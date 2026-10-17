#!/usr/bin/env python3
"""Generate review data from cached OSM responses, without hand-drawn coordinates."""
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/source'
PGT = 'https://www.mypenang.gov.my/abt_png.php?id=em1DVjlJRHFtbFpqWGVwZldaMjVUUT09'
SPECS = [
    ('fort', 'Fort Cornwallis', 'Heritage', 'relation', 5827552,
     'A historic fort beside the George Town waterfront.',
     'https://www.mypenang.gov.my/view_directory.php?id=Q3Z3ZG1Sa2o1dGJDc3VtTWo2dlNpdz09', 'Official tourism listing', 'Site centre; not an entrance'),
    ('kho', 'Khoo Kongsi', 'Heritage', 'node', 6832811985,
     'Discover a clanhouse and its intricate architecture in Cannon Square.',
     'https://www.khookongsi.com.my/', 'Official visitor information', 'Mapped attraction node'),
    ('jetty', 'Clan Jetties · Chew Jetty', 'Heritage', 'relation', 13314976,
     'Explore a waterfront community with respect for the people who live here.',
     'https://www.mypenang.gov.my/view_directory.php?id=ZW5mTlJKcWR2RXZ5eDkyS29yOVRWdz09', 'Official tourism listing', 'Chew Jetty represents the wider Clan Jetties area'),
    ('hill', 'Penang Hill', 'Nature', 'node', 1387210299,
     'Discover the hill landscape and find current visitor guidance from Penang Hill Corporation.',
     'https://www.penanghill.gov.my/index.php/en/', 'Official visitor information', 'Hill reference point; not the lower funicular station'),
    ('kek', 'Kek Lok Si Temple', 'Culture', 'way', 768570111,
     'Discover temple architecture in the hills of Air Itam.',
     'https://kekloksitemple.com/', 'Official visitor information', 'Temple building centre; not an entrance'),
    ('beach', 'Batu Ferringhi', 'Nature', 'relation', 11203462,
     'Explore the northern coast. This pin represents the locality, rather than a particular beach entrance.',
     PGT, 'Penang tourism overview', 'Locality reference point'),
    ('food', 'Food trail · Chowrasta', 'Food', 'way', 264409107,
     'Start your own food exploration around Chowrasta. This is one market anchor, not a mapped walking route.',
     'https://mypenang.gov.my/view_directory.php?id=amRoa3REM0h5TFMzY2RhVzgwTjIyQT09', 'Official tourism listing', 'Chowrasta Market building centre; one representative stop'),
    ('mainland', 'Bukit Mertajam', 'Local', 'relation', 7013106,
     'Discover mainland neighbourhoods and make room for a Seberang Perai adventure.',
     PGT, 'Penang tourism overview', 'Town reference point; not a visitor entrance'),
]

def read_osm(name):
    root = ET.parse(SOURCE / name).getroot()
    nodes = {int(n.attrib['id']): [float(n.attrib['lon']), float(n.attrib['lat'])] for n in root.findall('node')}
    return root, nodes

def tags(element):
    return {t.attrib['k']: t.attrib['v'] for t in element.findall('tag')}

def osm_feature(root, nodes, kind, osm_id, feature_id):
    el = next(x for x in root.findall(kind) if x.attrib['id'] == str(osm_id))
    coords = [nodes[int(n.attrib['ref'])] for n in el.findall('nd')]
    geometry = {'type': 'Polygon', 'coordinates': [coords]} if coords[0] == coords[-1] else {'type': 'LineString', 'coordinates': coords}
    return {'type': 'Feature', 'id': feature_id, 'properties': {
        'osm_type': kind, 'osm_id': osm_id, 'version': int(el.attrib['version']),
        'osm_timestamp': el.attrib['timestamp'], 'tags': tags(el),
        'source_url': f'https://www.openstreetmap.org/{kind}/{osm_id}',
    }, 'geometry': geometry}

