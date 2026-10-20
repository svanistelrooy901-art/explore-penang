# Diorama artwork

`diorama-atlas-v1.webp` is an original transparent 3×3 decorative sprite atlas created with the built-in ImageGen tool on 16 October 2026, using Mamu's approved “Explore Penang: Wander and Discover” concept as a style reference. The original generated PNG remains outside the repository; this 1152px WebP is the production copy, with transparency preserved. SVG crop windows isolate its nine cells and the browser reuses one decoded atlas.

The sprites are artistic interpretations, not photographs, measured architecture, terrain, real-time land use or additional geographic data. The George Town shophouse sprite represents heritage atmosphere; it is not a faithful architectural model of Khoo Kongsi. Bridge decks follow the approved footprints; their raised piers/towers are symbolic.

## Production prompt

Use case: stylized-concept. Asset type: ONE transparent production sprite atlas for an interactive Penang tourism diorama. The attached image is STYLE REFERENCE ONLY, not a map to reproduce. Create a precisely aligned 3-column by 3-row atlas on a square canvas, nine equal square cells, with a separate isolated richly detailed miniature 3D diorama in EACH cell. No grid lines, text, labels, UI, logos, border, drop-in background, ocean backdrop or shared ground joining cells. Every object and its soft contact shadow must stay inside its own cell with at least 8% transparent padding on all four sides; neighbouring sprites must never touch. Each sprite sits at the same scale, camera azimuth and elevated oblique view, about 35 degrees above the ground, front facing the bottom edge. Top-left warm morning sunlight, realistic miniature architectural materials, lush tropical foliage, exquisite tilt-shift tourism-model rendering, saturated emerald greens, cream stone, terracotta roofs, turquoise accents. Transparent background between and around ALL sprites. EXACT cell subjects in reading order: row1 col1 Penang Hill: dramatic forested rocky hill with dense realistic tree canopies and tiny cream hill-station building and red funicular; row1 col2 Kek Lok Si Temple: ornate cream tiered Chinese Buddhist pagoda, golden details, red/orange temple roofs, small lush terrace; row1 col3 George Town heritage cluster: five detailed pastel Peranakan shophouses and terracotta roofs with balconies and a leafy square; row2 col1 Fort Cornwallis: low historic star-shaped stone fort, grassy courtyard, cannons, no flags or lettering; row2 col2 Chew Jetty: detailed wooden stilt homes and narrow timber boardwalk, isolated architecture without painted sea; row2 col3 Batu Ferringhi beach: palms, realistic sand crescent, umbrellas and small resort building, no painted ocean; row3 col1 Chowrasta market-inspired heritage market: cream market hall, small colourful awnings and street stalls, no signs; row3 col2 Bukit Mertajam-inspired mainland neighbourhood: small realistic terracotta-roof shophouse and community buildings cluster with trees, no invented monumental landmark; row3 col3 a standalone dense tropical forest grove with varied broadleaf tree canopies, palms, ferns and irregular natural ground edge, no mountains or buildings. These are decorative landmark symbols, not measured footprints. Fill most of each cell with a readable attractive highly detailed 3D sprite and use transparent padding. Make the output 1536 by 1536 or higher square, with identical cell dimensions.

The tool returned a 1254px PNG. The runtime uses measured crop windows rather than assuming a perfect grid, then transcodes the atlas to WebP. Requested output size is not claimed as the actual size.


## P02.4 continuous world

Current runtime: `diorama-atlas-v3.webp` (1152px), `world-surface-v2.webp` (1400×1120) and `georgetown-surface-v2.webp` (1200×944). Built-in ImageGen created the atlas, continuous landscape and heritage material. Actual generated sizes were 1254×1254 for the atlas and 1402×1122 for each ground material. Technical WebP transcoding preserves atlas alpha. Generated PNG originals remain outside the repository.

The atlas now gives Khoo Kongsi its own ornate clan-house illustration and separates the hill summit from Kek Lok Si. Architectural motifs were informed by the official temple and Penang Hill pages already cited in the source review; these remain generated interpretations requiring architectural review. No generated roof, street, elevation or land-cover detail is a geographic observation.

