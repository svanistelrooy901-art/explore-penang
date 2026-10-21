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
test('continuous terrain bake matches its source and stays outside geographic data',()=>{
  const crypto=require('node:crypto'),manifest=JSON.parse(fs.readFileSync('review/assets/terrain-v2.json'));
  const hash=crypto.createHash('sha256').update(fs.readFileSync('scripts/build_terrain.cjs')).update(fs.readFileSync('data/geography.geojson')).digest('hex');
  assert.equal(hash,manifest.source_sha256,'rebake when decorative terrain code changes');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync('review/assets/terrain-v2.webp')).digest('hex'),manifest.asset_sha256);
  assert.equal(manifest.width,2200);assert.equal(manifest.height,1760);
  const html=fs.readFileSync('review.html','utf8');
  const surface=JSON.parse(fs.readFileSync('review/assets/surface-v2.json'));
  assert.deepEqual(surface.town,D.townExtent,'district bake and renderer must use the same material bounds');
  const input=crypto.createHash('sha256');for(const file of surface.inputs)input.update(fs.readFileSync(file));
  assert.equal(input.digest('hex'),surface.input_sha256,'rebake when surface inputs change');
  for(const [file,meta]of Object.entries(surface.assets))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),meta.sha256);
  assert.match(fs.readFileSync('scripts/bake_surface.cjs','utf8'),/clip-path="url\(#clip\)"/);
  assert.equal((html.match(/data:image\/webp;base64,/g)||[]).length,3,'heritage atlas, urban atlas and ferry embedded once each');
  assert.notDeepEqual(D.crops.kho,D.crops.town,'Khoo Kongsi has its own architectural illustration');
});
test('camera flight has exact endpoints, finite bounded zoom and continuous centres',()=>{
  const a={scale:1,x:0,y:0},b={scale:12,x:-4600,y:-3200};
  for(const t of [0,.01,.25,.5,.9,1]){
    const c=C.cameraBetween(a,b,t);assert(c.scale>=1&&c.scale<=12);
    assert(Object.values(c).every(Number.isFinite));
    const center=(550-c.x)/c.scale;
    assert(Math.abs(center-((550-a.x)/a.scale+((550-b.x)/b.scale-(550-a.x)/a.scale)*t))<1e-9);
  }
  for(const key of ['scale','x','y']){assert(Math.abs(C.cameraBetween(a,b,0)[key]-a[key])<1e-9);assert(Math.abs(C.cameraBetween(a,b,1)[key]-b[key])<1e-9);}
});
test('dense bridge detail sampling respects concave approach footprints',()=>{
  for(const id of ['bridge-1','bridge-2'])for(const count of [24,40,80,160]){
    const p=D.bridgeSpine(features[id].geometry,count);assert(p.length>=count-2);
    for(const point of p)assert(C.pointInGeometry(point,features[id].geometry));
  }
});
test('shore artwork excludes administrative borders and uses only approved coastline vertices',()=>{
  const {execFileSync}=require('node:child_process');
  const coast=JSON.parse(execFileSync('python3',['scripts/coastal_segments.py'],{encoding:'utf8'}));
  const allowed=new Set(allPoints(features['penang-land'].geometry).map(p=>p.join(',')));
  const ids=new Set(coast.segments.map(s=>s.way_id));
  assert(coast.segments.length>100);assert(coast.excluded_boundary_ways.length>0);
  for(const id of coast.excluded_boundary_ways)assert(!ids.has(id),'inland borders must not acquire foam or shallow-water lighting');
  for(const segment of coast.segments)for(const p of segment.coordinates)assert(allowed.has(p.join(',')),'shore art must not invent a coast vertex');
  const surface=JSON.parse(fs.readFileSync('review/assets/surface-v2.json'));
  assert.deepEqual(surface.coastal_way_ids,[...ids]);
  assert.deepEqual(surface.excluded_boundary_ways,coast.excluded_boundary_ways);
});
test('coastal art builds without ignored source caches and rejects invalid recipes',()=>{
  const {execFileSync,spawnSync}=require('node:child_process');
  const path=require('node:path'),os=require('node:os');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'penang-coast-'));
  const helper='scripts/coastal_segments.py',recipeFile='review/assets/coastal-recipe-v1.json';
  try{
    for(const file of [helper,recipeFile,'data/geography.geojson','data/source-receipts.json']){
      const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);
    }
    assert(!fs.existsSync(path.join(root,'data/source')));
    const run=()=>execFileSync('python3',[helper],{cwd:root,encoding:'utf8'});
    assert.equal(run(),execFileSync('python3',[helper],{encoding:'utf8'}),'clean checkout derives identical shore paths');
    const original=JSON.parse(fs.readFileSync(recipeFile,'utf8'));
    for(const corrupt of [r=>r.segments[0].step=0,r=>r.source.sha256='unapproved',r=>r.excluded_boundary_ways.push(r.segments[0].way_id)]){
      const recipe=structuredClone(original);corrupt(recipe);
      fs.writeFileSync(path.join(root,recipeFile),JSON.stringify(recipe));
      const result=spawnSync('python3',[helper],{cwd:root,encoding:'utf8'});
      assert.equal(result.status,1);assert.match(result.stderr,/ValueError: Coastal art/);
    }
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('ten regional art anchors are on approved land and separate from discovery destinations',()=>{
  const hasCropClip=id=>R.renderWorld(data,'illustrated').includes('clip-path="url(#hotspot-crop-'+id+')"');
  const H=require('../review/hotspots.js');assert.equal(H.areas.length,10);assert.equal(new Set(H.areas.map(a=>a.id)).size,10);
  for(const area of H.areas){
    assert(C.pointInGeometry(area.coordinates,features['penang-land'].geometry),area.id+' must be on approved land');
    assert.equal(new URL(area.source).protocol,'https:');
    if(area.art){const [x,y,w,h]=area.crop;assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=1536&&y+h<=1024);assert(hasCropClip(area.id));}
    if(area.place)assert.deepEqual(area.coordinates,places.find(p=>p.id===area.place).coordinates);
  }
  const html=R.renderWorld({...data,hotspotAtlas:'urban-atlas'},'illustrated');
  assert(!html.includes('world-surface'));assert(!html.includes('georgetown-surface'));
  assert(html.includes('id="flat-land"'));assert.equal((html.match(/class="hotspot-art"/g)||[]).length,6);
  assert.equal((html.match(/class="area-marker"/g)||[]).length,6);
});

