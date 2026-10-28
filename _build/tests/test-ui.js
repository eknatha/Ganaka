const {chromium}=require('playwright');
const G=require('../src/all.js');
const base='http://localhost:8765';
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m);}};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();
const errs=[],ext=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});p.on('request',r=>{if(!r.url().startsWith(base))ext.push(r.url());});
await p.goto(base+'/');await p.waitForSelector('.card');
ok(await p.locator('.card').count()>=100,'home cards');
ok((await p.textContent('h1'))==='Ganaka','h1');
// search
await p.fill('#qh','emi');await p.waitForSelector('#qh-l li');ok((await p.textContent('#qh-l li'))?.includes('EMI'),'search shows EMI');
await p.keyboard.press('Enter');await p.waitForURL('**/emi/');await p.waitForSelector('.hero-res');
let hero=await p.textContent('.hero-res .v');console.log('EMI hero',hero);ok(/22,493/.test(hero),'EMI hero');
// all calcs default render
let bad=[];
for(const c of G.CALCS){await p.goto(base+'/'+c.id+'/');await p.waitForSelector('#out > *',{timeout:5000}).catch(()=>{});const txt=await p.textContent('#out');const e=await p.locator('#out .err').count();
 if(e||/NaN|undefined|Infinity|\[object/.test(txt)||!txt.trim())bad.push([c.id,e?txt.slice(0,80):txt.match(/.{0,20}(NaN|undefined|Infinity|\[object).{0,20}/)?.[0]||'empty']);}
console.log('bad pages',bad);ok(!bad.length,'all calculators render');
// theme + lang
await p.goto(base+'/sip/');await p.waitForSelector('.hero-res');await p.click('.ibtn[aria-controls=setp]');await p.click('.seg button:nth-child(2)');ok(await p.getAttribute('html','data-theme')==='dark','dark theme');
await p.click('.seg button:nth-child(3)');ok(await p.getAttribute('html','data-theme')==='new','new theme');
await p.selectOption('#s-lang','te');ok(await p.getAttribute('html','lang')==='te','lang te');
ok((await p.textContent('h2#inh'))==='ఇన్‌పుట్‌లు','te inputs heading');
await p.click('.ibtn[aria-controls=setp]');await p.selectOption('#s-lang','en');
// favourite persists
await p.goto(base+'/bmi/');await p.click('.acts .abtn');await p.goto(base+'/');ok(await p.locator('text=Saved').count()>0,'saved section');
// url state
await p.goto(base+'/emi/?P=1000000&rate=8.5&n=20');await p.waitForSelector('.hero-res');hero=await p.textContent('.hero-res .v');ok(hero.replace(/[^\d.]/g,'')==='8678.23','EMI state from URL '+hero);
console.log('errors',errs,'external',ext);ok(!errs.length,'no console errors');ok(!ext.length,'no external requests');
console.log(fails?'FAILURES '+fails:'UI OK');await b.close();})();
