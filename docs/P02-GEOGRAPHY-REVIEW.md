# P02.2 — Geographic accuracy approval draft (PRIVATE REVIEW BRANCH)

**Status:** research and geographic source preparation in progress. **Not approved for publishing.** Do not merge this branch into main or alter GitHub Pages configuration until owner explicitly approves the map.

## Locked requirements
- Use OpenStreetMap (OSM) coastline, bridge, ferry and destination geometries as primary data source, preserving OSM attribution and applicable ODbL requirements.
- Cross-check place names, major crossings and tourism points against Malaysian official sources (e.g. MyGeoportal and Penang Global Tourism). Record each verification separately; do not claim it is done without evidence.
- Draw **both** road bridges: (1) Penang Bridge linking Gelugor to Perai; (2) Sultan Abdul Halim Mu'adzam Shah Bridge linking Batu Maung to Batu Kawan/Bandar Cassia.
- Represent George Town–Butterworth ferry separately from road bridges.
- Position Penang Island west of Seberang Perai; north-up geographic reference view first. Stylized 3D isometric render is a separate artistic layer.
- Retain mobile-first pan/zoom, destination discovery, attraction cards, official/ticket outbound links, quests and shareability.
- Never replace the live map before owner reviews and approves geographic draft.

## Source and compliance register
| Data / cross-check | Source | Status |
| --- | --- | --- |
| Coastlines, waterways, road/bridge geometries, attraction nodes | https://www.openstreetmap.org/ | Data extraction pending |
| Attribution / ODbL | https://www.openstreetmap.org/copyright | Requirements reviewed; implementation pending |
| Malaysian geographical reference | https://www.mygeoportal.gov.my/ | Cross-check pending |
| Penang tourism reference | https://mypenang.gov.my/ | Cross-check pending |

## Review gates
1. Obtain actual OSM coastline/bridge geometries and record extraction date, bounding box, license, and reproducible source.
2. Cross-check both bridge alignments, ferry connection, and named attractions.
3. Generate geographic reference map with north arrow and attribution; annotate any uncertain feature.
4. Build an independent illustrated 2.5D/3D mockup grounded in the verified geometry.
5. Test small-screen legibility and map controls; collect screenshots.
6. Present reference-versus-illustrated comparison for owner approval **before merge or publication**.

## Current risk
Earlier P02 artwork is schematic and does **not** constitute geographic verification. No extracted OSM dataset or geographic draft is committed as of creation of this file.
