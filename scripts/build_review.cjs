// Build one offline-capable review document and two maps from the same renderer.
const fs = require('node:fs');
const path = require('node:path');
const C = require('../review/map-core.js');
const R = require('../review/map-renderer.js');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const {buildPage,data}=require('./page-builder.cjs');
const html=buildPage('review/template.html');
fs.writeFileSync(path.join(root,'review.html'),html);
for(const mode of ['reference','illustrated']) {
  const markers=data.places.map(p=>{const [x,y]=C.viewPoint(p.coordinates,mode);return `<g transform="translate(${x} ${y})"><circle r="12" fill="#123e4c" stroke="#ffe5a9" stroke-width="2"/><text y="4" text-anchor="middle" font-size="12" fill="#fff4df">${p.number}</text></g>`;}).join('');
  const world=R.renderWorld(data,mode).replace('<g id="pins"></g>',`<g id="pins">${markers}</g>`);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 920" role="img" aria-label="Penang ${mode} geography review"><style>.geo-label{font-family:system-ui,sans-serif;fill:#153c3d;paint-order:stroke;stroke:#e1e5b7;stroke-width:3px;stroke-linejoin:round;font-weight:700}.geo-label:nth-child(n+5){fill:#fff4d9;stroke:#205c6d;stroke-width:4px}</style>${world}<rect y="880" width="1100" height="40" fill="#123e4c"/><text x="20" y="905" font-family="system-ui,sans-serif" font-size="13" fill="#fff1cf">${mode === 'reference' ? 'P02.2 approved geography' : 'P02.4 illustration draft'} · © OpenStreetMap contributors · openstreetmap.org/copyright · ODbL</text></svg>`;
  fs.writeFileSync(path.join(root,`docs/geography-${mode}.svg`),svg);
}
console.log('Built review.html and both geographic review maps.');
