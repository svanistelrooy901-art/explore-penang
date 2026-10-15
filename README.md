# Explore Penang

## P02.2 geography review — 15 October 2026

The geographic draft is implemented on `review/p02-geography`. Open **[review.html](review.html)** directly in a browser; it works offline and includes its source data. This branch is awaiting geographic approval before merge or publication.

- North-up map assembled from real OSM coastline and state-boundary member ways.
- Both road bridges and separate George Town–Butterworth ferry routes.
- An illustrated depth study using the identical geometry.
- Eight source-linked representative points, official visitor links, filters, a George Town close-up, discovery progress and Heritage Hunter quest.
- Pointer drag, wheel/button zoom, touch pinch, keyboard selection, deep links and safe recovery from unavailable/corrupt storage.
- No runtime mapping API, third-party script, analytics or tile request.

The live `index.html` remains the earlier schematic prototype. This review is a geographic foundation and early depth study; the detailed illustrated-world treatment in the approved art reference is still future work. Evidence and publication gate: [P02-GEOGRAPHY-REVIEW.md](docs/P02-GEOGRAPHY-REVIEW.md).

### Develop and verify

```sh
npm ci --ignore-scripts
npm run build:review
npm test
npx playwright install chromium
npm run test:browser
```

The build is deterministic from committed data. `review.html` and both `docs/geography-*.svg` files are generated. Edit `review/`, then rebuild. To deliberately refresh data, run `python3 scripts/fetch_sources.py` then `python3 scripts/build_geography.py`; read [data notes](data/README.md) first. Changed geography requires a new review.

## Existing live P01 / early P02 prototype

Open `index.html` in a modern browser. No dependencies, API keys or build process required.

## Implemented
- Original stylized SVG island/mainland scene, decorative layers and subtle CSS animation
- Clickable landmarks and category filtering
- Pan/zoom by pointer or buttons; mouse wheel zoom
- Tourism cards with directions and **search-based** official information/ticket discovery
- Heritage Hunter discovery quest and locally saved progress
- Shareable location deep links and Web Share/copy functionality
- Mobile-responsive layout

## Important limitations
- The artwork is a **schematic**, not geographically accurate. Coordinates are visual placements, not GIS data.
- The eight entries are sample content, not a verified visitor directory.
- The official information button opens a search query; it does **not** represent a verified official ticketing URL.
- No analytics, affiliate links, sponsorships, authentication, or backend are active.

## Next production tasks
1. Replace schematic map with geographic SVG/MapLibre source aligned to real Penang coordinates.
2. Build a consistent illustration asset pack (George Town, Penang Hill, mainland).
3. Create verified attraction records with canonical official URLs, prices/hours verification timestamps and photo rights.
4. Add privacy-respecting event analytics for engaged explorers and outbound clicks.
5. Add OG image generation, server-rendered destination pages and SEO metadata for social/search traffic.
6. Add tests for mobile interaction, deep links, map alignment and accessibility.
7. Introduce sponsored placement schema and labeling, without activating payments yet.

## P02 illustrated-world visual pass (14 October 2026)

The first P02 visual increment is committed on `main`: original inline-SVG decorative landmarks (George Town rooftops, shophouses, hills, temple, coastal palm, mainland town), ocean details, compass, map annotation, active-pin highlighting, and reduced-motion CSS.

**Scope / honesty:** The map coastline and pin positions are still **schematic**, not GIS-accurate. These illustrated assets are decorative and do not establish real-world geographic precision. Official destination links remain search fallbacks, not verified ticket providers. GitHub Pages is static; no analytics or backend is configured. Browser/device QA is outstanding.

### P02 next tasks

1. Replace the schematic coastline and hand-positioned pins with a verified geospatial foundation (license and attribution reviewed).
2. Align each destination to real coordinates, then build a consistent scalable illustrated asset set.
3. Test touch pan/zoom, keyboard access, reduced motion and small-screen legibility on real devices.
4. Replace Google-search fallbacks with individually verified official visitor and ticket URLs; include opening-hour caveats.
5. Add performance budget, SEO metadata, analytics and share-card previews before traffic campaigns.
