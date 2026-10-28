/* Ganaka UI. Plain JS, no dependencies, no network requests. */
(function(G){'use strict';
var $=function(s,r){return(r||document).querySelector(s);};
function h(tag,a,kids){var e=document.createElement(tag);if(a)for(var k in a){var v=a[k];if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v);}
 (kids||[]).forEach(function(c){if(c==null)return;e.appendChild(typeof c==='string'?document.createTextNode(c):c);});return e;}
var store={get:function(k){try{return localStorage.getItem(k);}catch(e){return null;}},set:function(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
var POP=['emi','sip','income-tax-india','gst','bmi','age','percentage','unit-converter','scientific','gpa','cidr','uptime-sla'];
var ORIGIN='https://eknathalabs.com';
var LANGCODES=G.LANGS.map(function(l){return l[0];});
var INDIC={hi:1,te:1,kn:1,ta:1,ml:1};

// ---------- settings
var set=(function(){var s={};try{s=JSON.parse(store.get('ga-set')||'{}')||{};}catch(e){}
 var nl=(navigator.language||'en').toLowerCase(),sl=store.get('el-lang');
 if(LANGCODES.indexOf(s.lang)<0){s.lang=LANGCODES.indexOf(sl)>=0?sl:(LANGCODES.indexOf(nl.slice(0,2))>=0?nl.slice(0,2):'en');}
 if(!s.fmt)s.fmt=(INDIC[s.lang]||/-in$/.test(nl))?'in':'intl';
 if(s.cur==null)s.cur=s.fmt==='in'?'₹':'$';
 s.theme=document.documentElement.getAttribute('data-theme')||'light';return s;})();
function save(){store.set('ga-set',JSON.stringify({lang:set.lang,fmt:set.fmt,cur:set.cur}));store.set('el-lang',set.lang);store.set('el-theme',set.theme);}
function t(k,v){var s=(G.I18N[set.lang]||G.I18N.en)[k];if(s==null)s=G.I18N.en[k]||k;if(v)for(var x in v)s=s.replace('{'+x+'}',v[x]);return s;}
function applyTheme(){document.documentElement.setAttribute('data-theme',set.theme);var m=$('meta[name=theme-color]');if(m)m.setAttribute('content',{light:'#1c1b4b',dark:'#1c1b4b',new:'#0b3d3a'}[set.theme]);}
function applyLang(){document.documentElement.lang=set.lang;}

// ---------- formatting
function nf(x,min,max){return new Intl.NumberFormat(set.fmt==='in'?'en-IN':'en-US',{minimumFractionDigits:min,maximumFractionDigits:max}).format(x);}
function groupStr(s){var neg=s[0]==='-';if(neg)s=s.slice(1);var o;if(set.fmt==='in'&&s.length>3){o=s.slice(-3);s=s.slice(0,-3);while(s.length>2){o=s.slice(-2)+','+o;s=s.slice(0,-2);}if(s)o=s+','+o;}else o=s.replace(/\B(?=(\d{3})+(?!\d))/g,',');return(neg?'-':'')+o;}
function fmt(r){var v=r.value,k=r.kind;if(typeof v==='string'&&k!=='bigint')return v;
 if(k==='bigint')return groupStr(String(v));
 if(typeof v!=='number'||!isFinite(v))return String(v);
 switch(k){case'cur':var ab=Math.round(Math.abs(v)*100)/100,ints=ab===Math.floor(ab);return(v<0&&ab>0?'-':'')+set.cur+nf(ab,ints?0:2,ints?0:2);case'pct':return nf(v,0,2)+'%';case'pct4':return nf(v,0,4)+'%';case'int':return nf(Math.round(v),0,0);case'x':return nf(v,0,2)+'×';case'kg':return nf(v,0,1)+' kg';case'deg':return nf(v,0,2)+'°';case'bits':return nf(v,0,1)+' bits';case'plain':return G.fmtPlain(v)+(r.unit?' '+r.unit:'');default:return nf(v,0,Math.abs(v)<1?6:4);}}

// ---------- URL state
function parseNum(s){s=String(s).replace(/[,\s_]/g,'');if(s==='')return 0;if(!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s))return NaN;return parseFloat(s);}
function stateFromUrl(c){var q=new URLSearchParams(location.search),o={};c.fields.forEach(function(f){var x=q.get(f.id);if(x==null)return;if(f.t==='rows'){try{var a=JSON.parse(x);if(Array.isArray(a))o[f.id]=a;}catch(e){}}else o[f.id]=x;});return o;}
function defOf(f){return f.t==='rows'?f.def.map(function(r){return r.map(String);}):f.t==='c'?(f.def?'1':'0'):String(f.def==null?'':f.def);}

// ---------- view helpers
var app,cur_c=null,timer=null,toastT=null;
function toast(m){var e=$('#toast');e.textContent=m;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){e.hidden=true;},1800);}
function copy(text,msg){function ok(){toast(msg);}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(ok,fb);}else fb();function fb(){var a=h('textarea',{style:'position:fixed;left:-999px'});a.value=text;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok();}catch(e){}a.remove();}}
function mark(){var NS='http://www.w3.org/2000/svg',s=document.createElementNS(NS,'svg'),p=document.createElementNS(NS,'path');s.setAttribute('viewBox','14 14 36 36');s.setAttribute('width','22');s.setAttribute('height','22');s.setAttribute('aria-hidden','true');p.setAttribute('d',G.MARK);p.setAttribute('fill','currentColor');s.appendChild(p);return s;}
function badge(c){var cat=G.CATS.filter(function(x){return x.id===c.cat;})[0];return h('span',{class:'ab','aria-hidden':'true',style:'background:'+cat.color,text:c.ab});}
function catName(id){return t('cat_'+id);}
function href(c){return '/'+c.id+'/';}
function pathId(){return location.pathname.replace(/index\.html$/,'').replace(/^\/+|\/+$/g,'');}
function go(url){history.pushState(null,'',url);route();window.scrollTo(0,0);}
function card(c){var a=h('a',{class:'card',href:href(c),'data-nav':'1'},[h('div',{class:'row'},[badge(c),h('h3',{text:c.name})]),h('p',{text:c.desc}),h('span',{class:'go',text:t('open')})]);return a;}
function lists(){var f=[],r=[];try{f=JSON.parse(store.get('ga-fav')||'[]');r=JSON.parse(store.get('ga-rec')||'[]');}catch(e){}return{fav:f.filter(function(i){return G.byId[i];}),rec:r.filter(function(i){return G.byId[i];})};}
function setList(k,a){store.set(k,JSON.stringify(a));}

