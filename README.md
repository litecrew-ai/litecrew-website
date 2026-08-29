# litecrew-website

The landing page for [litecrew-workspace](https://github.com/litecrew-ai/litecrew-workspace),
served at **litecrew.ai**.

**Pure static. Zero build. Zero dependencies.** No framework, no bundler, no `package.json`,
no CDN. Open `index.html` in a browser and everything works — including offline, because the
fonts, images, and videos are all self-hosted in this repository.

## Structure

```
.
├── index.html          # The whole landing page (semantic HTML, OG/Twitter meta)
├── assets/
│   ├── style.css       # Hand-written CSS. Design tokens drive the dual theme.
│   ├── main.js         # Vanilla JS: theme toggle, copy buttons, scroll reveals,
│   │                   #   in-view video autoplay. No libraries.
│   ├── favicon.svg     # Hub-and-spoke glyph, matching the hero banner mark.
│   ├── fonts/          # Inter + JetBrains Mono variable (SIL OFL 1.1, self-hosted woff2)
│   ├── img/            # Diagrams and video posters (converted to WebP from the
│   │                   #   main repo's docs/assets, plus social-preview.png for OG)
│   └── video/          # 35s workspace walkthrough (with score) + 60s promo film
├── LICENSE             # MIT (code and content). Fonts are OFL — see assets/fonts/.
└── README.md
```

## Features

- **Dark by default, light on demand.** The theme boots from an inline `<head>` script
  before first paint (no flash), defaults to dark, and persists the manual choice in
  `localStorage` under `litecrew-theme`.
- **Respects `prefers-reduced-motion`.** All reveal animations and video autoplay are
  disabled for users who ask for reduced motion.
- **Self-hosted variable fonts.** Inter and JetBrains Mono as subset woff2 (~88 KB total),
  with system font stacks as fallback. No Google Fonts request ever leaves the page.
- **Real media, copied in-repo.** Diagrams and videos originate from the
  litecrew-workspace repository and its marketing artifacts; nothing is hot-linked
  across repositories.

## Preview locally

Any static file server works:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly via `file://` also works, including the theme toggle and
copy buttons (with a clipboard fallback for non-secure contexts).

## Deploying

The site is a single directory of static files — any host will do.

- **GitHub Pages:** push this repository, enable Pages on the default branch. Done.
- **Cloudflare Pages / Netlify:** point at the repository, no build command, output
  directory is the repo root.

After a real domain is attached, make `og:image` and `twitter:image` in `index.html`
absolute URLs (e.g. `https://litecrew.ai/assets/img/social-preview.png`) — some social
crawlers do not resolve relative Open Graph images.

## Content policy

This site describes the open source **litecrew-workspace** project only. All copy is in
English and uses no emoji, matching the main repository's conventions. Media credits:
diagrams rendered from litecrew-workspace `docs/assets`; videos rendered with Remotion.

## License

MIT — see [LICENSE](./LICENSE). Fonts ship under the SIL Open Font License 1.1; the
license texts are preserved in `assets/fonts/`.