`build_terrain.cjs` produces the decorative layout guide, `terrain-v2.webp`. ImageGen used it and the approved concept to create `landscape-v2.webp`. `georgetown-material-v2.webp` supplies finer heritage fabric on zoom. Neither generated material supplies a coastline. `npm run bake:surfaces` uses pinned Sharp, the **exact approved land path**, static shore lighting and extrusion to create compact browser images. `surface-v2.json` records input/output hashes and the art extent; CI reproduces the bake. Both bridge decks and ferries remain separate source-derived layers.

Only technical resizing, encoding and the code-defined map compositing pipeline were applied after generation. The original concept is a style benchmark; its artistic geography was not traced.

### Atlas prompt

```text
Use case: stylized-concept
Asset type: transparent 3 by 3 landmark sprite atlas for the existing Explore Penang illustrated map.
Input image: approved concept, STYLE REFERENCE ONLY; do not reproduce its geography or UI.
Primary request: nine separate exquisitely detailed miniature architectural diorama cutouts, one centered in each exactly equal square cell of a 3x3 grid. All face the same south-east viewing direction, seen from elevated 45-degree bird's-eye perspective, sunlight from upper left, warm tropical lush realistic materials, cohesive high-end miniature world, photographic model detail rather than cartoon icons.
Row 1 left: Penang Hill summit, forested sloping peak with small white colonial bungalow and red-roof funicular upper station and one red funicular car on a very short track, NO pagoda.
Row 1 center: Kek Lok Si temple, recognizable cream and golden seven-storey Pagoda of Ten Thousand Buddhas beside red-roof temple halls and the tall pavilion housing Kuan Yin, terraces climbing a planted slope.
Row 1 right: Leong San Tong Khoo Kongsi clan house, ornate Southern Fujian two-storey raised hall, broad grey ceramic tiled sweeping swallowtail roof with tiny colorful porcelain dragons and crest sculptures, red and gold beams, carved stone columns, wide courtyard and steps. NOT ordinary shophouses, NOT pagoda.
Row 2 left: Fort Cornwallis, low star-shaped reddish brick ramparts with grassy parade ground, cannons, small white lighthouse, palms.
Row 2 center: Chew Jetty, long narrow wooden boardwalk over transparent empty background with tight rows of weathered wooden stilt houses, corrugated red and grey roofs, small boats, visible piles beneath. NO island mound.
Row 2 right: one compact George Town heritage streetscape with varied pastel two-storey narrow shophouses, five-foot arcades, terracotta roofs, shutters and one corner building, small street trees.
Row 3 left: Batu Ferringhi tiny curved beach garden, sand, rocky edge, coconut palms and a few resort buildings; NO opaque sea base.
Row 3 center: Chowrasta Market and street-food stalls, cream market hall, red awnings, hawker carts and tiny tables.
Row 3 right: Bukit Mertajam small historic town square and shop terraces with varied roofs, leafy tropical trees.
Composition: every cutout fully separated, 15 percent empty transparent margin within each cell, nothing crossing cell boundaries, subtle local contact shadows only, consistent scale and angle, all buildings grounded in small soft natural landscape bases that blend easily with a map. Nine cells aligned exactly in three equal columns and three equal rows. No grid lines.
Background: genuine alpha transparency.
Text: none. No labels, no captions, no watermarks, no UI, no map, no invented geographic outlines.
Resolution: large detailed square atlas.
```

### Landscape prompt

