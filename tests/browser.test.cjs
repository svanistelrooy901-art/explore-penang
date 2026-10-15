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
  const context=await browser.newContext({viewport:{width:1440,height:1000},...options});
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
test('mobile: no horizontal overflow; filters, zoom, reset and drag preserve crossings',async()=>{
  const {page,context,errors}=await setup({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
  await page.getByRole('button',{name:'Nature',exact:true}).click();
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
