// Build one offline-capable review document and two maps from the same renderer.
const fs = require('node:fs');
const path = require('node:path');
const C = require('../review/map-core.js');
const R = require('../review/map-renderer.js');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const atlas='data:image/webp;base64,'+fs.readFileSync(path.join(root,'review/assets/diorama-atlas-v3.webp')).toString('base64');
const surface='data:image/webp;base64,'+fs.readFileSync(path.join(root,'review/assets/world-surface-v2.webp')).toString('base64');
const town='data:image/webp;base64,'+fs.readFileSync(path.join(root,'review/assets/georgetown-surface-v2.webp')).toString('base64');
const ferry='data:image/webp;base64,'+fs.readFileSync(path.join(root,'review/assets/ferry-v1.webp')).toString('base64');
const data = {surface,town,ferry,geography: JSON.parse(read('data/geography.geojson')),places:JSON.parse(read('data/places.json')),receipts:JSON.parse(read('data/source-receipts.json')),atlas};
const cards = data.places.map(p => `<button class="place-card" data-place="${p.id}" aria-pressed="false"><span class="place-number">${p.number}</span><span><b>${C.escape(p.name)}</b><small>${C.escape(p.cat)}</small></span></button>`).join('');
const sources = data.places.map(p => `<tr><td>${C.escape(p.name)}</td><td>${p.coordinates[1].toFixed(6)} / ${p.coordinates[0].toFixed(6)}</td><td>${C.escape(p.coordinate_note)}</td><td><a href="https://www.openstreetmap.org/${p.osm_type}/${p.osm_id}" target="_blank" rel="noopener noreferrer">OSM ${p.osm_type} ${p.osm_id} ↗</a><a href="${C.escape(p.official_url)}" target="_blank" rel="noopener noreferrer">${C.escape(p.official_label)} ↗</a></td></tr>`).join('');
let html=read('review/template.html');
const replacements = {CSS:read('review/style.css')+'\n'+read('review/diorama.css'),SVG:R.renderWorld(data,'illustrated'),PLACE_LIST:cards,SOURCES:sources,DATA:JSON.stringify({...data,atlas:undefined,surface:undefined,town:undefined,ferry:undefined}).replace(/</g,'\\u003c'),CORE:read('review/map-core.js'),ART:read('review/map-art.js'),DIORAMA:read('review/diorama.js'),RENDERER:read('review/map-renderer.js'),APP:read('review/app.js')};
for(const [key,value] of Object.entries(replacements)) {
  const token=key==='SVG'||key==='PLACE_LIST'||key==='SOURCES'?`<!--__${key}__-->`:`/*__${key}__*/`;
  if(!html.includes(token))throw new Error('Missing template token '+token);
  html=html.replace(token,()=>value);
}
fs.writeFileSync(path.join(root,'review.html'),html);
for(const mode of ['reference','illustrated']) {
  const markers=data.places.map(p=>{const [x,y]=C.viewPoint(p.coordinates,mode);return `<g transform="translate(${x} ${y})"><circle r="12" fill="#123e4c" stroke="#ffe5a9" stroke-width="2"/><text y="4" text-anchor="middle" font-size="12" fill="#fff4df">${p.number}</text></g>`;}).join('');
  const world=R.renderWorld(data,mode).replace('<g id="pins"></g>',`<g id="pins">${markers}</g>`);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 920" role="img" aria-label="Penang ${mode} geography review"><style>.geo-label{font-family:system-ui,sans-serif;fill:#153c3d;paint-order:stroke;stroke:#e1e5b7;stroke-width:3px;stroke-linejoin:round;font-weight:700}.geo-label:nth-child(n+5){fill:#fff4d9;stroke:#205c6d;stroke-width:4px}</style>${world}<rect y="880" width="1100" height="40" fill="#123e4c"/><text x="20" y="905" font-family="system-ui,sans-serif" font-size="13" fill="#fff1cf">${mode === 'reference' ? 'P02.2 approved geography' : 'P02.4 illustration draft'} · © OpenStreetMap contributors · openstreetmap.org/copyright · ODbL</text></svg>`;
  fs.writeFileSync(path.join(root,`docs/geography-${mode}.svg`),svg);
}
console.log('Built review.html and both geographic review maps.');