```text
Use case: stylized-concept
Asset type: one continuous ground material image for an existing geographically locked miniature map, full opaque 5:4 landscape rectangle.
Input image 1 is an ARTISTIC LAYOUT GUIDE only, not target geography; input image 2 is approved STYLE and LIGHTING reference only.
Transform the simple green terrain layout into an exquisitely detailed high-end 3D miniature tropical Malaysian landscape. The browser will clip this rectangular image to the exact approved coastline, so this asset MUST contain no water, no coastlines, no island outlines, no labels, no UI, no separate floating patches, no frame. Fill the ENTIRE rectangle continuously with natural ground.
Composition anchored to image 1: a long connected ridge of lush green hills in the left third of the canvas, from x 15-36 percent, y 30-78 percent. Warm sunlight from upper left, visible rocky slopes, realistic elevation and soft ambient shadows, layered tropical tree canopy with many distinct species, coconut palms transitioning through lowland orchards and gardens. Keep elevation fairly low outside that ridge.
On the right half: a continuous cultivated mainland landscape, dense realistic small Malaysian towns and low-rise terracotta, white and grey roofs interwoven with tropical trees, green paddies and gently curving roads. Smaller hill at x 77%, y 60%. Architecture and trees are very small relative to terrain, hundreds of unique buildings in varied compact neighbourhoods.
The left ridge blends into a dense heritage town fabric on its east side around x 40%, y 42%, with narrow pastel shophouse rows and courtyards. No giant landmark buildings: landmarks are separate sprites.
All regions blend into each other through continuous connected natural terrain, roads and ground vegetation. Photoreal miniature model materials, finely detailed, warm tropical richness, orthographic elevated 50-degree aerial view, same camera direction as the reference concept, coherent lighting. No cartographic symbols, no repeated tile pattern, no simplified geometric shapes.
Preserve general ridge and town distribution of the layout guide but add beautiful natural detail throughout the complete rectangle. No exact architectural or geographic survey claim.
Output a detailed 2000px-plus opaque landscape image.

```

### Heritage ground prompt

```text
Use case: stylized-concept
Asset type: continuous close-up ground texture for the George Town district of an illustrated tourism map.
Input image 1 is STYLE REFERENCE for the existing miniature landmark artwork. Input image 2 is the owner's approved world STYLE benchmark. Do not copy any geography, coastline or interface.
Make one continuous dense heritage neighbourhood of George Town, Penang, viewed from the same elevated 50-degree aerial angle with warm sunlight from upper left. This is a beautiful photographic-scale miniature town, with 80-120 individually varied small two-storey pastel Straits shophouses, narrow five-foot arcades, terracotta tile roofs, shutters, corner buildings, tiny inner courtyards, a few coconut palms and large tropical shade trees. Buildings are small relative to the whole image. Closely packed historic blocks, naturally varied block shapes and a few gentle lanes linking them, not a regular repeated grid. Realistic walls, ceramic tiles, weathering, doors and trees. Dense but legible, finely detailed and cohesive.
No large landmarks: the temple, fort, market and jetties will be added separately by the app. No pagoda, mosque dome, giant temple, enormous building or tower.
Frame a complete rectangular ground surface of streets and built fabric filling all edges, a little greener and more tree shaded around the edges so it blends with a larger tropical landscape. No water, no coastline, no island edge, no raised plinth, no floating cutout, no UI, no letters, no signage, no map labels.
Opaque landscape image, about 5:4 ratio, high detail. Architectural illustration, not a surveyed street map.
```


## P02.4 refinement — architecture and coastal lighting

Current landmark atlas is `diorama-atlas-v3.webp`. A targeted built-in ImageGen edit replaced Fort Cornwallis's solid lighthouse with an open white steel framework and refined the pagoda's stacked octagonal storeys. Other cells retain their subjects, layout and visual treatment, with small generative differences. This remains an artistic interpretation, not an architectural survey.

