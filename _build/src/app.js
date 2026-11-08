/* Ganaka UI. Plain JS, no dependencies, no network requests. */
(function(G){'use strict';
var $=function(s,r){return(r||document).querySelector(s);};
function h(tag,a,kids){var e=document.createElement(tag);if(a)for(var k in a){var v=a[k];if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v);}
 (kids||[]).forEach(function(c){if(c==null)return;e.appendChild(typeof c==='string'?document.createTextNode(c):c);});return e;}
var NS='http://www.w3.org/2000/svg';
function sv(tag,a,kids){var e=document.createElementNS(NS,tag);if(a)for(var k in a)if(a[k]!=null)e.setAttribute(k,a[k]);(kids||[]).forEach(function(c){if(c)e.appendChild(c);});return e;}
var store={get:function(k){try{return localStorage.getItem(k);}catch(e){return null;}},set:function(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
var POP=['emi','sip','income-tax-india','gst','bmi','age','percentage','unit-converter','scientific','gpa','cidr','uptime-sla'];
var ORIGIN='https://eknathalabs.com';
var LANGCODES=G.LANGS.map(function(l){return l[0];});
var INDIC={hi:1,te:1,kn:1,ta:1,ml:1};
var INDIA_ONLY={'income-tax-india':1,hra:1,gratuity:1,epf:1,nps:1,ppf:1};

// ---------- settings
var set=(function(){var s={};try{s=JSON.parse(store.get('ga-set')||'{}')||{};}catch(e){}
 var nl=(navigator.language||'en').toLowerCase(),sl=store.get('el-lang'),tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
 if(LANGCODES.indexOf(s.lang)<0){s.lang=LANGCODES.indexOf(sl)>=0?sl:(LANGCODES.indexOf(nl.slice(0,2))>=0?nl.slice(0,2):'en');}
 s.fu=!!s.fmt;s.cu=s.cur!=null; // fu/cu: the visitor chose these explicitly
 var inHint=!!(INDIC[s.lang]||/-in$/.test(nl)||/^Asia\/(Calcutta|Kolkata)$/.test(tz));
 if(!s.fmt)s.fmt=inHint?'in':'intl';
 if(s.cur==null)s.cur=inHint?'₹':'$';
 s.theme=document.documentElement.getAttribute('data-theme')||'light';
 s.motion=store.get('ga-motion')==='off'?'off':'auto';return s;})();
function save(){var o={lang:set.lang};if(set.fu)o.fmt=set.fmt;if(set.cu)o.cur=set.cur;store.set('ga-set',JSON.stringify(o));store.set('el-lang',set.lang);store.set('el-theme',set.theme);store.set('ga-motion',set.motion);}
function t(k,v){var s=(G.I18N[set.lang]||G.I18N.en)[k];if(s==null)s=G.I18N.en[k];if(s==null)s=k;if(v)for(var x in v)s=s.replace('{'+x+'}',v[x]);return s;}
function applyTheme(){document.documentElement.setAttribute('data-theme',set.theme);var m=$('meta[name=theme-color]');if(m)m.setAttribute('content',{light:'#1c1b4b',dark:'#1c1b4b',new:'#0b3d3a'}[set.theme]);}
function applyLang(){document.documentElement.lang=set.lang;}
function applyMotion(){document.documentElement.setAttribute('data-motion',set.motion);}
function reduced(){try{return set.motion==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}

// ---------- currency and number format (India-only tools default to rupees and lakh/crore unless the visitor chose otherwise)
var cur_c=null;
function indiaAuto(){return!!(cur_c&&INDIA_ONLY[cur_c.id]&&!set.cu);}
function curSym(){return indiaAuto()?'₹':set.cur;}
function fmtMode(){return indiaAuto()?'in':set.fmt;}
function nf(x,min,max){return new Intl.NumberFormat(fmtMode()==='in'?'en-IN':'en-US',{minimumFractionDigits:min,maximumFractionDigits:max}).format(x);}
function groupStr(s){var neg=s[0]==='-';if(neg)s=s.slice(1);var o;if(fmtMode()==='in'&&s.length>3){o=s.slice(-3);s=s.slice(0,-3);while(s.length>2){o=s.slice(-2)+','+o;s=s.slice(0,-2);}if(s)o=s+','+o;}else o=s.replace(/\B(?=(\d{3})+(?!\d))/g,',');return(neg?'-':'')+o;}
function fmt(r){var v=r.value,k=r.kind;if(typeof v==='string'&&k!=='bigint')return v;
 if(k==='bigint')return groupStr(String(v));
 if(typeof v!=='number'||!isFinite(v))return String(v);
 switch(k){case'cur':var ab=Math.round(Math.abs(v)*100)/100,ints=ab===Math.floor(ab);return(v<0&&ab>0?'-':'')+curSym()+nf(ab,ints?0:2,ints?0:2);case'pct':return nf(v,0,2)+'%';case'pct4':return nf(v,0,4)+'%';case'int':return nf(Math.round(v),0,0);case'x':return nf(v,0,2)+'×';case'kg':return nf(v,0,1)+' kg';case'deg':return nf(v,0,2)+'°';case'bits':return nf(v,0,1)+' bits';case'plain':return G.fmtPlain(v)+(r.unit?' '+r.unit:'');default:return nf(v,0,Math.abs(v)<1?6:4);}}
function F(kind,value){return fmt({value:value,kind:kind});}
function compact(x,kind){if(kind!=='cur')return nf(x,0,2);var a=Math.abs(x),s=x<0?'-':'',c=curSym(),d;
 if(fmtMode()==='in'){if(a>=1e7)return s+c+nf(a/1e7,0,a>=1e8?0:1)+' Cr';if(a>=1e5)return s+c+nf(a/1e5,0,a>=1e6?0:1)+' L';if(a>=1e3)return s+c+nf(a/1e3,0,a>=1e4?0:1)+'K';}
 else{if(a>=1e9)return s+c+nf(a/1e9,0,1)+'B';if(a>=1e6)return s+c+nf(a/1e6,0,a>=1e7?0:1)+'M';if(a>=1e3)return s+c+nf(a/1e3,0,a>=1e4?0:1)+'K';}
 return s+c+nf(a,0,a<10?2:0);}

// ---------- which fields are money, how big their defaults are, and slider ranges
// MONEY lists the fields that hold an amount of currency. BASE says whether a calculator's default
// amounts are on an Indian scale (default) or a US scale, so defaults can follow the chosen currency.
var MONEY={emi:['P'],'loan-prepay':['P','extra'],sip:['m'],'step-up-sip':['m'],'sip-goal':['goal'],lumpsum:['P'],'compound-interest':['P','add'],'simple-interest':['P'],fd:['P'],rd:['m'],ppf:['y'],mortgage:['price','ins'],'loan-eligibility':['inc','emi'],'cc-payoff':['b','pay'],'debt-snowball':['extra'],retirement:['exp','have'],fire:['exp','have','save'],budget:['inc','needs','save'],'income-tax-india':['gross','ded','other'],roi:['inv','fin'],cagr:['s','e'],inflation:['a'],epf:['basic'],nps:['m'],swp:['c','w'],'rent-vs-buy':['price','rent'],hra:['basic','hra','rent'],gratuity:['sal'],gst:['a'],discount:['p'],'profit-margin':['cost','price'],breakeven:['fc','vc','pr','tp'],salary:['a'],tip:['b'],commission:['s'],roas:['spend','rev'],'fuel-cost':['p'],mileage:['p'],'ev-charge':['p'],'fuel-vs-ev':['pp','ep']};
var BASE={mortgage:'intl'};
var MULT={'₹':50,'$':1,'€':1,'£':1,'AED ':4,'¥':150};
function isMoney(c,f){var m=MONEY[c.id];return!!(m&&m.indexOf(f.id)>=0);}
function nice(x){if(!isFinite(x)||x<=0)return x;var p=Math.pow(10,Math.floor(Math.log10(x))-1);return Math.round(x/p)*p;}
function factor(c){var s=curSym();if(!MULT[s])return 1;return(BASE[c.id]==='intl'?1:1/50)*MULT[s];}
function scaled(c,f,x){if(!isMoney(c,f)||typeof x!=='number')return x;var k=factor(c);return k===1?x:nice(x*k);}
function defOf(c,f){return f.t==='rows'?f.def.map(function(r){return r.map(String);}):f.t==='c'?(f.def?'1':'0'):String(f.def==null?'':(f.t==='n'?scaled(c,f,f.def):f.def));}
function scaleActive(c){return(MONEY[c.id]||[]).length>0&&factor(c)!==1;}
var SL={emi:{P:[1e5,2e7,1e5],rate:[1,20,.1],n:{by:'u',y:[1,40,1],m:[6,480,6]}},'loan-prepay':{P:[1e5,2e7,1e5],rate:[1,20,.1],yrs:[1,40,1],extra:[0,5e4,500]},
 sip:{m:[500,2e5,500],rate:[1,30,.5],yrs:[1,40,1]},'step-up-sip':{m:[500,2e5,500],step:[0,30,1],rate:[1,30,.5],yrs:[1,40,1]},'sip-goal':{goal:[1e5,1e8,1e5],rate:[1,30,.5],yrs:[1,40,1]},
 lumpsum:{P:[1e4,1e7,1e4],rate:[1,30,.5],yrs:[1,40,1]},'compound-interest':{P:[1e3,1e7,1e3],add:[0,1e5,500],rate:[.5,20,.1],yrs:[1,50,1]},'simple-interest':{P:[1e3,1e7,1e3],rate:[1,30,.5],t:[1,30,1]},
 fd:{P:[1e4,1e7,1e4],rate:[1,12,.05],yrs:[1,20,1]},rd:{m:[500,1e5,500],rate:[1,12,.05],mo:[6,120,1]},ppf:{y:[500,15e4,500],rate:[5,10,.1],yrs:[15,50,1]},
 mortgage:{price:[5e4,2e6,5e3],down:[0,90,1],rate:[1,12,.05],yrs:[5,40,1],tax:[0,3,.05],ins:[0,1e4,100]},'loan-eligibility':{inc:[1e4,1e6,5e3],emi:[0,5e5,1e3],foir:[10,80,1],rate:[1,20,.1],yrs:[1,40,1]},
 'cc-payoff':{b:[5e3,2e6,5e3],apr:[5,60,.5],pay:[500,2e5,500]},retirement:{age:[18,70,1],ret:[40,75,1],life:[60,100,1],exp:[5e3,5e5,1e3],inf:[2,12,.5],pre:[4,20,.5],post:[3,14,.5],have:[0,5e7,1e5]},
 swp:{c:[1e5,1e8,1e5],w:[1e3,5e5,1e3],rate:[2,15,.5],step:[0,15,.5]},cagr:{s:[1e3,1e7,1e3],e:[1e3,1e7,1e3],y:[1,40,1]},roi:{inv:[1e3,1e7,1e3],fin:[1e3,1e7,1e3],yrs:[1,40,1]},inflation:{a:[1e3,1e7,1e3],r:[1,15,.5],y:[1,40,1]},
 bmi:{kg:[30,200,.5],cm:[100,220,1]},bmr:{age:[15,90,1],kg:[30,200,.5],cm:[100,220,1]},tdee:{age:[15,90,1],kg:[30,200,.5],cm:[100,220,1]},'ideal-weight':{cm:[100,220,1]},
 gst:{a:[100,1e6,100],r:[0,40,.5]},tip:{b:[100,1e5,50],p:[0,30,1]},'fuel-cost':{d:[10,3000,10],m:[5,40,.5],p:[50,200,1]}};
function slideCfg(c,f,vs){var cfg=SL[c.id]&&SL[c.id][f.id];if(!cfg)return null;var a=cfg;if(!Array.isArray(cfg)){a=cfg[vs[cfg.by]];if(!a)return null;}
 var k=isMoney(c,f)?factor(c):1;if(k===1)return a;var mn=nice(a[0]*k),mx=nice(a[1]*k),st=nice(a[2]*k);if(mn===0&&a[0]!==0)mn=0;return[a[0]===0?0:mn,mx,st>0?st:a[2]];}
// adornments inside the input box
var UNITMAP={'km per litre':'km/l','% per year':'%','% per month':'%'};
function unitOf(f){var l=f.label,m=/\(([^)]*)\)/.exec(l);if(m){var x=m[1].trim();if(/^%/.test(x))return'%';if(/^years?$/i.test(x)||/^yrs?$/i.test(x))return'yrs';if(/^months?$/i.test(x))return'mo';if(UNITMAP[x])return UNITMAP[x];if(x.length<=6&&!/\d/.test(x))return x;return'';}
 if(/\bage\b/i.test(l))return'yrs';if(/^years?$/i.test(l))return'yrs';return'';}
function groupable(c,f){if(f.t!=='n')return false;if(isMoney(c,f))return true;var d=Math.abs(+f.def);return d>=10000&&!unitOf(f);}

// ---------- URL state (scenario A uses plain ids, scenario B uses a "b." prefix)
function parseNum(s){s=String(s).replace(/[,\s_]/g,'');if(s==='')return 0;if(!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s))return NaN;return parseFloat(s);}
function stateFromUrl(c,pre){var q=new URLSearchParams(location.search),o={};c.fields.forEach(function(f){var x=q.get(pre+f.id);if(x==null)return;if(f.t==='rows'){try{var a=JSON.parse(x);if(Array.isArray(a))o[f.id]=a;}catch(e){}}else o[f.id]=x;});return o;}
function queryOf(c,vs,pre,all){var q=new URLSearchParams();c.fields.forEach(function(f){var d=defOf(c,f),v=vs[f.id];if(all||JSON.stringify(v)!==JSON.stringify(d))q.set(pre+f.id,f.t==='rows'?JSON.stringify(v):v);});return q;}

// ---------- small helpers
var app,timer=null,toastT=null,srT=null,vtPending=false;
function toast(m){var e=$('#toast');e.textContent=m;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){e.hidden=true;},1800);}
function announce(m){var e=$('#sr');if(!e)return;clearTimeout(srT);srT=setTimeout(function(){e.textContent='';e.textContent=m;},500);}
function copy(text,msg){function ok(){toast(msg);}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(ok,fb);}else fb();function fb(){var a=h('textarea',{style:'position:fixed;left:-999px'});a.value=text;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok();}catch(e){}a.remove();}}
function mark(){var s=sv('svg',{viewBox:'14 14 36 36',width:22,height:22,'aria-hidden':'true'});s.appendChild(sv('path',{d:G.MARK,fill:'currentColor'}));return s;}
function icon(d,size){var s=sv('svg',{viewBox:'0 0 24 24',width:size||22,height:size||22,fill:'none',stroke:'currentColor','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'});s.appendChild(sv('path',{d:d}));return s;}
var IC={fin:'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',biz:'M3 8h18v11H3zM9 8V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5V8M3 13h18',health:'M12 20.5S4 15.8 4 10a4.2 4.2 0 018-1.8A4.2 4.2 0 0120 10c0 5.8-8 10.5-8 10.5z',edu:'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5',math:'M4 7h6M7 4v6M14 7h6M4 18h6M14.5 15.5l5 5M19.5 15.5l-5 5',date:'M4 6h16v14H4zM4 10.5h16M8 3.5v4M16 3.5v4',conv:'M4 8h13l-3-3M20 16H7l3 3',travel:'M12 21s-6.5-5.5-6.5-10.5a6.5 6.5 0 0113 0C18.5 15.5 12 21 12 21zM12 8.2a2.3 2.3 0 100 4.6 2.3 2.3 0 000-4.6z',tech:'M3.5 5h17v14h-17zM7.5 10l3 2-3 2M12.5 14.5h4'};
var trend='M3 17l6-6 4 4 8-8M15 7h6v6',home='M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5',pct='M7.5 5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM16.5 14a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM18 5L6 19',receipt='M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',person='M12 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM6.5 20v-2.5a5.5 5.5 0 0111 0V20',pulse='M3 12h4l2.5-6 4 12 2.5-6H21',clock='M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 7.5V12l3 2',pump='M6 20V5a1 1 0 011-1h6a1 1 0 011 1v15M4 20h12M7 8h6M14 9h2.5a1.5 1.5 0 011.5 1.5V16a1.5 1.5 0 003 0V9l-3-3',coin='M12 4a8 8 0 100 16 8 8 0 000-16zM9.5 10.5a2.5 2.5 0 012.5-2h.5a2 2 0 010 4h-1a2 2 0 000 4h.5a2.5 2.5 0 002.5-2',target='M12 3a9 9 0 100 18 9 9 0 000-18zM12 7a5 5 0 100 10 5 5 0 000-10zM12 11a1 1 0 100 2 1 1 0 000-2z',calc='M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01',lock='M7 11V8a5 5 0 0110 0v3M5 11h14v9H5z',net='M12 4.5a2 2 0 100 4 2 2 0 000-4zM5 15.5a2 2 0 100 4 2 2 0 000-4zM19 15.5a2 2 0 100 4 2 2 0 000-4zM12 8.5v3.5M12 12L6 15.5M12 12l6 3.5',drop='M12 3.5s6 6.2 6 10.5a6 6 0 01-12 0c0-4.300 6-10.500 6-10.500z',sun='M12 8a4 4 0 100 8 4 4 0 000-8zM12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.2 5.2l1.8 1.8M17 17l1.8 1.8M18.8 5.2L17 7M7 17l-1.8 1.8',wallet='M4 7h15a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1zM4 7l12-3v3M16 13h.01',dice='M4 4h16v16H4zM8.500 8.500h.01M15.500 8.500h.01M12 12h.01M8.500 15.500h.01M15.500 15.500h.01',ichart='M4 20V4M4 20h16M7 15l4-5 3 3 5-7';
var ICC={emi:IC.fin,'loan-prepay':home,mortgage:home,'rent-vs-buy':home,'loan-eligibility':home,sip:trend,'step-up-sip':trend,lumpsum:coin,'compound-interest':trend,cagr:trend,roi:trend,'sip-goal':target,fire:target,retirement:target,gst:pct,percentage:pct,discount:pct,'income-tax-india':receipt,hra:receipt,gratuity:receipt,salary:wallet,bmi:person,bmr:person,tdee:person,'ideal-weight':person,'body-fat':person,whr:person,'waist-height':person,water:drop,'heat-index':sun,'hr-zones':pulse,'uptime-sla':pulse,'error-budget':pulse,'composite-sla':pulse,'password-entropy':lock,cidr:net,'subnet-split':net,cron:clock,countdown:clock,'time-duration':clock,age:clock,'date-difference':clock,scientific:calc,calculator:calc,'unit-converter':IC.conv,'fuel-cost':pump,mileage:pump,'fuel-vs-ev':pump,random:dice,graph:ichart,statistics:ichart};
function badge(c){var cat=G.CATS.filter(function(x){return x.id===c.cat;})[0];return h('span',{class:'ab','aria-hidden':'true',style:'--c1:'+cat.color},[icon(ICC[c.id]||IC[c.cat],22)]);}
function catName(id){return t('cat_'+id);}
function href(c){return '/'+c.id+'/';}
function pathId(){return location.pathname.replace(/index\.html$/,'').replace(/^\/+|\/+$/g,'');}
function focusMain(){try{app.focus({preventScroll:true});}catch(e){}}
function go(url,from){
 function run(){history.pushState(null,'',url);route();window.scrollTo(0,0);focusMain();if(vtPending){var b=$('h1 .ab');if(b)b.style.viewTransitionName='abx';}}
 var vb=from&&from.querySelector&&from.querySelector('.ab');
 if(document.startViewTransition&&!reduced()&&vb){try{vtPending=true;vb.style.viewTransitionName='abx';var vt=document.startViewTransition(run);vt.finished.then(done,done);return;}catch(e){}}
 run();function done(){vtPending=false;var b=$('h1 .ab');if(b)b.style.viewTransitionName='';}}
