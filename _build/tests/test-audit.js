const {chromium}=require('playwright');const base='http://localhost:8765';let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m);}};
const lum=([r,g,b])=>{const f=x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const AUDIT=`(()=>{const out=[];const parse=s=>{const m=s.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;const p=m[1].split(',').map(Number);return {c:p.slice(0,3),a:p.length>3?p[3]:1}};
function bg(el){let layers=[];while(el){const cs=getComputedStyle(el);const p=parse(cs.backgroundColor);if(p&&p.a>0){layers.push(p);if(p.a>=1)break}el=el.parentElement}let base=[255,255,255];for(let i=layers.length-1;i>=0;i--){const l=layers[i];base=base.map((b,k)=>Math.round(l.c[k]*l.a+b*(1-l.a)))}return base}
const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const seen=new Set();let n;while(n=w.nextNode()){if(!n.textContent.trim())continue;const el=n.parentElement;if(seen.has(el))continue;seen.add(el);const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none')continue;const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;if(el.closest('[hidden]'))continue;const f=parse(cs.color);if(!f)continue;const b=bg(el);const fg=f.a<1?f.c.map((x,k)=>Math.round(x*f.a+b[k]*(1-f.a))):f.c;out.push({t:n.textContent.trim().slice(0,30),fg,bg:b,size:parseFloat(cs.fontSize),bold:parseInt(cs.fontWeight)>=700})}return out})()`;
(async()=>{const b=await chromium.launch();
const pages=['/','/emi/','/scientific/','/graph/','/invoice/','/income-tax-india/','/color/'];
for(const theme of ['light','dark','new'])for(const lang of ['en','ta','ml']){
 const ctx=await b.newContext({viewport:{width:1280,height:900}});await ctx.addInitScript(([t,l])=>{try{localStorage.setItem('el-theme',t);localStorage.setItem('ga-set',JSON.stringify({lang:l,fmt:'in',cur:'₹'}));}catch(e){}},[theme,lang]);
 const p=await ctx.newPage();let low=[];
 for(const w of [320,375,768,1100,1440]){await p.setViewportSize({width:w,height:900});
  for(const u of pages){await p.goto(base+u);await p.waitForSelector(u==='/'?'.card':'.hero-res');
   const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));if(o.sw>o.iw+1)ok(false,`overflow ${theme}/${lang} w${w} ${u} ${o.sw}>${o.iw}`);
   if(w===1100){const items=await p.evaluate(AUDIT);for(const it of items){const r=ratio(it.fg,it.bg),need=(it.size>=24||(it.size>=18.66&&it.bold))?3:4.5;if(r<need)low.push(`${u} "${it.t}" ${r.toFixed(2)}<${need} ${it.fg}/${it.bg}`);}}}}
 ok(!low.length,`contrast ${theme}/${lang}: `+[...new Set(low)].slice(0,6).join(' | '));await ctx.close();}
// keyboard + popover
{const ctx=await b.newContext({viewport:{width:1280,height:900}});const p=await ctx.newPage();await p.goto(base+'/sip/');await p.waitForSelector('.hero-res');
 await p.focus('.ibtn[aria-controls=setp]');await p.keyboard.press('Enter');ok(await p.isVisible('#setp'),'popover opens by keyboard');await p.keyboard.press('Escape');ok(!(await p.isVisible('#setp')),'Esc closes');ok(await p.evaluate(()=>document.activeElement.getAttribute('aria-controls'))==='setp','focus returns');
 await p.keyboard.press('/');ok(await p.evaluate(()=>document.activeElement.id)==='qs','slash focuses search');await p.keyboard.type('bmi');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await p.waitForURL('**/bmi/');ok(true,'search nav');
 // every input labelled
 const unl=await p.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].filter(e=>!(e.labels&&e.labels.length)&&!e.getAttribute('aria-label')).map(e=>e.id||e.name));ok(!unl.length,'unlabelled controls '+unl);
 await ctx.close();}
// fonts: en page loads no Indic font, te loads Telugu only
for(const [l,exp] of [['en',[]],['te',['telugu']],['hi',['devanagari']]]){const ctx=await b.newContext();await ctx.addInitScript(l=>{try{localStorage.setItem('ga-set',JSON.stringify({lang:l,fmt:'in',cur:'₹'}))}catch(e){}},l);const p=await ctx.newPage();const fonts=[];p.on('request',r=>{if(/\.woff2/.test(r.url()))fonts.push(r.url().split('/').pop())});await p.goto(base+'/');await p.waitForSelector('.card');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
 const indic=fonts.filter(f=>/noto/.test(f));ok(JSON.stringify(indic.map(f=>f.split('-')[2]).filter((v,i,a)=>a.indexOf(v)===i))===JSON.stringify(exp),`fonts ${l}: ${indic}`);await ctx.close();}
// offline
{const ctx=await b.newContext();const p=await ctx.newPage();await p.goto(base+'/');await p.waitForSelector('.card');await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForTimeout(1500);await ctx.setOffline(true);
 await p.goto(base+'/emi/');await p.waitForSelector('.hero-res',{timeout:5000}).catch(()=>{});ok(await p.locator('.hero-res').count()===1,'offline emi renders');
 await p.goto(base+'/cidr/?ip=192.168.0.1&p=24');await p.waitForSelector('.hero-res',{timeout:5000}).catch(()=>{});ok((await p.textContent('.hero-res .v')).includes('192.168.0.0/24'),'offline with query');await ctx.close();}
console.log(fails?'AUDIT FAILURES '+fails:'AUDIT OK');await b.close();})();
