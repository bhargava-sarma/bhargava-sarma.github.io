# bhargava-sarma.github.io

Personal portfolio site for D Bhargava Rama Sarma — AI/ML engineer. Live at [bhargava-sarma.me](https://bhargava-sarma.me).

## Stack

Plain HTML, CSS, and vanilla JavaScript — no framework and no dependencies. Fonts (Inter,
JetBrains Mono) are loaded from Google Fonts.

The deployed site is fully pre-rendered static HTML. Content lives in `content.json` and is
rendered into `index.html` by a small Python script (standard library only) rather than
fetched and rendered in the browser, so there is no flash of empty content, no SEO cost, and
no need to loosen the CSP.

## Features

- Dark theme by default, with a light theme toggle (top-right nav) that persists across visits via `localStorage` and animates smoothly between themes
- Scroll-triggered section reveals and a hero entrance animation, both disabled automatically for `prefers-reduced-motion`
- Infinite marquee of tech keywords, driven by JS to stay seamless at any viewport width
- Click-to-copy email button (address is assembled from data attributes rather than sitting in the markup as a scrapeable `mailto:` link)
- Responsive layout down to 320px wide, with a slide-out nav menu on mobile

## Structure

```
content.json        All editable site copy — projects, work, skills, education, contact
index.html          Page markup; the content regions are generated from content.json
style.css           All styling, including both themes
app.js              Nav scroll state, mobile menu, reveals, marquee, theme toggle, email copy
CNAME               Custom domain for GitHub Pages
_config.yml         Keeps tooling out of the published site
_dashboard/         Local editor UI — never deployed
scripts/build.py    Renders content.json into index.html
scripts/dashboard.py  Local editor server
scripts/csp-hash.py   CSP hash generator/checker
```

## Updating content

Run the dashboard instead of hand-editing markup:

```
python3 scripts/dashboard.py
```

It opens `http://127.0.0.1:4173` with a form for every section — add, edit, reorder or
delete projects, jobs, skills and the rest. **Save & rebuild** writes `content.json` and
regenerates `index.html`. Review with `git diff`, then commit and push as usual; the
dashboard deliberately does not touch git.

Project numbering (`01`, `02`, …) follows list order and is generated, so reordering
projects renumbers them automatically.

You can still edit `content.json` by hand — run `python3 scripts/build.py` afterwards to
regenerate the page. `python3 scripts/build.py --check` exits non-zero if `index.html` has
drifted out of sync, which makes it useful in a pre-commit hook.

Everything outside the `<!-- build:… -->` markers in `index.html` (the head, nav, section
headings, CSP) is hand-maintained and left untouched by the generator.

### Why the dashboard is not on the website

GitHub Pages serves static files with no server-side code, so a hosted admin page could not
be given a real login — any check in client-side JavaScript is visible to, and bypassable
by, anyone who views source. So the dashboard runs on your machine only:

- it lives in `_dashboard/`, which `_config.yml` and Jekyll's underscore convention both
  keep out of the published site;
- its server binds `127.0.0.1` only, and rejects requests with a non-loopback `Host` or a
  cross-origin `Origin`, so no website can reach it through your browser;
- it holds no credentials and cannot reach GitHub, so even if the directory were somehow
  published it would expose nothing and grant no access.

**Do not add a `.nojekyll` file to this repo.** That switches Jekyll off entirely, which
would publish `_dashboard/` and `scripts/` at real URLs.

## Security

The page ships a strict Content Security Policy via `<meta>` (`default-src 'none'`, with
narrow allowances for the stylesheet, Google Fonts, and the `data:` favicon), plus
`base-uri 'none'`, `form-action 'none'`, and `require-trusted-types-for 'script'`.

Two things to be aware of when editing:

- **The inline theme script in `index.html` is allowlisted by SHA-256 hash.** Changing that
  script by even one character invalidates the hash and the browser will silently block it,
  bringing back the theme flash on reload. After editing it, run `python3 scripts/csp-hash.py`
  and paste the printed value into the `script-src` directive. `python3 scripts/csp-hash.py
  --check` verifies the two agree and exits non-zero if they don't.
- **Trusted Types is enforced**, so `innerHTML`, `script.textContent`, and similar sinks will
  throw. Build DOM with `textContent` / `createElement`, as the existing code does.

`frame-ancestors`, HSTS, and `Permissions-Policy` are response headers, which GitHub Pages
cannot set — they can't be added from this repo. Clickjacking protection therefore relies on
"Enforce HTTPS" being enabled in the repo's Pages settings; that checkbox is worth confirming
is on.

## Running locally

No build step — serve the directory with any static file server and open it in a browser:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deployment

Served via GitHub Pages from this repo, using the custom domain configured in `CNAME`.