function card(c){return h('a',{class:'card',href:href(c),'data-nav':'1'},[h('div',{class:'row'},[badge(c),h('h3',{text:c.name})]),h('p',{text:c.desc}),h('span',{class:'go','aria-hidden':'true',text:'→'})]);}
function lists(){var f=[],r=[];try{f=JSON.parse(store.get('ga-fav')||'[]');r=JSON.parse(store.get('ga-rec')||'[]');}catch(e){}return{fav:f.filter(function(i){return G.byId[i];}),rec:r.filter(function(i){return G.byId[i];})};}
function setList(k,a){store.set(k,JSON.stringify(a));}
function scnAll(){try{return JSON.parse(store.get('ga-scn')||'{}')||{};}catch(e){return{};}}
function scnSet(o){store.set('ga-scn',JSON.stringify(o));}
// cards fade in as they scroll into view (skipped for reduced motion)
var IO=null;
function reveal(host){if(reduced()||!('IntersectionObserver' in window))return;var cards=[].slice.call(host.querySelectorAll('.card'));if(!IO)IO=new IntersectionObserver(function(es){var i=0;es.filter(function(e){return e.isIntersecting;}).sort(function(a,b){return a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left;}).forEach(function(e){var el=e.target;IO.unobserve(el);el.style.setProperty('--d',Math.min(i++,7)*40+'ms');el.classList.add('in');setTimeout(function(){el.classList.remove('pre','in');el.style.removeProperty('--d');},800);});},{rootMargin:'0px 0px -6% 0px'});
 cards.forEach(function(c){c.classList.add('pre');IO.observe(c);});}

