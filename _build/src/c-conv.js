(function(G){'use strict';
var N=G.N,S=G.S,R=G.R,def=G.def,fail=G.fail;
function need(c,m){if(!c)fail(m);}
// factor = value of 1 unit in the base unit
var U={
 length:{base:'m',u:{mm:.001,cm:.01,m:1,km:1000,inch:.0254,foot:.3048,yard:.9144,mile:1609.344,'nautical mile':1852,micron:1e-6,'light year':9.4607e15}},
 mass:{base:'kg',u:{mg:1e-6,g:.001,kg:1,tonne:1000,quintal:100,ounce:.028349523125,pound:.45359237,stone:6.35029318,tola:.01166,'US ton':907.18474}},
 area:{base:'m²',u:{'cm²':1e-4,'m²':1,'km²':1e6,'hectare':1e4,acre:4046.8564224,'sq foot':.09290304,'sq yard':.83612736,'sq mile':2589988.110336,cent:40.468564,guntha:101.17141,bigha:2529.2853}},
 volume:{base:'L',u:{mL:.001,L:1,'m³':1000,'tsp (US)':.00492892,'tbsp (US)':.0147868,'fl oz (US)':.0295735,'cup (US)':.236588,'pint (US)':.473176,'quart (US)':.946353,'gallon (US)':3.78541,'gallon (UK)':4.54609}},
 speed:{base:'m/s',u:{'m/s':1,'km/h':1/3.6,mph:.44704,knot:.514444,'ft/s':.3048,Mach:340.29}},
 data:{base:'byte',u:{bit:.125,byte:1,KB:1e3,MB:1e6,GB:1e9,TB:1e12,PB:1e15,KiB:1024,MiB:1048576,GiB:1073741824,TiB:1099511627776}},
 time:{base:'s',u:{ms:.001,second:1,minute:60,hour:3600,day:86400,week:604800,month:2629746,year:31556952}},
 energy:{base:'J',u:{J:1,kJ:1000,cal:4.184,kcal:4184,Wh:3600,kWh:3.6e6,BTU:1055.056,'ft·lbf':1.355818,eV:1.602177e-19}},
 power:{base:'W',u:{W:1,kW:1000,MW:1e6,hp:745.6999,'BTU/h':.293071}},
 pressure:{base:'Pa',u:{Pa:1,kPa:1000,bar:1e5,atm:101325,psi:6894.757,mmHg:133.322,torr:133.322}},
 angle:{base:'deg',u:{degree:1,radian:180/Math.PI,gradian:.9,turn:360,arcminute:1/60,arcsecond:1/3600}},
 force:{base:'N',u:{N:1,kN:1000,kgf:9.80665,lbf:4.448222,dyne:1e-5}},
 fuel:{base:'km/L',u:{'km/L':1,'L/100km':0,mpg_us:.425144,mpg_uk:.354006}}
};
function toTemp(x,from){return from==='C'?x:from==='F'?(x-32)*5/9:from==='K'?x-273.15:x*5/4;}
function fromTemp(c,to){return to==='C'?c:to==='F'?c*9/5+32:to==='K'?c+273.15:c*4/5;}
var cats=Object.keys(U).map(function(k){return[k,k[0].toUpperCase()+k.slice(1)];}).concat([['temperature','Temperature']]);
function unitList(c){return c==='temperature'?['C','F','K','R']:Object.keys(U[c].u);}
G.UNITS=U;
def({id:'unit-converter',cat:'conv',name:'Unit Converter',desc:'Length, mass, area, volume, speed, data, time, energy, power, pressure, angle, force, temperature and fuel.',keywords:'convert metric imperial feet inches kg pounds celsius fahrenheit',ab:'UC',
 fields:[S('c','Category',cats,'length'),N('x','Value',1),G.TX('from','From (unit)','mile'),G.TX('to','To (unit)','km')],formula:'Value × (factor of source ÷ factor of target). Units can be typed; short names like km, ft, lb, kg, mph, F and C work.',
 units:true,
 calc:function(v){var cat=v.c,fr=resolve(cat,v.from),to=resolve(cat,v.to);need(fr,'Unknown unit "'+v.from+'" for '+cat);need(to,'Unknown unit "'+v.to+'" for '+cat);var out;
  if(cat==='temperature'){out=fromTemp(toTemp(v.x,fr),to);}
  else if(cat==='fuel'){var kmL=fr==='L/100km'?100/v.x:v.x*U.fuel.u[fr];out=to==='L/100km'?100/kmL:kmL/U.fuel.u[to];}
  else out=v.x*U[cat].u[fr]/U[cat].u[to];
  var table=unitList(cat).map(function(u){var o=cat==='temperature'?fromTemp(toTemp(v.x,fr),u):cat==='fuel'?(u==='L/100km'?100/(fr==='L/100km'?100/v.x:v.x*U.fuel.u[fr]):(fr==='L/100km'?100/v.x:v.x*U.fuel.u[fr])/U.fuel.u[u]):v.x*U[cat].u[fr]/U[cat].u[u];return[u,o];});
  return{res:[R(v.x+' '+fr+' =',out,'plain',{hero:1,unit:to})],table:{title:'In every '+cat+' unit',cols:['Unit','Value'],kinds:['text','plain'],rows:table}};}});
var AL={m:'m',meter:'m',metre:'m',meters:'m',km:'km',kilometer:'km',kilometre:'km',kilometers:'km',cm:'cm',mm:'mm',in:'inch',inches:'inch',ft:'foot',feet:'foot',yd:'yard',yards:'yard',mi:'mile',miles:'mile',nm:'nautical mile',
 g:'g',gram:'g',grams:'g',kg:'kg',lb:'pound',lbs:'pound',pounds:'pound',oz:'ounce',ounces:'ounce',t:'tonne',ton:'US ton',tons:'US ton',
 l:'L',litre:'L',liter:'L',liters:'L',ml:'mL',gal:'gallon (US)',gallon:'gallon (US)',cup:'cup (US)',cups:'cup (US)',
 sqft:'sq foot','sq ft':'sq foot',sqm:'m²','sq m':'m²',ha:'hectare',acres:'acre',sqkm:'km²',
 kmh:'km/h','kph':'km/h',mph:'mph',kn:'knot',knots:'knot','m/s':'m/s',
 b:'byte',bytes:'byte',kb:'KB',mb:'MB',gb:'GB',tb:'TB',pb:'PB',
 s:'second',sec:'second',seconds:'second',min:'minute',minutes:'minute',h:'hour',hr:'hour',hours:'hour',days:'day',weeks:'week',months:'month',years:'year',yr:'year',
 c:'C',celsius:'C',f:'F',fahrenheit:'F',k:'K',kelvin:'K',deg:'degree',degrees:'degree',rad:'radian',
 j:'J',joule:'J',joules:'J',kj:'kJ',kcal:'kcal',cal:'cal',wh:'Wh',kwh:'kWh',w:'W',kw:'kW',watt:'W',hp:'hp',pa:'Pa',kpa:'kPa',psi:'psi',atm:'atm',bar:'bar',n:'N',kn_:'kN',mpg:'mpg_us'};
function resolve(cat,s){s=String(s).trim();if(!s)return null;var list=unitList(cat);for(var i=0;i<list.length;i++)if(list[i]===s)return list[i];var low=s.toLowerCase();for(var j=0;j<list.length;j++)if(list[j].toLowerCase()===low)return list[j];var a=AL[low];if(a&&list.indexOf(a)>=0)return a;if(cat==='temperature'){var t=low.replace('°','');if(AL[t]&&list.indexOf(AL[t])>=0)return AL[t];}return null;}
G.resolveUnit=resolve;
def({id:'number-base',cat:'conv',name:'Number Base Converter',desc:'Binary, octal, decimal and hexadecimal (any size).',keywords:'binary hex octal base2 base16',
 fields:[G.TX('x','Number','255'),S('b','Input base',[[10,'Decimal'],[2,'Binary'],[8,'Octal'],[16,'Hexadecimal'],[36,'Base 36']])],formula:'Parsed and printed with BigInt so there is no precision loss.',
 calc:function(v){var b=+v.b,s=String(v.x).trim().toLowerCase().replace(/^0[xbo]/,'').replace(/[_\s]/g,'');need(s,'Enter a number');var dig='0123456789abcdefghijklmnopqrstuvwxyz'.slice(0,b),n=0n;for(var i=0;i<s.length;i++){var d=dig.indexOf(s[i]);need(d>=0,'"'+s[i]+'" is not valid in base '+b);n=n*BigInt(b)+BigInt(d);}return{res:[R('Decimal',n.toString(10),'bigint',{hero:1}),R('Binary',n.toString(2),'text'),R('Octal',n.toString(8),'text'),R('Hexadecimal',n.toString(16).toUpperCase(),'text')]};}});
def({id:'color',cat:'conv',name:'Colour Converter',desc:'HEX, RGB, HSL and CMYK, with a contrast check against black and white.',keywords:'color hex rgb hsl css',ab:'RGB',
 fields:[G.TX('c','Colour (hex, rgb() or hsl())','#0f766e')],formula:'Standard sRGB conversions; contrast ratio per WCAG 2.',
 calc:function(v){var s=String(v.c).trim().toLowerCase(),r,g,b,m;if((m=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s))){var h=m[1];if(h.length===3)h=h.replace(/./g,'$&$&');r=parseInt(h.slice(0,2),16);g=parseInt(h.slice(2,4),16);b=parseInt(h.slice(4,6),16);}else if((m=/^rgb\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)\s*\)$/.exec(s))){r=+m[1];g=+m[2];b=+m[3];}else if((m=/^hsl\(\s*(\d+)[,\s]+(\d+)%?[,\s]+(\d+)%?\s*\)$/.exec(s))){var H=m[1]/360,Sa=m[2]/100,L=m[3]/100,q=L<.5?L*(1+Sa):L+Sa-L*Sa,p=2*L-q;function hu(t){t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;}r=Math.round(hu(H+1/3)*255);g=Math.round(hu(H)*255);b=Math.round(hu(H-1/3)*255);}else fail('Use #0f766e, rgb(15,118,110) or hsl(175,77%,26%)');need([r,g,b].every(function(x){return x>=0&&x<=255;}),'RGB values must be 0-255');
  var R1=r/255,G1=g/255,B1=b/255,mx=Math.max(R1,G1,B1),mn=Math.min(R1,G1,B1),l=(mx+mn)/2,d=mx-mn,hh=0,ss=0;if(d){ss=l>.5?d/(2-mx-mn):d/(mx+mn);hh=mx===R1?(G1-B1)/d+(G1<B1?6:0):mx===G1?(B1-R1)/d+2:(R1-G1)/d+4;hh*=60;}
  var k=1-mx,c=k<1?(1-R1-k)/(1-k):0,mm=k<1?(1-G1-k)/(1-k):0,y=k<1?(1-B1-k)/(1-k):0;function lin(x){return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4);}var L2=.2126*lin(R1)+.7152*lin(G1)+.0722*lin(B1),cw=1.05/(L2+.05),cb=(L2+.05)/.05;
  var hex='#'+[r,g,b].map(function(x){return x.toString(16).padStart(2,'0');}).join('');return{res:[R('HEX',hex,'text',{hero:1,swatch:hex}),R('RGB','rgb('+r+', '+g+', '+b+')','text'),R('HSL','hsl('+Math.round(hh)+', '+Math.round(ss*100)+'%, '+Math.round(l*100)+'%)','text'),R('CMYK',Math.round(c*100)+'%, '+Math.round(mm*100)+'%, '+Math.round(y*100)+'%, '+Math.round(k*100)+'%','text'),R('Contrast with white',cw,'x'),R('Contrast with black',cb,'x'),R('Readable text colour',cw>=cb?'White':'Black','text')]};}});
