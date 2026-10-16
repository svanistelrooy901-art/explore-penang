/* Rasterize static presentation layers so phones do not repaint complex clips.
   Geographic shape comes only from the approved GeoJSON. No simplification. */
const fs=require('node:fs'),crypto=require('node:crypto'),sharp=require('sharp');
const R=require('../review/map-renderer.js');
const geo=JSON.parse(fs.readFileSync('data/geography.geojson'));
const land=R.geometryPath(geo.features.find(f=>f.id==='penang-land').geometry,'illustrated');
const uri=async file=>'data:image/png;base64,'+(await sharp(file).png().toBuffer()).toString('base64');
(async()=>{
const texture=await uri('review/assets/landscape-v2.webp');
const W=1100,H=880;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1120" viewBox="0 0 ${W} ${H}"><defs><path id="land" d="${land}"/><clipPath id="clip"><use href="#land"/></clipPath><filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter><linearGradient id="rock" x2=".1" y2="1"><stop stop-color="#a19e76"/><stop offset="1" stop-color="#496852"/></linearGradient></defs><use href="#land" transform="translate(4 12)" fill="#104e57" opacity=".55" filter="url(#blur)"/><use href="#land" fill="none" stroke="#65d6c7" stroke-width="18" opacity=".36" filter="url(#blur)"/><use href="#land" transform="translate(0 8)" fill="url(#rock)" stroke="#5b795d" stroke-width="1.5"/><use href="#land" fill="#a8b77e"/><image width="1100" height="880" href="${texture}" clip-path="url(#clip)"/><use href="#land" fill="none" stroke="#d9cf9b" stroke-width="1.1" opacity=".9"/></svg>`;
const townSource='review/assets/georgetown-material-v2.webp';
// High-resolution local fabric; ground extent is illustrative, anchors are not moved.
const town={x:390,y:266,width:150,height:118};
const tsvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="944" viewBox="${town.x} ${town.y} ${town.width} ${town.height}"><defs><clipPath id="clip"><path d="${land}"/></clipPath><radialGradient id="fade"><stop offset=".56" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="blend" maskUnits="userSpaceOnUse" x="${town.x}" y="${town.y}" width="${town.width}" height="${town.height}"><ellipse cx="${town.x+town.width/2}" cy="${town.y+town.height/2}" rx="${town.width*.72}" ry="${town.height*.72}" fill="url(#fade)"/></mask></defs><g clip-path="url(#clip)" mask="url(#blend)"><image x="${town.x}" y="${town.y}" width="${town.width}" height="${town.height}" href="${await uri(townSource)}" preserveAspectRatio="none"/></g></svg>`;
const digest=files=>{const h=crypto.createHash('sha256');for(const file of files)h.update(fs.readFileSync(file));return h.digest('hex');};
 await sharp(Buffer.from(svg)).webp({quality:65,alphaQuality:85,effort:6}).toFile('review/assets/world-surface-v2.webp');
 await sharp(Buffer.from(tsvg)).webp({quality:67,alphaQuality:85,effort:6}).toFile('review/assets/georgetown-surface-v2.webp');
 const inputs=['scripts/bake_surface.cjs','data/geography.geojson','review/assets/landscape-v2.webp',townSource];
 const outputs=['review/assets/world-surface-v2.webp','review/assets/georgetown-surface-v2.webp'];
 fs.writeFileSync('review/assets/surface-v2.json',JSON.stringify({description:'Static artwork clipped to exact approved land geometry; no measured elevation, land use or street layout.',inputs,input_sha256:digest(inputs),town,assets:Object.fromEntries(outputs.map(f=>[f,{bytes:fs.statSync(f).size,sha256:digest([f])}]))},null,2)+'\n');
 console.log(outputs.map(f=>f+': '+fs.statSync(f).size+' bytes').join('\n'));
})();
