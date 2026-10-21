# P02.2 — Geographic accuracy review

**Status, 16 October 2026:** Mamu approved the P02.2 geographic draft in reply to the presented review, against commit `18aa68460763b94b96c972f35a6af6e743d6d9a5`. [Approval record](geography-approval.json) locks the source-data fingerprints. P02.3 illustration development continues on `review/p02-geography`. This work has not been deployed to GitHub Pages; final visual work and publication remain outstanding.

## Concrete review material

- [Interactive self-contained review](../review.html): open locally; compare **North-up reference** and **Illustrated depth**. Use **George Town close-up** for four nearby points.
- [North-up reference map](geography-reference.svg).
- [Illustrated depth map](geography-illustrated.svg).
- [Geometry snapshot](../data/geography.geojson), [destination coordinates](../data/places.json), and [source receipts](../data/source-receipts.json).

The live `index.html` is byte-for-byte unchanged from production commit `5729c337704457b1b15045f024a6d313db290b2f`. No merge, deployment, DNS or GitHub Pages setting change is part of this work.

## Geographic source register

The six geometry features are extracted from OSM. Exact longitude/latitude vertices are retained. Each feature records its OSM ID, URL, object version and timestamp; raw-response SHA-256 receipts record retrieval. The north-up view uses local equirectangular projection (standard parallel 5.36° N), cropped to `[100.16, 5.20, 100.52, 5.51]` (west, south, east, north).

