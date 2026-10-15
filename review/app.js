(function () {
  'use strict';
  const C = PenangMap, R = PenangRenderer;
  const data = JSON.parse(document.getElementById('review-data').textContent);
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
  let mode = 'reference', category = 'All', selected = null, camera = { scale: 1, x: 0, y: 0 }, toastTimer;
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
    el('zoomIn').disabled = camera.scale >= 14;
    el('zoomOut').disabled = camera.scale <= .85;
    pins();
    // Scale bar is meaningful only at the default overview; compass remains fixed.
    const scale = svg.querySelector('[data-scale]'); if (scale) scale.style.display = camera.scale === 1 ? '' : 'none';
  }
  function pins() {
    const k = camera.scale, clustered = k < 4;
    let visible = places.filter(p => category === 'All' || p.cat === category);
    const grouped = visible.filter(p => quarter.includes(p.id));
    if (clustered) visible = visible.filter(p => !quarter.includes(p.id));
    const render = (id, coords, number, label, cluster = false) => {
      const [x,y] = C.viewPoint(coords, mode);
      const small = k > 4, radius = cluster ? 20 : 16;
      let dx = 0, dy = 29;
      if (!small && id === 'hill') { dx = -50; dy = -5; }
      if (!small && id === 'kek') { dx = -38; dy = 32; }
      return `<g class="pin" role="button" tabindex="0" aria-label="${C.escape(cluster ? 'Zoom to ' + grouped.length + ' George Town destinations' : 'Discover ' + label)}" data-id="${id}" data-active="${selected === id}" data-discovered="${discovered.has(id)}" transform="translate(${x} ${y}) scale(${1/k})"><circle r="${radius}"/><text>${C.escape(number)}</text><text class="pin-label" x="${dx}" y="${dy}">${C.escape(label)}</text></g>`;
    };
    el('pins').innerHTML = visible.map(p => render(p.id,p.coordinates,p.number,p.name.replace('Clan Jetties · ', '').replace('Food trail · ', ''))).join('') +
      (clustered && grouped.length ? render('georgetown', [100.339,5.417], '✦', 'George Town · ' + grouped.length + ' places', true) : '');
    el('pins').querySelectorAll('.pin').forEach(pin => {
      const act = () => pin.dataset.id === 'georgetown' ? focusQuarter() : choose(pin.dataset.id, false);
      pin.addEventListener('click', () => { if (!dragged) act(); });
      pin.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); act();} });
    });
  }
  function redraw() {
    const title = mode === 'reference' ? 'Penang north-up geographic reference map' : 'Penang illustrated depth study, based on the same OSM geometry';
    svg.innerHTML = `<title id="map-title">${title}</title><desc id="map-description">Two road bridges, separate ferry routes and eight representative destination coordinates. Depth and vegetation are decorative.</desc>` + R.renderWorld(data,mode);
    el('mapStatus').textContent = mode === 'reference' ? 'NORTH-UP · OSM GEOMETRY' : 'ILLUSTRATED DEPTH · SAME GEOMETRY';
    el('reference').setAttribute('aria-pressed', mode === 'reference');
    el('illustrated').setAttribute('aria-pressed', mode === 'illustrated');
    applyCamera();
  }
  function focusAt(coordinate, scale) {
    const [x,y] = C.viewPoint(coordinate,mode);
    camera = {scale,x:550-x*scale,y:440-y*scale}; applyCamera();
  }
  function focusQuarter() { focusAt([100.3375,5.416], 12); toast('George Town close-up — select a numbered place.'); }
  function choose(id, focus = true) {
    const p = places.find(p => p.id === id); if (!p) return;
    const first = !discovered.has(id); selected = id; discovered.add(id);
    // A selected deep-linked place must remain visible through an existing category filter.
    if (category !== 'All' && category !== p.cat) { category = 'All'; categories(); }
    try { storage.setItem('explorePenangReviewDiscovered',JSON.stringify([...discovered])); } catch { /* in-memory discovery still works */ }
    progress(); cards(); pins();
    if (focus) focusAt(p.coordinates,quarter.includes(id) ? 12 : 2.3);
    const query = encodeURIComponent(`${p.coordinates[1]},${p.coordinates[0]}`);
    el('detail').innerHTML = `<span class="eyebrow">${C.escape(p.cat)} · PLACE ${p.number}</span><h3>${C.escape(p.name)}</h3><p>${C.escape(p.description)}</p><div class="actions"><a target="_blank" rel="noopener noreferrer" href="${C.escape(p.official_url)}">${C.escape(p.official_label)} ↗</a><a class="secondary" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${query}">View mapped point ↗</a><button id="sharePlace">Share ↗</button></div><p class="coordinate-note">${C.escape(p.coordinate_note)}. Confirm the correct visitor entrance with the venue.</p>`;
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
    mode = id; camera = {scale:1,x:0,y:0}; redraw();
  };
  el('share').onclick = () => share(location.href);
  el('georgetown').onclick = focusQuarter;
  el('questButton').onclick = () => { category = 'Heritage'; categories(); cards(); focusQuarter(); el('map-section').scrollIntoView({block:'start',behavior:'smooth'}); };
  el('zoomIn').onclick = () => { camera = C.zoomAt(camera,[550,440],1.35); applyCamera(); };
  el('zoomOut').onclick = () => { camera = C.zoomAt(camera,[550,440],1/1.35); applyCamera(); };
  el('reset').onclick = () => {camera={scale:1,x:0,y:0}; applyCamera();};
  el('placeList').querySelectorAll('button').forEach(card => card.onclick = () => {choose(card.dataset.place); el('journal').focus({preventScroll:true});});
  svg.addEventListener('wheel', event => { event.preventDefault(); camera=C.zoomAt(camera,point(event),event.deltaY<0?1.12:1/1.12);applyCamera(); },{passive:false});
  function beginGesture() {
    const values = [...pointers.values()];
    if (values.length === 1) gesture={camera:{...camera},point:values[0]};
    else if (values.length > 1) gesture={camera:{...camera},mid:[(values[0][0]+values[1][0])/2,(values[0][1]+values[1][1])/2],distance:Math.hypot(values[0][0]-values[1][0],values[0][1]-values[1][1])};
    else gesture=null;
  }
  svg.addEventListener('pointerdown', event => { if(event.target.closest('.pin'))return;dragged=false; pointers.set(event.pointerId,point(event));svg.setPointerCapture(event.pointerId);beginGesture(); });
  svg.addEventListener('pointermove', event => {
    if(!pointers.has(event.pointerId)||!gesture)return;
    pointers.set(event.pointerId,point(event));const values=[...pointers.values()];
    if(values.length>1&&gesture.mid){
      const mid=[(values[0][0]+values[1][0])/2,(values[0][1]+values[1][1])/2];
      const distance=Math.hypot(values[0][0]-values[1][0],values[0][1]-values[1][1]);
      camera=C.zoomAt(gesture.camera,gesture.mid,distance/Math.max(gesture.distance,1));camera.x+=mid[0]-gesture.mid[0];camera.y+=mid[1]-gesture.mid[1];dragged=true;
    }else if(gesture.point){const dx=values[0][0]-gesture.point[0],dy=values[0][1]-gesture.point[1];camera={...gesture.camera,x:gesture.camera.x+dx,y:gesture.camera.y+dy};dragged=Math.hypot(dx,dy)>4;}
    applyCamera();
  });
  function end(event){pointers.delete(event.pointerId);if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);beginGesture();}
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('lostpointercapture',event=>{pointers.delete(event.pointerId);beginGesture();});
  window.addEventListener('hashchange',()=>{const id=C.readHash(location.hash,ids);if(id)choose(id);});
  categories();cards();progress();redraw();
  const hash=C.readHash(location.hash,ids);if(hash)choose(hash);
})();