// ---------- sliders
function pctOf(r){var mn=+r.min,mx=+r.max,v=+r.value;return mx>mn?Math.max(0,Math.min(100,(v-mn)/(mx-mn)*100)):0;}
function paintRange(r){r.style.setProperty('--p',pctOf(r)+'%');}
function decs(step){var s=String(step),i=s.indexOf('.');return i<0?0:s.length-i-1;}

// ---------- search (combobox with highlighted matches)
function score(c,q){var n=c.name.toLowerCase(),d=c.desc.toLowerCase(),k=c.keywords.toLowerCase(),cn=catName(c.cat).toLowerCase(),s=0;q.split(/\s+/).forEach(function(w){if(!w)return;var x=0;if(n.indexOf(w)===0)x=100;else if(n.indexOf(' '+w)>=0)x=80;else if(n.indexOf(w)>=0)x=60;else if(c.id.indexOf(w)>=0)x=55;else if(k.indexOf(w)>=0)x=40;else if(d.indexOf(w)>=0)x=20;else if(cn.indexOf(w)>=0)x=10;s=x?s+x:-1000;});return s;}
function search(q){q=q.trim().toLowerCase();if(!q)return[];return G.CALCS.map(function(c){return[score(c,q),c];}).filter(function(x){return x[0]>0;}).sort(function(a,b){return b[0]-a[0];}).slice(0,8).map(function(x){return x[1];});}
function hl(text,q){var ws=q.trim().toLowerCase().split(/\s+/).filter(Boolean).map(function(w){return w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');});if(!ws.length)return[document.createTextNode(text)];var re=new RegExp('('+ws.join('|')+')','ig'),out=[],last=0,m;while((m=re.exec(text))){if(m.index>last)out.push(document.createTextNode(text.slice(last,m.index)));out.push(h('mark',{text:m[0]}));last=m.index+m[0].length;if(m[0].length===0)re.lastIndex++;}if(last<text.length)out.push(document.createTextNode(text.slice(last)));return out;}
function mountSearch(box,idp){var inp=h('input',{type:'search',id:idp,placeholder:t('ph'),'aria-label':t('ph'),autocomplete:'off',role:'combobox','aria-expanded':'false','aria-controls':idp+'-l','aria-autocomplete':'list',enterkeyhint:'search'}),ul=h('ul',{class:'sug',id:idp+'-l',role:'listbox',hidden:true}),idx=-1,items=[];
 var hint=h('div',{class:'sug-hint','aria-hidden':'true',hidden:true},[h('span',null,[h('kbd',{text:'↑'}),h('kbd',{text:'↓'}),' '+t('kNav')]),h('span',null,[h('kbd',{text:'Enter'}),' '+t('kOpen')]),h('span',null,[h('kbd',{text:'Esc'}),' '+t('kClose')])]);
 var slash=h('kbd',{class:'slash','aria-hidden':'true',text:'/'});
 function close(){ul.hidden=true;hint.hidden=true;inp.setAttribute('aria-expanded','false');idx=-1;inp.removeAttribute('aria-activedescendant');}
 function paint(){ul.textContent='';slash.hidden=!!inp.value;items=search(inp.value);if(!items.length){if(inp.value.trim()){ul.appendChild(h('li',{class:'empty',role:'option','aria-disabled':'true',text:t('none')}));ul.hidden=false;hint.hidden=true;inp.setAttribute('aria-expanded','true');}else close();return;}
  items.forEach(function(c,i){var li=h('li',{role:'option',id:idp+'-o'+i,'aria-selected':'false'},[badge(c),h('div',null,[h('span',null,hl(c.name,inp.value)),h('small',{text:catName(c.cat)})])]);li.addEventListener('mousedown',function(e){e.preventDefault();pick(c);});ul.appendChild(li);});ul.hidden=false;hint.hidden=false;inp.setAttribute('aria-expanded','true');idx=-1;}
 function sel(){[].forEach.call(ul.children,function(li,i){li.setAttribute('aria-selected',i===idx?'true':'false');});if(idx>=0)inp.setAttribute('aria-activedescendant',idp+'-o'+idx);else inp.removeAttribute('aria-activedescendant');}
 function pick(c){close();inp.value='';slash.hidden=false;go(href(c));}
 inp.addEventListener('input',paint);inp.addEventListener('focus',function(){slash.hidden=true;if(inp.value)paint();});inp.addEventListener('blur',function(){slash.hidden=!!inp.value;setTimeout(close,120);});
 inp.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();if(ul.hidden)paint();idx=Math.min(items.length-1,idx+1);sel();}else if(e.key==='ArrowUp'){e.preventDefault();idx=Math.max(0,idx-1);sel();}else if(e.key==='Enter'){var c=items[idx>=0?idx:0];if(c){e.preventDefault();pick(c);}}else if(e.key==='Escape'){close();}});
 box.appendChild(inp);box.appendChild(slash);box.appendChild(ul);box.appendChild(hint);return inp;}

// ---------- count-up
var tw=null;
function tweenText(el,from,to,r){cancelAnimationFrame(tw);var D=260,t0=performance.now(),rnd=r.kind==='cur'||r.kind==='int';
 function make(x){return fmt({value:rnd?Math.round(x):x,kind:r.kind,unit:r.unit});}
 function step(now){var k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,3);if(k<1){el.textContent=make(from+(to-from)*e);tw=requestAnimationFrame(step);}else el.textContent=fmt(r);}
 tw=requestAnimationFrame(step);}

// ---------- home
function showHome(){cur_c=null;clearInterval(timer);cancelAnimationFrame(tw);document.title='Ganaka: free calculators that work offline | EknathaLabs';setMeta('Over 100 free calculators for finance, tax, health, education, math, dates, units, travel and DevOps. No sign-up, no ads, works offline.');
 app.textContent='';var L=lists(),active=store.get('ga-cat')||'all';
 var hq=h('div',{class:'hero-q'});
 var copyCol=h('div',{class:'hero-copy'},[h('h1',{text:'Ganaka'}),h('p',{class:'lede',text:t('tag')}),h('p',{class:'lede sub',text:t('sub',{n:G.CALCS.length,c:G.CATS.length})}),hq]);
 app.appendChild(h('section',{class:'hero'},[copyCol,miniEmi()]));
 mountSearch(hq,'qh');
 app.appendChild(h('ul',{class:'trust'},[['lock',t('tr1')],['x',t('tr2')],['dev',t('tr3')],['off',t('tr4')]].map(function(x){var d={lock:'M7 11V8a5 5 0 0110 0v3M5 11h14v9H5z',x:'M5 5l14 14M19 5L5 19',dev:'M9 3h6a1 1 0 011 1v16a1 1 0 01-1 1H9a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2',off:'M3 12h4l2-5 4 10 2-5h6'}[x[0]];return h('li',null,[icon(d,18),h('span',{text:x[1]})]);})));
 var chips=h('div',{class:'chips',role:'group','aria-label':t('all')}),host=h('div');
 app.appendChild(h('div',{class:'chipbar'},[chips]));app.appendChild(host);
 function section(title,list,count){if(!list.length)return;host.appendChild(h('section',{class:'sec'},[h('h2',null,[title,count?h('span',{text:count}):null]),h('div',{class:'grid'},list.map(card))]));}
 function draw(){chips.textContent='';[['all',t('all')]].concat(G.CATS.map(function(c){return[c.id,catName(c.id)];})).forEach(function(x){chips.appendChild(h('button',{class:'chip',type:'button','aria-pressed':String(active===x[0]),text:x[1],onclick:function(){active=x[0];store.set('ga-cat',active);draw();}}));});
  host.textContent='';
  if(active==='all'){section(t('favs'),L.fav.map(function(i){return G.byId[i];}));section(t('recent'),L.rec.slice(0,4).map(function(i){return G.byId[i];}));section(t('popular'),POP.map(function(i){return G.byId[i];}));}
  G.CATS.forEach(function(cat){if(active!=='all'&&active!==cat.id)return;var l=G.CALCS.filter(function(c){return c.cat===cat.id;});section(catName(cat.id),l,l.length);});
  reveal(host);}
 draw();
 app.appendChild(h('p',{class:'note',text:(set.lang==='en'?'':t('englishNote')+' ')+t('offline')}));}

