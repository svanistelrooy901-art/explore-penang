# Explore Penang

A static, interactive Penang discovery site: **Explore → Discover → Visit**.

The visitor-facing `index.html` now uses the approved OSM-based geography and a flat map with selective miniature landmarks. It includes both Penang bridges, ferry crossings, ten area focus choices, eight attraction stories with official links, place search, category filters, a Discovery Journal, Heritage Hunter quest and sharing.

Development continues on `review/p02-geography` in draft PR #1. Changes to `index.html` on this review branch are a proposed replacement; the live `main` branch and GitHub Pages remain unchanged until the owner explicitly approves publication.

## Open and develop

Open **[index.html](index.html)** directly in a modern browser. It is self-contained and works offline; official visitor links need an internet connection. **[review.html](review.html)** retains the geography/art review interface and source evidence.

```sh
npm ci --ignore-scripts
npm run build
npm test
npx playwright install chromium
npm run test:browser
npm audit
```

- `site/template.html`, `site/style.css` and `site/content.json`: visitor-facing layout and editorial copy.
- `review/`: shared map renderer, artwork, camera/gesture handling and review layout.
- `scripts/page-builder.cjs`: shared page assembly, embedding three WebP assets once per document.
- `npm run build:site`: regenerates `index.html` only.
- `npm run build:review`: regenerates `review.html` and both `docs/geography-*.svg` maps.
- `npm run bake:surfaces`: reproduces the archived landscape tiles and their input manifest. These tiles are no longer loaded by the hybrid map.

Search filters the eight current destination records. The ten areas are presentation focus points, not ten additional attraction profiles. Choosing an area does not increment discovery progress. Opening an attraction story does; this is not a visited-place or GPS tracker.

Visitor progress retains the original `explorePenangDiscovered` storage key. The technical review uses its own key. Corrupt or unavailable storage falls back safely to in-memory progress.

## Geographic integrity

The owner approved the geographic foundation on 16 October 2026, against commit `18aa684`. Exact approved files and hashes are protected by [geography-approval.json](docs/geography-approval.json) and automated tests. Do not refresh or alter coastlines, bridge footprints, ferry routes, destination coordinates or source receipts without explicit owner approval.

The ten decorative area anchors and source links live separately in `review/hotspots.js`. Architectural symbols, vegetation, bridge details and regional montages are interpretive, not surveyed models. The eastern edge of the displayed mainland is the regional administrative boundary, not a coastline.

## Validation and limits

The browser suite covers review and visitor flows, desktop and 390/320px layouts, touch/pan/zoom, keyboard access, reduced motion, official visit links, search/filter recovery, persistent progress, deep links, sharing and standalone/offline behavior. Synthetic performance checks use 4× CPU throttling; physical iOS/Android and screen-reader QA remain outstanding.

No backend, account, runtime map API, third-party script, analytics, location tracking, ticket sales or affiliate integration is active. Hours, fees and visitor entrances should be checked with the venue. The approved concept informs miniature materials and lighting; the owner's later direction calls for a flat base with detail at selected hotspots.

**P02 artwork remains in progress. Tests passing does not constitute visual acceptance. Keep PR #1 draft; no merge, deployment, DNS or Pages configuration change without owner approval.**

Asset prompts and provenance: [artwork README](review/assets/README.md). Geographic source/licensing notes: [data README](data/README.md).
