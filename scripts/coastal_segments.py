#!/usr/bin/env python3
"""Decorative shore selection using indices into the immutable approved rings.

Normal builds need only tracked files. --record-source reproduces the art recipe
from the receipt-verified local OSM cache; it never writes geographic data.
"""
import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
RECIPE = ROOT / 'review/assets/coastal-recipe-v1.json'


def approved_inputs():
    data = json.loads((ROOT / 'data/geography.geojson').read_text())
    land = next(f for f in data['features'] if f['id'] == 'penang-land')
    receipts = json.loads((ROOT / 'data/source-receipts.json').read_text())
    receipt = next(s for s in receipts['sources'] if s['cache_name'] == 'state.osm')
    members = {w['id'] for w in land['properties']['member_ways'] if w['role'] == 'outer'}
    return land, receipt, members


def record_source():
    land, receipt, members = approved_inputs()
    raw = (ROOT / 'data/source' / receipt['cache_name']).read_bytes()
    if hashlib.sha256(raw).hexdigest() != receipt['sha256']:
        raise ValueError('OSM cache differs from the approved source receipt')
    source = ET.fromstring(raw)
    nodes = {int(n.attrib['id']): [float(n.attrib['lon']), float(n.attrib['lat'])] for n in source.findall('node')}
    references, excluded = [], []
    for way in source.findall('way'):
        way_id = int(way.attrib['id'])
        if way_id not in members:
            continue
        tags = {t.attrib['k']: t.attrib['v'] for t in way.findall('tag')}
        if tags.get('natural') != 'coastline':
            excluded.append(way_id)
            continue
        points = [nodes[int(n.attrib['ref'])] for n in way.findall('nd')]
        match = None
        for pi, polygon in enumerate(land['geometry']['coordinates']):
            for ri, ring in enumerate(polygon):
                size = len(ring) - 1
                for start, point in enumerate(ring[:-1]):
                    if point != points[0]:
                        continue
                    for step in (1, -1):
                        if all(ring[(start + step * i) % size] == p for i, p in enumerate(points)):
                            match = dict(way_id=way_id, polygon=pi, ring=ri, start=start, step=step, count=len(points))
                            break
                    if match:
                        break
                if match:
                    break
            if match:
                break
        if match is None:
            raise ValueError(f'Coastline way {way_id} differs from the approved rings')
        references.append(match)
    recipe = dict(description='Art-only coastline selection; vertex indices reference approved geography, with no new coordinates.',
                  source=receipt, relation_id=land['properties']['osm_id'],
                  segments=references, excluded_boundary_ways=excluded)
    RECIPE.write_text(json.dumps(recipe, indent=2) + '\n')


def coast_segments():
    land, receipt, members = approved_inputs()
    recipe = json.loads(RECIPE.read_text())
    if recipe['source'] != receipt or recipe['relation_id'] != land['properties']['osm_id']:
        raise ValueError('Coastal art recipe differs from the approved source receipt')
    excluded = recipe['excluded_boundary_ways']
    selected = [s['way_id'] for s in recipe['segments']]
    all_ids = selected + excluded
    if not selected or len(all_ids) != len(set(all_ids)) or set(all_ids) != members:
        raise ValueError('Coastal art recipe must classify every approved outer member once')
    segments = []
    polygons = land['geometry']['coordinates']
    for s in recipe['segments']:
        keys = ('polygon', 'ring', 'start', 'step', 'count')
        if any(type(s[k]) is not int for k in keys):
            raise ValueError('Coastal art indices must be integers')
        if not 0 <= s['polygon'] < len(polygons) or not 0 <= s['ring'] < len(polygons[s['polygon']]):
            raise ValueError('Coastal art ring is outside approved geometry')
        ring = polygons[s['polygon']][s['ring']]
        size = len(ring) - 1
        if s['step'] not in (-1, 1) or not 0 <= s['start'] < size or not 2 <= s['count'] <= size + 1:
            raise ValueError('Coastal art span is outside approved geometry')
        points = [ring[(s['start'] + s['step'] * i) % size] for i in range(s['count'])]
        segments.append({'way_id': s['way_id'], 'coordinates': points})
    return {'segments': segments, 'excluded_boundary_ways': excluded}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--record-source', action='store_true', help='Reproduce art recipe from the receipt-verified local cache')
    if parser.parse_args().record_source:
        record_source()
    print(json.dumps(coast_segments(), separators=(',', ':')))