// live mini demo: the real EMI calculator on the home page
function miniEmi(){var c=G.byId.emi,pf=c.fields[0],k=factor(c);
 function sc(x){return k===1?x:nice(x*k);}
 var st={P:sc(2500000),rate:9,n:20},cfgP=SL.emi.P,mn=sc(cfgP[0]),mx=sc(cfgP[1]),stp=k===1?cfgP[2]:nice(cfgP[2]*k);
 var out=h('div',{class:'big',text:''}),sub=h('div',{class:'sub',text:''}),open=h('a',{class:'go2',href:'/emi/','data-nav':'1',text:t('openFull')}),last=null;
 function row(label,min,max,step,key,show){var o=h('output',{text:''}),r=h('input',{type:'range',class:'rng',min:min,max:max,step:step,value:st[key],'aria-label':label}),id='mq-'+key;r.id=id;
  function upd(){st[key]=+r.value;o.textContent=show(st[key]);paintRange(r);r.setAttribute('aria-valuetext',o.textContent);calc();}
  r.addEventListener('input',upd);o.textContent=show(st[key]);paintRange(r);return h('div',{class:'mrow'},[h('label',{for:id},[h('span',{text:label}),o]),r]);}
 function calc(){var res;try{res=c.calc({P:st.P,rate:st.rate,n:st.n,u:'y'});}catch(e){return;}var e=res.res[0],tot=res.res[2].value;
  var q=new URLSearchParams({P:st.P,rate:st.rate,n:st.n});open.setAttribute('href','/emi/?'+q.toString());
  if(last!=null&&!reduced())tweenText(out,last,e.value,e);else out.textContent=fmt(e);last=e.value;
  sub.textContent=t('total')+': '+F('cur',tot)+' · '+t('interest')+': '+F('cur',res.res[1].value);}
 var w=h('aside',{class:'demo','aria-label':t('quickEmi')},[h('div',{class:'demo-h'},[h('span',{class:'pill',text:t('tryIt')}),h('strong',{text:t('quickEmi')})]),
  row(pf.label,mn,mx,stp,'P',function(x){return curSym()+nf(x,0,0);}),row('Interest rate (% per year)',5,18,.1,'rate',function(x){return nf(x,0,1)+'%';}),row('Tenure (years)',1,30,1,'n',function(x){return x+' yrs';}),
  h('div',{class:'demo-r','aria-live':'off'},[h('div',{class:'l',text:t('monthlyEmi')}),out,sub]),open]);
 calc();return w;}

// ---------- calculator page
function setMeta(d){var m=$('meta[name=description]');if(m)m.setAttribute('content',d);}
function friendly(e,c){var m=e&&e.message||'';
 if(/^Unexpected end/.test(m))return t('exEnd');if(/^Missing \)/.test(m))return t('exParen');var u=/^Unknown "(.+)"$/.exec(m);if(u)return t('exUnknown',{x:u[1]});var o=/^Unexpected "(.+)"$/.exec(m);if(o)return t('exOp',{x:o[1]});
 if(e&&e.user){var mm=/^Enter a valid (\S+)$/.exec(m);if(mm){var f=c.fields.filter(function(x){return x.id===mm[1];})[0];return f?t('errNeg',{f:f.label}):m;}return m;}
 return t('errGeneric');}
function hints(c,v){var out=[];c.fields.forEach(function(f){if(f.t!=='n')return;var x=v[f.id];if(!isFinite(x))return;var l=f.label,u=unitOf(f);
  if(u==='%'&&/rate|interest|apr|return/i.test(l)&&x>40)out.push(t('hHigh',{f:l.replace(/\s*\(.*\)/,''),x:nf(x,0,2),y:nf(x/10,0,2)}));
  else if(/\bage\b/i.test(l)&&x>120)out.push(t('hAge',{f:l,x:nf(x,0,0)}));
  else if(u==='yrs'&&/tenure|period|term/i.test(l)&&x>60)out.push(t('hLong',{f:l.replace(/\s*\(.*\)/,''),x:nf(x,0,0)}));});return out;}
function exampleFor(c){if(c.live||/^(random|countdown|unix-time)$/.test(c.id))return null;var vs={};c.fields.forEach(function(f){vs[f.id]=defOf(c,f);});var v={};c.fields.forEach(function(f){var x=vs[f.id];v[f.id]=f.t==='n'?parseNum(x):f.t==='c'?x==='1':f.t==='s'?(function(){var o=f.opts.filter(function(o){return String(o[0])===String(x);})[0];return o?o[0]:x;})():x;});
 var o;try{o=c.calc(v);}catch(e){return null;}if(!o||!o.res||!o.res.length)return null;var hero=o.res.filter(function(r){return r.hero;})[0]||o.res[0];
 var parts=[];c.fields.forEach(function(f){if(parts.length>=5)return;if(f.t==='n'){var x=parseNum(vs[f.id]),u=unitOf(f),s=groupable(c,f)?groupStr(String(Math.abs(x)))+'':String(x);if(x<0)s='-'+s;parts.push(f.label.replace(/\s*\(.*\)/,'')+' '+(isMoney(c,f)?curSym():'')+s+(u&&u!=='%'?' '+u:u==='%'?'%':''));}else if(f.t==='s'){var op=f.opts.filter(function(o){return String(o[0])===String(vs[f.id]);})[0];if(op)parts.push(f.label+': '+op[1]);}else if(f.t==='d'&&vs[f.id])parts.push(f.label+' '+vs[f.id]);});
 return{inputs:parts.join(', '),label:hero.label,value:fmt(hero)};}
