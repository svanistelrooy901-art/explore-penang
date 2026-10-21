const fs=require('node:fs'),path=require('node:path');
const C=require('../review/map-core.js'),R=require('../review/map-renderer.js');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const atlas='data:image/webp;base64,'+fs.readFileSync(path.join(root,'review/assets/diorama-atlas-v3.webp')).toString('base64');
const hotspotAtlas='data:image/webp;base64,'+fs.readFileSync(path.join(root,'review/assets/hotspot-atlas-v1.webp')).toString('base64');
const ferry='data:image/webp;base64,'+fs.readFileSync(path.join(root,'review/assets/ferry-v1.webp')).toString('base64');
const data = {hotspotAtlas,ferry,geography: JSON.parse(read('data/geography.geojson')),places:JSON.parse(read('data/places.json')),receipts:JSON.parse(read('data/source-receipts.json')),atlas};
const cards = data.places.map(p => `<button class="place-card" data-place="${p.id}" aria-pressed="false"><span class="place-number">${p.number}</span><span><b>${C.escape(p.name)}</b><small>${C.escape(p.cat)}</small></span></button>`).join('');
const sources = data.places.map(p => `<tr><td>${C.escape(p.name)}</td><td>${p.coordinates[1].toFixed(6)} / ${p.coordinates[0].toFixed(6)}</td><td>${C.escape(p.coordinate_note)}</td><td><a href="https://www.openstreetmap.org/${p.osm_type}/${p.osm_id}" target="_blank" rel="noopener noreferrer">OSM ${p.osm_type} ${p.osm_id} ↗</a><a href="${C.escape(p.official_url)}" target="_blank" rel="noopener noreferrer">${C.escape(p.official_label)} ↗</a></td></tr>`).join('');
function buildPage(templateFile,publicSite=false){
let html=read(templateFile);
const content=publicSite?JSON.parse(read('site/content.json')):undefined;
const replacements = {CSS:read('review/style.css')+'\n'+read('review/diorama.css')+(publicSite?'\n'+read('site/style.css'):''),SVG:R.renderWorld({...data,visitorMode:publicSite},'illustrated'),PLACE_LIST:publicSite?data.places.map(p=>`<button class="place-card" data-place="${p.id}" aria-pressed="false"><span class="place-number">${p.number}</span><span class="place-body"><small>${C.escape(p.cat)}</small><b>${C.escape(p.name)}</b><span class="place-description">${C.escape(p.description)}</span></span><span class="place-arrow" aria-hidden="true">↗</span></button>`).join(''):cards,SOURCES:sources,DATA:JSON.stringify({...data,content,visitorMode:publicSite||undefined,atlas:undefined,hotspotAtlas:undefined,ferry:undefined}).replace(/</g,'\\u003c'),CORE:read('review/map-core.js'),ART:read('review/map-art.js'),HOTSPOTS:read('review/hotspots.js'),DIORAMA:read('review/diorama.js'),RENDERER:read('review/map-renderer.js'),APP:read('review/app.js')};
for(const [key,value] of Object.entries(replacements)) {
  const token=key==='SVG'||key==='PLACE_LIST'||key==='SOURCES'?`<!--__${key}__-->`:`/*__${key}__*/`;
  if(publicSite&&key==='SOURCES'&&!html.includes(token))continue;
  if(!html.includes(token))throw new Error('Missing template token '+token);
  html=html.replace(token,()=>value);
}
return html;
}
module.exports={buildPage,data};
