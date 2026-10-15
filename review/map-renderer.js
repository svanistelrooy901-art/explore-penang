(function (root) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./map-core.js') : root.PenangMap;
  const fmt = n => Number(n.toFixed(2));
  const ICONS = { Heritage: '✦', Nature: '♧', Culture: '◇', Food: '♨', Local: '⌂' };
  function geometryPath(geometry, mode) {
    const closed = geometry.type !== 'LineString';
    const lines = geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : geometry.type === 'Polygon' ? geometry.coordinates : [geometry.coordinates];
    return lines.map(line => line.map((p, i) => (i ? 'L' : 'M') + C.viewPoint(p, mode).map(fmt).join(' ')).join('') + (closed ? 'Z' : '')).join('');
  }
  function tree(x, y, s) {
    return `<g transform="translate(${fmt(x)} ${fmt(y)}) scale(${s})"><ellipse cy="7" rx="10" ry="4" fill="#0d534e" opacity=".18"/><path d="M0 5v-22" stroke="#685d34" stroke-width="3"/><path d="M-12-4L0-29 12-4Z" fill="#29785d"/><path d="M-9-14L0-35 9-14Z" fill="#549961"/><path d="M0-35L9-14H0Z" fill="#2d7957"/></g>`;
  }
  function building(x, y, type) {
    const wall = type === 'Culture' ? '#f2d287' : '#ffe6af';
    return `<g transform="translate(${fmt(x)} ${fmt(y)})"><ellipse cy="6" rx="27" ry="8" fill="#135949" opacity=".2"/><path d="M-20 0v-21l20-9 20 9V0L0 9Z" fill="${wall}" stroke="#a98552" stroke-width="1"/><path d="M0-30v39L20 0v-21Z" fill="#dfb774"/><path d="M-27-21L0-44l27 23L0-12Z" fill="#bd6548"/><path d="M0-44l27 23L0-12Z" fill="#934d3c"/><path d="M-12-14v10m10-14v10m10-9v9" stroke="#26777c" stroke-width="4"/></g>`;
  }
  function renderWorld(data, mode = 'reference') {
    const features = Object.fromEntries(data.geography.features.map(f => [f.id, f]));
    const land = geometryPath(features['penang-land'].geometry, mode);
    const relief = mode === 'illustrated';
    let art = '';
    if (relief) {
      // Decorative vegetation is clipped to the actual land polygon, not a terrain dataset.
      for (let i = 0; i < 260; i++) {
        const lon = 100.18 + ((i * 71) % 319) / 1000;
        const lat = 5.235 + ((i * 43) % 252) / 1000;
        if (C.pointInGeometry([lon, lat], features['penang-land'].geometry)) {
          const [x, y] = C.viewPoint([lon, lat], mode);
          art += tree(x, y, .65 + (i % 4) * .12);
        }
      }
      for (const id of ['kho', 'kek', 'mainland']) {
        const p = data.places.find(p => p.id === id), [x, y] = C.viewPoint(p.coordinates, mode);
        art += building(x, y, p.cat);
      }
      const [hx, hy] = C.viewPoint(data.places.find(p => p.id === 'hill').coordinates, mode);
      art += `<g transform="translate(${fmt(hx)} ${fmt(hy)})"><path d="M-34 4L0-55 35 5Z" fill="#3e8a68"/><path d="M0-55L35 5 0 0Z" fill="#226d5b"/><path d="M-10-37L0-55 11-35 1-39Z" fill="#a9c69a"/></g>`;
    }
    const bridges = ['bridge-1', 'bridge-2'].map(id => {
      const d = geometryPath(features[id].geometry, mode);
      return `${relief ? `<path d="${d}" transform="translate(0 7)" fill="#18565e" stroke="#18565e" stroke-width="7" opacity=".28"/>` : ''}<path class="bridge" data-feature="${id}" d="${d}" fill="#fbf0ce" stroke="#c48a40" stroke-width="4" stroke-linejoin="round" vector-effect="non-scaling-stroke"><title>${id === 'bridge-1' ? 'Penang Bridge — Gelugor to Perai' : "Sultan Abdul Halim Mu’adzam Shah Bridge — Batu Maung to Batu Kawan"}</title></path>`;
    }).join('');
    const ferries = ['ferry-to-island', 'ferry-to-mainland'].map(id => `<path data-feature="${id}" d="${geometryPath(features[id].geometry, mode)}" fill="none" stroke="#fcf3d4" stroke-width="2" stroke-dasharray="6 6" vector-effect="non-scaling-stroke"><title>George Town–Butterworth ferry, OSM route geometry; not live navigation</title></path>`).join('');
    const label = (coords, text, dx = 0, dy = 0, size = 13) => {
      const [x, y] = C.viewPoint(coords, mode);
      return `<text x="${fmt(x + dx)}" y="${fmt(y + dy)}" class="geo-label" font-size="${size}" text-anchor="middle">${C.escape(text)}</text>`;
    };
    const km = 5 / 111.32 * C.UNIT;
    return `<defs><linearGradient id="ocean" x2=".3" y2="1"><stop stop-color="#247d91"/><stop offset="1" stop-color="#135569"/></linearGradient><linearGradient id="land" x2="1" y2="1"><stop stop-color="#e1e8ad"/><stop offset="1" stop-color="#97ba7c"/></linearGradient><pattern id="water" width="90" height="65" patternUnits="userSpaceOnUse"><path d="M10 20q12-4 24 0m26 27q8-3 16 0" fill="none" stroke="#8bd5d4" stroke-opacity=".16" stroke-width="1.2"/></pattern><clipPath id="land-clip"><path d="${land}"/></clipPath></defs><rect width="1100" height="880" fill="url(#ocean)"/><rect width="1100" height="880" fill="url(#water)"/><g id="camera"><g class="geo-base">${relief ? `<path d="${land}" transform="translate(0 17)" fill="#487c61" stroke="#26605b" stroke-width="5"/>` : ''}<path d="${land}" fill="none" stroke="#71bcb5" stroke-width="18" opacity=".4"/><path data-feature="land" d="${land}" fill="url(#land)" stroke="#f5edc3" stroke-width="3" fill-rule="evenodd"/><g clip-path="url(#land-clip)" aria-hidden="true">${art}</g>${bridges}${ferries}</g><g id="map-labels">${label([100.244,5.356], 'PENANG ISLAND', 0, 0, 18)}${label([100.468,5.447], 'SEBERANG', 0, 0, 17)}${label([100.468,5.437], 'PERAI', 0, 0, 17)}${label([100.366,5.388], 'PENANG STRAIT',0,0,11)}${label([100.354,5.344], '01 · PENANG BRIDGE',0,16)}${label([100.366,5.265], '02 · SECOND BRIDGE',0,22)}${label([100.371,5.418], '03 · FERRY',40,-12)}${label([100.300,5.288], 'Batu Maung',-48,-10,11)}${label([100.428,5.253], 'Batu Kawan',40,10,11)}${label([100.311,5.357], 'Gelugor',-44,10,11)}${label([100.390,5.357], 'Perai',35,-8,11)}${label([100.365,5.422], 'Butterworth',40,-30,11)}</g><g id="pins"></g></g><g id="orientation" transform="translate(1030 62)"><circle r="29" fill="#123e4c" stroke="#83b6b4"/><path d="${relief ? 'M4 17L-4-17l-7 11 7-2 8 25' : 'M0 17V-17L-7-6 0-8 7-6Z'}" fill="#f8d080"/><text y="-37" text-anchor="middle" fill="#fff4d6" font-family="system-ui" font-size="13">N</text></g>${relief ? '<text x="30" y="845" fill="#e7f4e9" font-size="13">Illustrative depth · no elevation data</text>' : `<g data-scale="true" transform="translate(30 828)" fill="#fff4d6" stroke="#fff4d6"><path d="M0-5V0H${fmt(km)}V-5" fill="none" stroke-width="2"/><text x="0" y="20" stroke="none" font-size="13">0</text><text x="${fmt(km)}" y="20" text-anchor="end" stroke="none" font-size="13">5 km</text></g>`}`;
  }
  const api = { renderWorld, geometryPath, ICONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PenangRenderer = api;
})(globalThis);
