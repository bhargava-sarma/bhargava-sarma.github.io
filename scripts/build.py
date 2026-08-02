#!/usr/bin/env python3
"""Render content.json into the marked regions of index.html.

The site stays a fully pre-rendered static page: this rewrites index.html in
place rather than having the browser fetch and render JSON at runtime, so there
is no flash of empty content, no SEO cost, and no need to loosen the CSP with a
connect-src for fetch().

Only the regions between <!-- build:NAME --> and <!-- /build:NAME --> are
touched; everything else in index.html (the head, nav, CSP, section headings) is
hand-maintained and left exactly as-is. Running this twice in a row produces an
identical file.

    python3 scripts/build.py            rewrite index.html from content.json
    python3 scripts/build.py --check    exit non-zero if index.html is stale
"""

import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
CONTENT = ROOT / "content.json"


def esc(value) -> str:
    """Escape a string for use as HTML text.

    Only &, < and > are escaped. Quotes are left alone: they are not special in
    text nodes, and escaping them turns every apostrophe into &#x27;, which makes
    the generated markup noisy and the diffs hard to read.
    """
    return html.escape(str(value), quote=False)


def esc_attr(value) -> str:
    """Escape a string for use inside a double-quoted HTML attribute."""
    return html.escape(str(value), quote=True)


# --- region renderers -------------------------------------------------------
# Each returns the inner HTML for one build region, already indented to match
# the surrounding markup.

def render_meta(c) -> str:
    m = c["meta"]
    return (
        f'<title>{esc(m["title"])}</title>\n'
        f'<meta name="description" content="{esc_attr(m["description"])}">'
    )


def render_hero(c) -> str:
    h = c["hero"]
    plain_title = " ".join(" ".join(line) for line in h["titleLines"])

    lines = []
    for i, words in enumerate(h["titleLines"], start=1):
        spans = " ".join(f'<span class="word">{esc(w)}</span>' for w in words)
        lines.append(f'      <span class="line line--{i}">{spans}</span>')
    title_lines = "\n".join(lines)

    return (
        f'    <p class="hero__eyebrow reveal">{esc(h["eyebrow"])}</p>\n'
        f'    <h1 class="hero__title" aria-label="{esc_attr(plain_title)}">\n'
        f'{title_lines}\n'
        f'    </h1>\n'
        f'    <p class="hero__desc reveal">\n'
        f'      {esc(h["description"])}\n'
        f'    </p>\n'
        f'    <div class="hero__actions reveal">\n'
        f'      <a class="btn btn--solid" href="#projects">View projects</a>\n'
        f'      <a class="btn btn--ghost" href="{esc_attr(h["resumeFile"])}" '
        f'target="_blank" rel="noopener noreferrer">Download resume</a>\n'
        f'    </div>'
    )


def render_marquee(c) -> str:
    # Two identical groups are emitted; app.js clones further groups at runtime
    # to cover the viewport, but needs at least one full group to measure.
    cells = []
    for item in c["marquee"]:
        cells.append(f'<span>{esc(item)}</span><span>·</span>')

    # three items per source line, purely for readability of the output
    rows = []
    for i in range(0, len(cells), 3):
        rows.append("        " + "".join(cells[i:i + 3]))
    group = '      <div class="marquee__group">\n' + "\n".join(rows) + "\n      </div>"
    return group + "\n" + group


def render_work(c) -> str:
    out = []
    for entry in c["work"]:
        paras = "\n".join(
            f'          <p>{esc(b)}</p>' for b in entry["bullets"]
        )
        out.append(
            f'      <article class="entry reveal">\n'
            f'        <div class="entry__date">{esc(entry["date"])}</div>\n'
            f'        <div class="entry__main">\n'
            f'          <h3>{esc(entry["role"])} <span>- {esc(entry["org"])}</span></h3>\n'
            f'{paras}\n'
            f'        </div>\n'
            f'      </article>'
        )
    return "\n\n".join(out)


