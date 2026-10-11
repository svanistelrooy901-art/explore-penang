# Explore Penang — P01 interactive prototype

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