// ---------- search
function score(c,q){var n=c.name.toLowerCase(),d=c.desc.toLowerCase(),k=c.keywords.toLowerCase(),cn=catName(c.cat).toLowerCase(),s=0;q.split(/\s+/).forEach(function(w){if(!w)return;var x=0;if(n.indexOf(w)===0)x=100;else if(n.indexOf(' '+w)>=0)x=80;else if(n.indexOf(w)>=0)x=60;else if(c.id.indexOf(w)>=0)x=55;else if(k.indexOf(w)>=0)x=40;else if(d.indexOf(w)>=0)x=20;else if(cn.indexOf(w)>=0)x=10;s=x?s+x:-1000;});return s;}
function search(q){q=q.trim().toLowerCase();if(!q)return[];return G.CALCS.map(function(c){return[score(c,q),c];}).filter(function(x){return x[0]>0;}).sort(function(a,b){return b[0]-a[0];}).slice(0,8).map(function(x){return x[1];});}
function mountSearch(box,idp,big){var inp=h('input',{type:'search',id:idp,placeholder:t('ph'),'aria-label':t('ph'),autocomplete:'off',role:'combobox','aria-expanded':'false','aria-controls':idp+'-l','aria-autocomplete':'list',enterkeyhint:'search'}),ul=h('ul',{class:'sug',id:idp+'-l',role:'listbox',hidden:true}),idx=-1,items=[];
 function close(){ul.hidden=true;inp.setAttribute('aria-expanded','false');idx=-1;inp.removeAttribute('aria-activedescendant');}
 function paint(){ul.textContent='';items=search(inp.value);if(!items.length){if(inp.value.trim()){ul.appendChild(h('li',{class:'empty',role:'option','aria-disabled':'true',text:t('none')}));ul.hidden=false;inp.setAttribute('aria-expanded','true');}else close();return;}
  items.forEach(function(c,i){var li=h('li',{role:'option',id:idp+'-o'+i,'aria-selected':'false'},[badge(c),h('div',null,[h('span',{text:c.name}),h('small',{text:catName(c.cat)})])]);li.addEventListener('mousedown',function(e){e.preventDefault();pick(c);});ul.appendChild(li);});ul.hidden=false;inp.setAttribute('aria-expanded','true');idx=-1;}
 function mark(){[].forEach.call(ul.children,function(li,i){li.setAttribute('aria-selected',i===idx?'true':'false');});if(idx>=0)inp.setAttribute('aria-activedescendant',idp+'-o'+idx);else inp.removeAttribute('aria-activedescendant');}
 function pick(c){close();inp.value='';go(href(c));}
 inp.addEventListener('input',paint);inp.addEventListener('focus',function(){if(inp.value)paint();});inp.addEventListener('blur',function(){setTimeout(close,120);});
 inp.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();if(ul.hidden)paint();idx=Math.min(items.length-1,idx+1);mark();}else if(e.key==='ArrowUp'){e.preventDefault();idx=Math.max(0,idx-1);mark();}else if(e.key==='Enter'){var c=items[idx>=0?idx:0];if(c){e.preventDefault();pick(c);}}else if(e.key==='Escape'){close();}});
 box.appendChild(inp);box.appendChild(ul);return inp;}

