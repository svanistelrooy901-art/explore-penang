/* Pre-bake one shared landscape composition at world and district resolutions.
   Artistic detail is clipped to approved land; no source geometry is modified. */
const fs=require('node:fs'),crypto=require('node:crypto'),sharp=require('sharp');
const R=require('../review/map-renderer.js'),D=require('../review/diorama.js');
const coastal=JSON.parse(require('node:child_process').execFileSync('python3',['scripts/coastal_segments.py'],{encoding:'utf8'}));
const coast=coastal.segments.map(s=>R.geometryPath({type:'LineString',coordinates:s.coordinates},'illustrated')).join('');
const geo=JSON.parse(fs.readFileSync('data/geography.geojson'));
const land=R.geometryPath(geo.features.find(f=>f.id==='penang-land').geometry,'illustrated');
const uri=async file=>'data:image/png;base64,'+(await sharp(file).png().toBuffer()).toString('base64');
(async()=>{
 const texture=await uri('review/assets/landscape-v2.webp');
 const townSource='review/assets/georgetown-material-v3.webp',town=D.townExtent;
 const defs=`<path id="land" d="${land}"/><path id="coast" d="${coast}"/><clipPath id="clip"><use href="#land"/></clipPath><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="shallows" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter><linearGradient id="rock" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#b2aa83"/><stop offset=".3" stop-color="#8c9573"/><stop offset=".65" stop-color="#526f58"/><stop offset="1" stop-color="#365c4d"/></linearGradient><radialGradient id="town-fade"><stop offset=".5" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="town-blend" maskUnits="userSpaceOnUse" x="${town.x}" y="${town.y}" width="${town.width}" height="${town.height}"><ellipse cx="${town.x+town.width/2}" cy="${town.y+town.height/2}" rx="${town.width*.67}" ry="${town.height*.67}" fill="url(#town-fade)"/></mask>`;
 // Both resolutions use identical ground and shore colours. The close-up tile
 // replaces opaque land pixels only, avoiding doubled shallow-water halos.
 const ground=`<g clip-path="url(#clip)"><use href="#land" fill="#a8b77e"/><image width="1100" height="880" href="${texture}"/><image x="${town.x}" y="${town.y}" width="${town.width}" height="${town.height}" href="${await uri(townSource)}" preserveAspectRatio="none" mask="url(#town-blend)"/><use href="#coast" fill="none" stroke="#c6bb8c" stroke-width=".7" opacity=".7"/><use href="#coast" fill="none" stroke="#f2e8c5" stroke-width=".22" stroke-linecap="round" stroke-dasharray="1.7 3.1 4.2 2.1" opacity=".65"/></g>`;
 const depth=`<use href="#land" transform="translate(3 8)" fill="#073e51" opacity=".42" filter="url(#shadow)"/><use href="#coast" fill="none" stroke="#2eafa9" stroke-width="10" opacity=".17" filter="url(#shallows)"/><use href="#coast" fill="none" stroke="#78cdb4" stroke-width="3" opacity=".3" filter="url(#shallows)"/><use href="#land" transform="translate(0 5)" fill="url(#rock)" stroke="#456750" stroke-width=".6"/><use href="#land" transform="translate(0 1.8)" fill="#9ca77c"/>`;
 const svg=(width,height,viewBox,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"><defs>${defs}</defs>${body}</svg>`;
 const digest=files=>{const h=crypto.createHash('sha256');for(const file of files)h.update(fs.readFileSync(file));return h.digest('hex');};
 await sharp(Buffer.from(svg(1400,1120,'0 0 1100 880',depth+ground))).webp({quality:67,alphaQuality:85,effort:6}).toFile('review/assets/world-surface-v2.webp');
 await sharp(Buffer.from(svg(1500,1180,`${town.x} ${town.y} ${town.width} ${town.height}`,ground))).webp({quality:76,alphaQuality:90,effort:6}).toFile('review/assets/georgetown-surface-v2.webp');
 const inputs=['scripts/bake_surface.cjs','scripts/coastal_segments.py','review/diorama.js','review/map-core.js','review/map-renderer.js','review/assets/coastal-recipe-v1.json','data/source-receipts.json','data/geography.geojson','review/assets/landscape-v2.webp',townSource];
 const outputs=['review/assets/world-surface-v2.webp','review/assets/georgetown-surface-v2.webp'];
 fs.writeFileSync('review/assets/surface-v2.json',JSON.stringify({description:'Shared world/district artwork clipped to exact approved land; no measured elevation, land use or street layout.',inputs,input_sha256:digest(inputs),town,detail_pixels:{width:1500,height:1180},coastal_way_ids:coastal.segments.map(s=>s.way_id),excluded_boundary_ways:coastal.excluded_boundary_ways,assets:Object.fromEntries(outputs.map(f=>[f,{bytes:fs.statSync(f).size,sha256:digest([f])}]))},null,2)+'\n');
 console.log(outputs.map(f=>f+': '+fs.statSync(f).size+' bytes').join('\n'));
})();
