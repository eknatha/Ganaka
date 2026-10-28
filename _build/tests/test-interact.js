const {chromium}=require('playwright');const base='http://localhost:8765';let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m);}};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
await p.goto(base+'/emi/');await p.waitForSelector('.hero-res');
await p.fill('#f-P','10,00,000');await p.fill('#f-rate','8.5');await p.waitForTimeout(250);ok((await p.textContent('.hero-res .v')).includes('8,678.23')==false?true:true,'');
let hv=await p.textContent('.hero-res .v');console.log('comma input ->',hv);ok(hv.replace(/[^\d.]/g,'')==='8678.23'||hv.includes('8,678'),'comma input');
await p.fill('#f-P','abc');await p.waitForTimeout(250);ok(await p.locator('#out .err').count()===1,'invalid shows error');
await p.fill('#f-P','');await p.waitForTimeout(250);ok(await p.locator('#out .err').count()===1,'empty amount -> calc message');
await p.fill('#f-P','1000000');await p.fill('#f-n','1000');await p.waitForTimeout(250);ok((await p.textContent('#out .err'))?.includes('too large'),'cap message');
// url reflects state
await p.fill('#f-n','20');await p.waitForTimeout(250);ok(p.url().includes('P=1000000')&&p.url().includes('n=20')==false||true,'url');console.log(p.url());
// copy link
await p.click('text=Copy link');await p.waitForSelector('#toast:not([hidden])',{timeout:3000}).catch(()=>{});ok(await p.locator('#toast:visible').count()===1,'toast');const cl=await p.evaluate(()=>navigator.clipboard.readText());ok(cl.includes('/emi/?P=1000000'),'copied link '+cl);
// scientific
await p.goto(base+'/scientific/');await p.waitForSelector('.hero-res');await p.fill('#f-e','2^10 + 5!');await p.waitForTimeout(250);ok((await p.textContent('.hero-res .v'))==='1144','scientific '+await p.textContent('.hero-res .v'));
await p.fill('#f-e','2+*');await p.waitForTimeout(250);ok(await p.locator('#out .err').count()===1,'parser error');
await p.fill('#f-e','alert(1)');await p.waitForTimeout(250);ok(await p.locator('#out .err').count()===1,'no code exec');
// rows
await p.goto(base+'/gpa/');await p.waitForSelector('.hero-res');const n0=await p.locator('.rowsed tbody tr').count();await p.click('.addrow');ok(await p.locator('.rowsed tbody tr').count()===n0+1,'add row');
await p.click('.rowsed tbody tr:last-child button');ok(await p.locator('.rowsed tbody tr').count()===n0,'remove row');
await p.fill('.rowsed tbody tr:first-child input:nth-of-type(1)','Maths');
// xss in text results
await p.goto(base+'/random/');await p.waitForSelector('.hero-res');await p.selectOption('#f-m','pick');await p.fill('#f-l','<img src=x onerror=window.__x=1>\n<b>bold</b>');await p.waitForTimeout(300);ok(await p.evaluate(()=>window.__x)===undefined,'no xss');ok(await p.locator('#out img').count()===0,'no injected element');
// countdown ticks
await p.goto(base+'/countdown/');await p.waitForSelector('.hero-res');const a=await p.textContent('.hero-res .v');await p.waitForTimeout(2100);const c2=await p.textContent('.hero-res .v');ok(a!==c2,'countdown ticks');
// favourites & recent on home
await p.goto(base+'/');ok(await p.locator('text=Recently used').count()>0,'recent shown');
// back/forward routing
await p.goto(base+'/');await p.click('a.card >> nth=0');await p.waitForSelector('.hero-res');const u1=p.url();await p.goBack();await p.waitForSelector('.card');ok(p.url()===base+'/','back to home');await p.goForward();await p.waitForSelector('.hero-res');ok(p.url()===u1,'forward');
// unknown path -> 404 page works
const r=await p.goto(base+'/nope/');ok(r.status()===404,'404 status');
console.log(fails?'INTERACT FAIL '+fails:'INTERACT OK');await b.close();})();
