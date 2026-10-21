/* Geographic math shared by the renderer and interaction tests. */
(function (root) {
  'use strict';
  const BOUNDS = [100.16, 5.20, 100.52, 5.51];
  const WIDTH = 1100, HEIGHT = 880, COS = Math.cos(5.36 * Math.PI / 180);
  const UNIT = Math.min(960 / ((BOUNDS[2] - BOUNDS[0]) * COS), 740 / (BOUNDS[3] - BOUNDS[1]));
  function project([lon, lat]) {
    return [70 + (lon - BOUNDS[0]) * COS * UNIT, 70 + (BOUNDS[3] - lat) * UNIT];
  }
  function viewPoint(coordinate, mode = 'reference') {
    const [x, y] = project(coordinate);
    return mode === 'illustrated' ? [x + .16 * (y - 440), 100 + .76 * y] : [x, y];
  }
  function unviewPoint([x,y],mode='reference'){
    if(mode==='illustrated'){y=(y-100)/.76;x-=.16*(y-440);}
    return [BOUNDS[0]+(x-70)/(COS*UNIT),BOUNDS[3]-(y-70)/UNIT];
  }
  function reframe(camera,from,to){
    const center=[(550-camera.x)/camera.scale,(440-camera.y)/camera.scale];
    const projected=viewPoint(unviewPoint(center,from),to);
    return {scale:camera.scale,x:550-projected[0]*camera.scale,y:440-projected[1]*camera.scale};
  }
  function fitPoints(points,mode,padding=120){
    const p=points.map(point=>viewPoint(point,mode));
    const xs=p.map(p=>p[0]),ys=p.map(p=>p[1]);
    const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const scale=clamp(Math.min((1100-padding*2)/Math.max(1,x1-x0),(880-padding*2)/Math.max(1,y1-y0)),.85,14);
    return {scale,x:550-(x0+x1)/2*scale,y:440-(y0+y1)/2*scale};
  }
  function pointInRing([x, y], ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function pointInGeometry(point, geometry) {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    return polygons.some(rings => pointInRing(point, rings[0]) && !rings.slice(1).some(r => pointInRing(point, r)));
  }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function zoomAt(camera, point, factor) {
    const scale = clamp(camera.scale * factor, .85, 14);
    const ratio = scale / camera.scale;
    return { scale, x: point[0] - (point[0] - camera.x) * ratio, y: point[1] - (point[1] - camera.y) * ratio };
  }
  function cameraBetween(a,b,t){
    t=clamp(t,0,1);
    const scale=a.scale*Math.pow(b.scale/a.scale,t);
    const ax=(550-a.x)/a.scale,ay=(440-a.y)/a.scale;
    const bx=(550-b.x)/b.scale,by=(440-b.y)/b.scale;
    return {scale,x:550-(ax+(bx-ax)*t)*scale,y:440-(ay+(by-ay)*t)*scale};
  }
  function readProgress(storage, validIds, key = 'explorePenangReviewDiscovered') {
    try {
      const values = JSON.parse(storage.getItem(key) || '[]');
      return new Set(Array.isArray(values) ? values.filter(id => validIds.includes(id)) : []);
    } catch { return new Set(); }
  }
  function readHash(hash, validIds) {
    try { const id = decodeURIComponent(hash.replace(/^#/, '')); return validIds.includes(id) ? id : null; }
    catch { return null; }
  }
  function escape(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  const api = { BOUNDS, WIDTH, HEIGHT, UNIT, project, viewPoint, unviewPoint, reframe, fitPoints, pointInGeometry, clamp, zoomAt, cameraBetween, readProgress, readHash, escape };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PenangMap = api;
})(globalThis);