| Feature | OSM reference | Method and limitation |
| --- | --- | --- |
| Penang Island | Relation [12272811](https://www.openstreetmap.org/relation/12272811), v54 | Join exact coastline member nodes; fail on ring gaps. |
| State land / Seberang Perai | Relation [4445131](https://www.openstreetmap.org/relation/4445131), v127 | Exact outer rings; eastern edge includes an administrative boundary, not coastline. |
| Penang Bridge | Way [601267471](https://www.openstreetmap.org/way/601267471), v9 | Mapped bridge footprint; not all approach roads/interchanges. |
| Sultan Abdul Halim Mu’adzam Shah Bridge | Way [725050946](https://www.openstreetmap.org/way/725050946), v13 | Mapped marine footprint; not the full 24 km expressway. |
| Ferry to island | Way [665889565](https://www.openstreetmap.org/way/665889565), v16 | Extracted ferry route; no live position or sailing guarantee. |
| Ferry to mainland | Way [1212505372](https://www.openstreetmap.org/way/1212505372), v5 | Extracted separately from road bridges; unrelated routes excluded. |

Data is © OpenStreetMap contributors, licensed under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Attribution appears on the interactive map, standalone SVGs and embedded data downloads. Official sources were cross-checks only; no third-party map artwork was copied.

## Malaysian official cross-checks

Checked on **15 October 2026**. Scope is names, connections and general locality; official sources do not certify OSM vertices.

| Check | Evidence | Result and limit |
| --- | --- | --- |
| Two bridges, ferry, northern coast and mainland towns | [Penang Global Tourism — Penang Map](https://www.mypenang.gov.my/abt_png.php?id=em1DVjlJRHFtbFpqWGVwZldaMjVUUT09) | Names and broad relationships agree. |
| First bridge island ↔ Perai | [PLUS](https://www.plus.com.my/our-expressways/) | Operator confirms island–Perai link. [Penang Bridge office FAQ](https://penangbridge.com.my/faqs/) identifies Gelugor; its stale “only road connection” claim is rejected. |
| Second bridge Batu Maung ↔ Batu Kawan | [JKSB](https://www.jambatankedua.com.my/corporate-overview/) | Landing localities confirmed; total expressway and marine bridge are distinct. |
| Ferry terminal names | [Penang Port Commission](https://penangport.gov.my/en/services/service/ferry-services) | Raja Tun Uda (George Town) ↔ Sultan Abdul Halim (Butterworth). No schedules copied because official pages show conflicting times. |
| Fort Cornwallis | [PGT listing](https://www.mypenang.gov.my/view_directory.php?id=Q3Z3ZG1Sa2o1dGJDc3VtTWo2dlNpdz09) | Name and waterfront locality checked. |
| Khoo Kongsi | [Official site](https://www.khookongsi.com.my/) | Identity and visitor link checked. |
| Clan Jetties | [PGT listing](https://www.mypenang.gov.my/view_directory.php?id=ZW5mTlJKcWR2RXZ5eDkyS29yOVRWdz09) | Chew Jetty is the representative OSM point, not all jetties. |
| Penang Hill | [Penang Hill Corporation](https://www.penanghill.gov.my/index.php/en/) | Hill identity and visitor link checked; peak pin is not the lower railway entrance. |
| Kek Lok Si | [Official temple site](https://kekloksitemple.com/) | Air Itam locality and visitor link checked. |
| Food-trail anchor | [PGT Chowrasta Market](https://mypenang.gov.my/view_directory.php?id=amRoa3REM0h5TFMzY2RhVzgwTjIyQT09) | One real market stop; no invented trail geometry. |

MyGeoportal was an example in the earlier plan. It is not claimed as a completed cross-check or geometry provider. The official tourism bureau, operators and port commission provide the evidence above.

## Presentation and interaction

Both views use the same data. The depth study adds an affine presentation transform, raised land edges, decorative vegetation and symbols. It is **not measured terrain or the final detailed art direction**. The north arrow reflects the view transform. Building and locality centres are distinguished from entrances. Close George Town destinations group in overview and remain individually selectable on zoom or in the journal. Discovery uses a separate review-only local-storage key.

## Validation

- **10 core/geographic tests passed:** orientation, bridge IDs/extents/order, ferry extents, source versions, closed geometry, real POI coordinates, safe URLs, immutable rendering, zoom math, corrupt storage/hash recovery and output size/attribution, and approved-source fingerprints.
- **5 Chromium browser scenarios passed:** desktop and 390×844 mobile; filters, drag, pinch/button zoom, reduced motion, keyboard selection, quest/progress persistence, malformed hash, blocked storage, no third-party requests and standalone-file data download.
- Desktop and mobile screenshots inspected locally. Real-device iOS/Android and screen-reader testing remain outstanding.
- Deterministic build and `git diff --check` pass. CI runs checks only and has no deployment step. Remote CI must be read from the PR; local passes are not GitHub runs.

## Owner review and next development

Geography review is complete: Mamu's reply **“approved”** on 16 October 2026 accepts the presented island outline, west/east relationship, both bridge footprints, ferry alignment and representative pins. Geography approval does not mark the detailed art treatment complete. Tests reject changes to any approved source file unless the approval record is deliberately updated through a new review.

P02.3 now replaces generic conifers/buildings with broadleaf trees, palms, distinct fort/clanhouse/temple/hill/jetty/market symbols and a decorative ferry. Landmarks remain anchored to the approved POI coordinates and limit growth on close-up so they do not obscure the map. Symbols and landscape shading are illustrative, not measured footprints, terrain or land use.

Remaining: complete the detailed illustrated-world treatment, improve overview/mobile labels, verify venue entrances/accessibility, perform real-device QA and prepare publication. No ticket sales, affiliate tracking, ads or backend is active.

## P02.3 diorama pass — 16 October 2026

Compared directly with the approved concept image available in this conversation. This increment is a substantially more detailed 3D-inspired illustration, not a completed reproduction of that concept.

| Concept feature | Implemented in this pass | Remaining gap |
| --- | --- | --- |
| Textured terrain and dense foliage | Reusable transparent forest/hill sprites, overlapping canopies and layered rock/shore edges | Stylized elevation, repeated foliage and visible mainland patches; not continuous measured relief |
| Detailed landmark architecture | Generated decorative symbols and illustrated profile/card previews | Symbolic interpretations; architectural accuracy needs further reference work, especially Khoo Kongsi |
| Bridges with depth | Road decks, piers, shadows and cable/tower symbols; derived centre lines remain inside both approved footprints | Towers and engineering details are illustrative |
| Turquoise water and atmosphere | Shallow-water halos, wave texture, light glints, haze and decorative ferry motion | Simpler water/lighting than the concept render |
| Readable interactive discovery | Touch-sized pins, mobile regional clustering, close-up presets, keyboard navigation and mobile attraction sheet | Dense desktop George Town labels and additional real-device QA remain |

Validation for this pass: **12 core/geography checks and 7 Chromium browser scenarios** passed locally. Added coverage checks approved-data fingerprints, centre-preserving presentation changes, derived bridge details, focus bounds, DOM reuse during pan, selecting a landmark after dragging, touch clusters, mobile profiles and motion controls. Existing discovery, quest, deep-link, sharing controls and official outbound links remain. The offline document is under 2 MB; the atlas is 455,166 bytes. Remote CI must be checked at the new head.

Desktop (1440px), mobile (390px) and mobile attraction-state screenshots are delivered in the conversation for visual review. No approved geographic file, fingerprint, live entry page, DNS or Pages setting was changed. PR #1 remains draft; explicit owner approval is still required before merge or production publishing.

## P02.4 visual fidelity and interactive world — 16 October 2026

Compared desktop, 390px mobile and George Town close-up directly with the owner's approved “Wander and Discover” concept. This is a meaningful visual increment, not final art acceptance.

| Benchmark | Current result | Remaining visual limit |
| --- | --- | --- |
| Continuous miniature terrain | Connected forested ridge and mainland fabric; shared warm lighting, soft shore light and raised edges | Illustrative height and land cover; simpler land/water transition than the concept |
| Heritage architecture | Dedicated ornate Khoo Kongsi, separate hill summit and temple, stilt jetty, fort and market; finer George Town fabric on zoom | Generated interpretations; exact facade, roof, lighthouse and pavilion details require review; streets are decorative |
| Tropical vegetation | Varied canopy, palms, orchards and planted town transitions across a continuous material | Source art may contain repeated motifs and invented land-use details |
| Bridges and sea | More piers, cables, deck shading, small traffic symbols, boats, subtle waves, glints and haze | Engineering and vessel positions remain symbolic; no live service data |
| Discovery | Interruptible animated focus, immediate reduced-motion camera, stable label sizes, keyboard filter focus/profile dismissal and 320px/390px layouts | Physical iOS/Android, screen-reader and prolonged gesture QA remain |

Static art is baked from the exact approved land path into two compact textures. Both bridges and ferry routes remain source-derived layers. Dense bridge sampling uncovered a concave approach segment: selecting an interior intersection span fixes the decorative deck spine without changing the footprint. Source/output art hashes prevent stale bakes. Approved geographic files and fingerprints remain unchanged.

Validation: **15 core/geography tests and 11 Chromium browser scenarios**. Coverage adds concave bridge sampling, art-bake integrity, camera interpolation/interruption, 320px overflow, dedicated Khoo art, filter focus, Escape dismissal, hostile fragments, bounded vessel/label scale, tappable mobile labels and panning cost. Journal, quests, progress, filters, official links, sharing controls, offline downloads and storage recovery remain.

Performance sample: headless Chromium 153, 390×844, 4× CPU slowdown, software rendering, reduced motion, 72 pan frames per view. Final local run: overview recorded **33.3 ms p95 frame interval, 1.5 ms p95 event dispatch and 255 SVG nodes**; George Town recorded **16.8 ms p95 frame interval, 0.9 ms p95 event dispatch and 292 nodes**. Both recorded zero long tasks and zero pin rebuilds. CI repeats the benchmark with broad regression thresholds; this is not a guarantee for a particular phone. The standalone review remains below 2 MB with no third-party resources.

Security: npm audit reported **zero known dependency vulnerabilities**, including the build-only Sharp dependency. Focused source review checked fragment/storage inputs, text escaping, embedded JSON, outbound links and artwork references. Browser cases retain malformed/hostile fragment recovery, blocked storage and no third-party requests. This is a focused development check, not an exhaustive audit.

Review screenshots: [full world](screenshots/p024-world.webp), [George Town](screenshots/p024-georgetown.webp), [mobile](screenshots/p024-mobile.webp), [mobile attraction](screenshots/p024-mobile-profile.webp). Full PNGs and a concept comparison accompany the Work handoff. See [art provenance and production prompts](../review/assets/README.md).

P02 remains **illustration in progress**. Geometry, coordinates, receipts, geographic approval records, production entry page, DNS and Pages settings are untouched. Keep PR #1 in draft; explicit owner approval is required before merge or publication.

### P02.4 refinement pass — coastline lighting, architecture and mobile context

This pass retains the connected landscape and adds the following:

- Coastal light/foam now follows only the 150 approved OSM relation members tagged as coastline. Eighteen inland/boundary members are excluded. Every derived vertex must exist in the frozen land geometry. The geographic source files are not rewritten.
- The targeted v3 atlas corrects the fort's generic solid lighthouse into a white steel framework and refines the temple's octagonal pagoda. The source checks and complete built-in ImageGen edit prompt are in the artwork README. Measured crop windows remove adjacent-sprite bleed. Architecture still requires visual review.
- A transparent miniature ferry replaces the flat vector vessel, using the same decorative route anchor. It is not a current-fleet engineering model or live position.
- Mobile selection brings the map above the attraction sheet and focuses the selected point higher in the map. The selected miniature retains a readable screen size. Journal activation focuses a named attraction region; Escape returns to the map. Artwork placement changes do not change destination coordinates.

Validation: **16 core/geography checks and 12 Chromium browser scenarios passed locally**, including 320px/390px map-to-profile visibility, selected-art readability, keyboard focus, coastal-member exclusion and exact approved-vertex membership. The latest 4× CPU-throttled local pan sample recorded **16.8 ms p95 frame interval and 1.0 ms p95 event dispatch** in both overview and George Town, with zero long tasks and no pin rebuilds (250/287 SVG nodes). The self-contained review is **1,671,300 bytes** and requests no third-party resources. Npm audit reports zero known dependency vulnerabilities. CI must be verified at the new commit.

The desktop, George Town, mobile and mobile-profile screenshots above are refreshed for this pass. The Work handoff also includes the concept comparison. The improvement is visible in shoreline separation, landmark character and the mobile Explore → Discover → Visit transition. It does not complete P02: generated architecture, true elevation, detailed coastal realism, physical phone and screen-reader testing remain separate acceptance work. No merge or production publication is authorized by these test results.
