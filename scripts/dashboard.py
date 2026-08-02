#!/usr/bin/env python3
"""Local-only editor for content.json.

    python3 scripts/dashboard.py

Opens a small server on 127.0.0.1 that serves the dashboard UI, saves edits back
to content.json, and re-runs the build so index.html is regenerated. Nothing here
is ever deployed: this server is only ever reachable from this machine. The same UI is also
published at /dashboard/ on the live site, where it talks to the GitHub API
instead; served from here it uses the local file API below and needs no token.

Security posture -- this holds no credentials and can only touch files in the
repo, but it does have write access to them, so it deliberately:

  * binds 127.0.0.1 only, never 0.0.0.0, so it is not exposed on the network;
  * rejects requests whose Host header is not loopback, which is what stops a
    malicious page in your browser from driving it via DNS rebinding;
  * rejects cross-origin requests, so no other site can POST to it;
  * validates the JSON shape before writing, so a malformed save cannot corrupt
    content.json;
  * resolves every preview path and refuses anything outside the repo.

After saving, review `git diff` and commit as usual -- this never touches git.
"""

import argparse
import http.server
import json
import mimetypes
import pathlib
import subprocess
import sys
import threading
import webbrowser

ROOT = pathlib.Path(__file__).resolve().parent.parent
UI_DIR = ROOT / "dashboard"
CONTENT = ROOT / "content.json"
BUILD = ROOT / "scripts" / "build.py"

ALLOWED_HOSTS = {"localhost", "127.0.0.1", "[::1]", "::1"}

# Every top-level key the site needs, and the type it must have.
REQUIRED = {
    "meta": dict, "hero": dict, "marquee": list, "work": list, "projects": list,
    "skills": list, "extra": list, "education": list, "contact": dict,
}
REQUIRED_FIELDS = {
    "work": {"date", "role", "org", "bullets"},
    "projects": {"title", "description", "stack", "url"},
    "skills": {"label", "items"},
    "extra": {"date", "text"},
    "education": {"school", "degree", "date"},
}


def validate(data):
    """Return a list of human-readable problems; empty means the payload is safe."""
    problems = []
    if not isinstance(data, dict):
        return ["payload is not a JSON object"]

    for key, expected in REQUIRED.items():
        if key not in data:
            problems.append(f"missing top-level key: {key}")
        elif not isinstance(data[key], expected):
            problems.append(f"{key} must be a {expected.__name__}")

    for key, fields in REQUIRED_FIELDS.items():
        for i, item in enumerate(data.get(key, []) or []):
            if not isinstance(item, dict):
                problems.append(f"{key}[{i}] is not an object")
                continue
            for missing in sorted(fields - set(item)):
                problems.append(f"{key}[{i}] is missing '{missing}'")

    for i, entry in enumerate(data.get("work", []) or []):
        if isinstance(entry, dict) and not isinstance(entry.get("bullets"), list):
            problems.append(f"work[{i}].bullets must be a list")

    hero = data.get("hero")
    if isinstance(hero, dict):
        lines = hero.get("titleLines")
        if not isinstance(lines, list) or not all(isinstance(l, list) for l in lines):
            problems.append("hero.titleLines must be a list of word lists")

    return problems


class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "PortfolioDashboard/1.0"

    # -- helpers -----------------------------------------------------------

    def _local_only(self) -> bool:
        """Reject anything that is not a same-origin request from loopback."""
        if self.client_address[0] not in ("127.0.0.1", "::1"):
            return False
        host = self.headers.get("Host", "").rsplit(":", 1)[0]
        if host not in ALLOWED_HOSTS:
            return False
        origin = self.headers.get("Origin")
        if origin is not None:
            hostname = origin.split("//", 1)[-1].rsplit(":", 1)[0]
            if hostname not in ALLOWED_HOSTS:
                return False
        return True

    def _send(self, code, body: bytes, ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        # This tool must never be embedded or cached by anything.
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code, payload):
        self._send(code, json.dumps(payload).encode("utf-8"))

    def _serve_file(self, path: pathlib.Path, base: pathlib.Path):
        try:
            resolved = path.resolve()
            resolved.relative_to(base.resolve())
        except (ValueError, OSError):
            return self._json(403, {"error": "path outside the repository"})
        if not resolved.is_file():
            return self._json(404, {"error": "not found"})
        ctype = mimetypes.guess_type(str(resolved))[0] or "application/octet-stream"
        self._send(200, resolved.read_bytes(), ctype)

    # -- routes ------------------------------------------------------------

    def do_GET(self):
        if not self._local_only():
            return self._json(403, {"error": "local requests only"})

        path = self.path.split("?", 1)[0]

        if path == "/api/content":
            return self._send(200, CONTENT.read_bytes())

        if path in ("/", "/index.html"):
            return self._serve_file(UI_DIR / "index.html", UI_DIR)

        if path.startswith("/preview/"):
            rel = path[len("/preview/"):] or "index.html"
            return self._serve_file(ROOT / rel, ROOT)

        return self._serve_file(UI_DIR / path.lstrip("/"), UI_DIR)

    def do_POST(self):
        if not self._local_only():
            return self._json(403, {"error": "local requests only"})
        if self.path.split("?", 1)[0] != "/api/content":
            return self._json(404, {"error": "not found"})

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self._json(400, {"error": "bad Content-Length"})
        if length <= 0 or length > 2_000_000:
            return self._json(400, {"error": "empty or oversized payload"})

        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            return self._json(400, {"error": f"invalid JSON: {exc}"})

        problems = validate(data)
        if problems:
            return self._json(400, {"error": "; ".join(problems[:5])})

        # Write content.json first, then rebuild. If the build fails the JSON is
        # still saved, so edits are never lost to a rendering error.
        CONTENT.write_text(
            json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )

        result = subprocess.run(
            [sys.executable, str(BUILD)], capture_output=True, text=True, cwd=str(ROOT)
        )
        if result.returncode != 0:
            return self._json(500, {
                "error": "content saved but the build failed: "
                         + (result.stderr.strip() or "unknown error")
            })

        return self._json(200, {"ok": True, "build": result.stdout.strip()})

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--no-open", action="store_true",
                        help="do not open a browser window")
    args = parser.parse_args()

    if not UI_DIR.is_dir():
        sys.exit(f"error: dashboard UI not found at {UI_DIR}")
    if not CONTENT.is_file():
        sys.exit(f"error: {CONTENT} not found")

    url = f"http://127.0.0.1:{args.port}/"
    # Bind the loopback interface explicitly -- not 0.0.0.0, which would put a
    # tool with write access to the repo on every network this machine joins.
    server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), Handler)

    print(f"Portfolio dashboard  →  {url}")
    print("Editing:  content.json   (saving also rebuilds index.html)")
    print("Reachable from this machine only. Ctrl-C to stop.\n")

    if not args.no_open:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