// ---------- home
function showHome(){cur_c=null;clearInterval(timer);document.title='Ganaka: free calculators that work offline | EknathaLabs';setMeta('Over 100 free calculators for finance, tax, health, education, math, dates, units, travel and DevOps. No sign-up, no ads, works offline.');
 app.textContent='';var L=lists(),active=store.get('ga-cat')||'all';
 var hq=h('div',{class:'hero-q'});
 app.appendChild(h('section',{class:'hero'},[h('h1',{text:'Ganaka'}),h('p',{class:'lede',text:t('tag')}),h('p',{class:'lede',style:'margin-top:-8px',text:t('sub',{n:G.CALCS.length,c:G.CATS.length})}),hq]));
 var hi=mountSearch(hq,'qh');
 var chips=h('div',{class:'chips',role:'group','aria-label':t('all')}),host=h('div');
 app.appendChild(chips);app.appendChild(host);
 function section(title,list,count){if(!list.length)return;host.appendChild(h('section',{class:'sec'},[h('h2',null,[title,count?h('span',{text:count}):null]),h('div',{class:'grid'},list.map(card))]));}
 function draw(){chips.textContent='';[['all',t('all')]].concat(G.CATS.map(function(c){return[c.id,catName(c.id)];})).forEach(function(x){chips.appendChild(h('button',{class:'chip',type:'button','aria-pressed':String(active===x[0]),text:x[1],onclick:function(){active=x[0];store.set('ga-cat',active);draw();}}));});
  host.textContent='';
  if(active==='all'){section(t('favs'),L.fav.map(function(i){return G.byId[i];}));section(t('recent'),L.rec.slice(0,4).map(function(i){return G.byId[i];}));section(t('popular'),POP.map(function(i){return G.byId[i];}));}
  G.CATS.forEach(function(cat){if(active!=='all'&&active!==cat.id)return;var l=G.CALCS.filter(function(c){return c.cat===cat.id;});section(catName(cat.id),l,l.length);});}
 draw();
 app.appendChild(h('p',{class:'note',text:t('englishNote')+' '+t('offline')}));}

