#!/usr/bin/env python3
"""Cache a bounded set of named OSM references. No browser-time API requests.

Nominatim is used only for these finite, individually named places, at <=1 rps.
Existing responses are reused. Run deliberately to refresh a missing source.
"""
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/source'
GEOMETRY_REQUESTS = {
    'island.osm': 'https://api.openstreetmap.org/api/0.6/relation/12272811/full',
    'state.osm': 'https://api.openstreetmap.org/api/0.6/relation/4445131/full',
    'bridge-1.osm': 'https://api.openstreetmap.org/api/0.6/way/601267471/full',
    'bridge-2.osm': 'https://api.openstreetmap.org/api/0.6/way/725050946/full',
    'ferry.osm': 'https://api.openstreetmap.org/api/0.6/map?bbox=100.337,5.404,100.374,5.424',
}
LOOKUPS = {
    'fort': 'Fort Cornwallis, Penang, Malaysia',
    'kho': 'Khoo Kongsi, Penang, Malaysia',
    'jetty': 'Chew Jetty, Penang, Malaysia',
    'hill': 'Bukit Bendera, Penang, Malaysia',
    'kek': 'Kek Lok Si Temple, Penang, Malaysia',
    'beach': 'Batu Ferringhi, Penang, Malaysia',
    'food': 'Chowrasta Market, Penang, Malaysia',
    'mainland': 'Bukit Mertajam, Penang, Malaysia',
}

def write_receipts():
    requests = dict(GEOMETRY_REQUESTS)
    for key, query in LOOKUPS.items():
        requests[f'{key}-search.json'] = 'https://nominatim.openstreetmap.org/search?' + urlencode({'q': query, 'format': 'jsonv2', 'limit': 5})
    sources = []
    for name, url in requests.items():
        file = SOURCE / name
        sources.append({'cache_name': name, 'url': url,
            'retrieved_at': datetime.fromtimestamp(file.stat().st_mtime, timezone.utc).isoformat(),
            'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
    receipts = {'license': 'ODbL-1.0', 'attribution': '© OpenStreetMap contributors',
        'license_url': 'https://opendatacommons.org/licenses/odbl/1-0/',
        'copyright_url': 'https://www.openstreetmap.org/copyright',
        'display_bounds': [100.16, 5.20, 100.52, 5.51],
        'projection': 'Local equirectangular, standard parallel 5.36 N; north-up reference',
        'sources': sources,
        'notes': [
            'OSM source versions are recorded in geography.geojson. Refreshing current API data can return newer versions.',
            'Coordinates are unmodified OSM coordinates; area labels are representative points.',
            'No geometry was copied or traced from Google Maps or the artistic reference.',
            'The statewide polygon includes its inland administrative boundary. Regional view is cropped.',
            'Only the two named local ferry ways are selected from the bounded API response; unrelated routes are excluded.',
        ]}
    (ROOT / 'data/source-receipts.json').write_text(json.dumps(receipts, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    SOURCE.mkdir(parents=True, exist_ok=True)
    for filename, url in GEOMETRY_REQUESTS.items():
        target = SOURCE / filename
        if target.exists():
            continue
        request = Request(url, headers={'User-Agent': 'ExplorePenang-GeographyReview/0.2'})
        with urlopen(request, timeout=45) as response:
            content = response.read()
        target.write_bytes(content)
        print('Cached', filename, flush=True)
        time.sleep(1.1)
    for key, query in LOOKUPS.items():
        target = SOURCE / f'{key}-search.json'
        if target.exists():
            continue
        time.sleep(1.1)
        url = 'https://nominatim.openstreetmap.org/search?' + urlencode({
            'q': query, 'format': 'jsonv2', 'limit': 5,
        })
        request = Request(url, headers={'User-Agent': 'ExplorePenang-GeographyReview/0.2 (github.com/svanistelrooy901-art/explore-penang)'})
        with urlopen(request, timeout=30) as response:
            data = json.load(response)
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        print(key, [(p['osm_type'], p['osm_id'], p.get('name')) for p in data], flush=True)
    write_receipts()
