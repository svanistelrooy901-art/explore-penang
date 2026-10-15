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
  function readProgress(storage, validIds) {
    try {
      const values = JSON.parse(storage.getItem('explorePenangReviewDiscovered') || '[]');
      return new Set(Array.isArray(values) ? values.filter(id => validIds.includes(id)) : []);
    } catch { return new Set(); }
  }
  function readHash(hash, validIds) {
    try { const id = decodeURIComponent(hash.replace(/^#/, '')); return validIds.includes(id) ? id : null; }
    catch { return null; }
  }
  function escape(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  const api = { BOUNDS, WIDTH, HEIGHT, UNIT, project, viewPoint, pointInGeometry, clamp, zoomAt, readProgress, readHash, escape };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PenangMap = api;
})(globalThis);