def({id:'shoe-size',cat:'conv',name:'Clothing & Shoe Size Converter',desc:'Shoe sizes between India, UK, US and EU.',keywords:'size chart footwear',
 fields:[S('r','Region',[['uk','UK / India'],['us_m','US men'],['us_w','US women'],['eu','EU']]),N('s','Size',8)],formula:'Approximate: UK = EU − 33.5 = US men − 1 = US women − 2.5. Brands vary by up to a full size.',
 calc:function(v){var uk=v.r==='uk'?v.s:v.r==='us_m'?v.s-1:v.r==='us_w'?v.s-2.5:v.s-33.5;return{res:[R('UK / India',uk,'num',{hero:1}),R('US men',uk+1,'num'),R('US women',uk+2.5,'num'),R('EU',uk+33.5,'num')],note:'Always check the brand\'s own size chart.'};}});
def({id:'text-case',cat:'conv',name:'Word & Character Counter',desc:'Words, characters, sentences and reading time.',keywords:'text counter reading time',ab:'Aa',
 fields:[G.TA('t','Text','Paste or type your text here.')],formula:'Reading time at 230 words per minute; speaking at 130.',
 calc:function(v){var t=String(v.t),w=t.trim()?t.trim().split(/\s+/).length:0;return{res:[R('Words',w,'int',{hero:1}),R('Characters',t.length,'int'),R('Characters (no spaces)',t.replace(/\s/g,'').length,'int'),R('Sentences',(t.match(/[.!?]+(\s|$)/g)||[]).length,'int'),R('Paragraphs',t.split(/\n\s*\n/).filter(function(x){return x.trim();}).length,'int'),R('Reading time',G.round(w/230,1)+' min','text'),R('Speaking time',G.round(w/130,1)+' min','text')]};}});
})(typeof window!=='undefined'?window.G:globalThis.G);
