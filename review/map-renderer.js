(function (root) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./map-core.js') : root.PenangMap;
  const A = typeof module !== 'undefined' && module.exports ? require('./map-art.js') : root.PenangArt;
  const D = typeof module !== 'undefined' && module.exports ? require('./diorama.js') : root.PenangDiorama;
  const fmt = n => Number(n.toFixed(2));
  const ICONS = { Heritage: '✦', Nature: '♧', Culture: '◇', Food: '♨', Local: '⌂' };
  function geometryPath(geometry, mode) {
    const closed = geometry.type !== 'LineString';
    const lines = geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : geometry.type === 'Polygon' ? geometry.coordinates : [geometry.coordinates];
    return lines.map(line => line.map((p, i) => (i ? 'L' : 'M') + C.viewPoint(p, mode).map(fmt).join(' ')).join('') + (closed ? 'Z' : '')).join('');
  }
  function renderWorld(data, mode = 'reference') {
    if(mode==='illustrated')return D.render(data,geometryPath);
    const features = Object.fromEntries(data.geography.features.map(f => [f.id, f]));
    const land = geometryPath(features['penang-land'].geometry, mode);
    const relief = mode === 'illustrated';
    let art = '', landmarks = '', seaArt = '';
    if (relief) {
      // Decorative shading and vegetation are not elevation or land-use observations.
      const [hx,hy] = C.viewPoint(data.places.find(p=>p.id==='hill').coordinates,mode);
      art += `<g data-art="landscape-shading"><ellipse cx="${hx-22}" cy="${hy+65}" rx="105" ry="170" transform="rotate(9 ${hx} ${hy})" fill="#467c59" opacity=".16"/><ellipse cx="${hx-42}" cy="${hy+50}" rx="67" ry="133" fill="#6d9a64" opacity=".19"/><path d="M${hx-25} ${hy-95}q-50 75-24 165t4 132" fill="none" stroke="#d5daa0" stroke-width="22" opacity=".15"/></g>`;
      const noise=i=>{let v=(i+1)|0;v=Math.imul(v^(v>>>16),0x45d9f3b);v=Math.imul(v^(v>>>16),0x45d9f3b);return ((v^(v>>>16))>>>0)/4294967296;};
      const vegetation=[];
      for (let i = 0; i < 300; i++) {
        const lon = 100.18 + noise(i*3+1)*.32;
        const lat = 5.235 + noise(i*3+2)*.255;
        if (C.pointInGeometry([lon, lat], features['penang-land'].geometry)) {
          const [x, y] = C.viewPoint([lon, lat], mode);
          // Keep landmark symbols clear and avoid filling the whole mainland as forest.
          if(data.places.some(p=>{const [px,py]=C.viewPoint(p.coordinates,mode);return Math.hypot(x-px,y-py)<38;}))continue;
          if(lon>100.35&&i%3!==0)continue;
          vegetation.push({x,y,s:.48+noise(i+500)*.38,seed:i});
        }
      }
      vegetation.sort((a,b)=>a.y-b.y).forEach((v,i)=>{art+=i%11===0?A.palm(v.x,v.y,v.s):A.tree(v.x,v.y,v.s,v.seed);});
      for (const p of [...data.places].sort((a,b)=>b.coordinates[1]-a.coordinates[1])) {
        const [x,y]=C.viewPoint(p.coordinates,mode);
        landmarks += A.landmark(p.id,x,y,p.id==='hill'?.93:p.id==='kek'?.85:.9);
      }
      const route=features['ferry-to-island'].geometry.coordinates;
      const mid=route[Math.floor(route.length/2)], [fx,fy]=C.viewPoint(mid,mode);
      seaArt=`<g data-art="ferry-symbol" aria-hidden="true"><title>Decorative ferry symbol, not a live vessel position</title>${A.ferry(fx,fy,.72)}</g>`;
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
    return `<defs><linearGradient id="ocean" x2=".3" y2="1"><stop stop-color="#247d91"/><stop offset="1" stop-color="#135569"/></linearGradient><linearGradient id="land" x2="1" y2="1"><stop stop-color="#e1e8ad"/><stop offset="1" stop-color="#97ba7c"/></linearGradient><pattern id="water" width="90" height="65" patternUnits="userSpaceOnUse"><path d="M10 20q12-4 24 0m26 27q8-3 16 0" fill="none" stroke="#8bd5d4" stroke-opacity=".16" stroke-width="1.2"/></pattern><clipPath id="land-clip"><path d="${land}"/></clipPath></defs><rect width="1100" height="880" fill="url(#ocean)"/><rect width="1100" height="880" fill="url(#water)"/><g id="camera"><g class="geo-base">${relief ? `<path d="${land}" transform="translate(0 17)" fill="#487c61" stroke="#26605b" stroke-width="5"/>` : ''}<path d="${land}" fill="none" stroke="#71bcb5" stroke-width="18" opacity=".4"/><path data-feature="land" d="${land}" fill="url(#land)" stroke="#f5edc3" stroke-width="3" fill-rule="evenodd"/><g clip-path="url(#land-clip)" aria-hidden="true">${art}</g><g id="landmark-art-layer">${landmarks}</g>${bridges}${ferries}${seaArt}</g><g id="map-labels">${label([100.244,5.356], 'PENANG ISLAND', 0, 0, 18)}${label([100.468,5.447], 'SEBERANG', 0, 0, 17)}${label([100.468,5.437], 'PERAI', 0, 0, 17)}${label([100.366,5.388], 'PENANG STRAIT',0,0,11)}${label([100.354,5.344], '01 · PENANG BRIDGE',0,16)}${label([100.366,5.265], '02 · SECOND BRIDGE',0,22)}${label([100.371,5.418], '03 · FERRY',40,-12)}${label([100.300,5.288], 'Batu Maung',-48,-10,11)}${label([100.428,5.253], 'Batu Kawan',40,10,11)}${label([100.311,5.357], 'Gelugor',-44,10,11)}${label([100.390,5.357], 'Perai',35,-8,11)}${label([100.365,5.422], 'Butterworth',40,-30,11)}</g><g id="pins"></g></g><g id="orientation" transform="translate(1030 62)"><circle r="29" fill="#123e4c" stroke="#83b6b4"/><path d="${relief ? 'M4 17L-4-17l-7 11 7-2 8 25' : 'M0 17V-17L-7-6 0-8 7-6Z'}" fill="#f8d080"/><text y="-37" text-anchor="middle" fill="#fff4d6" font-family="system-ui" font-size="13">N</text></g>${relief ? '<text x="30" y="845" fill="#e7f4e9" font-size="13">Illustrative depth · no elevation data</text>' : `<g data-scale="true" transform="translate(30 828)" fill="#fff4d6" stroke="#fff4d6"><path d="M0-5V0H${fmt(km)}V-5" fill="none" stroke-width="2"/><text x="0" y="20" stroke="none" font-size="13">0</text><text x="${fmt(km)}" y="20" text-anchor="end" stroke="none" font-size="13">5 km</text></g>`}`;
  }
  const api = { renderWorld, geometryPath, ICONS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PenangRenderer = api;
})(globalThis);