function showCalc(c){cur_c=c;clearInterval(timer);cancelAnimationFrame(tw);document.title=c.name+' | Ganaka by EknathaLabs';setMeta(c.desc+' Free, no sign-up, works offline.');
 var rec=lists().rec.filter(function(i){return i!==c.id;});rec.unshift(c.id);setList('ga-rec',rec.slice(0,12));
 app.textContent='';
 var usp=new URLSearchParams(location.search),cmp=usp.get('cmp')==='1',init=stateFromUrl(c,''),initB=stateFromUrl(c,'b.'),vals={},valsB={},elsA={},elsB={},lastHero=null,lastText='';
 c.fields.forEach(function(f){vals[f.id]=init[f.id]!=null?init[f.id]:defOf(c,f);valsB[f.id]=initB[f.id]!=null?initB[f.id]:defOf(c,f);});
 var out=h('div',{id:'out'}),timerRun;function later(){clearTimeout(timerRun);timerRun=setTimeout(run,90);}


 // ----- one input field (text box with unit adornments, optional slider, live digit grouping)
 function fieldEl(f,vs,els,pre){var wrap=h('div',{class:'fld'}),id='f-'+pre+f.id,el;
  if(f.t==='c'){el=h('input',{type:'checkbox',id:id});el.checked=vs[f.id]==='1';el.addEventListener('change',function(){vs[f.id]=el.checked?'1':'0';later();});wrap.appendChild(h('div',{class:'chk'},[el,h('label',{for:id,text:f.label})]));els[f.id]=el;return wrap;}
  if(f.t==='rows'){var tb=h('table',{class:'rowsed'}),body=h('tbody');tb.appendChild(h('thead',null,[h('tr',null,f.cols.map(function(x){return h('th',{scope:'col',text:x});}).concat([h('th',{class:'sr',text:'Remove'})]))]));tb.appendChild(body);
   function draw(){body.textContent='';vs[f.id].forEach(function(r,i){body.appendChild(h('tr',null,f.cols.map(function(cn,j){var inp=h('input',{value:r[j],'aria-label':cn+' '+(i+1),type:'text',inputmode:j===0?'text':'decimal'});inp.addEventListener('input',function(){r[j]=inp.value;later();});return h('td',null,[inp]);}).concat([h('td',null,[h('button',{type:'button','aria-label':'Remove row '+(i+1),text:'×',onclick:function(){vs[f.id].splice(i,1);draw();later();}})])])));});}
   draw();wrap.appendChild(h('div',{class:'lbl',text:f.label}));wrap.appendChild(tb);wrap.appendChild(h('button',{type:'button',class:'abtn addrow',text:'+ '+t('addRow'),onclick:function(){vs[f.id].push(f.cols.map(function(){return'';}));draw();later();}}));els[f.id]=tb;return wrap;}
  if(f.t==='s'){el=h('select',{id:id},f.opts.map(function(o){return h('option',{value:String(o[0]),text:o[1]});}));el.value=vs[f.id];if(el.value!==vs[f.id]){el.selectedIndex=0;vs[f.id]=el.value;}
   var onSel=function(){vs[f.id]=el.value;refreshSliders(vs);later();};el.addEventListener('input',onSel);el.addEventListener('change',onSel);wrap.appendChild(h('label',{for:id,text:f.label}));wrap.appendChild(el);els[f.id]=el;return wrap;}
  if(f.t==='ta'){el=h('textarea',{id:id,rows:4,spellcheck:'false'});el.value=vs[f.id];}
  else if(f.t==='d'){el=h('input',{id:id,type:'date'});el.value=vs[f.id];}
  else if(f.t==='dt'){el=h('input',{id:id,type:'datetime-local'});el.value=vs[f.id];}
  else{el=h('input',{id:id,type:'text',inputmode:f.t==='n'?'decimal':'text',autocomplete:'off',spellcheck:'false',autocapitalize:'off'});el.value=vs[f.id];}
  wrap.appendChild(h('label',{for:id,text:f.label}));
  if(f.t==='n'){var money=isMoney(c,f),grp=groupable(c,f),u=unitOf(f),box=h('div',{class:'inp'+(money?' has-pre':'')+(u?' has-suf':'')}),rng=null;
   if(money)box.appendChild(h('span',{class:'pre','aria-hidden':'true',text:curSym().trim()}));
   box.appendChild(el);if(u)box.appendChild(h('span',{class:'suf','aria-hidden':'true',text:u}));wrap.appendChild(box);
   if(grp)el.value=groupStr0(vs[f.id]);
   var sc=slideCfg(c,f,vs);
   if(sc){rng=h('input',{type:'range',class:'rng',min:sc[0],max:sc[1],step:sc[2],'aria-label':f.label+' '+t('slider')});wrap.appendChild(rng);
    rng.addEventListener('input',function(){var d=decs(rng.step),x=(+rng.value).toFixed(d);x=String(parseFloat(x));vs[f.id]=x;el.value=grp?groupStr0(x):x;paintRange(rng);rng.setAttribute('aria-valuetext',el.value+(u?' '+u:''));later();});
    rng._f=f;rng._pre=pre;sliderRefs.push({rng:rng,f:f,vs:vs,el:el});syncRng(rng,vs[f.id]);}
   el.addEventListener('input',function(){var raw=el.value;if(grp)raw=regroup(el);vs[f.id]=raw;if(rng)syncRng(rng,raw);later();});
   els[f.id]=el;return wrap;}
  wrap.appendChild(el);el.addEventListener('input',function(){vs[f.id]=el.value;later();});el.addEventListener('change',function(){vs[f.id]=el.value;later();});els[f.id]=el;return wrap;}
 function groupStr0(s){s=String(s);if(!/^-?\d*\.?\d*$/.test(s))return s;var p=s.split('.'),g=groupStr(p[0]);return g+(p.length>1?'.'+p[1]:'');}
 function regroup(el){var raw=el.value;if(!/^[\d,\s.\-]*$/.test(raw))return raw;var caret=el.selectionStart,sig=0,i;for(i=0;i<caret;i++)if(/[\d.\-]/.test(raw[i]))sig++;var clean=raw.replace(/[,\s]/g,'');var parts=clean.split('.');if(parts.length>2||clean.indexOf('-')>0)return clean;
  var ip=parts[0],neg=ip[0]==='-';if(neg)ip=ip.slice(1);var o=(neg?'-':'')+groupStr(ip)+(parts.length>1?'.'+parts[1]:'');if(o!==raw){el.value=o;var n=0,p=0;if(sig>0){for(p=0;p<o.length;p++){if(/[\d.\-]/.test(o[p])){n++;if(n===sig){p++;break;}}}}try{el.setSelectionRange(p,p);}catch(e){}}return clean;}
 var sliderRefs=[];
 function syncRng(rng,raw){var x=parseNum(raw);if(isNaN(x))return;rng.value=Math.max(+rng.min,Math.min(+rng.max,x));paintRange(rng);}
 function refreshSliders(vs){sliderRefs.forEach(function(s){if(s.vs!==vs)return;var sc=slideCfg(c,s.f,vs);if(!sc)return;s.rng.min=sc[0];s.rng.max=sc[1];s.rng.step=sc[2];syncRng(s.rng,vs[s.f.id]);});}

 // ----- action buttons
 var favs=lists().fav,isFav=favs.indexOf(c.id)>=0;
 var star='M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z';
 var fbtn=h('button',{type:'button',class:'abtn pin','aria-pressed':String(isFav),onclick:function(){var l=lists().fav,i=l.indexOf(c.id);if(i>=0)l.splice(i,1);else l.unshift(c.id);setList('ga-fav',l);var on=i<0;paintFav(on);if(on){fbtn.classList.remove('burst');void fbtn.offsetWidth;fbtn.classList.add('burst');}toast(on?t('pinToast'):t('unpinToast'));}});
 function paintFav(on){fbtn.setAttribute('aria-pressed',String(on));fbtn.textContent='';var s=icon(star,18);if(on)s.setAttribute('fill','currentColor');fbtn.appendChild(s);fbtn.appendChild(h('span',{text:on?t('unfav'):t('fav')}));}
 paintFav(isFav);
 var cbtn=h('button',{type:'button',class:'abtn','aria-pressed':String(cmp),text:t('compare'),onclick:function(){cmp=!cmp;if(cmp){c.fields.forEach(function(f){valsB[f.id]=f.t==='rows'?vals[f.id].map(function(r){return r.slice();}):vals[f.id];});}cbtn.setAttribute('aria-pressed',String(cmp));lastHero=null;renderWork();run();}});
 var scnBox=h('div',{class:'scn'});
 var acts=h('div',{class:'acts'},[fbtn,cbtn,h('button',{type:'button',class:'abtn',text:t('copyLink'),onclick:function(){copy(shareUrl(true),t('copied'));}}),h('button',{type:'button',class:'abtn',text:t('copyRes'),onclick:function(){copy(resText(),t('copiedRes'));}}),h('button',{type:'button',class:'abtn',text:t('print'),onclick:function(){window.print();}}),h('button',{type:'button',class:'abtn',text:t('reset'),onclick:function(){go(href(c));}})]);
 function shareUrl(forCopy){var all=!!forCopy&&scaleActive(c),q=queryOf(c,vals,'',all);if(cmp){q.set('cmp','1');queryOf(c,valsB,'b.',all).forEach(function(v,k){q.set(k,v);});}var s=q.toString();return location.origin+href(c)+(s?'?'+s:'');}
 function resText(){return c.name+'\n'+lastText;}
 // saved scenarios
 function drawScn(){scnBox.textContent='';var all=scnAll(),mine=all[c.id]||[];
  var nameIn=h('input',{type:'text',maxlength:40,'aria-label':t('scnName'),placeholder:t('scnName'),autocomplete:'off'}),form=h('form',{class:'scnform',hidden:true,onsubmit:function(e){e.preventDefault();var n=nameIn.value.trim()||('Scenario '+(mine.length+1));var a=scnAll(),l=a[c.id]||[];l.unshift({n:n,q:queryOf(c,vals,'',true).toString(),t:Date.now()});a[c.id]=l.slice(0,12);scnSet(a);toast(t('scnSaved'));drawScn();}},[nameIn,h('button',{type:'submit',class:'abtn',text:t('scnSave')}),h('button',{type:'button',class:'abtn',text:t('scnCancel'),onclick:function(){form.hidden=true;sbtn.focus();}})]);
  var sbtn=h('button',{type:'button',class:'abtn','aria-expanded':'false',text:t('saveScn'),onclick:function(){form.hidden=!form.hidden;sbtn.setAttribute('aria-expanded',String(!form.hidden));if(!form.hidden){nameIn.value='';nameIn.focus();}}});
  scnBox.appendChild(h('div',{class:'scn-top'},[sbtn,form]));
  if(mine.length){var det=h('details',{class:'scn-list'},[h('summary',{text:t('scnList')+' ('+mine.length+')'})]),ul=h('ul');
   mine.forEach(function(s,i){ul.appendChild(h('li',null,[h('span',{class:'nm',text:s.n}),h('span',{class:'bt'},[
    h('button',{type:'button',class:'lnk',text:t('load'),onclick:function(){go(href(c)+(s.q?'?'+s.q:''));}}),
    h('button',{type:'button',class:'lnk',text:t('vsNow'),onclick:function(){var q=queryOf(c,vals,'',true);new URLSearchParams(s.q).forEach(function(v,k){q.set('b.'+k,v);});q.set('cmp','1');go(href(c)+'?'+q.toString());}}),
    h('button',{type:'button',class:'lnk del','aria-label':t('del')+' '+s.n,text:t('del'),onclick:function(){var a=scnAll(),l=(a[c.id]||[]).slice();l.splice(i,1);a[c.id]=l;scnSet(a);drawScn();}})])]));});
   det.appendChild(ul);scnBox.appendChild(det);}}
 drawScn();

 // ----- layout
 var left=h('section',{class:'panel','aria-labelledby':'inh'}),right=h('section',{class:'panel','aria-labelledby':'outh'},[h('h2',{id:'outh',text:t('result')}),out]);
 var psum=h('div',{class:'print-only psum'});
 var work=h('div',{class:'work'+(cmp?' is-cmp':'')},[left,right]);
 function renderWork(){work.classList.toggle('is-cmp',cmp);left.textContent='';sliderRefs.length=0;elsA={};elsB={};left.appendChild(h('h2',{id:'inh',text:t('inputs')}));
  function mk(vs,els,pre){var form=h('form',{novalidate:true,onsubmit:function(e){e.preventDefault();run();}});c.fields.forEach(function(f){form.appendChild(fieldEl(f,vs,els,pre));});return form;}
  if(cmp){left.appendChild(h('div',{class:'cmpgrid'},[h('div',{class:'cmpcol'},[h('h3',{class:'sc a',text:t('scenA')}),mk(vals,elsA,'')]),h('div',{class:'cmpcol'},[h('h3',{class:'sc b',text:t('scenB')}),mk(valsB,elsB,'b-')])]));}
  else left.appendChild(mk(vals,elsA,''));}
 renderWork();
 var cat=catName(c.cat),cd=G.CATS.filter(function(x){return x.id===c.cat;})[0];
 app.appendChild(h('nav',{class:'crumbs','aria-label':'Breadcrumb'},[h('a',{href:'/','data-nav':'1',text:'Ganaka'}),'›',h('a',{href:'/#'+c.cat,'data-nav':'1',text:cat})]));
 var vbadge=badge(c);if(vtPending)vbadge.style.viewTransitionName='abx';
 app.appendChild(h('h1',{class:'ttl',style:'--c1:'+cd.color},[vbadge,h('span',{text:c.name})]));app.appendChild(h('p',{class:'lede',text:c.desc}));app.appendChild(acts);app.appendChild(scnBox);app.appendChild(psum);app.appendChild(work);
 // explanations
 var info=G.INFO[c.id]||{},ex=exampleFor(c),det=[];
 function dt(title,body,open){return h('details',{class:'xp',open:open?true:null},[h('summary',null,[h('span',{text:title})]),h('div',{class:'xb'},body)]);}
 if(info.mean)det.push(dt(t('mean'),[h('p',{text:info.mean})],true));
 if(ex)det.push(dt(t('example'),[h('p',null,[t('exWith')+' ',h('strong',{text:ex.inputs}),' → '+ex.label+': ',h('strong',{text:ex.value}),'.']),h('button',{type:'button',class:'abtn',text:t('useEx'),onclick:function(){go(href(c));}})],false));
 if(info.assume)det.push(dt(t('assume'),[h('p',{text:typeof info.assume==='function'?info.assume():info.assume}),h('p',{class:'dim',text:t('estimate')})],false));
 det.push(dt(t('formula'),[h('p',{class:'formula',text:c.formula})],!info.mean));
 var rel=[],i0=G.CALCS.indexOf(c),relc=G.CALCS.filter(function(x){return x.cat===c.cat&&x.id!==c.id;});rel=relc.filter(function(x){return G.CALCS.indexOf(x)>i0;}).concat(relc.filter(function(x){return G.CALCS.indexOf(x)<i0;})).slice(0,4);
 var relEl=rel.length?h('section',{class:'rel'},[h('h2',{text:t('related')}),h('div',{class:'grid'},rel.map(card))]):null;
 app.appendChild(h('div',{class:'under'},[h('section',{class:'xps'},det),relEl]));if(relEl)reveal(relEl);

 // ----- evaluation
 function readValues(vs){var v={},bad=null;c.fields.forEach(function(f){var x=vs[f.id];if(f.t==='n'){var n=parseNum(x);if(isNaN(n)&&!bad)bad=f;v[f.id]=n;}else if(f.t==='s'){var o=f.opts.filter(function(o){return String(o[0])===String(x);})[0];v[f.id]=o?o[0]:x;}else if(f.t==='c')v[f.id]=x==='1';else v[f.id]=x;});return{v:v,bad:bad};}
 function evalCalc(vs){var rv=readValues(vs);if(rv.bad)return{bad:rv.bad};var o;try{o=c.calc(rv.v);}catch(e){if(!e.user)try{console.warn(e);}catch(_){}return{err:friendly(e,c)};}
  if(o.res.some(function(r){return typeof r.value==='number'&&!isFinite(r.value);}))return{err:t('errNaN')};return{o:o,v:rv.v};}
 function showErr(msg,fld,els){var box=h('div',{class:'err',role:'alert'},[icon('M12 3.5l9.5 16.500H2.500zM12 10v4.500M12 17.500h.01',20),h('span',{text:msg})]);out.appendChild(box);}
 function clearInvalid(){[elsA,elsB].forEach(function(els){for(var k in els){var e=els[k];if(e&&e.removeAttribute){e.removeAttribute('aria-invalid');e.removeAttribute('aria-describedby');if(e.parentNode&&e.parentNode.classList)e.parentNode.classList.remove('bad');}}});}
 function markInvalid(els,f){var e=els[f.id];if(e&&e.setAttribute){e.setAttribute('aria-invalid','true');e.setAttribute('aria-describedby','outh');if(e.parentNode&&e.parentNode.classList&&e.parentNode.classList.contains('inp'))e.parentNode.classList.add('bad');}}
 function caution(){var g=G.CAUTION.groups[G.CAUTION.map[c.id]];if(!g)return null;return h('aside',{class:'caution',role:'note','aria-label':t('caution')+': '+g.title},[icon('M12 3.5l9.500 16.500H2.500zM12 10v4.500M12 17.500h.01',20),h('div',null,[h('strong',{text:t('caution')+' · '+g.title}),h('p',{text:g.text})])]);}
 function inputsList(vs){return c.fields.map(function(f){var x=vs[f.id],s;if(f.t==='n'){var u=unitOf(f);s=(isMoney(c,f)?curSym():'')+(groupable(c,f)?groupStr0(x):x)+(u?(u==='%'?'%':' '+u):'');}else if(f.t==='s'){var o=f.opts.filter(function(o){return String(o[0])===String(x);})[0];s=o?o[1]:x;}else if(f.t==='c')s=x==='1'?'Yes':'No';else if(f.t==='rows')s=x.length+' rows';else s=String(x).slice(0,80);return[f.label,s];});}
 function printSummary(){psum.textContent='';var A=inputsList(vals),B=cmp?inputsList(valsB):null;
  var rows=A.map(function(r,i){return h('tr',null,[h('th',{scope:'row',text:r[0]}),h('td',{text:r[1]})].concat(B?[h('td',{text:B[i][1]})]:[]));});
  psum.appendChild(h('div',{class:'ph'},[h('div',{class:'pb'},[h('b',{text:'Ganaka'}),h('span',{text:' · EknathaLabs'})]),h('div',{class:'pd',text:new Date().toLocaleString(set.lang==='en'?undefined:set.lang)})]));
  psum.appendChild(h('h2',{text:c.name}));
  psum.appendChild(h('table',{class:'pin2'},[h('caption',{text:t('inputs')}),h('thead',null,[h('tr',null,[h('th',{text:''}),h('th',{text:cmp?t('scenA'):t('value')})].concat(B?[h('th',{text:t('scenB')})]:[]))]),h('tbody',null,rows)]));
  var g=G.CAUTION.groups[G.CAUTION.map[c.id]];psum.appendChild(h('p',{class:'pdis',text:(g?g.text+' ':'')+t('printNote')}));}

 var DIR_LOW=/interest|tax|cost|fee|charge|payable|total payment|total paid|emi|expense|penalty|months to clear|loan amount/i,DIR_HIGH=/maturity|corpus|saving|gain|profit|income|take-home|you save|saved|final balance|interest earned|return|value|estimated loan/i;
 function renderCompare(a,b){var texts=[];
  function hero(o,sc,cl){var r=o.res.filter(function(r){return r.hero;})[0]||o.res[0];return h('div',{class:'hero-res '+cl},[h('div',{class:'l',text:sc+' · '+r.label}),h('div',{class:'v'+(r.kind==='pre'?' pre':''),text:fmt(r)})]);}
  if(a.o&&b.o)out.appendChild(h('div',{class:'twin'},[hero(a.o,t('scenA'),'sa'),hero(b.o,t('scenB'),'sb')]));
  else{if(!a.o)out.appendChild(h('div',{class:'err',role:'alert'},[icon('M12 3.5l9.500 16.500H2.500zM12 10v4.500M12 17.500h.01',20),h('span',{text:t('scenA')+': '+(a.bad?t('errNum',{f:a.bad.label}):a.err)})]));if(!b.o)out.appendChild(h('div',{class:'err',role:'alert'},[icon('M12 3.5l9.500 16.500H2.500zM12 10v4.500M12 17.500h.01',20),h('span',{text:t('scenB')+': '+(b.bad?t('errNum',{f:b.bad.label}):b.err)})]));if(!(a.o&&b.o))return;}
  var body=h('tbody');a.o.res.forEach(function(r,i){var rb=b.o.res[i];if(!rb)return;var dl='—',cls='',word='';
   if(typeof r.value==='number'&&typeof rb.value==='number'&&r.kind!=='pre'&&r.kind!=='text'){var d=rb.value-r.value;if(Math.abs(d)<1e-9){dl='0';}else{var up=d>0;dl=(up?'▲ +':'▼ −')+fmt({value:Math.abs(d),kind:r.kind,unit:r.unit});var good=null;if(DIR_LOW.test(r.label))good=!up;else if(DIR_HIGH.test(r.label))good=up;if(good!=null){cls=good?'good':'bad';word=good?t('better'):t('worse');}}}
   texts.push(r.label+': '+fmt(r)+' | '+fmt(rb));
   body.appendChild(h('tr',null,[h('th',{scope:'row',text:r.label}),h('td',{text:fmt(r)}),h('td',{text:fmt(rb)}),h('td',{class:'dl '+cls},[dl,word?h('small',{text:' '+word}):null])]));});
  out.appendChild(h('div',{class:'tbl cmp open',tabindex:'0',role:'region','aria-label':t('diffTitle')},[h('table',null,[h('caption',{text:t('diffTitle')}),h('thead',null,[h('tr',null,[h('th',{text:t('metric')}),h('th',{text:t('scenA')}),h('th',{text:t('scenB')}),h('th',{text:t('diff')})])]),body])]));
  lastText=texts.join('\n')+'\n';out.appendChild(h('p',{class:'note',text:t('cmpNote')}));
  var cs=caution();if(cs)out.appendChild(cs);announce(t('scenA')+' '+fmt(a.o.res[0])+', '+t('scenB')+' '+fmt(b.o.res[0]));}

 function run(){out.textContent='';clearInvalid();history.replaceState(null,'',shareUrl().replace(location.origin,''));lastText='';printSummary();
  var A=evalCalc(vals);
  if(cmp){var B=evalCalc(valsB);if(A.bad)markInvalid(elsA,A.bad);if(B.bad)markInvalid(elsB,B.bad);renderCompare(A,B);return;}
  if(A.bad){markInvalid(elsA,A.bad);showErr(t('errNum',{f:A.bad.label}));return;}
  if(A.err){showErr(A.err);return;}
  var o=A.o,res=o.res,hero=res.filter(function(r){return r.hero;})[0]||res[0];
  var hs=hints(c,A.v);if(hs.length)out.appendChild(h('div',{class:'hint',role:'status'},[icon('M12 3.5a8.500 8.500 0 100 17 8.500 8.500 0 000-17zM12 11v5M12 8h.01',18),h('div',null,hs.map(function(x){return h('p',{text:x});}))]));
  var vEl=h('div',{class:'v'+(hero.kind==='pre'?' pre':''),text:fmt(hero)}),hv=h('div',{class:'hero-res'},[h('div',{class:'l',text:hero.label}),vEl]);if(hero.swatch)vEl.prepend(h('span',{class:'sw',style:'background:'+hero.swatch}));
  if(hero.kind==='cur'&&isFinite(hero.value)&&Math.abs(hero.value)>=1&&Math.abs(hero.value)<1e15){hv.appendChild(h('div',{class:'w',text:t('inWords')+': '+wordsOf(hero.value)}));}
  var say=info.say&&(function(){try{return info.say(A.v,o,F);}catch(e){return null;}})();if(say)hv.appendChild(h('p',{class:'say',text:say}));
  out.appendChild(hv);lastText=hero.label+': '+fmt(hero)+'\n';
  if(!c.live&&!reduced()&&lastHero&&lastHero.label===hero.label&&typeof hero.value==='number'&&typeof lastHero.value==='number'&&isFinite(hero.value)&&hero.kind!=='pre'&&hero.kind!=='plain'&&lastHero.value!==hero.value&&!hero.swatch){tweenText(vEl,lastHero.value,hero.value,hero);hv.classList.remove('pulse');void hv.offsetWidth;hv.classList.add('pulse');}
  lastHero={label:hero.label,value:hero.value};
  var rest=res.filter(function(r){return r!==hero;});if(rest.length){var g=h('div',{class:'res'});rest.forEach(function(r){var vv=h('div',{class:'v'+(r.kind==='pre'?' pre':''),text:fmt(r)});g.appendChild(h('div',null,[h('div',{class:'l',text:r.label}),vv]));lastText+=r.label+': '+fmt(r).replace(/\n/g,' ')+'\n';});out.appendChild(g);}
  if(o.chart||o.chart2){var cw=h('div',{class:'charts'});if(o.chart)cw.appendChild(chart(o.chart));if(o.chart2)cw.appendChild(chart(o.chart2));out.appendChild(cw);}
  if(o.table)out.appendChild(table(o.table));
  if(o.note)out.appendChild(h('p',{class:'note',text:o.note}));
  var cs=caution();if(cs)out.appendChild(cs);
  announce(hero.label+': '+fmt(hero));}
 function wordsOf(v){var neg=v<0,a=Math.abs(v),r=Math.round(a*100)/100,ip=Math.floor(r+1e-9),fr=Math.round((r-ip)*100),w=G.words(ip,fmtMode()==='in'),s=curSym().trim(),U={'₹':['rupees','paise'],'$':['dollars','cents'],'€':['euros','cents'],'£':['pounds','pence']}[s];
  if(ip===0)w='zero';var o=w;if(U)o+=' '+U[0];if(fr>0){o+=' and '+G.words(fr,false)+(U?' '+U[1]:' hundredths');}o=o.charAt(0).toUpperCase()+o.slice(1);return(neg?'Minus '+o.charAt(0).toLowerCase()+o.slice(1):o);}
 run();if(c.live)timer=setInterval(run,1000);}