def render_projects(c) -> str:
    out = []
    for i, p in enumerate(c["projects"], start=1):
        out.append(
            f'      <article class="project reveal">\n'
            f'        <a class="project__link" href="{esc_attr(p["url"])}" '
            f'target="_blank" rel="noopener noreferrer">\n'
            f'          <span class="project__index">{i:02d}</span>\n'
            f'          <span class="project__body">\n'
            f'            <span class="project__title">{esc(p["title"])}</span>\n'
            f'            <span class="project__desc">{esc(p["description"])}</span>\n'
            f'            <span class="project__stack">{esc(p["stack"])}</span>\n'
            f'          </span>\n'
            f'          <span class="project__arrow">↗</span>\n'
            f'        </a>\n'
            f'      </article>'
        )
    return "\n\n".join(out)


def render_skills(c) -> str:
    return "\n".join(
        f'      <div class="skills__row">\n'
        f'        <span class="skills__label">{esc(r["label"])}</span>\n'
        f'        <span class="skills__items">{esc(r["items"])}</span>\n'
        f'      </div>'
        for r in c["skills"]
    )


def render_extra(c) -> str:
    return "\n".join(
        f'      <div class="timeline__item">\n'
        f'        <span class="timeline__date">{esc(i["date"])}</span>\n'
        f'        <p>{esc(i["text"])}</p>\n'
        f'      </div>'
        for i in c["extra"]
    )


def render_education(c) -> str:
    return "\n".join(
        f'      <div class="edu__row">\n'
        f'        <span class="edu__school">{esc(e["school"])}</span>\n'
        f'        <span class="edu__degree">{esc(e["degree"])}</span>\n'
        f'        <span class="edu__date">{esc(e["date"])}</span>\n'
        f'      </div>'
        for e in c["education"]
    )


def render_contact(c) -> str:
    ct = c["contact"]
    user, domain = ct["emailUser"], ct["emailDomain"]
    # The address is split across data attributes and reassembled by app.js, so
    # it never appears in the markup as a scrapeable mailto: link.
    domain_name, _, tld = domain.rpartition(".")
    links = "\n".join(
        f'      <a href="{esc_attr(l["url"])}" target="_blank" '
        f'rel="noopener noreferrer">{esc(l["label"])} ↗</a>'
        for l in ct["links"]
    )
    return (
        f'    <button class="cta__email reveal" id="emailBtn" type="button" '
        f'data-user="{esc_attr(user)}" data-domain="{esc_attr(domain)}">\n'
        f'      {esc(user)}<span class="cta__at">[at]</span>{esc(domain_name)}'
        f'<span class="cta__dot">[dot]</span>{esc(tld)}\n'
        f'    </button>\n'
        f'    <p class="cta__hint reveal" id="emailHint">Click to copy</p>\n'
        f'    <div class="cta__links reveal">\n'
        f'{links}\n'
        f'    </div>'
    )


RENDERERS = {
    "meta": render_meta,
    "hero": render_hero,
    "marquee": render_marquee,
    "work": render_work,
    "projects": render_projects,
    "skills": render_skills,
    "extra": render_extra,
    "education": render_education,
    "contact": render_contact,
}


def build(html_text: str, content: dict) -> str:
    for name, renderer in RENDERERS.items():
        pattern = re.compile(
            r"(<!-- build:%s -->\n).*?(\n\s*<!-- /build:%s -->)" % (name, name),
            re.S,
        )
        if not pattern.search(html_text):
            sys.exit(f"error: no <!-- build:{name} --> region found in index.html")
        body = renderer(content)
        html_text = pattern.sub(
            lambda m: m.group(1) + body + m.group(2), html_text, count=1
        )
    return html_text


def main() -> int:
    content = json.loads(CONTENT.read_text(encoding="utf-8"))
    current = INDEX.read_text(encoding="utf-8")
    rebuilt = build(current, content)

    if "--check" in sys.argv:
        if current == rebuilt:
            print("ok: index.html is up to date with content.json")
            return 0
        print("STALE: index.html does not match content.json -- "
              "run python3 scripts/build.py", file=sys.stderr)
        return 1

    if current == rebuilt:
        print("index.html already up to date")
        return 0

    INDEX.write_text(rebuilt, encoding="utf-8")
    print("index.html rebuilt from content.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
