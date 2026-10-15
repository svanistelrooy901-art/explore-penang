const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const C=require('../review/map-core.js');
const R=require('../review/map-renderer.js');
const D=require('../review/diorama.js');
const geography=JSON.parse(fs.readFileSync('data/geography.geojson','utf8'));
const places=JSON.parse(fs.readFileSync('data/places.json','utf8'));
const data={geography,places};
const features=Object.fromEntries(geography.features.map(f=>[f.id,f]));
const allPoints=g=>g.type==='MultiPolygon'?g.coordinates.flat(2):g.type==='Polygon'?g.coordinates.flat():g.coordinates;
const extent=g=>{const p=allPoints(g);return [Math.min(...p.map(p=>p[0])),Math.min(...p.map(p=>p[1])),Math.max(...p.map(p=>p[0])),Math.max(...p.map(p=>p[1]))];};
test('north-up projection puts island west of mainland, north above south',()=>{
  assert(C.project([100.25,5.4])[0]<C.project([100.46,5.4])[0]);
  assert(C.project([100.3,5.47])[1]<C.project([100.3,5.26])[1]);
  const a=C.project([100.3,5.3]),b=C.project([100.31,5.3]),c=C.project([100.3,5.31]);
  assert(Math.abs((b[0]-a[0])/(a[1]-c[1])-Math.cos(5.36*Math.PI/180))<1e-9);
});
test('both separately sourced bridge footprints cross the strait in the correct order',()=>{
  const first=features['bridge-1'],second=features['bridge-2'];
  assert.equal(first.properties.osm_id,601267471);assert.equal(second.properties.osm_id,725050946);
  assert.equal(first.geometry.type,'Polygon');assert.equal(second.geometry.type,'Polygon');
  const a=extent(first.geometry),b=extent(second.geometry);
  assert(a[0]<100.32&&a[2]>100.38);assert(b[0]<100.30&&b[2]>100.42);
  assert(b[3]<a[1],'the entire second bridge must be south of the first');
});
test('local ferry routes are independent of bridges, north of both, with no Langkawi outlier',()=>{
  for(const id of ['ferry-to-island','ferry-to-mainland']){
    const f=features[id],p=f.geometry.coordinates;
    assert.equal(f.properties.tags.route,'ferry');
    assert.equal(f.geometry.type,'LineString');
    for(const [lon,lat] of p){assert(lon>100.33&&lon<100.38);assert(lat>5.39&&lat<5.43);}
    assert(Math.abs(p[0][0]-p.at(-1)[0])>.015);
  }
});
test('geometries retain source IDs, versions, exact closed rings and finite coordinates',()=>{
  assert.equal(features['penang-island'].properties.osm_id,12272811);
  for(const f of geography.features){
    assert(f.properties.version>=1);assert.match(f.properties.source_url,/^https:\/\/www.openstreetmap.org\//);
    for(const p of allPoints(f.geometry))assert(p.every(Number.isFinite));
    if(f.geometry.type!=='LineString'){
      const rings=f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates.flat();
      for(const ring of rings)assert.deepEqual(ring[0],ring.at(-1));
    }
  }
});
test('all eight attraction IDs survive with real OSM coordinates and safe official URLs',()=>{
  assert.deepEqual(places.map(p=>p.id),['fort','kho','jetty','hill','kek','beach','food','mainland']);
  for(const p of places){
    assert(p.osm_id>0);assert.equal(new URL(p.official_url).protocol,'https:');
    assert(p.coordinates[0]>100.17&&p.coordinates[0]<100.51&&p.coordinates[1]>5.25&&p.coordinates[1]<5.49);
  }
  for(const id of ['hill','kek','fort'])assert(C.pointInGeometry(places.find(p=>p.id===id).coordinates,features['penang-island'].geometry));
  assert(!C.pointInGeometry(places.find(p=>p.id==='mainland').coordinates,features['penang-island'].geometry));
  assert(places.find(p=>p.id==='beach').coordinates[1]>places.find(p=>p.id==='hill').coordinates[1]);
  assert.match(places.find(p=>p.id==='food').coordinate_note,/Chowrasta/);
});
test('depth transform changes presentation without mutating source geometry',()=>{
  const before=JSON.stringify(data);const html=R.renderWorld(data,'illustrated');
  assert.equal(JSON.stringify(data),before);assert(html.includes('no elevation data'));
  assert.equal((html.match(/data-feature="bridge-/g)||[]).length,2);
  assert.notDeepEqual(C.viewPoint(places[0].coordinates,'reference'),C.viewPoint(places[0].coordinates,'illustrated'));
});
test('zoom preserves the map point beneath the pointer, including at limits',()=>{
  const initial={scale:2,x:-100,y:-80},p=[300,200];
  for(const factor of [1.2,.5,100,.001]){
    const next=C.zoomAt(initial,p,factor);assert(next.scale>=.85&&next.scale<=14);
    assert(Math.abs((p[0]-next.x)/next.scale-(p[0]-initial.x)/initial.scale)<1e-8);
    assert(Math.abs((p[1]-next.y)/next.scale-(p[1]-initial.y)/initial.scale)<1e-8);
  }
});
test('invalid/blocked storage and malformed deep links do not crash discovery',()=>{
  const ids=places.map(p=>p.id);
  for(const value of ['{','null','{}','42','"fort"'])assert.equal(C.readProgress({getItem:()=>value},ids).size,0);
  assert.equal(C.readProgress({getItem(){throw new Error('blocked');}},ids).size,0);
  assert.deepEqual([...C.readProgress({getItem:()=>JSON.stringify(['fort','fort','missing'])},ids)],['fort']);
  assert.equal(C.readHash('#%E0%A4%A',ids),null);assert.equal(C.readHash('#fort',ids),'fort');
});
test('review output is self-contained, attributed and explicitly withheld from publishing',()=>{
  const html=fs.readFileSync('review.html','utf8');
  assert(!/\b(?:src|href)="https?:\/\/[^\"]+\.(?:js|css)/.test(html));
  assert(html.includes('© OpenStreetMap contributors'));assert(html.includes('noindex,nofollow'));
  assert(html.includes('Geography approved'));assert(html.includes('Not published'));assert(!html.includes('/*__'));
  assert(Buffer.byteLength(html)<2000000,'keep the offline diorama, including its embedded atlas, under 2 MB');
});
test('illustration work preserves the exact geographic files approved by the owner',()=>{
  const crypto=require('node:crypto');
  const approval=JSON.parse(fs.readFileSync('docs/geography-approval.json','utf8'));
  assert.equal(approval.status,'approved');
  for(const [file,digest] of Object.entries(approval.files)){
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),digest,`${file}: approved geometry changed`);
  }
});
test('switching presentation keeps the same geographic point beneath the view centre',()=>{
  const initial={scale:7,x:-2600,y:-1200};
  const world=[(550-initial.x)/initial.scale,(440-initial.y)/initial.scale];
  const before=C.unviewPoint(world,'illustrated');
  const converted=C.reframe(initial,'illustrated','reference');
  const after=C.unviewPoint([(550-converted.x)/converted.scale,(440-converted.y)/converted.scale],'reference');
  assert(Math.abs(before[0]-after[0])<1e-10&&Math.abs(before[1]-after[1])<1e-10);
  const back=C.reframe(converted,'reference','illustrated');
  assert(Math.abs(back.x-initial.x)<1e-8&&Math.abs(back.y-initial.y)<1e-8);
});
test('bridge art spines stay within the approved footprints and presets fit both bridges',()=>{
  const points=[];
  for(const id of ['bridge-1','bridge-2']){
    const g=features[id].geometry;
    for(const p of D.bridgeSpine(g)){assert(C.pointInGeometry(p,g),'bridge detail must remain in its source polygon');points.push(p);}
  }
  const camera=C.fitPoints(points,'illustrated',120);
  for(const p of points){const [x,y]=C.viewPoint(p,'illustrated');assert(x*camera.scale+camera.x>=119&&x*camera.scale+camera.x<=981);assert(y*camera.scale+camera.y>=119&&y*camera.scale+camera.y<=761);}
});
