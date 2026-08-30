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
├── cases/              # Real artifacts produced by litecrew-workspace runs,
│   │                   #   each served at /cases/<slug>/ — see "Cases" below
│   └── internet-archaeology/   # The Dead Web Gazette (20-dispatch blog)
├── scripts/
│   └── sync-case.sh    # Sync a run's site into cases/<slug>/ (see "Cases")
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
- **Real cases, hosted in-repo.** `cases/` carries finished sites produced by
  litecrew-workspace runs, each with an injected provenance bar linking back to
  this site and to its source files.

## Cases

The `cases/` directory hosts **real artifacts produced end-to-end by single
litecrew-workspace runs** — not mockups. Each case is a self-contained static
site served at `/cases/<slug>/` on this domain, linked from the landing page's
Cases section.

**Adding or updating a case:**

```bash
scripts/sync-case.sh <path-to-run-site> <slug>
# e.g.
scripts/sync-case.sh ../litecrew-workspace-showcase/artifacts/writing/internet-archaeology-blog/site internet-archaeology
```

The script is idempotent (rerunning produces byte-identical output) and does
three things:

1. **Mirrors** the source tree into `cases/<slug>/` (the destination is
   rebuilt, so files removed upstream disappear here too).
2. **Injects a provenance bar** at the top of every HTML page — "This site was
   produced entirely by a litecrew-workspace run" with a link back to `/` and
   to the source files on GitHub. The bar carries its own scoped inline styles
   and never touches the case's own stylesheet. It is dismissible: clicking the
   close button hides it and records the slug in `localStorage` under
   `litecrew-bar-hidden` (a comma-separated list), so the bar stays hidden on
   every page of that case. To bring it back, clear the site's local storage —
   there is deliberately no restore control. Without JavaScript the bar simply
   shows with no close button.
3. **Rewrites placeholder feed URLs** (`example.org`) to the live
   `https://litecrew.ai/cases/<slug>/` prefix, and fails loudly if any
   residue survives.

Then **register the case in the `CASES` registry** at the top of
`assets/main.js` — the nav "Cases" dropdown is generated from this list at
runtime, so a new case needs exactly one entry:

```js
var CASES = [
  {
    slug: "internet-archaeology",                         // directory under cases/
    title: "The Dead Web Gazette",                        // shown in the dropdown
    line: "One line describing the output",               // subtitle in the dropdown
    thumb: "/cases/internet-archaeology/assets/x.webp"    // optional 52x52 thumbnail
  }
];
```

Without JavaScript the nav item simply stays a link to the Cases section.
Finally add the case card to the Cases section in `index.html` (art, title,
a real-output line, source link) and commit.

**License note:** content under `cases/` originates from the
[litecrew-workspace-showcase](https://github.com/litecrew-ai/litecrew-workspace-showcase)
repository (MIT) and is synced verbatim apart from the provenance bar and the
feed URL rewrite.

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
  directory is the repo root. Static subdirectories such as `cases/` are served
  as-is; no routing configuration is needed.

`og:image` and `twitter:image` in `index.html` are absolute URLs
(`https://litecrew.ai/assets/img/social-preview.png`) — some social crawlers do
not resolve relative Open Graph images. If the domain ever changes, update those
two tags and the `SITE_ORIGIN` constant in `scripts/sync-case.sh`.

## Content policy

This site describes the open source **litecrew-workspace** project only. All copy is in
English and uses no emoji, matching the main repository's conventions. Media credits:
diagrams rendered from litecrew-workspace `docs/assets`; videos rendered with Remotion.

## License

MIT — see [LICENSE](./LICENSE). Fonts ship under the SIL Open Font License 1.1; the
license texts are preserved in `assets/fonts/`.
