#!/usr/bin/env python3
"""Read-only decorative shoreline selection from the approved OSM snapshot.

Administrative boundary segments are not coast. Every returned vertex and way
must belong to the frozen land geometry; nothing is written to data/.
"""
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]

def coast_segments():
    data = json.loads((ROOT / 'data/geography.geojson').read_text())
    land = next(f for f in data['features'] if f['id'] == 'penang-land')
    members = {w['id'] for w in land['properties']['member_ways'] if w['role'] == 'outer'}
    approved = {tuple(p) for polygon in land['geometry']['coordinates'] for ring in polygon for p in ring}
    source = ET.parse(ROOT / 'data/source/state.osm').getroot()
    nodes = {int(n.attrib['id']): [float(n.attrib['lon']), float(n.attrib['lat'])] for n in source.findall('node')}
    segments = []
    excluded = []
    for way in source.findall('way'):
        way_id = int(way.attrib['id'])
        if way_id not in members:
            continue
        tags = {t.attrib['k']: t.attrib['v'] for t in way.findall('tag')}
        if tags.get('natural') != 'coastline':
            excluded.append(way_id)
            continue
        points = [nodes[int(n.attrib['ref'])] for n in way.findall('nd')]
        if not all(tuple(p) in approved for p in points):
            raise ValueError(f'Coastline way {way_id} differs from the approved land snapshot')
        segments.append({'way_id': way_id, 'coordinates': points})
    if not segments:
        raise ValueError('No approved coastline members found')
    return {'segments': segments, 'excluded_boundary_ways': excluded}

if __name__ == '__main__':
    print(json.dumps(coast_segments(), separators=(',', ':')))