def relation_geometry(root, nodes, osm_id):
    """Assemble exact OSM member-node rings. Fail on gaps; never close a guessed edge."""
    relation = next(x for x in root.findall('relation') if x.attrib['id'] == str(osm_id))
    ways = {int(w.attrib['id']): [int(n.attrib['ref']) for n in w.findall('nd')] for w in root.findall('way')}
    segments = []
    for m in relation.findall('member'):
        if m.attrib['type'] == 'way' and m.attrib.get('role') == 'outer':
            segments.append(ways[int(m.attrib['ref'])][:])
        elif m.attrib.get('role') == 'inner':
            raise ValueError('Inner rings need explicit support before refresh')
    rings = []
    while segments:
        ring = segments.pop()
        while ring[0] != ring[-1]:
            for i, other in enumerate(segments):
                if ring[-1] == other[0]:
                    ring.extend(other[1:]); segments.pop(i); break
                if ring[-1] == other[-1]:
                    ring.extend(other[-2::-1]); segments.pop(i); break
            else:
                raise ValueError(f'Unclosed OSM ring at node {ring[-1]}')
        rings.append([[nodes[i] for i in ring]])
    return relation, {'type': 'MultiPolygon', 'coordinates': rings}

def build():
    features = []
    for filename, osm_id, fid in [('island.osm', 12272811, 'penang-island'), ('state.osm', 4445131, 'penang-land')]:
        root, nodes = read_osm(filename)
        relation, geometry = relation_geometry(root, nodes, osm_id)
        features.append({'type': 'Feature', 'id': fid, 'properties': {
            'osm_type': 'relation', 'osm_id': osm_id, 'version': int(relation.attrib['version']),
            'osm_timestamp': relation.attrib['timestamp'], 'source_url': f'https://www.openstreetmap.org/relation/{osm_id}',
            'member_ways': [{'id': int(m.attrib['ref']), 'role': m.attrib['role']} for m in relation.findall('member') if m.attrib['type'] == 'way'],
        }, 'geometry': geometry})
    for filename, osm_id, fid in [('bridge-1.osm', 601267471, 'bridge-1'), ('bridge-2.osm', 725050946, 'bridge-2')]:
        root, nodes = read_osm(filename)
        features.append(osm_feature(root, nodes, 'way', osm_id, fid))
    root, nodes = read_osm('ferry.osm')
    for osm_id, fid in [(665889565, 'ferry-to-island'), (1212505372, 'ferry-to-mainland')]:
        features.append(osm_feature(root, nodes, 'way', osm_id, fid))
    collection = {'type': 'FeatureCollection', 'license': 'ODbL-1.0',
                  'attribution': '© OpenStreetMap contributors', 'features': features}
    (ROOT / 'data/geography.geojson').write_text(json.dumps(collection, ensure_ascii=False, separators=(',', ':')) + '\n')
    places = []
    for i, (pid, name, cat, kind, osm_id, desc, url, label, note) in enumerate(SPECS):
        candidates = json.loads((SOURCE / f'{pid}-search.json').read_text())
        selected = next(p for p in candidates if p['osm_type'] == kind and p['osm_id'] == osm_id)
        places.append({'id': pid, 'number': i + 1, 'name': name, 'cat': cat, 'description': desc,
                       'coordinates': [float(selected['lon']), float(selected['lat'])],
                       'osm_type': selected['osm_type'], 'osm_id': selected['osm_id'],
                       'official_url': url, 'official_label': label, 'coordinate_note': note,
                       'verified_date': '2026-10-15', 'verification_scope': 'Name and general locality; not entrance, opening hours or fees'})
    (ROOT / 'data/places.json').write_text(json.dumps(places, ensure_ascii=False, indent=2) + '\n')
    print('Built', len(features), 'geometry features and', len(places), 'destinations')

if __name__ == '__main__':
    build()
