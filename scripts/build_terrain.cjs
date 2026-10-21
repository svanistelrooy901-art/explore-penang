/* Decorative, deterministic relief. Not DEM or surveyed land cover.
   Bake only when art changes: node scripts/build_terrain.cjs (requires sharp).
   The browser draws one texture, clipped to the owner-approved land polygon. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('sharp');
const C=require('../review/map-core.js');
const root=path.resolve(__dirname,'..');
const geo=JSON.parse(fs.readFileSync(path.join(root,'data/geography.geojson')));
const features=Object.fromEntries(geo.features.map(f=>[f.id,f]));
const land=features['penang-land'].geometry,island=features['penang-island'].geometry;
const n=v=>Number(v.toFixed(2));
function random(i){let v=(i+71)|0;v=Math.imul(v^(v>>>16),0x45d9f3b);v=Math.imul(v^(v>>>16),0x45d9f3b);return((v^(v>>>16))>>>0)/4294967296;}
const inside=(x,y)=>C.pointInGeometry(C.unviewPoint([x,y],'illustrated'),land);
const gauss=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
function height(x,y){
  const [lon,lat]=C.unviewPoint([x,y],'illustrated');
  const main=lon>100.35;
  let h=main?12*gauss(lon,lat,100.475,5.365,.026,.035)+4*gauss(lon,lat,100.48,5.28,.05,.04):
    42*gauss(lon,lat,100.253,5.424,.035,.050)+29*gauss(lon,lat,100.239,5.36,.027,.060)+15*gauss(lon,lat,100.25,5.305,.035,.025)+19*gauss(lon,lat,100.231,5.475,.025,.023);
  h*=.83+.12*Math.sin(x*.052+y*.04)+.05*Math.cos(x*.11-y*.053);
  if(!inside(x,y))return 0;
  // Ease at every coastline rather than drawing new coast geometry.
  let coast=0;for(const [dx,dy]of [[12,0],[-12,0],[0,12],[0,-12]])if(inside(x+dx,y+dy))coast++;
  return h*(coast/4);
}
const parts=[];
// A continuous triangulated surface with warm north-west light and dark valleys.
const step=6;
for(let y=70;y<850;y+=step)for(let x=0;x<1100;x+=step){
  if(!inside(x+3,y+3))continue;
  const h=height(x,y),hx=height(x+step,y),hy=height(x,y+step),hd=height(x+step,y+step);
  const slope=(h-hx)*.9+(h-hy)*.7;
  const [lon,lat]=C.unviewPoint([x,y],'illustrated');
  const mountain=h>7,urban=lon>100.30&&lat>5.29&&lat<5.45;
  const light=Math.max(-22,Math.min(26,slope*4));
  const grain=(random(x*23+y*37)-.5)*9;
  const rgb=mountain?[65+light+grain,103+light+grain,55+light*.7+grain]:urban?[148+light+grain,158+light+grain,105+light*.7+grain]:[133+light+grain,155+light+grain,88+light*.7+grain];
  const color=`rgb(${rgb.map(v=>Math.round(v)).join(',')})`;
  parts.push(`<path d="M${x} ${n(y-h)}L${x+step} ${n(y-hx)}L${x+step} ${n(y+step-hd)}L${x} ${n(y+step-hy)}Z" fill="${color}" stroke="${color}" stroke-width=".7"/>`);
}
// Varied lowland fields and garden clearings (illustrative, no land-use claim).
for(let i=0;i<520;i++){
 const x=55+random(i*5)*1010,y=170+random(i*5+1)*650;
 if(!inside(x,y)||height(x,y)>8)continue;
 const w=7+random(i+50)*24,h=3+random(i+75)*13;
 parts.push(`<path d="M${n(x)} ${n(y)}l${n(w)} -3 3 ${n(h)}-${n(w)} 3Z" fill="${['#b3bc7a','#7c9d61','#9ba96b','#c5c58b'][i%4]}" opacity=".42"/>`);
}
// Thousands of canopy crowns become a single raster; no runtime tree DOM.
const trees=[];
for(let i=0;i<14500;i++){
 const x=30+random(i*3)*1040,y=155+random(i*3+1)*650;
 if(!inside(x,y))continue;
 const h=height(x,y),[lon,lat]=C.unviewPoint([x,y],'illustrated');
 const forest=C.pointInGeometry([lon,lat],island)&&h>7;
 if(!forest&&random(i+400)>.13)continue;
 const radius=(forest?2.2:1.3)+random(i+800)*3.3,yy=y-h;
 const tone=Math.round(random(i+71)*27);
 trees.push({y,html:`<ellipse cx="${n(x+2)}" cy="${n(yy+2.5)}" rx="${n(radius*1.1)}" ry="${n(radius*.65)}" fill="#153d2e" opacity=".26"/><ellipse cx="${n(x)}" cy="${n(yy)}" rx="${n(radius)}" ry="${n(radius*.8)}" fill="rgb(${36+tone},${76+tone},${36+tone/2})"/><ellipse cx="${n(x-radius*.28)}" cy="${n(yy-radius*.25)}" rx="${n(radius*.67)}" ry="${n(radius*.48)}" fill="rgb(${68+tone},${108+tone},${41+tone/2})" opacity=".85"/>`});
}
parts.push(trees.sort((a,b)=>a.y-b.y).map(p=>p.html).join(''));
// Fine grained town fabric, grounded and shaded rather than repeated atlas patches.
for(let i=0;i<4900;i++){
 const x=40+random(i*4+20000)*1030,y=180+random(i*4+20001)*610;
 if(!inside(x,y)||height(x,y)>9)continue;
 const [lon,lat]=C.unviewPoint([x,y],'illustrated');
 const density=lon>100.35?.42:(lon>.29&&lat>.30?.75:.05);
 if(random(i+27000)>density)continue;
 const w=2+random(i+30000)*5,h=2+random(i+31000)*3;
 const color=['#b87145','#ae6347','#dbc8a0','#eee0b4','#8c9a83'][i%5];
 parts.push(`<path d="M${n(x)} ${n(y)}l${n(w)} -1v${n(h)}l-${n(w)} 1Z" fill="#e1cc9e"/><path d="M${n(x)} ${n(y)}l2 -2 ${n(w)} -1 -2 2Z" fill="${color}"/><path d="M${n(x+w)} ${n(y-1)}l2 -2v${n(h)}l-2 2Z" fill="#6e6950"/>`);
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="1760" viewBox="0 0 1100 880"><defs><linearGradient id="ground" x2="1" y2="1"><stop stop-color="#9fb77b"/><stop offset="1" stop-color="#b5b47b"/></linearGradient></defs><rect width="1100" height="880" fill="url(#ground)"/>${parts.join('')}</svg>`;
(async()=>{
 const output=path.join(root,'review/assets/terrain-v2.webp');
 await sharp(Buffer.from(svg)).webp({quality:83,alphaQuality:90,effort:6}).toFile(output);
 const inputHash=crypto.createHash('sha256').update(fs.readFileSync(__filename)).update(fs.readFileSync(path.join(root,'data/geography.geojson'))).digest('hex');
 const manifest={description:'Decorative relief, vegetation and settlement texture. No measured elevation or land use.',width:2200,height:1760,source_sha256:inputHash,asset_sha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex')};
 fs.writeFileSync(path.join(root,'review/assets/terrain-v2.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('Baked continuous terrain:',fs.statSync(output).size,'bytes; baked trees:',trees.length);
})();