References checked: [Marine Department July 2020 bulletin](https://www.marine.gov.my/wp-content/uploads/2024/01/20201008121208-a8119-buletin-jlm-julai-2020-1.pdf), which describes a white steel framework tower, and [Kek Lok Si's official history](https://kekloksitemple.com/?page_id=5), which describes the pagoda's combined Chinese, Thai and Burmese architecture. No attraction/source coordinate or official link was changed.

`coastal_segments.py` uses the tracked `coastal-recipe-v1.json` art recipe for clean, offline builds. The recipe records which approved relation members are tagged `natural=coastline`, using only polygon/ring vertex indices into the unchanged approved GeoJSON. It contains no new coordinates. Every outer member is classified once, and the source identity must match the immutable receipt. Shallow water and foam are painted only on those segments; eighteen inland administrative members receive no coastal halo. The same exact land outline is still used for clipping. Static art bakes keep this detail off the live SVG render path.

The optional `python3 scripts/coastal_segments.py --record-source` command reproduces that recipe from the local `data/source/state.osm` cache only after verifying its SHA-256 against the approved receipt (`a3df14f4fd36cdade9382490ce16a87c95ef3ff2887e1a9ff1de82fc49f8e6ad`). It verifies each complete source way matches consecutive approved ring vertices, including direction and closure. Normal builds do not need this ignored cache or a network request, and neither mode writes to `data/`.

On small screens, selected architectural sprites now retain a readable size, and choosing a place brings the map point above the attraction sheet. Journal activation focuses the named attraction region; Escape returns to the map.

### Targeted atlas edit prompt

```text
Use case: precise-object-edit.
Asset type: existing Explore Penang transparent 3×3 miniature landmark atlas, targeted architectural correction.
EDIT TARGET: supplied diorama-atlas-v2 image. Preserve its transparent background, exact 3×3 grid/cell positions, perspective, warm upper-left light, object scale, cutout boundaries, and all seven untargeted cells.
Change ONLY these two cells:
1. Row 2 column 1, Fort Cornwallis: replace the inaccurate solid cylindrical white lighthouse with a slender WHITE STEEL SKELETAL FRAMEWORK lighthouse: four slightly tapering open lattice legs, diagonal cross-braces, small enclosed upper watchroom and lantern/gallery. Open air visible through framework, like a small white pyramidal harbour signal tower. Keep low reddish brick star-bastion ramparts, grassy parade courtyard, black cannons, small guard buildings and coconut palms. No large stone lighthouse and no tall castle. This is an interpretive symbol, not measured engineering.
2. Row 1 column 2, Kek Lok Si: refine the cream Pagoda of Ten Thousand Buddhas into its recognizable tapered white octagonal lower storeys, Thai-influenced middle and gold Burmese crown. Make seven readable stacked storeys rather than a generic cylindrical cone. Keep the pagoda separate from red-roof prayer halls, granite terrace steps, tropical gardens and the smaller upper pavilion. Preserve overall silhouette and cell size; do not add a giant new structure.
Keep Penang Hill, Khoo Kongsi, Chew Jetty, town shophouses, beach, market and mainland cells unchanged. Each sprite must remain isolated inside its own equal 1/3-square crop window; preserve transparent inter-cell margins. No text, grid lines, labels, background, UI, lettering or watermark. Maintain photographic miniature model detail rather than cartoon icons.
Actual alpha transparency required.
```


### Ferry model

`ferry-v1.webp` is a 512px transparent model generated with the built-in ImageGen tool and technically resized/encoded to WebP. It replaces the flat vector boat while retaining the existing decorative position on the approved ferry route. It is a Penang-inspired symbol, not a measured model of the current fleet or a live vessel position. Wake lines and optional bobbing remain code-native. The original generated PNG remains outside the repository.

The v3 landmark atlas uses measured crop windows to remove neighbouring-cell bleed introduced by the targeted generation edit.

```text
Use case: stylized-concept.
Asset type: one transparent production ferry sprite for the existing Explore Penang miniature map.
Input image is the owner-approved style benchmark only. Create ONE beautifully detailed small Penang-inspired harbour passenger ferry as a photographic miniature model. White hull and superstructure, rich blue hull band, warm yellow-gold deck accents, two passenger levels, small wheelhouse, visible windows, slender deck railings, rescue rings and a few tiny seated passengers. Same elevated 45-degree aerial viewpoint and warm upper-left sunlight as the miniature world. Bow points toward lower left; stern toward upper right. Complete ferry visible with generous transparent padding. Realistic miniature materials and soft local contact shadow, no exaggerated cartoon shape. This is an illustrative ferry, not a precise real-vessel model.
Genuine alpha transparency surrounding the whole ferry; no water, no wake, no island, no square base, no sky, no UI, no words, no logos, no text or watermark. Detailed silhouette readable at 60px. Compact isolated composition on a square canvas.
```


## P02.4 continuous George Town detail — 17 October 2026

`georgetown-material-v3.webp` is a new 1402 × 1122 built-in ImageGen district material, technically encoded as WebP at quality 86. It has smaller, denser shophouse blocks, connected alleys and softer transitions into tropical neighbourhoods. The v2 material and owner-approved concept were style references; neither was traced into the geographic data. Streets and buildings are interpretive, not surveyed.

The surface bake now uses one shared ground composition at world and district resolutions. The 1500 × 1180 detail tile replaces land pixels over the same fixed material bounds and remains visible at every zoom, so town fabric no longer pops in at the detail threshold. The world bake contains the same urban fabric. Narrower coastal light, a fine broken foam edge and a shallower shaded bevel reduce the broad halo at close range. Shallow-water effects stay out of the detail tile to avoid doubling them. No new live SVG layers, filters or animations were added.

The material bounds are exported by `review/diorama.js` and consumed by the bake and renderer. Both the renderer and projection code are hashed as bake inputs. Approved coastlines, coordinates, bridge/ferry data and approval fingerprints are unchanged.

### District material generation prompt

```text
Use case: stylized-concept.
Asset type: production George Town district ground material for the EXISTING Explore Penang miniature world.
Input image 1 (georgetown-material-v2.webp): reference for building materials and warm light, NOT a composition to preserve.
Input image 2 (owner's approved Wander and Discover concept): style benchmark only. Do not reproduce UI, text, geography, sea, bridges or landmarks.
Primary request: create a wider, much denser miniature heritage district, at a 45-degree overhead oblique viewpoint consistent with the references. Tiny tightly packed two-storey Penang shophouses with red weathered clay-tile roofs, pastel cream/mint/ochre facades, five-foot-way arcades, slender windows, narrow streets, alley courtyards, occasional trees and coconut palms. MANY SMALL BUILDINGS: show roughly 30 narrow house frontages across the entire width and 18 rows in depth, rather than oversized individual buildings. Small roofs remain crisp, straight, detailed and varied. A few open courtyards and one small green square, continuous plausible urban fabric.
Composition: opaque rectangular landscape material, 5:4 ratio, filling ALL edges. No horizon. Fine urban blocks dominate the centre and lower right, gradually blending into leafy lower-density tropical neighbourhoods on the left and top edges. Similar warm yellow-green vegetation to the larger terrain; avoid a dark forest border or vignette.
Lighting: warm sun from upper left, consistent short directional shadows and small ambient-occlusion gaps between houses; photographic miniature model materials, attractive and detailed, not a cartoon. Crisp 2048x1632-style detail with no photographic tilt-shift blur. Moderate natural colour, avoid oversaturated orange roofs.
Constraints: this is interpretive decorative urban ground, NOT a surveyed street map. NO ocean, water, coastline, seawall, island silhouette, raised plinth, floating cutout, large signature landmark, pagoda, giant temple, tall buildings, UI, words, signs, labels, logos, borders or watermark. No transparency. Do not duplicate a repeating tile or regular checkerboard; use irregular connected street blocks and varied roof geometry. Maintain the existing product's visual direction.
```


## P02.4 hybrid map and urban atlas — 20 October 2026

The owner revised the composition to a flat map with selected miniature hotspots. `hotspot-atlas-v1.webp` contains six built-in ImageGen symbols: Komtar, Gurney, Batu Kawan, Teluk Bahang, Queensbay and Butterworth. The existing atlas still supplies the eight discovery landmarks. Runtime no longer embeds the full-world or George Town surface tiles; their sources and reproducible bake remain archived for continuity.

Source PNGs: `exec-f779e496-02c6-4608-afa1-e739542759e6.png` and targeted revision `exec-8cee3f24-bbab-4db1-8a6f-93ccf82688af.png`. Generated with the built-in ImageGen tool using the existing v3 landmark atlas as a style reference. The revision improves the Komtar office tower silhouette. Production output is technically resized from 1536×1024 to 1152×768 and encoded as WebP quality 76 / alpha 95. Original PNGs remain outside git. Measured SVG crop windows and explicit clip paths prevent neighbouring symbols leaking into letterboxed viewports.

These are interpretive regional symbols: Gurney towers, Queensbay buildings and terminal details are not surveyed architecture. Entopia/ESCAPE and Batu Kawan retail are montages, not shared entrances/site plans. Presentation anchors and OSM/official source links are in `review/hotspots.js`; approved geographic files and eight visitor pins are unchanged. The approved original concept remains the miniature material/lighting reference; its fully illustrated composition is superseded by the owner's 20 October hybrid direction.

### Initial urban atlas prompt

```text
Use case: stylized-concept.
Asset type: ONE production transparent sprite atlas for the EXISTING Explore Penang hybrid tourism map, exactly 3 columns × 2 rows, landscape 1536 × 1024 layout. Six equal square cells, generous fully transparent gutters. Each object wholly inside its own cell, with at least 40px transparent padding on all sides. The existing supplied atlas is STYLE REFERENCE only: same detailed photographic miniature materials, 45-degree aerial oblique view, warm upper-left sunshine and fine local shadows. Do NOT reproduce its subjects.
Create these six isolated interpretive Penang regional landmark symbols, one per cell:
TOP LEFT: KOMTAR George Town — one tall slender pale-grey faceted cylindrical tower with horizontal bands, small dark windows, flat rooftop observation structure, on its low modern shopping podium, with just three small heritage shophouses at its foot. NOT twin towers, not the Petronas towers, not a needle spire.
TOP MIDDLE: Gurney modern waterfront — a compact grouping of three elegant modern hotel/condominium towers of different heights, pale concrete and blue-grey glass, balconies, a low retail podium, a little green promenade with palms. No ocean, no coastline.
TOP RIGHT: Batu Kawan retail — a recognizable low broad blue-and-yellow Scandinavian furniture-store warehouse beside a smaller open-air outlet shopping block, simple landscaped forecourt. No readable brand word or logo, no giant skyline.
BOTTOM LEFT: Teluk Bahang family attractions — a light steel-and-glass butterfly conservatory pavilion with lush foliage and a small curling water slide/rope-park element behind it. A regional montage, not a surveyed site model.
BOTTOM MIDDLE: Queensbay/Bayan Baru urban destination — a wide contemporary shopping-mall building with a curved silver canopy, two small modern apartment towers and a little landscaped plaza. A regional symbol, not an exact architectural claim.
BOTTOM RIGHT: Butterworth Penang Sentral — a compact contemporary multi-level transport terminal, white/silver facade with bold orange-red accents, long horizontal roof, small bus bay and a small waterfront passenger-ferry pontoon, with no water.
Constraints: one coherent six-cell atlas. Genuine alpha transparency outside each miniature. Tiny contact shadows only. NO land map, island outline, sea, terrain blanket, plinth, full square background, labels, lettering, logos, grid lines, UI, people portraits or watermark. Moderate natural colours, clean silhouettes readable at 60–100px. City symbols must clearly feel contemporary; trees are only small supporting accents. Accurate named subjects are interpretive rather than surveyed models. Do not add famous landmarks from other cities.
```

### Targeted correction prompt

```text
Edit this transparent 1536 x 1024 atlas while preserving the 3 column by 2 row layout and detailed miniature art style. Remove ALL diffuse background haze and broad glows around every asset: every pixel outside each miniature and its tight ground shadow must be fully transparent. CRITICAL each cell must have at least 35 px clear transparent padding on every side, no fragment from a neighbouring cell, so slightly shrink/recenter all six cutouts inside their 512 x 512 cells. Top left: replace the generic residential glass tower with recognisable KOMTAR Penang: tall pale beige cylindrical/faceted office tower with very closely spaced horizontal concrete floor bands and dark horizontal ribbon windows, NOT residential balconies, a simple wider circular top observation crown with subtle rainbow skywalk arc, broad low shopping podium, a couple of heritage shophouses. Keep the other five regional symbols in their existing positions and styles: Gurney modern waterfront hotel/condo towers; Batu Kawan blue/yellow warehouse with outlet shops; Teluk Bahang conservatory and adventure park regional montage; Queensbay modern mall and apartments regional montage; Butterworth modern transport terminal and ferry pontoon montage. No text, no logos, no labels, no grid. Transparent background.
```
