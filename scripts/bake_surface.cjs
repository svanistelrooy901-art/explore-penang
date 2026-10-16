/* Rasterize static presentation layers so phones do not repaint complex clips.
   Geographic shape comes only from the approved GeoJSON. No simplification. */
const fs=require('node:fs'),crypto=require('node:crypto'),sharp=require('sharp');
const R=require('../review/map-renderer.js');
const coastal=JSON.parse(require('node:child_process').execFileSync('python3',['scripts/coastal_segments.py'],{encoding:'utf8'}));
const coast=coastal.segments.map(s=>R.geometryPath({type:'LineString',coordinates:s.coordinates},'illustrated')).join('');
const geo=JSON.parse(fs.readFileSync('data/geography.geojson'));
const land=R.geometryPath(geo.features.find(f=>f.id==='penang-land').geometry,'illustrated');
const uri=async file=>'data:image/png;base64,'+(await sharp(file).png().toBuffer()).toString('base64');
(async()=>{
const texture=await uri('review/assets/landscape-v2.webp');
const W=1100,H=880;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1120" viewBox="0 0 ${W} ${H}"><defs><path id="land" d="${land}"/><path id="coast" d="${coast}"/><clipPath id="clip"><use href="#land"/></clipPath><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter><filter id="shallows" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter><linearGradient id="rock" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#b2aa83"/><stop offset=".3" stop-color="#8c9573"/><stop offset=".65" stop-color="#526f58"/><stop offset="1" stop-color="#365c4d"/></linearGradient></defs><use href="#land" transform="translate(5 12)" fill="#073e51" opacity=".55" filter="url(#shadow)"/><use href="#coast" fill="none" stroke="#2eafa9" stroke-width="16" opacity=".2" filter="url(#shallows)"/><use href="#coast" fill="none" stroke="#78cdb4" stroke-width="6" opacity=".38" filter="url(#shallows)"/><use href="#land" transform="translate(0 8)" fill="url(#rock)" stroke="#456750" stroke-width="1.2"/><use href="#land" transform="translate(0 3)" fill="#9ca77c"/><use href="#land" fill="#a8b77e"/><image width="1100" height="880" href="${texture}" clip-path="url(#clip)"/><use href="#coast" fill="none" stroke="#d3c49a" stroke-width="1.5" opacity=".78"/><use href="#coast" transform="translate(-.3 -.35)" fill="none" stroke="#f3e8be" stroke-width=".55" stroke-linecap="round" stroke-dasharray="1.7 3.1 4.2 2.1" opacity=".75"/></svg>`;
const townSource='review/assets/georgetown-material-v2.webp';
// High-resolution local fabric; ground extent is illustrative, anchors are not moved.
const town={x:390,y:266,width:150,height:118};
const tsvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="944" viewBox="${town.x} ${town.y} ${town.width} ${town.height}"><defs><clipPath id="clip"><path d="${land}"/></clipPath><radialGradient id="fade"><stop offset=".56" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="blend" maskUnits="userSpaceOnUse" x="${town.x}" y="${town.y}" width="${town.width}" height="${town.height}"><ellipse cx="${town.x+town.width/2}" cy="${town.y+town.height/2}" rx="${town.width*.72}" ry="${town.height*.72}" fill="url(#fade)"/></mask></defs><g clip-path="url(#clip)" mask="url(#blend)"><image x="${town.x}" y="${town.y}" width="${town.width}" height="${town.height}" href="${await uri(townSource)}" preserveAspectRatio="none"/></g><path d="${coast}" fill="none" stroke="#e5d9b3" stroke-width=".22" opacity=".7" mask="url(#blend)"/></svg>`;
const digest=files=>{const h=crypto.createHash('sha256');for(const file of files)h.update(fs.readFileSync(file));return h.digest('hex');};
 await sharp(Buffer.from(svg)).webp({quality:65,alphaQuality:85,effort:6}).toFile('review/assets/world-surface-v2.webp');
 await sharp(Buffer.from(tsvg)).webp({quality:67,alphaQuality:85,effort:6}).toFile('review/assets/georgetown-surface-v2.webp');
 const inputs=['scripts/bake_surface.cjs','scripts/coastal_segments.py','review/assets/coastal-recipe-v1.json','data/source-receipts.json','data/geography.geojson','review/assets/landscape-v2.webp',townSource];
 const outputs=['review/assets/world-surface-v2.webp','review/assets/georgetown-surface-v2.webp'];
 fs.writeFileSync('review/assets/surface-v2.json',JSON.stringify({description:'Static artwork clipped to exact approved land geometry; no measured elevation, land use or street layout.',inputs,input_sha256:digest(inputs),town,coastal_way_ids:coastal.segments.map(s=>s.way_id),excluded_boundary_ways:coastal.excluded_boundary_ways,assets:Object.fromEntries(outputs.map(f=>[f,{bytes:fs.statSync(f).size,sha256:digest([f])}]))},null,2)+'\n');
 console.log(outputs.map(f=>f+': '+fs.statSync(f).size+' bytes').join('\n'));
})();
