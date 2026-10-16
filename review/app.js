(function () {
  'use strict';
  const C = PenangMap, R = PenangRenderer;
  const data = JSON.parse(document.getElementById('review-data').textContent);
  // Reuse the initial SVG's embedded assets rather than duplicating base64 in JSON.
  data.atlas=document.getElementById('diorama-atlas')?.getAttribute('href')||'';
  data.surface=document.getElementById('world-surface')?.getAttribute('href')||'';
  data.town=document.getElementById('georgetown-surface')?.getAttribute('href')||'';
  let thumbnailId=0;
  function artThumbnail(id){
    const key=id,r=PenangDiorama.crops[key].map(v=>v*1152),box=r.join(' '),clip='thumbnail-'+(++thumbnailId);
    return `<svg class="art-thumbnail" viewBox="${box}" overflow="hidden" aria-hidden="true"><defs><clipPath id="${clip}"><rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}"/></clipPath></defs><image clip-path="url(#${clip})" width="1152" height="1152" href="${data.atlas}"/></svg>`;
  }
  document.querySelectorAll('[data-place]').forEach(card=>card.insertAdjacentHTML('afterbegin',artThumbnail(card.dataset.place)));
  // Keep the single-file draft's data links usable after downloading it on its own.
  for (const [href, value, type] of [
    ['data/geography.geojson', data.geography, 'application/geo+json'],
    ['data/source-receipts.json', data.receipts, 'application/json'],
  ]) {
    if (!value) continue;
    const url = URL.createObjectURL(new Blob([JSON.stringify(value)], {type}));
    document.querySelectorAll(`a[href="${href}"]`).forEach(a => {a.href=url; a.download=href.split('/').pop();});
  }
  const places = data.places, ids = places.map(p => p.id), el = id => document.getElementById(id);
  const svg = el('map'), heritage = ['fort', 'kho', 'jetty'], quarter = ['fort', 'kho', 'jetty', 'food'];
  let storage; try { storage = window.localStorage; } catch { storage = { getItem() { return null; }, setItem() {} }; }
  const discovered = C.readProgress(storage, ids);
  let mode = 'illustrated', category = 'All', selected = null, camera = { scale: 1, x: 0, y: 0 }, toastTimer;
  let pinSignature='',pinScale=0,paintScale=0,paintUnit=0,paintSelected,frame=0,flight=0;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const worldCache=new Map();
  const pointers = new Map(); let gesture = null, dragged = false;
  function toast(message) {
    el('toast').textContent = message; el('toast').classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el('toast').classList.remove('show'), 3000);
  }
  function progress() {
    el('progressText').textContent = `${discovered.size} / ${places.length}`;
    el('progressFill').style.width = `${discovered.size / places.length * 100}%`;
    el('progress').setAttribute('aria-valuenow', discovered.size);
    const n = heritage.filter(id => discovered.has(id)).length;
    el('questProgress').textContent = n === 3 ? 'Heritage Hunter stamp unlocked!' : `${n} of 3 heritage places discovered.`;
  }
  function categories() {
    el('filters').innerHTML = ['All', 'Heritage', 'Nature', 'Culture', 'Food', 'Local'].map(cat => `<button data-cat="${cat}" aria-pressed="${cat === category}">${cat}</button>`).join('');
    el('filters').querySelectorAll('button').forEach(button => button.onclick = () => {
      category = button.dataset.cat; categories(); cards(); pins();
      el('filters').querySelector(`[data-cat="${category}"]`)?.focus({preventScroll:true});
    });
  }
  function cards() {
    let count = 0;
    el('placeList').querySelectorAll('button').forEach(card => {
      const p = places.find(p => p.id === card.dataset.place);
      card.hidden = category !== 'All' && p.cat !== category;
      // Explicit display prevents component CSS from overriding the hidden attribute.
      card.style.display = card.hidden ? 'none' : '';
      if (!card.hidden) count++;
      card.setAttribute('aria-pressed', p.id === selected);
      card.querySelector('small').textContent = p.cat + (discovered.has(p.id) ? ' · Discovered' : '');
    });
    el('placeCount').textContent = `${count} ${count === 1 ? 'place' : 'places'} to explore`;
    el('emptyState').hidden = count > 0;
  }
  function point(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return [550, 440];
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return [p.x, p.y];
  }
  function applyCamera() {
    const pad = 200;
    camera.x = C.clamp(camera.x, 1100 - 1100 * camera.scale - pad, pad);
    camera.y = C.clamp(camera.y, 880 - 880 * camera.scale - pad, pad);
    el('camera').setAttribute('transform', `translate(${camera.x} ${camera.y}) scale(${camera.scale})`);
    const unit=1/Math.max(.1,svg.getScreenCTM()?.a||1);
    if(paintScale!==camera.scale||paintUnit!==unit){
      paintScale=camera.scale;paintUnit=unit;
    el('mapFrame').classList.toggle('zoom-detail',camera.scale>3);
    svg.querySelectorAll('.landmark-art').forEach(node=>{
      node.setAttribute('transform',`translate(${node.dataset.artX} ${node.dataset.artY}) scale(${1/Math.max(1,camera.scale/2.1)})`);
    });
    svg.querySelectorAll('.sea-decoration').forEach(node=>node.setAttribute('transform',`translate(${node.dataset.artX} ${node.dataset.artY}) scale(${1/Math.max(1,camera.scale/1.2)})`));
    for(const id of ['water','glitter'])svg.querySelector('#'+id)?.setAttribute('patternTransform',`scale(${1/Math.max(1,camera.scale/1.4)})`);
    svg.querySelectorAll('#map-labels text').forEach(node=>{
      const x=node.getAttribute('x'),y=node.getAttribute('y');
      const dy=svg.clientWidth<600&&node.classList.contains('primary-crossing')?12:0;
      node.setAttribute('transform',`translate(${x} ${y}) scale(${unit/camera.scale}) translate(${-x} ${-y+dy})`);
    });
    el('mapFrame').classList.toggle('zoom-quarter',camera.scale>=4);
    el('zoomIn').disabled = camera.scale >= 14;
    el('zoomOut').disabled = camera.scale <= .85;
    }
    if(paintSelected!==selected){paintSelected=selected;svg.querySelectorAll('.landmark-art').forEach(node=>{node.dataset.selected=node.dataset.art===selected;});}
    pins();
    // Scale bar is meaningful only at the default overview; compass remains fixed.
    const scale = svg.querySelector('[data-scale]'); if (scale) scale.style.display = camera.scale === 1 ? '' : 'none';
  }
  function stopFlight(){if(flight){cancelAnimationFrame(flight);flight=0;}svg.dataset.cameraMoving='false';}
  function moveCamera(next,animate=true){
    stopFlight();
    if(!animate||reducedMotion.matches){camera=next;applyCamera();return;}
    const from={...camera},start=performance.now();svg.dataset.cameraMoving='true';
    function tick(now){
      const t=Math.min(1,(now-start)/420),ease=1-Math.pow(1-t,3);
      camera=C.cameraBetween(from,next,ease);applyCamera();
      if(t<1)flight=requestAnimationFrame(tick);else{flight=0;svg.dataset.cameraMoving='false';}
    }
    flight=requestAnimationFrame(tick);
  }
  function requestCamera(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;applyCamera();});}
  function pins() {
    const k = camera.scale, clustered = k < 4;
    const compact=svg.getBoundingClientRect().width<600;
    const groupHills=compact&&k<2.8&&category==='All';
    const unit=1/Math.max(.1,svg.getScreenCTM()?.a||1);
    const signature=[mode,category,clustered,groupHills,selected,[...discovered].join(','),Math.round(unit*100)].join('|');
    if(signature===pinSignature){
      if(pinScale===unit/k)return;pinScale=unit/k;
      el('pins').querySelectorAll('.pin').forEach(pin=>pin.setAttribute('transform',`translate(${pin.dataset.x} ${pin.dataset.y}) scale(${unit/k})`));
      return;
    }
    const focused=document.activeElement?.closest?.('.pin')?.dataset.id;
    pinSignature=signature;pinScale=unit/k;
    let visible = places.filter(p => category === 'All' || p.cat === category);
    const grouped = visible.filter(p => quarter.includes(p.id));
    if (clustered) visible = visible.filter(p => !quarter.includes(p.id));
    if(groupHills)visible=visible.filter(p=>p.id!=='hill'&&p.id!=='kek');
    const render = (id, coords, number, label, cluster = false) => {
      const [x,y] = C.viewPoint(coords, mode);
      const mobile=compact;
      const showLabel=!mobile||k>=4||(cluster&&id!=='central')||selected===id;
      const width=Math.max(68,label.length*5.9+20);
      const offsets={hill:[-62,-8],kek:[61,20],fort:[0,-49],kho:[-38,26],food:[-58,-39],jetty:[46,26]};
      const [labelX,labelY]=offsets[id]||[0,26];
      const aria=id==='central'?'Explore Penang Hill and Kek Lok Si':cluster?'Zoom to '+grouped.length+' George Town destinations':'Discover '+label;
      return `<g class="pin" role="button" tabindex="0" aria-label="${C.escape(aria)}" data-id="${id}" data-x="${x}" data-y="${y}" data-active="${selected === id}" data-discovered="${discovered.has(id)}" transform="translate(${x} ${y}) scale(${unit/k})">${showLabel?`<rect class="pin-hit-box" x="${Math.min(-22,labelX-width/2)}" y="${Math.min(-22,labelY)}" width="${Math.max(22,labelX+width/2)-Math.min(-22,labelX-width/2)}" height="${Math.max(22,labelY+25)-Math.min(-22,labelY)}"/>`:""}<circle r="22" class="pin-hit"/><circle r="15" class="pin-dot"/><text>${C.escape(number)}</text>${showLabel?`<rect class="label-bg" x="${labelX-width/2}" y="${labelY}" width="${width}" height="25" rx="12"/><text class="pin-label" x="${labelX}" y="${labelY+17}">${C.escape(label)}</text>`:''}</g>`;
    };
    el('pins').innerHTML = visible.map(p => render(p.id,p.coordinates,p.number,p.name.replace('Clan Jetties · ', '').replace('Food trail · ', ''))).join('') +
      (clustered && grouped.length ? render('georgetown', [100.339,5.417], '✦', compact?'George Town':'George Town · '+grouped.length+' places', true) : '')+
      (groupHills?render('central',hillsCenter(),'2','Hills & temples',true):'');
    el('pins').querySelectorAll('.pin').forEach(pin => {
      const act = () => pin.dataset.id === 'georgetown' ? focusQuarter() : pin.dataset.id==='central'?focusAt(hillsCenter(),4.5):choose(pin.dataset.id, true);
      pin.addEventListener('click', () => { if (!dragged) act(); });
      pin.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); act();} });
    });
    if(focused)el('pins').querySelector(`[data-id="${focused}"]`)?.focus({preventScroll:true});
  }
  function redraw() {
    const title = mode === 'reference' ? 'Penang north-up geographic reference map' : 'Penang illustrated depth study, based on the same OSM geometry';
    if(!worldCache.has(mode))worldCache.set(mode,R.renderWorld(data,mode));
    svg.innerHTML = `<title id="map-title">${title}</title><desc id="map-description">Two road bridges, separate ferry routes and eight representative destination coordinates. Terrain and buildings are decorative. Drag or pinch to explore, double-click to zoom. Arrow keys pan, plus and minus zoom, Home resets.</desc>` + worldCache.get(mode);
    pinSignature='';paintScale=0;paintSelected=undefined;
    el('mapStatus').textContent = mode === 'reference' ? 'NORTH-UP · APPROVED GEOGRAPHY' : 'DIORAMA · APPROVED GEOGRAPHY';
    el('reference').setAttribute('aria-pressed', mode === 'reference');
    el('illustrated').setAttribute('aria-pressed', mode === 'illustrated');
    applyCamera();
  }
  function focusAt(coordinate, scale) {
    const [x,y] = C.viewPoint(coordinate,mode);
    moveCamera({scale,x:550-x*scale,y:440-y*scale});
  }
  function focusQuarter() { focusAt([100.3375,5.416], 12); toast('George Town close-up — select a numbered place.'); }
  function hillsCenter(){const p=places.filter(p=>p.id==='hill'||p.id==='kek');return [(p[0].coordinates[0]+p[1].coordinates[0])/2,(p[0].coordinates[1]+p[1].coordinates[1])/2];}
  function choose(id, focus = true) {
    const p = places.find(p => p.id === id); if (!p) return;
    const first = !discovered.has(id); selected = id; discovered.add(id);
    // A selected deep-linked place must remain visible through an existing category filter.
    if (category !== 'All' && category !== p.cat) { category = 'All'; categories(); }
    try { storage.setItem('explorePenangReviewDiscovered',JSON.stringify([...discovered])); } catch { /* in-memory discovery still works */ }
    progress(); cards(); pins();
    if (focus) focusAt(p.coordinates,quarter.includes(id) ? 12 : 2.3);
    const query = encodeURIComponent(`${p.coordinates[1]},${p.coordinates[0]}`);
    el('detail').classList.add('is-selected');
    el('detail').innerHTML = `<button class="dismiss-detail" id="closeDetail" aria-label="Close attraction profile">×</button><div class="detail-art" role="img" aria-label="Decorative illustration of ${C.escape(p.name)}">${artThumbnail(id)}</div><span class="eyebrow">${C.escape(p.cat)} · PLACE ${p.number}</span><h3>${C.escape(p.name)}</h3><p>${C.escape(p.description)}</p><div class="actions"><a target="_blank" rel="noopener noreferrer" href="${C.escape(p.official_url)}">${C.escape(p.official_label)} ↗</a><a class="secondary" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${query}">View mapped point ↗</a><button id="sharePlace">Share ↗</button></div><p class="coordinate-note">${C.escape(p.coordinate_note)}. Confirm the correct visitor entrance with the venue.</p>`;
    el('closeDetail').onclick=()=>{el('detail').classList.remove('is-selected');svg.focus({preventScroll:true});};
    el('sharePlace').onclick = () => share(`${location.href.split('#')[0]}#${encodeURIComponent(p.id)}`);
    try { history.replaceState(null,'','#' + encodeURIComponent(p.id)); } catch { /* file preview still works */ }
    if (first) toast(heritage.every(id => discovered.has(id)) && heritage.includes(id) ? '✦ Heritage Hunter stamp unlocked!' : '✦ Discovered: ' + p.name);
  }
  async function share(url) {
    try {
      if (navigator.share) { await navigator.share({title:'Explore Penang — Geography Review',url}); return; }
      if (navigator.clipboard) {await navigator.clipboard.writeText(url); toast('Link copied. This draft needs to be opened from the same review location.'); return;}
    } catch (error) { if (error.name === 'AbortError') return; }
    toast('Copy this page’s address to share this review.');
  }
  for (const id of ['reference','illustrated']) el(id).onclick = () => {
    if (mode === id) return;
    stopFlight();camera=C.reframe(camera,mode,id);mode=id;redraw();
  };
  el('share').onclick = () => share(location.href);
  el('georgetown').onclick = focusQuarter;
  el('island').onclick=()=>{const g=data.geography.features.find(f=>f.id==='penang-island').geometry;moveCamera(C.fitPoints(g.coordinates.flat(2),mode,100));};
  el('crossings').onclick=()=>{const points=data.geography.features.filter(f=>f.id==='bridge-1'||f.id==='bridge-2').flatMap(f=>f.geometry.coordinates.flat());moveCamera(C.fitPoints(points,mode,170));};
  const motionPreference=reducedMotion;
  let motion=!motionPreference.matches;
  function setMotion(){el('mapFrame').classList.toggle('motion-on',motion);el('motion').setAttribute('aria-pressed',motion);el('motion').textContent=motion?'Motion on':'Motion off';}
  el('motion').onclick=()=>{motion=!motion;setMotion();};
  motionPreference.addEventListener('change',event=>{if(event.matches){motion=false;stopFlight();}setMotion();});setMotion();
  el('questButton').onclick = () => { category = 'Heritage'; categories(); cards(); focusQuarter(); el('map-section').scrollIntoView({block:'start',behavior:reducedMotion.matches?'instant':'smooth'}); };
  el('zoomIn').onclick = () => { moveCamera(C.zoomAt(camera,[550,440],1.35)); };
  el('zoomOut').onclick = () => { moveCamera(C.zoomAt(camera,[550,440],1/1.35)); };
  el('reset').onclick = () => {moveCamera({scale:1,x:0,y:0});};
  el('placeList').querySelectorAll('button').forEach(card => card.onclick = () => {choose(card.dataset.place); el('journal').focus({preventScroll:true});});
  svg.addEventListener('wheel', event => { event.preventDefault(); stopFlight();camera=C.zoomAt(camera,point(event),event.deltaY<0?1.12:1/1.12);requestCamera(); },{passive:false});
  svg.addEventListener('dblclick',event=>{if(event.target.closest('.pin'))return;event.preventDefault();moveCamera(C.zoomAt(camera,point(event),2));});
  svg.addEventListener('keydown',event=>{
    const steps={ArrowLeft:[60,0],ArrowRight:[-60,0],ArrowUp:[0,60],ArrowDown:[0,-60]};
    if(steps[event.key]){event.preventDefault();stopFlight();camera.x+=steps[event.key][0];camera.y+=steps[event.key][1];applyCamera();}
    else if(event.key==='+'||event.key==='='){event.preventDefault();el('zoomIn').click();}
    else if(event.key==='-'){event.preventDefault();el('zoomOut').click();}
    else if(event.key==='Home'){event.preventDefault();el('reset').click();}
    else if(event.key==='Escape')el('detail').classList.remove('is-selected');
  });
  new ResizeObserver(()=>{pinSignature='';requestCamera();}).observe(svg);
  function beginGesture() {
    const values = [...pointers.values()];
    if (values.length === 1) gesture={camera:{...camera},point:values[0]};
    else if (values.length > 1) gesture={camera:{...camera},mid:[(values[0][0]+values[1][0])/2,(values[0][1]+values[1][1])/2],distance:Math.hypot(values[0][0]-values[1][0],values[0][1]-values[1][1])};
    else gesture=null;
  }
  svg.addEventListener('pointerdown', event => { stopFlight();dragged=false;pointers.set(event.pointerId,point(event));if(!event.target.closest('.pin')||pointers.size>1)svg.setPointerCapture(event.pointerId);beginGesture(); });
  svg.addEventListener('pointermove', event => {
    if(!pointers.has(event.pointerId)||!gesture)return;
    pointers.set(event.pointerId,point(event));const values=[...pointers.values()];
    if(values.length>1&&gesture.mid){
      const mid=[(values[0][0]+values[1][0])/2,(values[0][1]+values[1][1])/2];
      const distance=Math.hypot(values[0][0]-values[1][0],values[0][1]-values[1][1]);
      camera=C.zoomAt(gesture.camera,gesture.mid,distance/Math.max(gesture.distance,1));camera.x+=mid[0]-gesture.mid[0];camera.y+=mid[1]-gesture.mid[1];dragged=true;
    }else if(gesture.point){const dx=values[0][0]-gesture.point[0],dy=values[0][1]-gesture.point[1];camera={...gesture.camera,x:gesture.camera.x+dx,y:gesture.camera.y+dy};dragged=Math.hypot(dx,dy)>4;}
    requestCamera();
  });
  function end(event){if(frame){cancelAnimationFrame(frame);frame=0;applyCamera();}pointers.delete(event.pointerId);if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);beginGesture();}
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('lostpointercapture',event=>{pointers.delete(event.pointerId);beginGesture();});
  window.addEventListener('hashchange',()=>{const id=C.readHash(location.hash,ids);if(id)choose(id);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&el('detail').classList.contains('is-selected')){el('detail').classList.remove('is-selected');svg.focus({preventScroll:true});}});
  categories();cards();progress();redraw();
  const hash=C.readHash(location.hash,ids);if(hash)choose(hash);
})();
