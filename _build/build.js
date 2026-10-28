// Ganaka build: node build.js  -> writes ./dist
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const SRC=path.join(__dirname,'src'),OUT=path.resolve(process.env.GANAKA_OUT||path.join(__dirname,'..'));
const BASE=process.env.GANAKA_BASE||'https://ganaka.eknathalabs.com';
globalThis.G=globalThis.G||{};
const FILES=['core','c-fin','c-biz','c-health','c-edu','c-math','c-date','c-conv','c-travel','c-tech','i18n'];
FILES.forEach(f=>require(path.join(SRC,f+'.js')));
const G=globalThis.G;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
fs.mkdirSync(OUT,{recursive:true});
// remove previously generated output only (never _build, assets, README, CNAME, LICENSE)
for(const e of fs.readdirSync(OUT,{withFileTypes:true})){const p=path.join(OUT,e.name);
 if(e.isDirectory()&&/^[a-z0-9-]+$/.test(e.name)&&e.name!=='assets'&&fs.readdirSync(p).join()==='index.html')fs.rmSync(p,{recursive:true});}
for(const f of ['index.html','404.html','app.js','app.css','sw.js','sitemap.xml','robots.txt','site.webmanifest','favicon.svg'])fs.rmSync(path.join(OUT,f),{force:true});
// bundle
const bundle=FILES.map(f=>fs.readFileSync(path.join(SRC,f+'.js'),'utf8')).concat(fs.readFileSync(path.join(SRC,'app.js'),'utf8')).join('\n;\n');
const css=fs.readFileSync(path.join(SRC,'app.css'),'utf8');
const ver=crypto.createHash('sha1').update(bundle+css).digest('hex').slice(0,10);
fs.writeFileSync(path.join(OUT,'app.js'),bundle);fs.writeFileSync(path.join(OUT,'app.css'),css);
const FONTS=path.join(OUT,'assets');if(!fs.existsSync(FONTS)){const alt=path.join(__dirname,'assets');if(fs.existsSync(alt))fs.cpSync(alt,FONTS,{recursive:true});else throw new Error('assets/fonts missing');}
const THEME="(function(){try{var t=localStorage.getItem('el-theme');if(t!=='light'&&t!=='dark'&&t!=='new')t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})()";
const catName=id=>G.CAT_EN[id];
function page({title,desc,url,body,ld,preload}){return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#1c1b4b">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="website"><meta property="og:site_name" content="Ganaka by EknathaLabs">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<script>${THEME}</script>
<link rel="preload" href="/assets/fonts/poppins-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/app.css?v=${ver}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<a class="skip" href="#app">Skip to content</a>
<header class="top" id="hdr"><div class="wrap bar"><a class="brand" href="/"><b><svg viewBox="14 14 36 36" width="22" height="22" aria-hidden="true"><path d="${G.MARK}" fill="currentColor"/></svg></b><span>Ganaka<small>EknathaLabs</small></span></a></div></header>
<main class="wrap" id="app" tabindex="-1">
${body}
<noscript><p class="note">Ganaka needs JavaScript to calculate. It runs entirely in your browser and sends nothing anywhere.</p></noscript>
</main>
<footer class="foot" id="ftr"><div class="wrap"><span>Part of EknathaLabs · <a href="https://eknathalabs.com/">eknathalabs.com</a></span></div></footer>
<div class="toast" id="toast" role="status" hidden></div>
<script src="/app.js?v=${ver}" defer></script>
</body>
</html>
`;}
// home
const homeDesc=`${G.CALCS.length} free calculators for finance, tax, health, education, math, dates, units, travel and DevOps. No sign-up, no ads, works offline.`;
const homeBody=`<section class="hero"><h1>Ganaka</h1><p class="lede">Free calculators for everyone. Works offline.</p></section>
<h2>All ${G.CALCS.length} calculators</h2>
${G.CATS.map(c=>`<section class="sec"><h2>${esc(catName(c.id))}</h2><ul>${G.CALCS.filter(x=>x.cat===c.id).map(x=>`<li><a href="/${x.id}/">${esc(x.name)}</a>: ${esc(x.desc)}</li>`).join('')}</ul></section>`).join('\n')}`;
fs.writeFileSync(path.join(OUT,'index.html'),page({title:'Ganaka: free calculators that work offline | EknathaLabs',desc:homeDesc,url:BASE+'/',body:homeBody,ld:{'@context':'https://schema.org','@type':'WebSite',name:'Ganaka',url:BASE+'/',description:homeDesc,publisher:{'@type':'Organization',name:'EknathaLabs',url:'https://eknathalabs.com/'},potentialAction:{'@type':'SearchAction',target:BASE+'/?q={q}','query-input':'required name=q'}}}));
fs.writeFileSync(path.join(OUT,'404.html'),fs.readFileSync(path.join(OUT,'index.html'),'utf8').replace('<link rel="canonical" href="'+BASE+'/">',''));
// calculators
G.CALCS.forEach(c=>{const url=`${BASE}/${c.id}/`;
 const inputs=c.fields.map(f=>`<li>${esc(f.label)}</li>`).join('');
 const body=`<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Ganaka</a> › <a href="/#${c.cat}">${esc(catName(c.cat))}</a></nav>
<h1>${esc(c.name)}</h1><p class="lede">${esc(c.desc)}</p>
<section><h2>Inputs</h2><ul>${inputs}</ul></section>
<section><h2>How it is calculated</h2><p class="formula">${esc(c.formula)}</p></section>`;
 const desc=`${c.desc} Free, no sign-up, works offline.`;
 const ld=[{'@context':'https://schema.org','@type':'WebApplication',name:c.name,url,description:c.desc,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},isPartOf:{'@type':'WebSite',name:'Ganaka',url:BASE+'/'},publisher:{'@type':'Organization',name:'EknathaLabs',url:'https://eknathalabs.com/'}},
  {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Ganaka',item:BASE+'/'},{'@type':'ListItem',position:2,name:catName(c.cat),item:BASE+'/#'+c.cat},{'@type':'ListItem',position:3,name:c.name,item:url}]}];
 fs.mkdirSync(path.join(OUT,c.id),{recursive:true});
 fs.writeFileSync(path.join(OUT,c.id,'index.html'),page({title:`${c.name} | Ganaka by EknathaLabs`,desc,url,body,ld}));
});
// sitemap, robots, manifest, icon, sw
fs.writeFileSync(path.join(OUT,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['',...G.CALCS.map(c=>c.id+'/')].map(p=>`<url><loc>${BASE}/${p}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT,'site.webmanifest'),JSON.stringify({name:'Ganaka',short_name:'Ganaka',description:'Free calculators that work offline',start_url:'/',scope:'/',display:'standalone',background_color:'#fff9ee',theme_color:'#1c1b4b',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]}));
fs.writeFileSync(path.join(OUT,'favicon.svg'),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1c1b4b"/><rect x="6" y="6" width="52" height="52" rx="10" fill="#ffb400"/><path d="${G.MARK}" fill="#1c1b4b"/></svg>\n`);
const pre=['/','/app.js?v='+ver,'/app.css?v='+ver,'/favicon.svg','/site.webmanifest',...G.CALCS.map(c=>'/'+c.id+'/'),...['poppins-latin-400-normal','poppins-latin-600-normal','poppins-latin-700-normal','poppins-latin-800-normal','jetbrains-mono-latin-400-normal'].map(f=>`/assets/fonts/${f}.woff2`)];
fs.writeFileSync(path.join(OUT,'sw.js'),`const V='ganaka-${ver}',PRE=${JSON.stringify(pre)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(PRE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('ganaka-')&&x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));}return res;}).catch(()=>caches.match('/'))));});
`);
// optional icons from main site
for(const f of ['icon-192.png','icon-512.png']){const p=path.join(__dirname,'icons',f);if(fs.existsSync(p))fs.copyFileSync(p,path.join(OUT,f));}
console.log('built',G.CALCS.length,'calculators, version',ver,'->',OUT);