test('visitor site is self-contained and uses the protected map without review scaffolding',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert(html.includes('data-experience="public"'));assert(html.includes('id="placeSearch"'));
 assert(html.includes('id="flat-land"'));assert.equal((html.match(/class="place-card"/g)||[]).length,8);
 assert(!html.includes('class="review-banner"'));assert(!html.includes('id="review-notes"'));assert(!html.includes('/*__'));
 assert(!/\b(?:src|href)="https?:\/\/[^"]+\.(?:js|css)/.test(html));
 assert.equal((html.match(/data:image\/webp;base64,/g)||[]).length,3);
 assert(Buffer.byteLength(html)<2000000);assert(html.includes('© OpenStreetMap contributors'));
 const json=html.match(/<script id="review-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
 const built=JSON.parse(json);assert.deepEqual(built.geography,geography);assert.deepEqual(built.places,places);
 assert.equal(built.visitorMode,true);assert.equal(Object.keys(built.content.areas).length,10);
});
test('visitor progress restores the existing public-site key without mixing review progress',()=>{
 const storage={getItem:key=>JSON.stringify(key==='explorePenangDiscovered'?['fort','kho','bad']:['hill'])};
 assert.deepEqual([...C.readProgress(storage,places.map(p=>p.id),'explorePenangDiscovered')],['fort','kho']);
 assert.deepEqual([...C.readProgress(storage,places.map(p=>p.id))],['hill']);
});