// ---------- calculator page
function setMeta(d){var m=$('meta[name=description]');if(m)m.setAttribute('content',d);}
function showCalc(c){cur_c=c;clearInterval(timer);document.title=c.name+' | Ganaka by EknathaLabs';setMeta(c.desc+' Free, no sign-up, works offline.');
 var rec=lists().rec.filter(function(i){return i!==c.id;});rec.unshift(c.id);setList('ga-rec',rec.slice(0,12));
 app.textContent='';var init=stateFromUrl(c),vals={},els={};
 c.fields.forEach(function(f){vals[f.id]=init[f.id]!=null?init[f.id]:defOf(f);});
 var out=h('div',{id:'out','aria-live':'polite'}),form=h('form',{novalidate:true,onsubmit:function(e){e.preventDefault();run();}});
 var timerRun;function later(){clearTimeout(timerRun);timerRun=setTimeout(run,90);}
 function fieldEl(f){var wrap=h('div',{class:'fld'}),id='f-'+f.id,el;
  if(f.t==='c'){el=h('input',{type:'checkbox',id:id});el.checked=vals[f.id]==='1';el.addEventListener('change',function(){vals[f.id]=el.checked?'1':'0';later();});wrap.className='fld';wrap.appendChild(h('div',{class:'chk'},[el,h('label',{for:id,text:f.label})]));}
  else if(f.t==='rows'){var tb=h('table',{class:'rowsed'}),body=h('tbody');tb.appendChild(h('thead',null,[h('tr',null,f.cols.map(function(x){return h('th',{scope:'col',text:x});}).concat([h('th',{class:'sr',text:'Remove'})]))]));tb.appendChild(body);
   function draw(){body.textContent='';vals[f.id].forEach(function(r,i){body.appendChild(h('tr',null,f.cols.map(function(cn,j){var inp=h('input',{value:r[j],'aria-label':cn+' '+(i+1),type:'text',inputmode:j===0?'text':'decimal'});inp.addEventListener('input',function(){r[j]=inp.value;later();});return h('td',null,[inp]);}).concat([h('td',null,[h('button',{type:'button','aria-label':'Remove row '+(i+1),text:'×',onclick:function(){vals[f.id].splice(i,1);draw();later();}})])])));});}
   draw();wrap.appendChild(h('div',{class:'lbl',text:f.label}));wrap.appendChild(tb);wrap.appendChild(h('button',{type:'button',class:'abtn addrow',text:'+ '+t('addRow'),onclick:function(){vals[f.id].push(f.cols.map(function(){return'';}));draw();later();}}));return wrap;}
  else{if(f.t==='s'){el=h('select',{id:id},f.opts.map(function(o){return h('option',{value:String(o[0]),text:o[1]});}));el.value=vals[f.id];if(el.value!==vals[f.id]){el.selectedIndex=0;vals[f.id]=el.value;}}
   else if(f.t==='ta'){el=h('textarea',{id:id,rows:4,spellcheck:'false'});el.value=vals[f.id];}
   else if(f.t==='d'){el=h('input',{id:id,type:'date'});el.value=vals[f.id];}
   else if(f.t==='dt'){el=h('input',{id:id,type:'datetime-local'});el.value=vals[f.id];}
   else{el=h('input',{id:id,type:'text',inputmode:f.t==='n'?'decimal':'text',autocomplete:'off',spellcheck:'false',autocapitalize:'off'});el.value=vals[f.id];}
   el.addEventListener('input',function(){vals[f.id]=el.value;later();});el.addEventListener('change',function(){vals[f.id]=el.value;later();});
   wrap.appendChild(h('label',{for:id,text:f.label}));wrap.appendChild(el);}
  els[f.id]=el;return wrap;}
 c.fields.forEach(function(f){form.appendChild(fieldEl(f));});
 var favs=lists().fav,isFav=favs.indexOf(c.id)>=0;
 var fbtn=h('button',{type:'button',class:'abtn','aria-pressed':String(isFav),text:(isFav?'★ '+t('unfav'):'☆ '+t('fav')),onclick:function(){var l=lists().fav,i=l.indexOf(c.id);if(i>=0)l.splice(i,1);else l.unshift(c.id);setList('ga-fav',l);var on=i<0;fbtn.setAttribute('aria-pressed',String(on));fbtn.textContent=on?'★ '+t('unfav'):'☆ '+t('fav');}});
 var acts=h('div',{class:'acts'},[fbtn,h('button',{type:'button',class:'abtn',text:t('copyLink'),onclick:function(){copy(shareUrl(),t('copied'));}}),h('button',{type:'button',class:'abtn',text:t('copyRes'),onclick:function(){copy(resText(),t('copiedRes'));}}),h('button',{type:'button',class:'abtn',text:t('print'),onclick:function(){window.print();}}),h('button',{type:'button',class:'abtn',text:t('reset'),onclick:function(){go(href(c));}})]);
 function shareUrl(){var q=new URLSearchParams();c.fields.forEach(function(f){var d=defOf(f),v=vals[f.id];if(JSON.stringify(v)!==JSON.stringify(d))q.set(f.id,f.t==='rows'?JSON.stringify(v):v);});var s=q.toString();return location.origin+href(c)+(s?'?'+s:'');}
 var lastText='';function resText(){return c.name+'\n'+lastText;}
 var left=h('section',{class:'panel','aria-labelledby':'inh'},[h('h2',{id:'inh',text:t('inputs')}),form]),right=h('section',{class:'panel','aria-labelledby':'outh'},[h('h2',{id:'outh',text:t('result')}),out]);
 var cat=catName(c.cat);
 app.appendChild(h('nav',{class:'crumbs','aria-label':'Breadcrumb'},[h('a',{href:'/','data-nav':'1',text:'Ganaka'}),'›',h('a',{href:'/#'+c.cat,'data-nav':'1',text:cat})]));
 app.appendChild(h('h1',{text:c.name}));app.appendChild(h('p',{class:'lede',text:c.desc}));app.appendChild(acts);app.appendChild(h('div',{class:'work'},[left,right]));
 var rel=G.CALCS.filter(function(x){return x.cat===c.cat&&x.id!==c.id;}),i0=G.CALCS.indexOf(c),relc=[];G.CALCS.forEach(function(x){if(x.cat===c.cat&&x.id!==c.id)relc.push(x);});var ri=relc.filter(function(x){return G.CALCS.indexOf(x)>i0;}).concat(relc.filter(function(x){return G.CALCS.indexOf(x)<i0;})).slice(0,4);
 app.appendChild(h('div',{class:'under'},[h('section',null,[h('h2',{text:t('formula')}),h('p',{class:'formula',text:c.formula})]),ri.length?h('section',{class:'rel'},[h('h2',{text:t('related')}),h('div',{class:'grid'},ri.map(card))]):null]));

 function readValues(){var v={},bad=null;c.fields.forEach(function(f){var x=vals[f.id];if(f.t==='n'){var n=parseNum(x);if(isNaN(n)&&!bad)bad=f.label;v[f.id]=n;}else if(f.t==='s'){var o=f.opts.filter(function(o){return String(o[0])===String(x);})[0];v[f.id]=o?o[0]:x;}else if(f.t==='c')v[f.id]=x==='1';else if(f.t==='rows')v[f.id]=x;else v[f.id]=x;});return{v:v,bad:bad};}
 function run(){var rv=readValues();out.textContent='';history.replaceState(null,'',shareUrl().replace(location.origin,''));lastText='';
  if(rv.bad){out.appendChild(h('div',{class:'err',role:'alert',text:t('invalid',{f:rv.bad})}));return;}
  var o;try{o=c.calc(rv.v);}catch(e){out.appendChild(h('div',{class:'err',role:'alert',text:e.user||/^(Unexpected|Missing|Unknown)/.test(e.message)?e.message:'Could not calculate. Check the inputs.'}));if(!e.user)try{console.warn(e);}catch(_){}return;}
  if(o.res.some(function(r){return typeof r.value==='number'&&!isFinite(r.value);})){out.appendChild(h('div',{class:'err',role:'alert',text:'These inputs do not give a valid result. Check the numbers.'}));return;}
  var res=o.res,hero=res.filter(function(r){return r.hero;})[0]||res[0];
  var hv=h('div',{class:'hero-res'},[h('div',{class:'l',text:hero.label}),h('div',{class:'v'+(hero.kind==='pre'?' pre':''),text:fmt(hero)})]);if(hero.swatch)hv.firstChild.nextSibling.prepend(h('span',{class:'sw',style:'background:'+hero.swatch}));
  if(hero.kind==='cur'&&isFinite(hero.value)&&Math.abs(hero.value)>=1&&Math.abs(hero.value)<1e15){hv.appendChild(h('div',{class:'w',text:t('inWords')+': '+(function(w){return w.charAt(0).toUpperCase()+w.slice(1);})((hero.value<0?'minus ':'')+G.words(Math.round(Math.abs(hero.value)),set.fmt==='in'))}));}
  out.appendChild(hv);lastText=hero.label+': '+fmt(hero)+'\n';
  var rest=res.filter(function(r){return r!==hero;});if(rest.length){var g=h('div',{class:'res'});rest.forEach(function(r){var vv=h('div',{class:'v'+(r.kind==='pre'?' pre':''),text:fmt(r)});g.appendChild(h('div',null,[h('div',{class:'l',text:r.label}),vv]));lastText+=r.label+': '+fmt(r).replace(/\n/g,' ')+'\n';});out.appendChild(g);}
  if(o.chart)out.appendChild(chart(o.chart));
  if(o.table)out.appendChild(table(o.table));
  if(o.note)out.appendChild(h('p',{class:'note',text:o.note}));}
 run();if(c.live)timer=setInterval(run,1000);}