// ---------- charts and table
var PAL=['#2456b8','#e63e2d','#1a7a48','#c78b00','#6a3fc0','#0a6f7d'];
function niceStep(max,n){var raw=max/n,p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p;return(f<=1?1:f<=2?2:f<=5?5:10)*p;}
function chart(ch){var box=h('figure',{class:'chart '+ch.type}),tip=h('div',{class:'tip',hidden:true,'aria-live':'polite'});
 function place(x,y){var r=box.getBoundingClientRect(),w=tip.offsetWidth||140;var L=Math.max(4,Math.min(r.width-w-4,x-w/2));tip.style.left=L+'px';tip.style.top=Math.max(0,y-tip.offsetHeight-12)+'px';}
 if(ch.type==='donut'){var tot=ch.data.reduce(function(a,d){return a+Math.max(0,d[1]);},0)||1,svg=sv('svg',{viewBox:'0 0 120 120',role:'img','aria-label':ch.data.map(function(d){return d[0]+' '+Math.round(d[1]/tot*100)+'%';}).join(', ')}),a0=-Math.PI/2,R=44;
  ch.data.forEach(function(d,i){var fr=Math.max(0,d[1])/tot,a1=a0+fr*2*Math.PI,p;if(fr>=.9999)p=sv('circle',{cx:60,cy:60,r:R});else if(fr>0){var x0=60+R*Math.cos(a0),y0=60+R*Math.sin(a0),x1=60+R*Math.cos(a1),y1=60+R*Math.sin(a1);p=sv('path',{d:'M'+x0+' '+y0+'A'+R+' '+R+' 0 '+(fr>.5?1:0)+' 1 '+x1+' '+y1});}
   if(p){p.setAttribute('fill','none');p.setAttribute('stroke',PAL[i%6]);p.setAttribute('stroke-width',20);p.setAttribute('pathLength',100);p.setAttribute('class','seg');p.style.setProperty('--i',i);
    var show=function(ev){var r=box.getBoundingClientRect();tip.hidden=false;tip.textContent='';tip.appendChild(h('b',{text:d[0]}));tip.appendChild(h('span',{text:(ch.kind?F(ch.kind,d[1])+' · ':'')+Math.round(fr*100)+'%'}));place(ev.clientX-r.left,ev.clientY-r.top);};p.addEventListener('pointermove',show);p.addEventListener('pointerenter',show);p.addEventListener('pointerleave',function(){tip.hidden=true;});svg.appendChild(p);}a0=a1;});
  if(ch.centerLabel&&ch.kind){svg.appendChild(sv('text',{x:60,y:57,'text-anchor':'middle','font-size':6.5,fill:'currentColor','fill-opacity':.7,class:'ctr'},[]));svg.lastChild.textContent=ch.centerLabel;svg.appendChild(sv('text',{x:60,y:68,'text-anchor':'middle','font-size':11,'font-weight':700,fill:'currentColor',class:'ctr'},[]));svg.lastChild.textContent=compact(tot,ch.kind);}
  box.appendChild(svg);box.appendChild(h('ul',{class:'legend'},ch.data.map(function(d,i){return h('li',null,[h('i',{style:'background:'+PAL[i%6]}),d[0]+': '+Math.round(Math.max(0,d[1])/tot*100)+'%']);})));}
 else if(ch.type==='area'){var W=520,H=250,Lp=54,Rp=14,Tp=14,Bp=34,n=ch.x.length,pw=W-Lp-Rp,ph=H-Tp-Bp,kind=ch.kind||'cur',ser=ch.stack.slice(),cum=[],mx=0,i,s;
  for(s=0;s<ser.length;s++){cum[s]=[];for(i=0;i<n;i++)cum[s][i]=(s?cum[s-1][i]:0)+Math.max(0,ser[s].values[i]);}
  for(i=0;i<n;i++){mx=Math.max(mx,cum[ser.length-1][i],ch.line?ch.line.values[i]:0);}if(!(mx>0))mx=1;var stp=niceStep(mx,4),top=Math.ceil(mx/stp)*stp;
  function X(i){return n<2?Lp+pw/2:Lp+i/(n-1)*pw;}function Y(v){return Tp+ph-v/top*ph;}
  var svg2=sv('svg',{viewBox:'0 0 '+W+' '+H,role:'img',tabindex:0,'aria-label':(ch.title||'Chart')+': '+ser.map(function(x){return x.name;}).concat(ch.line?[ch.line.name]:[]).join(', ')+'. '+ch.xlabel+' '+ch.x[0]+' to '+ch.x[n-1]+'. Use the left and right arrow keys to read values.',class:'area'});
  for(var g=0;g<=top+1e-9;g+=stp){svg2.appendChild(sv('line',{x1:Lp,x2:W-Rp,y1:Y(g),y2:Y(g),class:'grid'}));var yl=sv('text',{x:Lp-6,y:Y(g)+3.5,'text-anchor':'end',class:'axis'});yl.textContent=compact(g,kind);svg2.appendChild(yl);}
  var step=Math.max(1,Math.ceil(n/6));for(i=0;i<n;i+=step){var xl=sv('text',{x:X(i),y:H-12,'text-anchor':'middle',class:'axis'});xl.textContent=ch.x[i];svg2.appendChild(xl);}
  var xt=sv('text',{x:Lp+pw/2,y:H-1,'text-anchor':'middle',class:'axis dim'});xt.textContent=ch.xlabel;svg2.appendChild(xt);
  var grp=sv('g',{class:'reveal'});
  for(s=ser.length-1;s>=0;s--){var d='M'+X(0)+' '+Y(s?cum[s-1][0]:0);for(i=0;i<n;i++)d+='L'+X(i)+' '+Y(cum[s][i]);for(i=n-1;i>=0;i--)d+='L'+X(i)+' '+Y(s?cum[s-1][i]:0);d+='Z';grp.appendChild(sv('path',{d:d,fill:PAL[s%6],'fill-opacity':.82}));}
  if(ch.line){var ld='';for(i=0;i<n;i++)ld+=(i?'L':'M')+X(i)+' '+Y(ch.line.values[i]);grp.appendChild(sv('path',{d:ld,fill:'none',class:'lineS','stroke-width':2.5,'stroke-linejoin':'round'}));}
  svg2.appendChild(grp);
  var guide=sv('line',{y1:Tp,y2:Tp+ph,class:'guide',style:'display:none'}),dots=[];svg2.appendChild(guide);
  (ch.line?[ch.line.values]:[]).concat(cum.map(function(c2){return c2;})).forEach(function(v,k){var dt=sv('circle',{r:4,class:'dot',style:'display:none',fill:ch.line&&k===0?'var(--text)':PAL[(ch.line?k-1:k)%6]});dots.push([dt,v]);svg2.appendChild(dt);});
  var cur=-1;function showAt(k,cx,cy){k=Math.max(0,Math.min(n-1,k));cur=k;guide.style.display='';guide.setAttribute('x1',X(k));guide.setAttribute('x2',X(k));dots.forEach(function(p){p[0].style.display='';p[0].setAttribute('cx',X(k));p[0].setAttribute('cy',Y(p[1][k]));});
   tip.hidden=false;tip.textContent='';tip.appendChild(h('b',{text:ch.xlabel+' '+ch.x[k]}));ser.forEach(function(x,j){tip.appendChild(h('span',null,[h('i',{style:'background:'+PAL[j%6]}),x.name+': '+F(kind,x.values[k])]));});if(ch.line)tip.appendChild(h('span',null,[h('i',{class:'ln'}),ch.line.name+': '+F(kind,ch.line.values[k])]));
   var r=box.getBoundingClientRect(),sr=svg2.getBoundingClientRect();var px=(X(k)/W)*sr.width+(sr.left-r.left);place(px,cy!=null?cy:(sr.top-r.top)+Y(cum[ser.length-1][k])/H*sr.height);}
  function hide(){cur=-1;guide.style.display='none';dots.forEach(function(p){p[0].style.display='none';});tip.hidden=true;}
  svg2.addEventListener('pointermove',function(e){var sr=svg2.getBoundingClientRect(),x=(e.clientX-sr.left)/sr.width*W;showAt(Math.round((x-Lp)/pw*(n-1)),e.clientX-box.getBoundingClientRect().left,e.clientY-box.getBoundingClientRect().top-4);});
  svg2.addEventListener('pointerleave',function(){if(document.activeElement!==svg2)hide();});
  svg2.addEventListener('keydown',function(e){var k=cur<0?0:cur;if(e.key==='ArrowRight')k++;else if(e.key==='ArrowLeft')k--;else if(e.key==='Home')k=0;else if(e.key==='End')k=n-1;else if(e.key==='Escape'){hide();return;}else return;e.preventDefault();showAt(k);});
  svg2.addEventListener('focus',function(){showAt(cur<0?n-1:cur);});svg2.addEventListener('blur',hide);
  if(ch.title)box.appendChild(h('figcaption',{text:ch.title}));box.appendChild(svg2);
  box.appendChild(h('ul',{class:'legend row'},ser.map(function(x,j){return h('li',null,[h('i',{style:'background:'+PAL[j%6]}),x.name]);}).concat(ch.line?[h('li',null,[h('i',{class:'ln'}),ch.line.name])]:[])));}
 else if(ch.type==='plot'){var W2=360,H2=200,P=28,y0=ch.y0,y1=ch.y1;if(y1===y0){y1+=1;y0-=1;}var svg3=sv('svg',{viewBox:'0 0 '+W2+' '+H2,style:'max-width:480px;width:100%',role:'img','aria-label':'Graph of the function'});
  function X2(x){return P+(x-ch.x0)/(ch.x1-ch.x0)*(W2-P-8);}function Y2(y){return H2-P-(y-y0)/(y1-y0)*(H2-P-8);}
  svg3.appendChild(sv('rect',{x:P,y:8,width:W2-P-8,height:H2-P-8,fill:'none',stroke:'currentColor','stroke-opacity':.3}));
  if(y0<0&&y1>0)svg3.appendChild(sv('line',{x1:P,x2:W2-8,y1:Y2(0),y2:Y2(0),stroke:'currentColor','stroke-opacity':.5}));if(ch.x0<0&&ch.x1>0)svg3.appendChild(sv('line',{y1:8,y2:H2-P,x1:X2(0),x2:X2(0),stroke:'currentColor','stroke-opacity':.5}));
  var d2='',pen=false;ch.pts.forEach(function(p){if(!p){pen=false;return;}d2+=(pen?'L':'M')+X2(p[0]).toFixed(1)+' '+Y2(p[1]).toFixed(1);pen=true;});svg3.appendChild(sv('path',{d:d2,fill:'none',stroke:PAL[0],'stroke-width':2}));
  [[ch.x0,P,H2-12,'start'],[ch.x1,W2-8,H2-12,'end']].forEach(function(l){var tx=sv('text',{x:l[1],y:l[2],'text-anchor':l[3],'font-size':10,fill:'currentColor'});tx.textContent=G.fmtPlain(l[0],4);svg3.appendChild(tx);});
  [[y0,H2-P],[y1,16]].forEach(function(l){var tx=sv('text',{x:P-3,y:l[1],'text-anchor':'end','font-size':10,fill:'currentColor'});tx.textContent=G.fmtPlain(l[0],3);svg3.appendChild(tx);});box.appendChild(svg3);}
 box.appendChild(tip);return box;}
