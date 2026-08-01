#!/usr/bin/env python3
"""Print the CSP script-src hash for the inline theme script in index.html.

The inline bootstrap script is allowlisted in the Content-Security-Policy by
SHA-256 hash rather than 'unsafe-inline'. Editing that script by even one
character invalidates the hash, and the browser will then silently block it --
the visible symptom is that the saved theme flashes to dark on every reload.

Run this after touching the script and paste the printed value into the
script-src directive. With --check it verifies the two already agree and exits
non-zero if they do not, so it can be wired into a pre-commit hook or CI.
"""

import base64
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"


def compute(html: str) -> str:
    # Strip comments first: the CSP block above the script mentions this
    # extraction in prose, and a naive <script> match would grab that instead.
    stripped = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    match = re.search(r"<script>(.*?)</script>", stripped, re.S)
    if match is None:
        sys.exit("error: no inline <script> block found in index.html")
    digest = hashlib.sha256(match.group(1).encode("utf-8")).digest()
    return "sha256-" + base64.b64encode(digest).decode()


def declared(html: str) -> str:
    match = re.search(r"script-src[^;]*?'(sha256-[^']+)'", html)
    if match is None:
        sys.exit("error: no sha256 hash found in the script-src directive")
    return match.group(1)


def main() -> int:
    html = INDEX.read_text(encoding="utf-8")
    actual = compute(html)

    if "--check" not in sys.argv:
        print(actual)
        return 0

    current = declared(html)
    if current == actual:
        print(f"ok: script-src hash matches the inline script ({actual})")
        return 0

    print(f"MISMATCH: the inline script would be blocked by CSP\n"
          f"  declared in script-src: {current}\n"
          f"  actual script hash:     {actual}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
