# bhargava-sarma.github.io

Personal portfolio site for D Bhargava Rama Sarma — AI/ML engineer. Live at [bhargava-sarma.me](https://bhargava-sarma.me).

## Stack

Plain HTML, CSS, and vanilla JavaScript — no framework, no build step, no dependencies. Fonts (Inter, JetBrains Mono) are loaded from Google Fonts.

## Features

- Dark theme by default, with a light theme toggle (top-right nav) that persists across visits via `localStorage` and animates smoothly between themes
- Scroll-triggered section reveals and a hero entrance animation, both disabled automatically for `prefers-reduced-motion`
- Infinite marquee of tech keywords, driven by JS to stay seamless at any viewport width
- Click-to-copy email button (address is assembled from data attributes rather than sitting in the markup as a scrapeable `mailto:` link)
- Responsive layout down to 320px wide, with a slide-out nav menu on mobile

## Structure

```
index.html   Page markup and content
style.css    All styling, including both themes
app.js       Nav scroll state, mobile menu, reveal animations, marquee, theme toggle, email copy
CNAME        Custom domain for GitHub Pages
```

## Running locally

No build step — serve the directory with any static file server and open it in a browser:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deployment

Served via GitHub Pages from this repo, using the custom domain configured in `CNAME`.