function table(tb){var th=h('tr',null,tb.cols.map(function(c){return h('th',{scope:'col',text:c});})),body=h('tbody');tb.rows.forEach(function(r){body.appendChild(h('tr',null,r.map(function(v,i){return h('td',{text:typeof v==='number'?fmt({value:v,kind:tb.kinds[i]==='text'?'num':tb.kinds[i]}):String(v)});})));});
 var wrap=h('div',{class:'tbl'+(tb.rows.length<=8?' open':''),tabindex:'0',role:'region','aria-label':tb.title},[h('table',null,[h('caption',{text:tb.title}),h('thead',null,[th]),body])]),box=h('div',{class:'tblw'},[wrap]);
 if(tb.rows.length>8){var btn=h('button',{type:'button',class:'abtn more','aria-expanded':'false',text:t('showAll',{n:tb.rows.length}),onclick:function(){var o=!wrap.classList.contains('open');wrap.classList.toggle('open',o);btn.setAttribute('aria-expanded',String(o));btn.textContent=o?t('showLess'):t('showAll',{n:tb.rows.length});}});box.appendChild(btn);}
 return box;}

// ---------- shell
function themeTo(next,ev){function apply(){set.theme=next;save();applyTheme();}
 if(!document.startViewTransition||reduced()||!ev||!ev.clientX&&!ev.clientY&&ev.detail===0){apply();return;}
 var x=ev.clientX,y=ev.clientY,r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));document.documentElement.classList.add('vt-theme');
 try{var vt=document.startViewTransition(apply);vt.ready.then(function(){document.documentElement.animate({clipPath:['circle(0px at '+x+'px '+y+'px)','circle('+r+'px at '+x+'px '+y+'px)']},{duration:520,easing:'cubic-bezier(.4,0,.2,1)',pseudoElement:'::view-transition-new(root)'});});vt.finished.then(function(){document.documentElement.classList.remove('vt-theme');},function(){document.documentElement.classList.remove('vt-theme');});}catch(e){document.documentElement.classList.remove('vt-theme');apply();}}