// ---------- chart and table
var PAL=['#2456b8','#e63e2d','#1a7a48','#c78b00','#6a3fc0','#0a6f7d'];
function chart(ch){var box=h('div',{class:'chart'}),NS='http://www.w3.org/2000/svg';function s(tag,a){var e=document.createElementNS(NS,tag);for(var k in a)e.setAttribute(k,a[k]);return e;}
 if(ch.type==='donut'){var tot=ch.data.reduce(function(a,d){return a+Math.max(0,d[1]);},0)||1,svg=s('svg',{viewBox:'0 0 120 120',width:150,height:150,role:'img','aria-label':ch.data.map(function(d){return d[0]+' '+Math.round(d[1]/tot*100)+'%';}).join(', ')}),a0=-Math.PI/2,R=44,r=0;
  ch.data.forEach(function(d,i){var fr=Math.max(0,d[1])/tot,a1=a0+fr*2*Math.PI;if(fr>=.9999){svg.appendChild(s('circle',{cx:60,cy:60,r:R,fill:'none',stroke:PAL[i%6],'stroke-width':22}));}else if(fr>0){var x0=60+R*Math.cos(a0),y0=60+R*Math.sin(a0),x1=60+R*Math.cos(a1),y1=60+R*Math.sin(a1);svg.appendChild(s('path',{d:'M'+x0+' '+y0+'A'+R+' '+R+' 0 '+(fr>.5?1:0)+' 1 '+x1+' '+y1,fill:'none',stroke:PAL[i%6],'stroke-width':22}));}a0=a1;});
  box.appendChild(svg);box.appendChild(h('ul',{class:'legend'},ch.data.map(function(d,i){return h('li',null,[h('i',{style:'background:'+PAL[i%6]}),d[0]+': '+Math.round(Math.max(0,d[1])/tot*100)+'%']);})));}
 else if(ch.type==='plot'){var W=360,H=200,P=28,y0=ch.y0,y1=ch.y1;if(y1===y0){y1+=1;y0-=1;}var svg2=s('svg',{viewBox:'0 0 '+W+' '+H,width:'100%',style:'max-width:480px',role:'img','aria-label':'Graph of the function'});
  function X(x){return P+(x-ch.x0)/(ch.x1-ch.x0)*(W-P-8);}function Y(y){return H-P-(y-y0)/(y1-y0)*(H-P-8);}
  svg2.appendChild(s('rect',{x:P,y:8,width:W-P-8,height:H-P-8,fill:'none',stroke:'currentColor','stroke-opacity':.3}));
  if(y0<0&&y1>0)svg2.appendChild(s('line',{x1:P,x2:W-8,y1:Y(0),y2:Y(0),stroke:'currentColor','stroke-opacity':.5}));if(ch.x0<0&&ch.x1>0)svg2.appendChild(s('line',{y1:8,y2:H-P,x1:X(0),x2:X(0),stroke:'currentColor','stroke-opacity':.5}));
  var d='',pen=false;ch.pts.forEach(function(p){if(!p){pen=false;return;}d+=(pen?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1);pen=true;});svg2.appendChild(s('path',{d:d,fill:'none',stroke:PAL[0],'stroke-width':2}));
  [[ch.x0,P,H-12,'start'],[ch.x1,W-8,H-12,'end']].forEach(function(l){var tx=s('text',{x:l[1],y:l[2],'text-anchor':l[3],'font-size':10,fill:'currentColor'});tx.textContent=G.fmtPlain(l[0],4);svg2.appendChild(tx);});
  [[y0,H-P],[y1,16]].forEach(function(l){var tx=s('text',{x:P-3,y:l[1],'text-anchor':'end','font-size':10,fill:'currentColor'});tx.textContent=G.fmtPlain(l[0],3);svg2.appendChild(tx);});box.appendChild(svg2);}
 return box;}
