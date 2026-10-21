/* Presentation only. Approved OSM data is never edited or displaced. */
(function(root){
  'use strict';
  const C=typeof module!=='undefined'&&module.exports?require('./map-core.js'):root.PenangMap;
  const H=typeof module!=='undefined'&&module.exports?require('./hotspots.js'):root.PenangHotspots;
  const A=typeof module!=='undefined'&&module.exports?require('./map-art.js'):root.PenangArt;
  const n=v=>Number(v.toFixed(2));
  // Measured crop windows avoid neighbouring cutouts after the targeted edit.
  const cropPixels={hill:[0,0,396,410],kek:[396,0,398,410],kho:[794,0,358,410],fort:[0,410,420,370],jetty:[420,410,353,370],town:[773,410,379,370],beach:[0,780,396,372],food:[409,780,373,372],mainland:[782,780,370,372]};
  const crops=Object.fromEntries(Object.entries(cropPixels).map(([key,r])=>[key,r.map(v=>v/1152)]));
  // Decorative material bounds shared with the bake; geographic anchors stay fixed.
  const townExtent=Object.freeze({x:390,y:266,width:150,height:118});
  function sprite(key,x,y,w,h,extra=''){
    const box=crops[key].map(v=>n(v*1152)).join(' ');
    const grounded=key==='beach'?' transform="translate(6 20)"':'';
    return `<g transform="translate(${n(x)} ${n(y)})" ${extra}><svg data-sprite="${key}"${grounded} x="${-w/2}" y="${-h*.80}" width="${w}" height="${h}" viewBox="${box}" overflow="hidden"><g clip-path="url(#sprite-crop-${key})"><use href="#diorama-atlas"/></g></svg></g>`;
  }
  function bridgeSpine(geometry,count=40){
    const ring=geometry.coordinates[0],xs=ring.map(p=>p[0]),lo=Math.min(...xs),hi=Math.max(...xs),out=[];
    for(let i=1;i<count;i++){
      const x=lo+(hi-lo)*i/count,ys=[];
      for(let j=1;j<ring.length;j++){
        const a=ring[j-1],b=ring[j];
        if((a[0]<=x&&b[0]>x)||(b[0]<=x&&a[0]>x))ys.push(a[1]+(x-a[0])/(b[0]-a[0])*(b[1]-a[1]));
      }
      ys.sort((a,b)=>a-b);
      const spans=[];for(let j=0;j+1<ys.length;j+=2)spans.push([ys[j],ys[j+1]]);
      spans.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]));
      const span=spans.find(s=>C.pointInGeometry([x,(s[0]+s[1])/2],geometry));
      if(span)out.push([x,(span[0]+span[1])/2]);
    }
    return out;
  }
  function render(data,path){
    const F=Object.fromEntries(data.geography.features.map(f=>[f.id,f]));
    const mode='illustrated',land=path(F['penang-land'].geometry,mode),pos=p=>C.viewPoint(p,mode),atlas=data.atlas||'';
    const symbols=Object.entries(crops).map(([key,r])=>`<clipPath id="sprite-crop-${key}"><rect x="${n(r[0]*1152)}" y="${n(r[1]*1152)}" width="${n(r[2]*1152)}" height="${n(r[3]*1152)}"/></clipPath>`).join('');
    const sizes={hill:[94,100],kek:[78,98],beach:[92,86],fort:[64,64],kho:[62,62],jetty:[70,66],food:[58,58],mainland:[110,100]};
    const landmarks=[...data.places].sort((a,b)=>b.coordinates[1]-a.coordinates[1]).map(p=>{
      const [x,y]=pos(p.coordinates),[w,h]=sizes[p.id];
      const extra=`class="landmark-art" data-art="${p.id}" data-art-x="${n(x)}" data-art-y="${n(y)}" aria-hidden="true"`;
      return atlas?sprite(p.id,x,y,w,h,extra):A.landmark(p.id,x,y,.7);
    }).join('');
    const bridges=['bridge-1','bridge-2'].map((id,index)=>{
      const p=bridgeSpine(F[id].geometry).map(pos),d=p.map((p,i)=>(i?'L':'M')+p.map(n).join(' ')).join('');
      let piers='',cables='',traffic='';
      p.forEach(([x,y],i)=>{
        if(i%3===0)piers+=`<path d="M${n(x+2)} ${n(y+3)}v10l3 2" stroke="#164f5c" stroke-width="3" opacity=".35"/><path d="M${n(x)} ${n(y)}v9" stroke="#d4d4b7" stroke-width="2"/>`;
        if(i%7===2)traffic+=`<path d="M${n(x-.8)} ${n(y-.7)}l2 .3" stroke="${i%2?'#f0d77b':'#fff5de'}" stroke-width="1.1"/>`;
      });
      // Symbolic pylons on the source-derived deck, not an engineering model.
      for(const i of (index?[18,22]:[20,24])){
        const [x,y]=p[i],height=index?17:22;
        for(let j=-4;j<=4;j++){const q=p[Math.max(0,Math.min(p.length-1,i+j))];cables+=`<path d="M${n(x)} ${n(y-height)}L${n(q[0])} ${n(q[1])}" stroke="#fff1ce" stroke-width=".55" opacity=".9"/>`;}
        cables+=`<path d="M${n(x-1.7)} ${n(y+1)}l1.2-${height}h1l1.2 ${height}" fill="none" stroke="#fff1cf" stroke-width="1.4"/>`;
      }
      return `<g class="bridge-structure" data-bridge-art="${id}" aria-hidden="true"><title>Bridge artwork follows the approved footprint; pylons are illustrative</title><path d="${d}" transform="translate(2 9)" stroke="#0c495a" stroke-width="7" fill="none" opacity=".32"/>${piers}<path class="bridge" data-feature="${id}" d="${path(F[id].geometry,mode)}" fill="#c6b27d" stroke="#f7dfac" stroke-width="3.2" stroke-linejoin="round"/><path d="${d}" stroke="#5d7273" stroke-width="2.6" fill="none"/><path d="${d}" stroke="#ebdca9" stroke-width=".45" stroke-dasharray="2 2" fill="none"/>${traffic}${cables}</g>`;
    }).join('');
    const ferry=['ferry-to-island','ferry-to-mainland'].map(id=>`<path data-feature="${id}" d="${path(F[id].geometry,mode)}" stroke="#326d7d" stroke-width="1.2" stroke-dasharray="4 6" fill="none" opacity=".7" vector-effect="non-scaling-stroke"/>`).join('');
    const route=F['ferry-to-island'].geometry.coordinates,[fx,fy]=pos(route[Math.floor(route.length/2)]);
    const boat=`<g class="sea-decoration" data-art-x="${fx}" data-art-y="${fy}" transform="translate(${fx} ${fy})" aria-hidden="true"><g class="ferry-float" data-art="ferry-symbol"><title>Decorative ferry; not a live position</title><path d="M-9 9q-13 4-27 0m28 6q-19 4-35-1" fill="none" stroke="#d8f4e9" stroke-width="1.3" opacity=".6"/>${data.ferry?`<ellipse cy="8" rx="25" ry="6" fill="#064e63" opacity=".2"/><svg x="-36" y="-25" width="72" height="50" viewBox="0 80 512 352" overflow="hidden"><image id="ferry-texture" width="512" height="512" href="${data.ferry}"/></svg>`:A.ferry(0,0,.5)}</g></g>`;
    const sail=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})" aria-hidden="true"><path d="M-10 7q10 7 21-1M0-16V7" stroke="#f3ebcf" fill="none" stroke-width="1.6"/><path d="M-2-14L-11 3H-2ZM1-12L9 2H1Z" fill="#fff5d9"/><path d="M-16 13q-12 3-25 0" stroke="#a8deda" stroke-width="1" fill="none" opacity=".6"/></g>`;
    const label=(coord,text,kind='regional',size=12)=>{const[x,y]=pos(coord);return `<text x="${n(x)}" y="${n(y)}" class="geo-label ${kind}" font-size="${size}" text-anchor="middle">${C.escape(text)}</text>`;};
    const labels=label([100.233,5.322],'PENANG ISLAND','regional',14)+label([100.466,5.46],'SEBERANG PERAI','regional',13)+label([100.366,5.387],'PENANG STRAIT','water-label',10)+label([100.354,5.333],'01 · PENANG BRIDGE','crossing-label primary-crossing',10)+label([100.36,5.24],'02 · SECOND BRIDGE','crossing-label',10)+label([100.384,5.418],'FERRY','crossing-label',9);
    const modernClips=H.areas.filter(a=>a.art).map(a=>`<clipPath id="hotspot-crop-${a.id}"><rect x="${a.crop[0]}" y="${a.crop[1]}" width="${a.crop[2]}" height="${a.crop[3]}"/></clipPath>`).join('');
    const modern=H.areas.filter(a=>a.art).map(a=>{
      const [x,y]=pos(a.coordinates),crop=a.crop,[w,h]=a.size;
      return `<g class="hotspot-art" aria-hidden="true" data-area="${a.id}" data-area-art="${a.id}" data-art-x="${n(x)}" data-art-y="${n(y)}" transform="translate(${n(x)} ${n(y)})"><svg x="${-w/2}" y="${-h*.83}" width="${w}" height="${h}" viewBox="${crop.join(' ')}" overflow="hidden"><use href="#hotspot-atlas" clip-path="url(#hotspot-crop-${a.id})"/></svg></g>`;
    }).join('');
    // Separate bounded controls from atlas paint bounds so transparent neighbour
    // cells cannot intercept input or create oversized keyboard focus regions.
    const areaTargets=H.areas.filter(a=>a.art).map(a=>{
      const [x,y]=pos(a.coordinates),[w,h]=a.size;
      return `<rect class="hotspot-target" role="button" tabindex="0" aria-label="Explore ${C.escape(a.name)}" data-area="${a.id}" data-art-x="${n(x)}" data-art-y="${n(y)}" transform="translate(${n(x)} ${n(y)})" x="${-w/2}" y="${-h*.83}" width="${w}" height="${h}" rx="8"/>`;
    }).join('');
    const areaLabels=H.areas.filter(a=>a.art).map(a=>{
      const [x,y]=pos(a.coordinates),width=a.short.length*6+24;
      return `<g class="area-marker" role="button" tabindex="0" aria-label="Explore ${C.escape(a.name)}" data-area="${a.id}" data-x="${n(x)}" data-y="${n(y)}" transform="translate(${n(x)} ${n(y)})"><rect x="${-width/2}" y="6" width="${width}" height="28" rx="14"/><text y="24" text-anchor="middle">${C.escape(a.short)} ↗</text></g>`;
    }).join('');
    return `<defs><linearGradient id="ocean" x2="1" y2="1"><stop stop-color="${data.visitorMode?'#9dcece':'#a5d7d5'}"/><stop offset="1" stop-color="${data.visitorMode?'#9dcece':'#71b9c5'}"/></linearGradient><pattern id="water" width="121" height="83" patternUnits="userSpaceOnUse"><path d="M2 13q13-4 27 0m40 38q17-4 31-1" stroke="#ecf6e9" stroke-width=".7" fill="none" opacity=".45"/></pattern><pattern id="glitter" width="173" height="117" patternUnits="userSpaceOnUse"><path d="M6 20l9-1m65 35l8-1" stroke="#fffbee" stroke-width="1" opacity=".35"/></pattern><path id="diorama-land-shape" d="${land}"/><clipPath id="land-clip"><use href="#diorama-land-shape"/></clipPath><image id="diorama-atlas" width="1152" height="1152" href="${atlas}"/><image id="hotspot-atlas" width="1536" height="1024" href="${data.hotspotAtlas||''}"/>${symbols}${modernClips}</defs><rect width="1100" height="880" fill="url(#ocean)"/><rect width="1100" height="880" fill="url(#water)"/><rect class="water-sparkle" width="1100" height="880" fill="url(#glitter)"/><g id="camera">${data.visitorMode?'':'<use href="#diorama-land-shape" transform="translate(0 2)" fill="#497f76" opacity=".25"/>'}<use id="flat-land" data-feature="land" href="#diorama-land-shape" fill="#e5e8ce" stroke="#fbf2d4" stroke-width="1" vector-effect="non-scaling-stroke"/><g id="landmark-art-layer">${landmarks}${modern}</g>${bridges}${ferry}${boat}${sail(105,405,.5)}${sail(462,655,.45)}<g id="map-labels">${labels}</g><g id="area-targets">${areaTargets}</g><g id="area-markers">${areaLabels}</g><g id="pins"></g></g><g id="orientation" transform="translate(1030 65)"><circle r="26" fill="#fff8e8" stroke="#649894"/><path d="M4 17L-4-17l-7 11 7-2 8 25" fill="#24636b"/><text y="-35" text-anchor="middle" fill="#245c63" font-size="12">N</text></g><text x="24" y="843" fill="#245962" font-size="10">${data.visitorMode?'Miniature landmarks · island & mainland':'Landmark miniatures · flat base · no elevation data'}</text>`;

  }
  const api={render,sprite,bridgeSpine,crops,townExtent};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PenangDiorama=api;
})(globalThis);