function buildChrome(){var hd=$('#hdr');hd.textContent='';
 var bar=h('div',{class:'wrap bar'});
 bar.appendChild(h('a',{class:'brand',href:'/','data-nav':'1','aria-label':'Ganaka home'},[h('b',null,[mark()]),h('span',null,['Ganaka',h('small',{text:'EknathaLabs'})])]));
 var hq=h('div',{class:'hq',id:'hq'});bar.appendChild(hq);
 bar.appendChild(h('span',{class:'grow'}));
 bar.appendChild(h('a',{class:'ibtn',href:ORIGIN+(set.lang==='en'?'/':'/'+set.lang+'/')},[h('span',{text:'EknathaLabs'}),icon('M7 17L17 7M9 7h8v8',14)]));
 var panel=h('div',{class:'pop-panel',id:'setp',hidden:true,role:'dialog','aria-label':t('settings')}),btn=h('button',{class:'ibtn',type:'button','aria-expanded':'false','aria-controls':'setp'},[icon('M12 8.500a3.500 3.500 0 100 7 3.500 3.500 0 000-7zM19.400 13.500a7.700 7.700 0 000-3l2-1.500-2-3.400-2.300 1a7.600 7.600 0 00-2.600-1.500L14 2.500h-4l-.5 2.600A7.600 7.600 0 006.900 6.600l-2.300-1-2 3.400 2 1.500a7.700 7.700 0 000 3l-2 1.500 2 3.400 2.300-1a7.600 7.600 0 002.600 1.500l.5 2.600h4l.5-2.600a7.600 7.600 0 002.600-1.500l2.300 1 2-3.400z',18),h('span',{class:'lab',text:t('settings')})]);
 function sel(id,label,opts,val,fn){var s=h('select',{id:id},opts.map(function(o){return h('option',{value:o[0],text:o[1]});}));s.value=val;s.addEventListener('change',function(){fn(s.value);});return[h('label',{for:id,text:label}),s];}
 function segment(label,keys,get,fn){panel.appendChild(h('label',{text:label}));var sg=h('div',{class:'seg',role:'group','aria-label':label});keys.forEach(function(k){sg.appendChild(h('button',{type:'button','aria-pressed':String(get()===k[0]),text:k[1],onclick:function(ev){fn(k[0],ev);[].forEach.call(sg.children,function(b,i){b.setAttribute('aria-pressed',String(keys[i][0]===get()));});}}));});panel.appendChild(sg);}
 function build(){panel.textContent='';
  sel('s-lang',t('language'),G.LANGS.map(function(l){return[l[0],l[1]];}),set.lang,function(v){set.lang=v;save();applyLang();buildChrome();route();}).forEach(function(e){panel.appendChild(e);});
  sel('s-cur',t('currency'),[['₹','₹ INR'],['$','$ USD'],['€','€ EUR'],['£','£ GBP'],['¥','¥ JPY / CNY'],['AED ','AED'],['',t('nocur')]],set.cur,function(v){set.cur=v;set.cu=true;save();rerun();}).forEach(function(e){panel.appendChild(e);});
  sel('s-fmt',t('numfmt'),[['in',t('indian')],['intl',t('intl')]],set.fmt,function(v){set.fmt=v;set.fu=true;save();rerun();}).forEach(function(e){panel.appendChild(e);});
  segment(t('theme'),[['light',t('light')],['dark',t('dark')],['new',t('new')]],function(){return set.theme;},function(k,ev){themeTo(k,ev);});
  segment(t('motion'),[['auto',t('motionAuto')],['off',t('motionOff')]],function(){return set.motion;},function(k){set.motion=k;save();applyMotion();});}
 build();
 function close(f){panel.hidden=true;btn.setAttribute('aria-expanded','false');if(f)btn.focus();}
 btn.addEventListener('click',function(){var o=panel.hidden;panel.hidden=!o;btn.setAttribute('aria-expanded',String(o));if(o)$('select',panel).focus();});
 var pop=h('div',{class:'pop'},[btn,panel]);bar.appendChild(pop);
 if(!buildChrome.bound){buildChrome.bound=1;
  document.addEventListener('keydown',function(e){var p=$('#setp');if(e.key==='Escape'&&p&&!p.hidden){p.hidden=true;var b=$('.ibtn[aria-controls=setp]');if(b){b.setAttribute('aria-expanded','false');b.focus();}}});
  document.addEventListener('click',function(e){var p=$('#setp');if(p&&!p.hidden&&!p.parentNode.contains(e.target)){p.hidden=true;var b=$('.ibtn[aria-controls=setp]');if(b)b.setAttribute('aria-expanded','false');}});}
 hd.appendChild(bar);mountSearch(hq,'qs');
 var sk=$('.skip');if(sk)sk.textContent=t('skip');
 var ft=$('#ftr');ft.textContent='';ft.appendChild(h('div',{class:'wrap'},[h('span',null,[t('part')+' · ',h('a',{href:ORIGIN+(set.lang==='en'?'/':'/'+set.lang+'/'),text:'eknathalabs.com'})]),h('span',{class:'a11y'},[t('a11y')+' ',h('a',{href:'https://github.com/eknatha/Ganaka/issues',text:t('report')})]),set.lang==='en'?null:h('span',{text:t('englishNote')})]));}
function rerun(){if(cur_c)showCalc(cur_c);else showHome();}
function route(){var id=pathId(),c=G.byId[id];var home=!c;var hq=$('#hq');if(hq)hq.style.display=home?'none':'';if(c)showCalc(c);else showHome();if(home&&location.hash){var cid=location.hash.slice(1);if(G.CATS.some(function(x){return x.id===cid;})){store.set('ga-cat',cid);showHome();}}}
function init(){app=$('#app');applyTheme();applyLang();applyMotion();
 var wmk=[];for(var wi=0;wi<30;wi++)wmk.push(h('span',{text:'Ganaka · ganaka.eknathalabs.com'}));document.body.appendChild(h('div',{class:'wm','aria-hidden':'true'},wmk));
 document.body.appendChild(h('div',{class:'print-foot print-only'},[h('span',{text:t('printHdr')}),h('span',{text:t('printNote')})]));
 document.body.appendChild(h('div',{id:'sr',class:'sr',role:'status','aria-live':'polite'}));
 buildChrome();
 document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-nav]');if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();var u=a.getAttribute('href');go(u,a);});
 window.addEventListener('popstate',route);
 document.addEventListener('keydown',function(e){var tg=e.target,typing=tg&&/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName);if((e.key==='/'&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){e.preventDefault();var i=$('#hq').style.display==='none'?$('#qh'):$('#qs');if(i)i.focus();}});
 route();
 if('serviceWorker' in navigator&&location.protocol==='https:'||location.hostname==='localhost'){try{navigator.serviceWorker.register('/sw.js');}catch(e){}}}
G.init=init;
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',init);
})(window.G);