function table(tb){var th=h('tr',null,tb.cols.map(function(c){return h('th',{scope:'col',text:c});})),body=h('tbody');tb.rows.forEach(function(r){body.appendChild(h('tr',null,r.map(function(v,i){return h('td',{text:typeof v==='number'?fmt({value:v,kind:tb.kinds[i]==='text'?'num':tb.kinds[i]}):String(v)});})));});
 return h('div',{class:'tbl',tabindex:'0',role:'region','aria-label':tb.title},[h('table',null,[h('caption',{text:tb.title}),h('thead',null,[th]),body])]);}

// ---------- shell
function buildChrome(){var hd=$('#hdr');hd.textContent='';
 var bar=h('div',{class:'wrap bar'});
 bar.appendChild(h('a',{class:'brand',href:'/','data-nav':'1','aria-label':'Ganaka home'},[h('b',null,[mark()]),h('span',null,['Ganaka',h('small',{text:'EknathaLabs'})])]));
 var hq=h('div',{class:'hq',id:'hq'});bar.appendChild(hq);
 var grow=h('span',{class:'grow'});bar.appendChild(grow);
 bar.appendChild(h('a',{class:'ibtn',href:ORIGIN+(set.lang==='en'?'/':'/'+set.lang+'/'),'aria-label':'EknathaLabs'},[h('span',{text:'⌂'}),h('span',{class:'lab',text:'EknathaLabs'})]));
 // settings popover
 var panel=h('div',{class:'pop-panel',id:'setp',hidden:true,role:'dialog','aria-label':t('settings')}),btn=h('button',{class:'ibtn',type:'button','aria-expanded':'false','aria-controls':'setp'},[h('span',{text:'⚙'}),h('span',{class:'lab',text:t('settings')})]);
 function sel(id,label,opts,val,fn){var s=h('select',{id:id},opts.map(function(o){return h('option',{value:o[0],text:o[1]});}));s.value=val;s.addEventListener('change',function(){fn(s.value);});return[h('label',{for:id,text:label}),s];}
 function build(){panel.textContent='';
  sel('s-lang',t('language'),G.LANGS.map(function(l){return[l[0],l[1]];}),set.lang,function(v){set.lang=v;save();applyLang();buildChrome();route();}).forEach(function(e){panel.appendChild(e);});
  sel('s-cur',t('currency'),[['₹','₹ INR'],['$','$ USD'],['€','€ EUR'],['£','£ GBP'],['¥','¥ JPY / CNY'],['AED ','AED'],['',t('nocur')]],set.cur,function(v){set.cur=v;save();rerun();}).forEach(function(e){panel.appendChild(e);});
  sel('s-fmt',t('numfmt'),[['in',t('indian')],['intl',t('intl')]],set.fmt,function(v){set.fmt=v;save();rerun();}).forEach(function(e){panel.appendChild(e);});
  panel.appendChild(h('label',{text:t('theme')}));var sg=h('div',{class:'seg',role:'group','aria-label':t('theme')});['light','dark','new'].forEach(function(k){sg.appendChild(h('button',{type:'button','aria-pressed':String(set.theme===k),text:t(k),onclick:function(){set.theme=k;save();applyTheme();[].forEach.call(sg.children,function(b,i){b.setAttribute('aria-pressed',String(['light','dark','new'][i]===k));});}}));});panel.appendChild(sg);}
 build();
 function close(f){panel.hidden=true;btn.setAttribute('aria-expanded','false');if(f)btn.focus();}
 btn.addEventListener('click',function(){var o=panel.hidden;panel.hidden=!o;btn.setAttribute('aria-expanded',String(o));if(o)$('select',panel).focus();});
 var pop=h('div',{class:'pop'},[btn,panel]);bar.appendChild(pop);
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden)close(true);});
 document.addEventListener('click',function(e){if(!panel.hidden&&!pop.contains(e.target))close(false);});
 hd.appendChild(bar);mountSearch(hq,'qs');
 var sk=$('.skip');if(sk)sk.textContent=t('skip');
 var ft=$('#ftr');ft.textContent='';ft.appendChild(h('div',{class:'wrap'},[h('span',null,[t('part')+' · ',h('a',{href:ORIGIN+(set.lang==='en'?'/':'/'+set.lang+'/'),text:'eknathalabs.com'})]),h('span',{text:t('englishNote')})]));}
function rerun(){if(cur_c)showCalc(cur_c);else showHome();}
function route(){var id=pathId(),c=G.byId[id];var home=!c;var hq=$('#hq');if(hq)hq.style.display=home?'none':'';if(c)showCalc(c);else showHome();if(home&&location.hash){var cid=location.hash.slice(1);if(G.CATS.some(function(x){return x.id===cid;})){store.set('ga-cat',cid);showHome();}}}
function init(){app=$('#app');applyTheme();applyLang();buildChrome();
 document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-nav]');if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();var u=a.getAttribute('href');go(u);});
 window.addEventListener('popstate',route);
 document.addEventListener('keydown',function(e){var tg=e.target,typing=tg&&/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName);if((e.key==='/'&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){e.preventDefault();var i=$('#hq').style.display==='none'?$('#qh'):$('#qs');if(i)i.focus();}});
 route();
 if('serviceWorker' in navigator&&location.protocol==='https:'||location.hostname==='localhost'){try{navigator.serviceWorker.register('/sw.js');}catch(e){}}}
G.init=init;
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',init);
})(window.G);
