const {test,before,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
let browser,server,url;
before(async()=>{
  const root=path.resolve('.');
  server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.json')||file.endsWith('.geojson')?'application/json':'text/plain');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  url=`http://127.0.0.1:${server.address().port}/review.html`;
});
beforeEach(async()=>{
  const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox','--disable-gpu',...(executablePath?['--no-zygote','--single-process']:[])]});
});
afterEach(async()=>{await browser?.close();});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});
async function setup(options={}){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',...options});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);return {page,context,errors};
}
test('desktop: both map modes, close-up, discovery, quest and real official links work',async()=>{
  const {page,context,errors}=await setup();
  assert.equal(await page.locator('.bridge').count(),2);
  assert.equal(await page.locator('[data-feature^="ferry-"]').count(),2);
  await page.getByRole('button',{name:'Illustrated depth',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Illustrated depth',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.bridge').count(),2);
  assert.equal(await page.locator('.landmark-art').count(),8);
  await page.getByRole('button',{name:'George Town close-up'}).click();
  const symbolWidth=await page.locator('.landmark-art[data-art="kho"]>svg').evaluate(e=>Number(e.getAttribute('width'))*e.parentElement.getScreenCTM().a);
  assert(symbolWidth<170,'the clipped landmark viewport should not grow over the close-up map');
  await page.getByRole('button',{name:'North-up reference',exact:true}).click();
  await page.getByRole('button',{name:'George Town close-up'}).click();
  await page.locator('.pin[data-id="fort"]').focus();await page.keyboard.press('Enter');
  assert.match(await page.locator('#detail').innerText(),/Fort Cornwallis/);
  assert.match(await page.locator('#detail a').first().getAttribute('href'),/mypenang\.gov\.my/);
  assert.equal(await page.locator('#progressText').innerText(),'1 / 8');
  await page.locator('[data-place="kho"]').click();await page.locator('[data-place="jetty"]').click();
  assert.match(await page.locator('#questProgress').innerText(),/unlocked/);
  await page.reload();assert.equal(await page.locator('#progressText').innerText(),'3 / 8');
  assert.deepEqual(errors,[]);await context.close();
});
test('George Town material remains visible and anchored through zoom and reset',async()=>{
  const {page,context,errors}=await setup({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const tile=page.locator('#georgetown-surface');
  const initial=await tile.evaluate(e=>({x:e.getAttribute('x'),y:e.getAttribute('y'),width:e.getAttribute('width'),height:e.getAttribute('height'),href:e.getAttribute('href')}));
  for(const action of [null,'#georgetown','#reset']){
    if(action)await page.locator(action).click();
    assert.equal(await tile.evaluate(e=>getComputedStyle(e).opacity),'1','the district must not pop in at a zoom threshold');
    assert.deepEqual(await tile.evaluate(e=>({x:e.getAttribute('x'),y:e.getAttribute('y'),width:e.getAttribute('width'),height:e.getAttribute('height'),href:e.getAttribute('href')})),initial,'zoom changes the camera, not the urban material or its bounds');
  }
  assert.deepEqual(errors,[]);await context.close();
});
test('mobile: no horizontal overflow; filters, zoom, reset and drag preserve crossings',async()=>{
  const {page,context,errors}=await setup({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
  await page.getByRole('button',{name:'Explore Penang Hill and Kek Lok Si'}).click();
  assert.equal(await page.locator('.pin[data-id="hill"]').count(),1);
  assert.equal(await page.locator('.pin[data-id="kek"]').count(),1);
  await page.locator('#reset').click();
  await page.getByRole('button',{name:'Nature',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.cat),'Nature','filter activation retains keyboard focus');
  assert.equal(await page.locator('.place-card:visible').count(),2);
  assert.equal(await page.locator('.bridge').count(),2);
  await page.locator('#zoomIn').click();assert.match(await page.locator('#camera').getAttribute('transform'),/scale\(1\.35\)/);
  await page.locator('#reset').click();assert.match(await page.locator('#camera').getAttribute('transform'),/scale\(1\)/);
  await page.locator('#map').scrollIntoViewIfNeeded();
  const box=await page.locator('#map').boundingBox();
  await page.mouse.move(box.x+40,box.y+70);await page.mouse.down();await page.mouse.move(box.x+80,box.y+100);await page.mouse.up();
  assert.notEqual(await page.locator('#camera').getAttribute('transform'),'translate(0 0) scale(1)');
  await page.locator('#reset').click();
  const cdp=await context.newCDPSession(page);
  const touch=(id,x,y)=>({id,x:box.x+x,y:box.y+y,radiusX:2,radiusY:2,force:1});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(0,60,95),touch(1,110,95)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(0,40,95),touch(1,150,95)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert(!/scale\(1\)/.test(await page.locator('#camera').getAttribute('transform')),'pinch should zoom the map');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  assert.deepEqual(errors,[]);await context.close();
});
test('corrupted storage and malformed hash recover; deep links reveal filtered places',async()=>{
  const {page,context,errors}=await setup();
  await page.evaluate(()=>localStorage.setItem('explorePenangReviewDiscovered','{'));
  await page.goto(url+'#%E0%A4%A');assert.equal(await page.locator('#progressText').innerText(),'0 / 8');
  await page.getByRole('button',{name:'Nature',exact:true}).click();
  await page.evaluate(()=>{location.hash='fort';});
  await page.waitForFunction(()=>document.getElementById('detail').textContent.includes('Fort Cornwallis'));
  assert.equal(await page.getByRole('button',{name:'All',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.pin[data-id="fort"]').count(),1);
  assert.deepEqual(errors,[]);await context.close();
});
test('blocked storage keeps discovery usable; the draft makes no third-party requests',async()=>{
  const context=await browser.newContext();
  await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
  const page=await context.newPage(),external=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:'))external.push(r.url());});
  await page.goto(url+'#kek');assert.match(await page.locator('#detail').innerText(),/Kek Lok Si/);
  assert.equal(await page.locator('#progressText').innerText(),'1 / 8');assert.deepEqual(external,[]);
  await context.close();
});
test('downloaded HTML works as a standalone local file, including source-data download',async()=>{
  const context=await browser.newContext();const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('review.html')+'#hill');
  assert.match(await page.locator('#detail').innerText(),/Penang Hill/);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('.map-attribution a[download]').click();const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'geography.geojson');
  const content=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(content.features.length,6);
  assert.deepEqual(errors,[]);await context.close();
});
test('drag reuses pins and does not swallow the next selection; keyboard navigation works',async()=>{
  const {page,context,errors}=await setup();
  await page.evaluate(()=>{window.pinChanges=0;new MutationObserver(records=>window.pinChanges+=records.filter(r=>r.type==='childList').length).observe(document.getElementById('pins'),{childList:true});});
  const box=await page.locator('#map').boundingBox();
  await page.mouse.move(box.x+20,box.y+100);await page.mouse.down();await page.mouse.move(box.x+70,box.y+120,{steps:8});await page.mouse.up();
  assert.equal(await page.evaluate(()=>window.pinChanges),0,'pan should reuse landmark DOM');
  await page.locator('.pin[data-id="mainland"]').click();
  assert.match(await page.locator('#detail').innerText(),/Bukit Mertajam/);
  await page.locator('#map').focus();await page.keyboard.press('Home');
  assert.match(await page.locator('#camera').getAttribute('transform'),/scale\(1\)/);
  await page.keyboard.press('+');assert.match(await page.locator('#camera').getAttribute('transform'),/scale\(1\.35\)/);
  await page.keyboard.press('ArrowLeft');assert.notEqual(await page.locator('#camera').getAttribute('transform'),'translate(0 0) scale(1.35)');
  assert.deepEqual(errors,[]);await context.close();
});
test('presets preserve crossings; presentation, motion and mobile profile work',async()=>{
  const {page,context,errors}=await setup({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.getByRole('button',{name:'Both bridges',exact:true}).click();
  const before=await page.locator('#camera').getAttribute('transform');
  await page.getByRole('button',{name:'North-up reference',exact:true}).click();
  assert(!/scale\(1\)/.test(await page.locator('#camera').getAttribute('transform')),'mode switch should preserve zoom');
  await page.getByRole('button',{name:'Illustrated depth',exact:true}).click();
  const after=await page.locator('#camera').getAttribute('transform');
  const numbers=s=>s.match(/-?[\d.]+/g).map(Number);
  numbers(before).forEach((v,i)=>assert(Math.abs(v-numbers(after)[i])<1e-6));
  await page.getByRole('button',{name:'Motion off',exact:true}).click();assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'true');
  await page.locator('[data-place="hill"]').click();
  assert.equal(await page.locator('#detail').evaluate(e=>getComputedStyle(e).position),'fixed');
  await page.getByRole('button',{name:'Close attraction profile'}).click();
  assert.notEqual(await page.locator('#detail').evaluate(e=>getComputedStyle(e).position),'fixed');
  assert.deepEqual(errors,[]);await context.close();
});
test('animated focus settles, manual zoom cancels it, and reduced motion is immediate',async()=>{
  const {page,context,errors}=await setup({reducedMotion:'no-preference'});
  await page.locator('#georgetown').click();
  await page.waitForFunction(()=>document.getElementById('map').dataset.cameraMoving==='false');
  assert.match(await page.locator('#camera').getAttribute('transform'),/scale\(12\)/);
  assert.equal(await page.locator('#map-labels').evaluate(e=>getComputedStyle(e).display),'none','regional text should disappear in the heritage close-up');
  const ferryWidth=await page.locator('.sea-decoration').evaluate(e=>e.getBoundingClientRect().width);
  assert(ferryWidth<100,'decorative vessels must not balloon into the close-up');
  await page.locator('#reset').click();
  await page.waitForFunction(()=>document.getElementById('map').dataset.cameraMoving==='false');
  const labelSize=await page.locator('#map-labels text').first().evaluate(e=>Number(e.getAttribute('font-size'))*e.getScreenCTM().a);
  assert(labelSize<=15,'regional text should retain a screen-space size');
  await page.evaluate(()=>{
    document.getElementById('georgetown').click();
    document.getElementById('map').dispatchEvent(new WheelEvent('wheel',{deltaY:-10,clientX:220,clientY:550,bubbles:true,cancelable:true}));
  });
  assert.equal(await page.locator('#map').getAttribute('data-camera-moving'),'false');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#georgetown').click();
  assert.match(await page.locator('#camera').getAttribute('transform'),/scale\(12\)/);
  assert.equal(await page.locator('#map').getAttribute('data-camera-moving'),'false');
  assert.deepEqual(errors,[]);await context.close();
});
test('320px layout, keyboard profile dismissal and hostile fragments remain usable',async()=>{
  const {page,context,errors}=await setup({viewport:{width:320,height:740},hasTouch:true,isMobile:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=320));
  await page.evaluate(()=>{location.hash=encodeURIComponent('<img src=x onerror="window.fragmentRan=true">');});
  assert.equal(await page.evaluate(()=>window.fragmentRan),undefined);
  assert.equal(await page.locator('#progressText').innerText(),'0 / 8');
  await page.locator('[data-place="kho"]').click();
  assert.match(await page.locator('#detail').innerText(),/Khoo Kongsi/);
  const crop=(await page.locator('#detail .art-thumbnail').getAttribute('viewBox')).split(' ').map(Number);
  assert(crop[0]>768&&crop[2]<384,'the measured Khoo window should exclude the neighbouring temple cutout');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#detail.is-selected').count(),0);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'map');
  assert.deepEqual(errors,[]);await context.close();
});
test('mobile performance: bounded SVG and pan work under 4x CPU throttling',async()=>{
  const {page,context,errors}=await setup({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.locator('#map').scrollIntoViewIfNeeded();
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const box=await page.locator('#map').boundingBox();await page.mouse.move(box.x+40,box.y+70);await page.mouse.down();
  const measure=()=>page.evaluate(async()=>{
    const svg=document.getElementById('map'),box=svg.getBoundingClientRect();
    let mutations=0;const observer=new MutationObserver(rs=>mutations+=rs.length);observer.observe(document.getElementById('pins'),{childList:true});
    const times=[],work=[],longTasks=[];const perf=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>e.duration)));perf.observe({type:'longtask',buffered:false});
    let last=performance.now();
    for(let i=0;i<72;i++)await new Promise(resolve=>requestAnimationFrame(now=>{
      if(i)times.push(now-last);last=now;
      const start=performance.now();svg.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,clientX:box.x+40+Math.sin(i/12)*30,clientY:box.y+70+Math.cos(i/12)*15,bubbles:true}));
      work.push(performance.now()-start);resolve();
    }));
    await new Promise(resolve=>requestAnimationFrame(resolve));observer.disconnect();perf.disconnect();
    const p95=a=>a.sort((a,b)=>a-b)[Math.floor(a.length*.95)];
    return {svgNodes:svg.querySelectorAll('*').length,p95FrameMs:p95(times),p95DispatchMs:p95(work),pinMutations:mutations,longTasks:longTasks.length};
  });
  const metrics=await measure();await page.mouse.up();
  await page.locator('#georgetown').click();await page.mouse.move(box.x+40,box.y+70);await page.mouse.down();
  const detail=await measure();await page.mouse.up();
  console.log('P02.4 mobile close-up synthetic performance',JSON.stringify(detail));
  assert(detail.p95FrameMs<100,'close-up pan should avoid sustained sub-10fps rendering');
  assert.equal(detail.pinMutations,0);
  console.log('P02.4 mobile synthetic performance',JSON.stringify(metrics));
  assert(metrics.svgNodes<850,'keep map SVG complexity bounded');
  assert.equal(metrics.pinMutations,0,'pan should never rebuild pins');
  assert(metrics.p95DispatchMs<20,'pointer event handling should stay under 20ms at 4x throttle');
  assert(metrics.p95FrameMs<100,'synthetic panning should avoid sustained sub-10fps rendering');
  assert.deepEqual(errors,[]);await context.close();
});
test('mobile close-up pin labels and their combined touch target select a place',async()=>{
  const {page,context,errors}=await setup({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.locator('#georgetown').click();
  await page.locator('.pin[data-id="kho"]').tap();
  assert.match(await page.locator('#detail').innerText(),/Khoo Kongsi/);
  await page.getByRole('button',{name:'Close attraction profile'}).click();
  await page.locator('#georgetown').click();
  await page.locator('.pin[data-id="fort"] .label-bg').tap();
  assert.match(await page.locator('#detail').innerText(),/Fort Cornwallis/);
  assert.deepEqual(errors,[]);await context.close();
});
test('mobile discovery retains visible map context and a readable selected landmark',async()=>{
  const {page,context,errors}=await setup({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await page.locator('[data-place="kho"]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'detail');
  assert.equal(await page.getByRole('region',{name:'Khoo Kongsi',exact:true}).count(),1);
  const pin=await page.locator('.pin[data-id="kho"] .pin-dot').boundingBox();
  const sheet=await page.locator('#detail').boundingBox();
  assert(pin.y>=0&&pin.y+pin.height<sheet.y,'selected map point must be visible above the attraction sheet');
  const artWidth=await page.locator('.landmark-art[data-art="kho"]>svg').evaluate(e=>Number(e.getAttribute('width'))*e.parentElement.getScreenCTM().a);
  assert(artWidth>=95&&artWidth<=130,'selected architectural detail should remain readable on the phone');
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'map');
  await page.setViewportSize({width:320,height:740});
  await page.locator('[data-place="fort"]').click();
  const smallPin=await page.locator('.pin[data-id="fort"] .pin-dot').boundingBox(),smallSheet=await page.locator('#detail').boundingBox();
  assert(smallPin.y>=0&&smallPin.y+smallPin.height<smallSheet.y);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=320));
  assert.deepEqual(errors,[]);await context.close();
});
