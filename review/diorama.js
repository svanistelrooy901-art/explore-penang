/* Decorative diorama layers. All geography remains in the approved GeoJSON. */
(function(root){
  'use strict';
  const C=typeof module!=='undefined'&&module.exports?require('./map-core.js'):root.PenangMap;
  const A=typeof module!=='undefined'&&module.exports?require('./map-art.js'):root.PenangArt;
  const n=v=>Number(v.toFixed(2));
  const crops={hill:[0,0,.34,.355],kek:[.34,0,.32,.355],town:[.66,0,.34,.355],fort:[0,.36,.34,.29],jetty:[.34,.36,.32,.29],beach:[.66,.36,.34,.29],food:[0,.65,.34,.35],mainland:[.34,.65,.32,.35],grove:[.66,.65,.34,.35]};
  function noise(i){let v=(i+1)|0;v=Math.imul(v^(v>>>16),0x45d9f3b);v=Math.imul(v^(v>>>16),0x45d9f3b);return ((v^(v>>>16))>>>0)/4294967296;}
  function sprite(key,x,y,w,h,extra=''){
    const box=crops[key].map(v=>n(v*1152)).join(' ');
    return `<g transform="translate(${n(x)} ${n(y)})" ${extra}><svg data-sprite="${key}" x="${-w/2}" y="${-h*.88}" width="${w}" height="${h}" viewBox="${box}" overflow="hidden"><g clip-path="url(#sprite-crop-${key})"><use href="#diorama-atlas"/></g></svg></g>`;
  }
  function bridgeSpine(geometry,count=24){
    const ring=geometry.coordinates[0],xs=ring.map(p=>p[0]),lo=Math.min(...xs),hi=Math.max(...xs),out=[];
    for(let i=1;i<count;i++){
      const x=lo+(hi-lo)*i/count,ys=[];
      for(let j=1;j<ring.length;j++){
        const a=ring[j-1],b=ring[j];
        if((a[0]<=x&&b[0]>x)||(b[0]<=x&&a[0]>x))ys.push(a[1]+(x-a[0])/(b[0]-a[0])*(b[1]-a[1]));
      }
      if(ys.length>=2)out.push([x,(Math.min(...ys)+Math.max(...ys))/2]);
    }
    return out;
  }
  function render(data,path){
    const F=Object.fromEntries(data.geography.features.map(f=>[f.id,f]));
    const mode='illustrated',land=path(F['penang-land'].geometry,mode);
    const pos=p=>C.viewPoint(p,mode);
    const size=1152,atlas=data.atlas||'';
    const symbols=Object.entries(crops).map(([key,r])=>`<clipPath id="sprite-crop-${key}"><rect x="${n(r[0]*size)}" y="${n(r[1]*size)}" width="${n(r[2]*size)}" height="${n(r[3]*size)}"/></clipPath>`).join('');
    let forest=[],towns=[],terrain='';
    const hill=data.places.find(p=>p.id==='hill'),[hx,hy]=pos(hill.coordinates);
    for(let i=0;i<120;i++){
      const coordinate=[100.185+noise(i*3+1)*.145,5.272+noise(i*3+2)*.205];
      if(!C.pointInGeometry(coordinate,F['penang-island'].geometry))continue;
      const [x,y]=pos(coordinate);
      if(data.places.some(p=>{const [px,py]=pos(p.coordinates);return Math.hypot(px-x,py-y)<48;}))continue;
      const s=78+noise(i+500)*48;
      forest.push({y,html:sprite('grove',x,y,s,s*.88)});
    }
    // Extra canopy contours make a continuous ridge; they remain decorative.
    for(let i=0;i<5;i++)terrain+=`<ellipse cx="${n(hx-15+i*3)}" cy="${n(hy+40+i*4)}" rx="${125-i*15}" ry="${180-i*21}" transform="rotate(-10 ${hx} ${hy})" fill="${['#264f39','#35683e','#4e8147','#7a9c58','#b0b778'][i]}" opacity=".22"/>`;
    for(const id of ['kho','mainland','food']){
      const p=data.places.find(p=>p.id===id),[x,y]=pos(p.coordinates);
      for(let i=0;i<10;i++){
        const xx=x+(noise(i+(id==='mainland'?450:700))-.5)*155,yy=y+(noise(i+330)-.5)*95;
        towns.push({y:yy,html:sprite(id==='mainland'?'mainland':'town',xx,yy,50+noise(i+25)*20,48)});
      }
    }
    for(let i=0;i<75;i++){
      const coordinate=[100.355+noise(i+930)*.165,5.22+noise(i+950)*.30];
      if(!C.pointInGeometry(coordinate,F['penang-land'].geometry)||C.pointInGeometry(coordinate,F['penang-island'].geometry))continue;
      const [x,y]=pos(coordinate);
      if(data.places.some(p=>{const [px,py]=pos(p.coordinates);return Math.hypot(px-x,py-y)<48;}))continue;
      const s=40+noise(i+200)*34;
      towns.push({y,html:sprite(i%3?'mainland':'grove',x,y,s,s*.85)});
    }
    const forestHTML=forest.sort((a,b)=>a.y-b.y).map(p=>p.html).join('');
    const townHTML=towns.sort((a,b)=>a.y-b.y).map(p=>p.html).join('');
    const landmarkSizes={hill:[190,184],kek:[122,145],beach:[122,94],fort:[100,100],kho:[110,104],jetty:[102,91],food:[100,100],mainland:[135,116]};
    const landmarks=[...data.places].sort((a,b)=>b.coordinates[1]-a.coordinates[1]).map(p=>{
      const [x,y]=pos(p.coordinates),[w,h]=landmarkSizes[p.id];
      const extra=`class="landmark-art" data-art="${p.id}" data-art-x="${n(x)}" data-art-y="${n(y)}" aria-hidden="true"`;
      return atlas?sprite(p.id==='kho'?'town':p.id,x,y,w,h,extra):A.landmark(p.id,x,y,.9);
    }).join('');
    const bridges=['bridge-1','bridge-2'].map((id,index)=>{
      const coords=bridgeSpine(F[id].geometry),p=coords.map(pos),d=p.map((p,i)=>(i?'L':'M')+p.map(n).join(' ')).join('');
      let piers='',cables='';
      p.forEach(([x,y],i)=>{if(i%3===0)piers+=`<path d="M${n(x)} ${n(y)}v15l5 3" stroke="#266773" stroke-width="5" opacity=".3"/><path d="M${n(x)} ${n(y)}v12" stroke="#ddd9bd" stroke-width="3"/>`;});
      for(const i of [9,12]){
        const [x,y]=p[i]||p[Math.floor(p.length/2)];
        const height=index?25:30;
        for(let j=-3;j<=3;j++){const q=p[Math.max(0,Math.min(p.length-1,i+j))];cables+=`<path d="M${n(x)} ${n(y-height)}L${n(q[0])} ${n(q[1])}" stroke="#fbf0ce" stroke-width=".8" opacity=".9"/>`;}
        cables+=`<path d="M${n(x-1)} ${n(y+2)}v-${height+2}h3v${height+2}" fill="none" stroke="#fff0cd" stroke-width="2"/>`;
      }
      return `<g class="bridge-structure" data-bridge-art="${id}" aria-hidden="true"><title>Illustrative bridge deck, piers and towers; source footprint is unchanged</title>${piers}<path d="${d}" transform="translate(2 10)" stroke="#073e55" stroke-width="10" fill="none" opacity=".35"/><path class="bridge" data-feature="${id}" d="${path(F[id].geometry,mode)}" fill="#e7c797" stroke="#eedbb3" stroke-width="5" stroke-linejoin="round"/><path d="${d}" stroke="#4e6668" stroke-width="3.5" fill="none"/><path d="${d}" stroke="#f3e6b7" stroke-width=".6" stroke-dasharray="3 3" fill="none"/>${cables}</g>`;
    }).join('');
    const ferry=['ferry-to-island','ferry-to-mainland'].map(id=>`<path data-feature="${id}" d="${path(F[id].geometry,mode)}" stroke="#e9f2cd" stroke-width="1.5" stroke-dasharray="5 7" fill="none" opacity=".8"/>`).join('');
    const route=F['ferry-to-island'].geometry.coordinates,[fx,fy]=pos(route[Math.floor(route.length/2)]);
    const boat=`<g class="ferry-float" data-art="ferry-symbol" aria-hidden="true"><title>Decorative ferry; not a live position</title><path d="M${fx-15} ${fy+17}q-18 5-33 0m31 8q-23 5-39-1" fill="none" stroke="#d8f4e9" stroke-width="2" opacity=".65"/>${A.ferry(fx,fy,.8)}</g>`;
    const label=(coordinate,text,dx=0,dy=0,size=13)=>{const[x,y]=pos(coordinate);return `<text x="${n(x+dx)}" y="${n(y+dy)}" class="geo-label" font-size="${size}" text-anchor="middle">${C.escape(text)}</text>`;};
    const labels=label([100.22,5.33],'PENANG ISLAND',0,0,17)+label([100.474,5.445],'SEBERANG PERAI',0,0,15)+label([100.371,5.387],'PENANG STRAIT',0,0,11)+label([100.354,5.344],'01 · PENANG BRIDGE',0,18)+label([100.365,5.253],'02 · SECOND BRIDGE',0,10)+label([100.375,5.426],'03 · FERRY',25,-4,11)+label([100.299,5.286],'Batu Maung',-30,10,10)+label([100.427,5.24],'Batu Kawan',35,10,10)+label([100.391,5.36],'Perai',20,-5,10)+label([100.368,5.435],'Butterworth',18,-8,10);
    return `<defs><linearGradient id="ocean" x2=".8" y2="1"><stop stop-color="#19899b"/><stop offset=".45" stop-color="#076d85"/><stop offset="1" stop-color="#073a5b"/></linearGradient><linearGradient id="diorama-land" x1="0" x2="1" y2="1"><stop stop-color="#b4c68b"/><stop offset=".5" stop-color="#7e9e5c"/><stop offset="1" stop-color="#c0bb7e"/></linearGradient><linearGradient id="rock" x2=".2" y2="1"><stop stop-color="#9b956b"/><stop offset="1" stop-color="#485e43"/></linearGradient><radialGradient id="haze"><stop stop-color="#fffdf1" stop-opacity=".6"/><stop offset="1" stop-color="#fffdf1" stop-opacity="0"/></radialGradient><filter id="island-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter><pattern id="water" width="57" height="39" patternUnits="userSpaceOnUse"><path d="M2 13q9-3 16 0m19 19q7-3 15 0" stroke="#70cbd1" stroke-width=".8" fill="none" opacity=".4"/></pattern><pattern id="glitter" width="113" height="71" patternUnits="userSpaceOnUse"><path d="M6 20l9-1m55 26l8-1m-44 17l5-1" stroke="#e6f5d5" stroke-width="1.4" opacity=".28"/></pattern><path id="diorama-land-shape" d="${land}"/><clipPath id="land-clip"><use href="#diorama-land-shape"/></clipPath><image id="diorama-atlas" width="1152" height="1152" href="${atlas}"/>${symbols}</defs><rect width="1100" height="880" fill="url(#ocean)"/><rect width="1100" height="880" fill="url(#water)"/><rect class="water-sparkle" width="1100" height="880" fill="url(#glitter)"/><g id="camera"><use href="#diorama-land-shape" transform="translate(10 29)" fill="#043649" opacity=".5" filter="url(#island-shadow)"/><use href="#diorama-land-shape" fill="none" stroke="#3ebec1" stroke-width="50" opacity=".23"/><use href="#diorama-land-shape" transform="translate(0 21)" fill="url(#rock)" stroke="#4d6a50" stroke-width="5"/><use href="#diorama-land-shape" transform="translate(0 10)" fill="#a2a776" stroke="#819167" stroke-width="3"/><use data-feature="land" href="#diorama-land-shape" fill="url(#diorama-land)" stroke="#e5d2a4" stroke-width="3"/><g clip-path="url(#land-clip)" aria-hidden="true"><g>${terrain}</g><g class="forest-canopy">${forestHTML}</g><g class="town-texture">${townHTML}</g></g><g id="landmark-art-layer">${landmarks}</g>${bridges}${ferry}${boat}<g id="map-labels">${labels}</g><g id="pins"></g></g><g class="atmosphere" pointer-events="none" aria-hidden="true"><ellipse cx="1060" cy="80" rx="140" ry="110" fill="url(#haze)"/><ellipse cx="40" cy="740" rx="130" ry="95" fill="url(#haze)"/><ellipse cx="730" cy="35" rx="150" ry="55" fill="url(#haze)"/></g><g id="orientation" transform="translate(1030 65)"><circle r="29" fill="#083e52" stroke="#abcac1"/><path d="M4 17L-4-17l-7 11 7-2 8 25" fill="#f8d080"/><text y="-37" text-anchor="middle" fill="#fff4d6" font-size="13">N</text></g><text x="24" y="843" fill="#e8f0d1" font-size="11">Illustrative terrain and architecture · no elevation data</text>`;
  }
  const api={render,sprite,bridgeSpine,crops};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PenangDiorama=api;
})(globalThis);
