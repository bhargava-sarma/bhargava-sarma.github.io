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
robots.txt          Keeps /dashboard/ out of search results
dashboard/          The editor UI — served at /dashboard/, also used locally
scripts/build.py    Renders content.json into index.html
scripts/dashboard.py  Local editor server
scripts/csp-hash.py   CSP hash generator/checker
.github/workflows/build-site.yml  Reruns the build when content.json changes
```

## Updating content

There is one dashboard, reachable two ways. Both edit `content.json`; neither requires
touching markup.

### From anywhere — <https://bhargava-sarma.me/dashboard/>

Open it on any device and paste a GitHub **fine-grained** token scoped to this repository
with `Contents: Read and write`. **Save & publish** commits `content.json` straight to
`main`; a GitHub Action reruns the build and the site redeploys in about a minute.

The token lives only in that browser tab's `sessionStorage` — it is never written to the
repository, and closing the tab (or pressing **Lock**) discards it. The page is public, but
inert without a token: it is verified against GitHub before the editor appears, and a
read-only or wrong-repo token is refused at the gate.

### On your own machine

```
python3 scripts/dashboard.py
```

Serves the same UI at `http://127.0.0.1:4173` with no token needed — the local server has
file access, so it writes `content.json` and reruns the build directly. Review with
`git diff`, then commit and push yourself; this mode deliberately does not touch git.

Project numbering (`01`, `02`, …) follows list order and is generated, so reordering
projects renumbers them automatically.

You can still edit `content.json` by hand — run `python3 scripts/build.py` afterwards to
regenerate the page. `python3 scripts/build.py --check` exits non-zero if `index.html` has
drifted out of sync, which makes it useful in a pre-commit hook.

Everything outside the `<!-- build:… -->` markers in `index.html` (the head, nav, section
headings, CSP) is hand-maintained and left untouched by the generator.

### How the hosted dashboard is secured

GitHub Pages has no server-side code, so there is nothing to hold a password against and no
way to gate the URL — a login check written in JavaScript is visible in view-source and
trivially skipped. The page is therefore designed to be safe while public rather than
pretending to be hidden:

- **It stores no credentials.** Authority comes from a token you supply per session, held in
  `sessionStorage` and gone when the tab closes. Nothing sensitive is in the repository.
- **The token is checked against the repository before the editor opens**, so an expired or
  wrong-repo token fails at the gate. This is a usability guard more than a security one:
  it reads the repository permissions GitHub reports, which do not always mirror a
  fine-grained token's exact scope, so a token that passes the gate can still be refused at
  save time — the error from GitHub is shown as-is when that happens.
- **Its CSP allows `connect-src` to `api.github.com` and this origin only**, so a script that
  somehow ran on the page has nowhere to exfiltrate a token to.
- **It refuses to run inside a frame.** Pages cannot send `X-Frame-Options`, and
  `frame-ancestors` is ignored in a `<meta>` CSP, so the page busts out of frames in JS.
- **Scope the token narrowly**: fine-grained, this repository only, `Contents: Read and
  write`, short expiry. Then the worst case is edits to this one repo, revocable from
  GitHub's settings at any time.

Anyone can open `/dashboard/`. Without a token they see a locked form that does nothing.

The site's own CSP is unchanged and does not permit `connect-src` — the dashboard's policy
is separate and applies only to that page.

**Do not add a `.nojekyll` file to this repo.** That switches Jekyll off entirely and would
publish `scripts/` and `content.json` at real URLs.

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
- **URLs in `content.json` are restricted to `http`, `https` and `mailto`.** Anything else —
  `javascript:`, `data:` — is refused by the build and by both dashboards rather than escaped,
  because escaping does not help when the danger is the scheme itself. Relative links
  (`#contact`, `resume.pdf`) are unaffected.

Fonts are the one remaining third-party dependency: they come from Google Fonts, which
cannot be pinned with Subresource Integrity because the stylesheet varies by browser.
Self-hosting the two font families would remove that dependency and allow `style-src` and
`font-src` to be narrowed to `'self'`.

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
