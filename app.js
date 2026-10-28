/* Ganaka core: registry, field builders, math and date helpers, expression compiler. No DOM here,
   so the build can load this file in Node to export metadata for the per-calculator pages. */
(function (G) {
  'use strict';
  G.CALCS = []; G.byId = {};
  G.CATS = [
    { id: 'fin', color: '#2456b8' }, { id: 'biz', color: '#c62833' }, { id: 'health', color: '#1a7a48' },
    { id: 'edu', color: '#6a3fc0' }, { id: 'math', color: '#9a4a00' }, { id: 'date', color: '#0a6f7d' },
    { id: 'conv', color: '#8a2f8a' }, { id: 'travel', color: '#7a5200' }, { id: 'tech', color: '#3a3d44' },
  ];
  G.MARK = 'M29.2 23.2V35.5Q29.2 37.5 28.4 38.4Q27.6 39.4 26.1 39.4Q25 39.4 23.8 38.7Q22.6 38.1 21.6 37Q20.7 36 20 34.8Q19.4 33.6 19.4 32.5Q19.4 31.2 20.1 30.4Q20.9 29.6 22.9 29.6L23 29.7V23.2H18V18.2H46V23.2H41.9V45.8H35.7V23.2Z';
  G.CAT_EN = { fin: 'Finance', biz: 'Tax & Business', health: 'Health & Fitness', edu: 'Education', math: 'Math', date: 'Date & Time', conv: 'Converters', travel: 'Travel', tech: 'Tech & DevOps' };
  G.def = function (c) {
    c.fields = c.fields || []; c.keywords = c.keywords || '';
    if (!c.ab) c.ab = c.name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).join('').slice(0, 3).toUpperCase();
    G.CALCS.push(c); G.byId[c.id] = c; return c;
  };
  // ---- field builders
  var A = Object.assign;
  G.N = function (id, label, def, o) { return A({ t: 'n', id: id, label: label, def: def }, o); };
  G.S = function (id, label, opts, def, o) {
    var os = opts.map(function (x) { return Array.isArray(x) ? x : [x, String(x)]; });
    return A({ t: 's', id: id, label: label, opts: os, def: def === undefined ? os[0][0] : def }, o);
  };
  G.TX = function (id, label, def, o) { return A({ t: 't', id: id, label: label, def: def == null ? '' : def }, o); };
  G.TA = function (id, label, def, o) { return A({ t: 'ta', id: id, label: label, def: def == null ? '' : def }, o); };
  G.DA = function (id, label, def, o) { return A({ t: 'd', id: id, label: label, def: def }, o); };
  G.DT = function (id, label, def, o) { return A({ t: 'dt', id: id, label: label, def: def }, o); };
  G.CB = function (id, label, def, o) { return A({ t: 'c', id: id, label: label, def: !!def }, o); };
  G.ROWS = function (id, label, cols, def, o) { return A({ t: 'rows', id: id, label: label, cols: cols, def: def }, o); };
  G.R = function (label, value, kind, o) { return A({ label: label, value: value, kind: kind || 'num' }, o); };
  G.cap = function (v, ids, max, what) { ids.forEach(function (k) { if (!(Math.abs(v[k]) <= max)) G.fail((what || 'Value') + ' is too large (maximum ' + max + ')'); }); };
  G.fail = function (m) { var e = new Error(m); e.user = true; throw e; };

  // ---- math helpers
  G.gcd = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; };
  G.lcm = function (a, b) { return a / G.gcd(a, b) * b; };
  G.round = function (x, d) { var p = Math.pow(10, d || 0); return Math.round((x + Number.EPSILON) * p) / p; };
  G.fact = function (n) { if (n < 0 || n !== Math.floor(n)) return NaN; var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; };
  G.sum = function (a) { return a.reduce(function (s, x) { return s + x; }, 0); };
  G.fv = function (P, rate, n) { return P * Math.pow(1 + rate, n); };
  G.pmt = function (P, r, n) { return r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1); };
  G.pv = function (pay, r, n) { return r === 0 ? pay * n : pay * (1 - Math.pow(1 + r, -n)) / r; };

  // ---- number to words (Indian and international)
  G.words = function (n, indian) {
    n = Math.floor(Math.abs(n)); if (!isFinite(n) || n === 0) return n === 0 ? 'zero' : '';
    if (n >= 1e15) return '';
    var ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    var tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    function two(x) { return x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? '-' + ones[x % 10] : ''); }
    function three(x) { var h = Math.floor(x / 100), r = x % 100; return (h ? ones[h] + ' hundred' + (r ? ' ' : '') : '') + (r ? two(r) : ''); }
    var parts = [];
    if (indian) {
      var cr = Math.floor(n / 1e7), la = Math.floor(n % 1e7 / 1e5), th = Math.floor(n % 1e5 / 1e3), rest = n % 1e3;
      if (cr) parts.push((cr >= 100 ? G.words(cr, true) : two(cr)) + ' crore');
      if (la) parts.push(two(la) + ' lakh'); if (th) parts.push(two(th) + ' thousand'); if (rest) parts.push(three(rest));
    } else {
      var names = ['', ' thousand', ' million', ' billion', ' trillion'], i = 0, x = n;
      while (x > 0) { var g = x % 1000; if (g) parts.unshift(three(g) + names[i]); x = Math.floor(x / 1000); i++; }
    }
    return parts.join(' ');
  };

  // ---- date helpers (all local-time, date-only)
  G.pd = function (s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); if (!m) return null; return new Date(+m[1], +m[2] - 1, +m[3]); };
  G.iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  G.today = function () { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  G.daysBetween = function (a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5); };
  G.addMonths = function (d, m) { var r = new Date(d.getFullYear(), d.getMonth() + m, 1), dim = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate(); r.setDate(Math.min(d.getDate(), dim)); return r; };
  G.addDays = function (d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); };
  G.ymd = function (a, b) { // calendar difference a -> b (a <= b): whole months first (day clamped to month end), then leftover days
    var m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()), t = G.addMonths(a, m);
    if (t > b) { m--; t = G.addMonths(a, m); }
    return { y: Math.floor(m / 12), m: m % 12, d: G.daysBetween(t, b) };
  };
  G.isoWeek = function (d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day); var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return { week: Math.ceil(((t - y0) / 864e5 + 1) / 7), year: t.getUTCFullYear() };
  };
  G.isLeap = function (y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; };
  G.DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  G.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  G.longDate = function (d) { return G.DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + G.MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };

  // ---- expression compiler: safe (no eval). Supports + - * / ^ % ! , implicit multiplication, functions, constants, variables
  var FN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2, exp: Math.exp,
    floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign, fact: G.fact, trunc: Math.trunc,
    min: Math.min, max: Math.max, pow: Math.pow, mod: function (a, b) { return a % b; }, gcd: G.gcd, lcm: G.lcm, atan2: Math.atan2,
    root: function (x, n) { return Math.sign(x) * Math.pow(Math.abs(x), 1 / n); },
  };
  var TRIG = { sin: 1, cos: 1, tan: 1 }, ATRIG = { asin: 1, acos: 1, atan: 1 };
  var CONST = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2 };
  G.compile = function (src, opt) {
    opt = opt || {}; var vars = opt.vars || [], deg = !!opt.deg;
    var s = String(src).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/\s+/g, ' ');
    var toks = [], i = 0, m;
    while (i < s.length) {
      var c = s[i];
      if (c === ' ') { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i)))) {
        // avoid eating "e" when it is the constant e (e.g. 2e or 2e*3)
        var txt = m[0]; if (m[2] && !/\d$/.test(txt)) txt = m[1];
        toks.push({ t: 'n', v: parseFloat(txt) }); i += txt.length; continue;
      }
      if ((m = /^[A-Za-z_][A-Za-z_0-9]*/.exec(s.slice(i)))) { toks.push({ t: 'i', v: m[0].toLowerCase() === m[0] ? m[0] : m[0].toLowerCase() }); i += m[0].length; continue; }
      if ('+-*/^(),!%'.indexOf(c) >= 0) { toks.push({ t: 'o', v: c }); i++; continue; }
      throw new Error('Unexpected "' + c + '"');
    }
    var p = 0;
    function peek() { return toks[p]; }
    function isOp(v) { var t = toks[p]; return t && t.t === 'o' && t.v === v; }
    function expr() { var l = term(); while (isOp('+') || isOp('-')) { var op = toks[p++].v, r = term(); l = bin(op, l, r); } return l; }
    function bin(op, a, b) { return op === '+' ? function (v) { return a(v) + b(v); } : op === '-' ? function (v) { return a(v) - b(v); } : op === '*' ? function (v) { return a(v) * b(v); } : function (v) { return a(v) / b(v); }; }
    function startsPrimary() { var t = toks[p]; return t && (t.t === 'n' || t.t === 'i' || (t.t === 'o' && t.v === '(')); }
    function term() {
      var l = unary();
      for (;;) {
        if (isOp('*') || isOp('/')) { var op = toks[p++].v, r = unary(); l = bin(op, l, r); }
        else if (startsPrimary()) { var r2 = unary(); l = bin('*', l, r2); }
        else return l;
      }
    }
    function unary() {
      if (isOp('-')) { p++; var u = unary(); return function (v) { return -u(v); }; }
      if (isOp('+')) { p++; return unary(); }
      return power();
    }
    function power() {
      var b = postfix();
      if (isOp('^')) { p++; var e = unary(); return function (v) { return Math.pow(b(v), e(v)); }; }
      return b;
    }
    function postfix() {
      var a = primary();
      for (;;) {
        if (isOp('!')) { p++; var f = a; a = (function (f) { return function (v) { return G.fact(f(v)); }; })(f); }
        else if (isOp('%')) { p++; var g = a; a = (function (g) { return function (v) { return g(v) / 100; }; })(g); }
        else return a;
      }
    }
    function primary() {
      var t = toks[p++]; if (!t) throw new Error('Unexpected end');
      if (t.t === 'n') { var n = t.v; return function () { return n; }; }
      if (t.t === 'o' && t.v === '(') { var e = expr(); if (!isOp(')')) throw new Error('Missing )'); p++; return e; }
      if (t.t === 'i') {
        var name = t.v;
        if (FN[name] && isOp('(')) {
          p++; var args = [];
          if (!isOp(')')) { args.push(expr()); while (isOp(',')) { p++; args.push(expr()); } }
          if (!isOp(')')) throw new Error('Missing )'); p++;
          var fn = FN[name];
          if (TRIG[name] && deg) return function (v) { return fn(args[0](v) * Math.PI / 180); };
          if (ATRIG[name] && deg) return function (v) { return fn(args[0](v)) * 180 / Math.PI; };
          return function (v) { return fn.apply(null, args.map(function (a) { return a(v); })); };
        }
        if (vars.indexOf(name) >= 0) return function (v) { return v[name]; };
        if (name in CONST) { var c = CONST[name]; return function () { return c; }; }
        if (FN[name]) throw new Error(name + ' needs ( )');
        throw new Error('Unknown "' + name + '"');
      }
      throw new Error('Unexpected "' + t.v + '"');
    }
    var tree = expr(); if (p < toks.length) throw new Error('Unexpected "' + toks[p].v + '"');
    return tree;
  };
  G.fmtPlain = function (x, sig) {
    if (!isFinite(x)) return String(x);
    if (x === 0) return '0'; var a = Math.abs(x);
    if (a >= 1e15 || a < 1e-9) return x.toExponential(8).replace(/\.?0+e/, 'e');
    var s = Number(x.toPrecision(sig || 12)); return String(s);
  };
})(typeof window !== 'undefined' ? (window.G = window.G || {}) : (globalThis.G = globalThis.G || {}));

;
(function(G){'use strict';
var N=G.N,S=G.S,R=G.R,def=G.def,fail=G.fail,pmt=G.pmt;
function need(c,m){if(!c)fail(m);}
function pos(v,ids){ids.forEach(function(k){need(isFinite(v[k])&&v[k]>=0,'Enter a valid '+k);});}
var FREQ=[[12,'Monthly'],[4,'Quarterly'],[2,'Half-yearly'],[1,'Yearly']];

// Indian tax config. Verify against the official Income Tax portal before relying on it.
G.TAX={fy:'FY 2026-27 (AY 2027-28)',
 newSlabs:[[400000,0],[800000,.05],[1200000,.10],[1600000,.15],[2000000,.20],[2400000,.25],[Infinity,.30]],
 oldSlabs:[[250000,0],[500000,.05],[1000000,.20],[Infinity,.30]],
 oldSlabsSenior:[[300000,0],[500000,.05],[1000000,.20],[Infinity,.30]],
 oldSlabsSuper:[[500000,0],[1000000,.20],[Infinity,.30]],
 newStd:75000,oldStd:50000,newRebateLimit:1200000,newRebate:60000,oldRebateLimit:500000,oldRebate:12500,cess:.04,
 surNew:[[5000000,0],[10000000,.10],[20000000,.15],[Infinity,.25]],
 surOld:[[5000000,0],[10000000,.10],[20000000,.15],[50000000,.25],[Infinity,.37]]};
function slabTax(inc,slabs){var t=0,prev=0;for(var i=0;i<slabs.length;i++){var up=slabs[i][0],r=slabs[i][1];if(inc>prev){t+=(Math.min(inc,up)-prev)*r;}prev=up;if(inc<=up)break;}return t;}
function sur(tax,inc,tbl){var r=0;for(var i=0;i<tbl.length;i++){if(inc<=tbl[i][0]){r=tbl[i][1];break;}}return tax*r;}
G.indiaTax=function(gross,regime,o){o=o||{};var T=G.TAX,ti,tax,rebate=0;
 if(regime==='new'){ti=Math.max(0,gross-T.newStd-(o.other||0));tax=slabTax(ti,T.newSlabs);
  if(ti<=T.newRebateLimit){rebate=Math.min(tax,T.newRebate);}
  else{var over=ti-T.newRebateLimit;if(tax-over>0&&tax>over){rebate=tax-over;}} // marginal relief
  tax-=rebate;var s=sur(tax,ti,T.surNew);}
 else{ti=Math.max(0,gross-T.oldStd-(o.ded||0));var sl=o.age>=80?T.oldSlabsSuper:o.age>=60?T.oldSlabsSenior:T.oldSlabs;tax=slabTax(ti,sl);
  if(ti<=T.oldRebateLimit){rebate=Math.min(tax,T.oldRebate);tax-=rebate;}var s=sur(tax,ti,T.surOld);}
 var cess=(tax+s)*T.cess;return{taxable:ti,slab:tax+rebate,rebate:rebate,tax:tax,sur:s,cess:cess,total:tax+s+cess};};

def({id:'emi',cat:'fin',name:'EMI Calculator',desc:'Monthly instalment, total interest and payoff schedule for any loan.',keywords:'loan home car personal installment',
 fields:[N('P','Loan amount',2500000),N('rate','Interest rate (% per year)',9,{step:.05}),N('n','Tenure',20),S('u','Tenure unit',[['y','Years'],['m','Months']])],
 formula:'EMI = P × r × (1+r)^n ÷ ((1+r)^n − 1), where r is the monthly rate and n the number of months.',
 calc:function(v){G.cap(v,['n'],v.u==='y'?100:1200,'Tenure');pos(v,['P','rate','n']);need(v.P>0&&v.n>0,'Amount and tenure must be above zero');var n=v.u==='y'?v.n*12:v.n,r=v.rate/1200,e=pmt(v.P,r,n),tot=e*n;
  var bal=v.P,rows=[],yr={};for(var k=1;k<=Math.round(n);k++){var i=bal*r,pr=Math.min(e-i,bal);bal-=pr;var y=Math.ceil(k/12);yr[y]=yr[y]||[0,0,0];yr[y][0]+=pr;yr[y][1]+=i;yr[y][2]=Math.max(bal,0);}
  Object.keys(yr).forEach(function(y){rows.push([+y,yr[y][0],yr[y][1],yr[y][2]]);});
  return{res:[R('Monthly EMI',e,'cur',{hero:1}),R('Total interest',tot-v.P,'cur'),R('Total payment',tot,'cur'),R('Interest share',(tot-v.P)/tot*100,'pct')],
   chart:{type:'donut',data:[['Principal',v.P],['Interest',tot-v.P]]},table:{title:'Year-wise schedule',cols:['Year','Principal paid','Interest paid','Balance'],kinds:['int','cur','cur','cur'],rows:rows}};}});

def({id:'loan-prepay',cat:'fin',name:'Loan Prepayment Calculator',desc:'See how much interest and time an extra monthly payment saves.',keywords:'amortization extra payment prepay emi',
 fields:[N('P','Loan amount',2500000),N('rate','Interest rate (% per year)',9,{step:.05}),N('yrs','Tenure (years)',20),N('extra','Extra payment each month',5000)],
 formula:'Each month the extra amount is added to the EMI and reduces principal directly; the loop runs until the balance reaches zero.',
 calc:function(v){G.cap(v,['yrs'],100,'Tenure');pos(v,['P','rate','yrs','extra']);need(v.P>0&&v.yrs>0,'Amount and tenure must be above zero');var n=v.yrs*12,r=v.rate/1200,e=pmt(v.P,r,n);
  function run(x){var b=v.P,m=0,ti=0;while(b>0.005&&m<n*2){var i=b*r;ti+=i;b-=Math.min(b,e+x-i);m++;}return{m:m,i:ti};}
  var a=run(0),b=run(v.extra);return{res:[R('Interest saved',a.i-b.i,'cur',{hero:1}),R('Time saved',(a.m-b.m)+' months ('+G.round((a.m-b.m)/12,1)+' yrs)','text'),R('Original interest',a.i,'cur'),R('Interest with prepayment',b.i,'cur'),R('New payoff time',b.m+' months','text'),R('Regular EMI',e,'cur')]};}});

def({id:'sip',cat:'fin',name:'SIP Calculator',desc:'Future value of a monthly investment at an expected return.',keywords:'mutual fund systematic investment plan',
 fields:[N('m','Monthly investment',10000),N('rate','Expected return (% per year)',12,{step:.1}),N('yrs','Period (years)',15)],
 formula:'FV = M × ((1+i)^n − 1) ÷ i × (1+i), with i = annual rate ÷ 12 and n = months (instalments at start of month).',
 calc:function(v){G.cap(v,['yrs'],100,'Period');pos(v,['m','rate','yrs']);var i=v.rate/1200,n=v.yrs*12,fv=i===0?v.m*n:v.m*((Math.pow(1+i,n)-1)/i)*(1+i),inv=v.m*n,rows=[];
  for(var y=1;y<=v.yrs;y++){var k=y*12,f=i===0?v.m*k:v.m*((Math.pow(1+i,k)-1)/i)*(1+i);rows.push([y,v.m*k,f-v.m*k,f]);}
  return{res:[R('Maturity value',fv,'cur',{hero:1}),R('Amount invested',inv,'cur'),R('Estimated gain',fv-inv,'cur'),R('Wealth multiple',fv/inv,'x')],chart:{type:'donut',data:[['Invested',inv],['Gain',fv-inv]]},
   table:{title:'Year-wise growth',cols:['Year','Invested','Gain','Value'],kinds:['int','cur','cur','cur'],rows:rows}};}});

def({id:'step-up-sip',cat:'fin',name:'Step-up SIP Calculator',desc:'SIP where the monthly amount rises by a fixed percentage every year.',keywords:'increasing sip annual increase',
 fields:[N('m','Starting monthly investment',10000),N('step','Yearly increase (%)',10),N('rate','Expected return (% per year)',12,{step:.1}),N('yrs','Period (years)',15)],
 formula:'Month by month: balance = (balance + instalment) × (1 + i); the instalment is multiplied by (1 + step) after every 12 months.',
 calc:function(v){G.cap(v,['yrs'],100,'Period');pos(v,['m','step','rate','yrs']);var i=v.rate/1200,b=0,inv=0,a=v.m,rows=[];for(var y=1;y<=v.yrs;y++){for(var k=0;k<12;k++){b=(b+a)*(1+i);inv+=a;}rows.push([y,a,inv,b]);a*=1+v.step/100;}
  return{res:[R('Maturity value',b,'cur',{hero:1}),R('Amount invested',inv,'cur'),R('Estimated gain',b-inv,'cur')],chart:{type:'donut',data:[['Invested',inv],['Gain',b-inv]]},table:{title:'Year-wise',cols:['Year','Monthly amount','Invested so far','Value'],kinds:['int','cur','cur','cur'],rows:rows}};}});

def({id:'sip-goal',cat:'fin',name:'SIP Goal Calculator',desc:'Monthly SIP needed to reach a target corpus.',keywords:'target corpus planner goal',
 fields:[N('goal','Target amount',10000000),N('rate','Expected return (% per year)',12,{step:.1}),N('yrs','Period (years)',20)],
 formula:'M = Goal × i ÷ (((1+i)^n − 1) × (1+i)).',
 calc:function(v){G.cap(v,['yrs'],100,'Period');pos(v,['goal','rate','yrs']);need(v.yrs>0,'Period must be above zero');var i=v.rate/1200,n=v.yrs*12,m=i===0?v.goal/n:v.goal*i/((Math.pow(1+i,n)-1)*(1+i));
  return{res:[R('Monthly SIP needed',m,'cur',{hero:1}),R('Total invested',m*n,'cur'),R('Gain',v.goal-m*n,'cur')]};}});

def({id:'lumpsum',cat:'fin',name:'Lumpsum Calculator',desc:'Growth of a one-time investment.',keywords:'one time investment',
 fields:[N('P','Investment',500000),N('rate','Expected return (% per year)',12,{step:.1}),N('yrs','Period (years)',10)],
 formula:'FV = P × (1 + r)^t.',calc:function(v){G.cap(v,['yrs'],1000,'Years');pos(v,['P','rate','yrs']);var f=G.fv(v.P,v.rate/100,v.yrs);return{res:[R('Maturity value',f,'cur',{hero:1}),R('Gain',f-v.P,'cur'),R('Multiple',f/v.P,'x')],chart:{type:'donut',data:[['Invested',v.P],['Gain',f-v.P]]}};}});

def({id:'compound-interest',cat:'fin',name:'Compound Interest Calculator',desc:'Compound growth with any compounding frequency and optional monthly top-ups.',keywords:'interest growth savings',
 fields:[N('P','Starting amount',100000),N('add','Monthly addition',0),N('rate','Interest rate (% per year)',7,{step:.05}),N('yrs','Years',10),S('f','Compounding',FREQ.concat([[365,'Daily']]),12)],
 formula:'A = P(1 + r/f)^(f·t). Monthly additions are accumulated month by month using the effective monthly rate.',
 calc:function(v){G.cap(v,['yrs'],100,'Period');pos(v,['P','add','rate','yrs']);var f=+v.f,eff=Math.pow(1+v.rate/100/f,f/12)-1,b=v.P,rows=[];for(var y=1;y<=v.yrs;y++){for(var k=0;k<12;k++)b=b*(1+eff)+v.add;rows.push([y,v.P+v.add*12*y,b-v.P-v.add*12*y,b]);}
  var inv=v.P+v.add*12*v.yrs;return{res:[R('Final balance',b,'cur',{hero:1}),R('Total contributed',inv,'cur'),R('Interest earned',b-inv,'cur')],chart:{type:'donut',data:[['Contributed',inv],['Interest',b-inv]]},table:{title:'Year-wise',cols:['Year','Contributed','Interest','Balance'],kinds:['int','cur','cur','cur'],rows:rows}};}});

def({id:'simple-interest',cat:'fin',name:'Simple Interest Calculator',desc:'Interest and total on a principal at a flat rate.',keywords:'si',
 fields:[N('P','Principal',100000),N('rate','Rate (% per year)',8),N('t','Time (years)',3)],formula:'SI = P × r × t ÷ 100.',
 calc:function(v){pos(v,['P','rate','t']);var si=v.P*v.rate*v.t/100;return{res:[R('Simple interest',si,'cur',{hero:1}),R('Total amount',v.P+si,'cur')]};}});

def({id:'fd',cat:'fin',name:'Fixed Deposit Calculator',desc:'Maturity amount of an FD with quarterly or other compounding.',keywords:'fd bank deposit term',
 fields:[N('P','Deposit',200000),N('rate','Interest rate (% per year)',7,{step:.05}),N('yrs','Tenure (years)',5),S('f','Compounding',FREQ,4)],formula:'A = P(1 + r/f)^(f·t).',
 calc:function(v){pos(v,['P','rate','yrs']);var a=v.P*Math.pow(1+v.rate/100/v.f,v.f*v.yrs);return{res:[R('Maturity amount',a,'cur',{hero:1}),R('Interest earned',a-v.P,'cur'),R('Effective yearly yield',(Math.pow(1+v.rate/100/v.f,v.f)-1)*100,'pct')]};}});

def({id:'rd',cat:'fin',name:'Recurring Deposit Calculator',desc:'Maturity value of a monthly recurring deposit.',keywords:'rd',
 fields:[N('m','Monthly deposit',5000),N('rate','Interest rate (% per year)',6.5,{step:.05}),N('mo','Tenure (months)',60)],formula:'Each deposit compounds quarterly (r/4) for its remaining months, as banks in India do.',
 calc:function(v){G.cap(v,['mo'],1200,'Tenure');pos(v,['m','rate','mo']);var q=v.rate/400,a=0;for(var k=1;k<=v.mo;k++){a+=v.m*Math.pow(1+q,(v.mo-k+1)/3);}var inv=v.m*v.mo;return{res:[R('Maturity value',a,'cur',{hero:1}),R('Deposited',inv,'cur'),R('Interest',a-inv,'cur')]};}});

def({id:'ppf',cat:'fin',name:'PPF Calculator',desc:'Public Provident Fund balance at maturity (15 years, extendable).',keywords:'provident fund india',
 fields:[N('y','Yearly deposit (max 150000)',150000),N('rate','Interest rate (% per year)',7.1,{step:.05}),N('yrs','Years',15)],formula:'Balance compounds yearly: B = (B + deposit) × (1 + r). Check the current notified rate before relying on this.',
 calc:function(v){G.cap(v,['yrs'],100,'Years');pos(v,['y','rate','yrs']);need(v.y<=150000,'PPF allows up to 1,50,000 per year');var b=0,rows=[];for(var k=1;k<=v.yrs;k++){b=(b+v.y)*(1+v.rate/100);rows.push([k,v.y*k,b-v.y*k,b]);}return{res:[R('Maturity value',b,'cur',{hero:1}),R('Invested',v.y*v.yrs,'cur'),R('Interest',b-v.y*v.yrs,'cur')],table:{title:'Year-wise',cols:['Year','Invested','Interest','Balance'],kinds:['int','cur','cur','cur'],rows:rows}};}});

def({id:'mortgage',cat:'fin',name:'Mortgage Calculator',desc:'Payment with property tax, insurance and down payment.',keywords:'house home loan down payment',
 fields:[N('price','Home price',400000),N('down','Down payment (%)',20),N('rate','Interest rate (% per year)',6.5,{step:.05}),N('yrs','Term (years)',30),N('tax','Property tax (% per year)',1.1,{step:.05}),N('ins','Insurance per year',1200)],formula:'Principal and interest use the EMI formula; tax and insurance are added monthly.',
 calc:function(v){pos(v,['price','down','rate','yrs','tax','ins']);var P=v.price*(1-v.down/100),pi=pmt(P,v.rate/1200,v.yrs*12),t=v.price*v.tax/1200,i=v.ins/12;return{res:[R('Monthly payment',pi+t+i,'cur',{hero:1}),R('Principal & interest',pi,'cur'),R('Property tax',t,'cur'),R('Insurance',i,'cur'),R('Loan amount',P,'cur'),R('Total interest',pi*v.yrs*12-P,'cur')]};}});

def({id:'loan-eligibility',cat:'fin',name:'Loan Eligibility Calculator',desc:'Estimate the loan a lender may offer from income and existing EMIs.',keywords:'borrow how much afford',
 fields:[N('inc','Monthly net income',90000),N('emi','Existing EMIs',10000),N('foir','Max share of income for EMIs (%)',50),N('rate','Interest rate (% per year)',9),N('yrs','Tenure (years)',20)],formula:'Affordable EMI = income × FOIR − existing EMIs; loan = EMI × (1 − (1+r)^−n) ÷ r.',
 calc:function(v){pos(v,['inc','emi','foir','rate','yrs']);var e=Math.max(0,v.inc*v.foir/100-v.emi),l=G.pv(e,v.rate/1200,v.yrs*12);return{res:[R('Estimated loan',l,'cur',{hero:1}),R('Affordable EMI',e,'cur')],note:'Lenders apply their own rules; this is only an estimate.'};}});

def({id:'cc-payoff',cat:'fin',name:'Credit Card Payoff Calculator',desc:'Months and interest to clear a card balance.',keywords:'debt credit card',
 fields:[N('b','Balance',100000),N('apr','APR (% per year)',36),N('pay','Monthly payment',6000)],formula:'Each month: interest = balance × APR ÷ 12, then the payment reduces the balance.',
 calc:function(v){pos(v,['b','apr','pay']);var r=v.apr/1200;need(v.pay>v.b*r,'Payment must exceed monthly interest ('+G.round(v.b*r,2)+')');var b=v.b,m=0,ti=0;while(b>0.005&&m<1200){var i=b*r;ti+=i;b-=Math.min(b,v.pay-i);m++;}return{res:[R('Months to clear',m,'int',{hero:1}),R('Total interest',ti,'cur'),R('Total paid',v.b+ti,'cur')]};}});

def({id:'debt-snowball',cat:'fin',name:'Debt Payoff Planner',desc:'Compare snowball and avalanche for several debts.',keywords:'snowball avalanche multiple debts',
 fields:[G.ROWS('d','Debts',['Name','Balance','APR %','Min payment'],[['Card A',50000,36,2500],['Card B',120000,24,4000],['Loan',300000,12,8000]]),N('extra','Extra monthly payment',10000)],formula:'Minimums are paid on all debts; the extra goes to the smallest balance (snowball) or highest rate (avalanche), and freed payments roll over.',
 calc:function(v){var base=v.d.map(function(r){return{n:r[0],b:+r[1],a:+r[2],m:+r[3]};}).filter(function(x){return x.b>0;});need(base.length,'Add at least one debt');
  function sim(order){var ds=base.map(function(x){return{n:x.n,b:x.b,a:x.a,m:x.m};}),mo=0,ti=0,pool=base.reduce(function(s,x){return s+x.m;},0)+v.extra;while(ds.some(function(d){return d.b>0.005;})&&mo<1200){mo++;var pay=pool;ds.forEach(function(d){if(d.b>0){var i=d.b*d.a/1200;d.b+=i;ti+=i;}});ds.forEach(function(d){if(d.b>0){var p=Math.min(d.b,d.m);d.b-=p;pay-=p;}});
   var tg=ds.filter(function(d){return d.b>0.005;}).sort(order)[0];if(tg){var p2=Math.min(tg.b,pay);tg.b-=p2;}}
   return{mo:mo,ti:ti};}
  var sn=sim(function(a,b){return a.b-b.b;}),av=sim(function(a,b){return b.a-a.a;});
  return{res:[R('Avalanche: debt-free in',av.mo+' months','text',{hero:1}),R('Avalanche interest',av.ti,'cur'),R('Snowball: debt-free in',sn.mo+' months','text'),R('Snowball interest',sn.ti,'cur'),R('Avalanche saves',sn.ti-av.ti,'cur')]};}});

def({id:'retirement',cat:'fin',name:'Retirement Corpus Calculator',desc:'Corpus you need at retirement and the SIP to build it.',keywords:'pension nest egg fire',
 fields:[N('age','Current age',30),N('ret','Retirement age',60),N('life','Plan until age',85),N('exp','Monthly expenses today',50000),N('inf','Inflation (% per year)',6,{step:.1}),N('pre','Return before retirement (%)',12,{step:.1}),N('post','Return after retirement (%)',8,{step:.1}),N('have','Savings already invested',500000)],formula:'Expenses are inflated to retirement, the corpus is the present value of withdrawals that grow with inflation, and the SIP is solved against the shortfall.',
 calc:function(v){G.cap(v,['age','ret','life'],150,'Age');need(v.ret>v.age&&v.life>v.ret,'Ages must satisfy current < retirement < plan');var yrs=v.ret-v.age,exp0=v.exp*12*Math.pow(1+v.inf/100,yrs),g=(1+v.post/100)/(1+v.inf/100)-1,n=v.life-v.ret,corpus=Math.abs(g)<1e-9?exp0*n:exp0*(1-Math.pow(1+g,-n))/g*(1+g);
  var have=G.fv(v.have,v.pre/100,yrs),gap=Math.max(0,corpus-have),i=v.pre/1200,N2=yrs*12,m=gap===0?0:gap*i/((Math.pow(1+i,N2)-1)*(1+i));
  return{res:[R('Corpus needed',corpus,'cur',{hero:1}),R('Monthly expense at retirement',exp0/12,'cur'),R('Existing savings will grow to',have,'cur'),R('Monthly SIP needed',m,'cur')],note:'Withdrawals are assumed at the start of each year and rise with inflation.'};}});

def({id:'fire',cat:'fin',name:'FIRE Number Calculator',desc:'Financial-independence number from expenses and a safe withdrawal rate.',keywords:'financial independence retire early 4% rule',
 fields:[N('exp','Yearly expenses',600000),N('swr','Safe withdrawal rate (%)',3.5,{step:.1}),N('have','Invested today',2000000),N('save','Yearly savings',500000),N('rate','Real return (% per year)',6,{step:.1})],formula:'FIRE number = expenses ÷ withdrawal rate. Years are found by compounding savings until the target is reached.',
 calc:function(v){need(v.swr>0,'Withdrawal rate must be above zero');var t=v.exp/(v.swr/100),b=v.have,y=0;while(b<t&&y<100){b=b*(1+v.rate/100)+v.save;y++;}return{res:[R('FIRE number',t,'cur',{hero:1}),R('Years to reach',y>=100?'100+':y,'int'),R('Progress today',Math.min(100,v.have/t*100),'pct')]};}});

def({id:'budget',cat:'fin',name:'Monthly Budget Planner (50/30/20)',desc:'Split income into needs, wants and savings and compare with your actuals.',keywords:'expenses savings 50 30 20',
 fields:[N('inc','Monthly income',80000),N('needs','Actual needs (rent, food, bills)',40000),N('wants','Actual wants',20000),N('save','Actual savings',20000)],formula:'Targets are 50% needs, 30% wants and 20% savings of income.',
 calc:function(v){pos(v,['inc','needs','wants','save']);need(v.inc>0,'Income must be above zero');var out=v.needs+v.wants+v.save;return{res:[R('Needs target',v.inc*.5,'cur'),R('Wants target',v.inc*.3,'cur'),R('Savings target',v.inc*.2,'cur'),R('Needs share',v.needs/v.inc*100,'pct'),R('Wants share',v.wants/v.inc*100,'pct'),R('Savings share',v.save/v.inc*100,'pct'),R(out>v.inc?'Over budget by':'Left unallocated',Math.abs(v.inc-out),'cur',{hero:1})],chart:{type:'donut',data:[['Needs',v.needs],['Wants',v.wants],['Savings',v.save]]}};}});

def({id:'income-tax-india',cat:'fin',name:'Income Tax Calculator (India)',desc:'Compare old and new regime tax with deductions, surcharge and cess.',keywords:'itr tax slab 80c salary old vs new regime',
 fields:[N('gross','Annual gross income',1500000),N('ded','Old regime deductions (80C, 80D, HRA, etc.)',200000),N('other','Other new-regime deductions (e.g. employer NPS)',0),S('age','Age group',[[30,'Below 60'],[60,'60 to 79'],[80,'80 and above']])],
 formula:'Slabs, standard deduction, 87A rebate with marginal relief, surcharge and 4% cess as per the configured rates ('+G.TAX.fy+').',
 calc:function(v){pos(v,['gross','ded','other']);var n=G.indiaTax(v.gross,'new',{other:v.other}),o=G.indiaTax(v.gross,'old',{ded:v.ded,age:+v.age}),b=n.total<=o.total?'New regime':'Old regime';
  return{res:[R('Better option',b,'text',{hero:1}),R('You save',Math.abs(n.total-o.total),'cur'),R('New regime tax',n.total,'cur'),R('Old regime tax',o.total,'cur'),R('New regime taxable income',n.taxable,'cur'),R('Old regime taxable income',o.taxable,'cur'),R('New regime monthly tax',n.total/12,'cur')],
   table:{title:'Breakdown',cols:['','New regime','Old regime'],kinds:['text','cur','cur'],rows:[['Taxable income',n.taxable,o.taxable],['Tax on slabs',n.slab,o.slab],['Rebate u/s 87A',-n.rebate,-o.rebate],['Surcharge',n.sur,o.sur],['Cess (4%)',n.cess,o.cess],['Total tax',n.total,o.total]]},
   note:'Rates are configured for '+G.TAX.fy+' and can change. Verify with the Income Tax Department before filing. Salaried individuals only; capital gains and special rates are not included.'};}});

def({id:'roi',cat:'fin',name:'ROI Calculator',desc:'Return on investment as an amount, percentage and yearly rate.',keywords:'return investment gain',
 fields:[N('inv','Amount invested',100000),N('fin','Final value',150000),N('yrs','Years held',3)],formula:'ROI = (final − invested) ÷ invested × 100.',
 calc:function(v){need(v.inv>0,'Investment must be above zero');var g=v.fin-v.inv,r=[R('ROI',g/v.inv*100,'pct',{hero:1}),R('Gain / loss',g,'cur')];if(v.yrs>0&&v.fin>0)r.push(R('Annualised (CAGR)',(Math.pow(v.fin/v.inv,1/v.yrs)-1)*100,'pct'));return{res:r};}});

def({id:'cagr',cat:'fin',name:'CAGR Calculator',desc:'Compound annual growth rate between two values.',keywords:'growth rate',
 fields:[N('s','Starting value',100000),N('e','Ending value',250000),N('y','Years',5)],formula:'CAGR = (end ÷ start)^(1 ÷ years) − 1.',
 calc:function(v){need(v.s>0&&v.e>0&&v.y>0,'All values must be above zero');var c=Math.pow(v.e/v.s,1/v.y)-1;return{res:[R('CAGR',c*100,'pct',{hero:1}),R('Total growth',(v.e/v.s-1)*100,'pct')]};}});

def({id:'inflation',cat:'fin',name:'Inflation Calculator',desc:'What money today will be worth, or cost, in the future.',keywords:'purchasing power cost of living',
 fields:[N('a','Amount today',100000),N('r','Inflation (% per year)',6,{step:.1}),N('y','Years',10)],formula:'Future cost = amount × (1+r)^y; purchasing power = amount ÷ (1+r)^y.',
 calc:function(v){pos(v,['a','r','y']);var f=Math.pow(1+v.r/100,v.y);return{res:[R('Same things will cost',v.a*f,'cur',{hero:1}),R('Today\'s money will buy only',v.a/f,'cur'),R('Value lost',(1-1/f)*100,'pct')]};}});

def({id:'hra',cat:'fin',name:'HRA Exemption Calculator',desc:'Tax-exempt House Rent Allowance under the old regime.',keywords:'house rent allowance salary exemption',
 fields:[N('basic','Basic salary + DA (yearly)',900000),N('hra','HRA received (yearly)',360000),N('rent','Rent paid (yearly)',300000),S('metro','City',[[0.5,'Metro (Delhi, Mumbai, Kolkata, Chennai)'],[0.4,'Non-metro']])],formula:'Exempt HRA = least of: HRA received; rent paid − 10% of basic; 50% (metro) or 40% of basic.',
 calc:function(v){pos(v,['basic','hra','rent']);var a=v.hra,b=Math.max(0,v.rent-v.basic*.1),c=v.basic*v.metro,e=Math.min(a,b,c);return{res:[R('Exempt HRA',e,'cur',{hero:1}),R('Taxable HRA',v.hra-e,'cur')],table:{title:'The three limits',cols:['Rule','Amount'],kinds:['text','cur'],rows:[['HRA received',a],['Rent − 10% of basic',b],['Metro / non-metro share of basic',c]]}};}});

def({id:'gratuity',cat:'fin',name:'Gratuity Calculator',desc:'Gratuity payable on leaving an employer (India).',keywords:'retirement benefit payment of gratuity act',
 fields:[N('sal','Last drawn basic + DA (monthly)',60000),N('yrs','Years of service',12),S('cov','Employer covered by Gratuity Act?',[['y','Yes'],['n','No']])],formula:'Covered: (15 ÷ 26) × salary × completed years (6+ months rounds up), capped at ₹20 lakh. Not covered: (15 ÷ 30) × salary × years.',
 calc:function(v){pos(v,['sal','yrs']);var y=Math.floor(v.yrs)+(v.yrs%1>=.5?1:0),g=v.cov==='y'?15/26*v.sal*y:15/30*v.sal*Math.floor(v.yrs);var capped=Math.min(g,2000000);return{res:[R('Gratuity',capped,'cur',{hero:1}),R('Years counted',y,'int')],note:'Eligibility rules (including the 5-year rule and recent labour-code changes) depend on your employment terms. Check with HR.'};}});

def({id:'epf',cat:'fin',name:'EPF Calculator',desc:'Provident fund corpus from employee and employer contributions.',keywords:'pf provident fund retirement',
 fields:[N('basic','Monthly basic + DA',50000),N('age','Current age',28),N('ret','Retirement age',58),N('inc','Yearly salary increase (%)',6),N('rate','EPF interest (% per year)',8.25,{step:.05})],formula:'Employee 12% of basic goes to EPF; employer 12% splits as 8.33% EPS (on max ₹15,000) and the rest EPF.',
 calc:function(v){G.cap(v,['age','ret'],150,'Age');need(v.ret>v.age,'Retirement age must be above current age');var b=0,m=v.basic,yrs=v.ret-v.age;for(var y=0;y<yrs;y++){var emp=m*.12,eps=Math.min(m,15000)*.0833,er=m*.12-eps;for(var k=0;k<12;k++)b=(b+emp+er)*(1+v.rate/1200);m*=1+v.inc/100;}return{res:[R('EPF corpus at retirement',b,'cur',{hero:1})],note:'Interest here is compounded monthly for simplicity; EPFO credits it yearly.'};}});

def({id:'nps',cat:'fin',name:'NPS Calculator',desc:'Pension corpus and expected monthly pension from NPS.',keywords:'national pension system annuity',
 fields:[N('m','Monthly contribution',10000),N('age','Current age',30),N('ret','Retirement age',60),N('rate','Expected return (%)',10,{step:.1}),N('ann','Annuity share of corpus (%)',40),N('arate','Annuity rate (%)',6,{step:.1})],formula:'Corpus grows like a SIP; the annuity share buys a pension at the annuity rate.',
 calc:function(v){G.cap(v,['age','ret'],150,'Age');need(v.ret>v.age,'Retirement age must be above current age');var i=v.rate/1200,n=(v.ret-v.age)*12,fv=v.m*((Math.pow(1+i,n)-1)/i)*(1+i),an=fv*v.ann/100;return{res:[R('Total corpus',fv,'cur',{hero:1}),R('Lump sum you can withdraw',fv-an,'cur'),R('Annuity purchase',an,'cur'),R('Monthly pension',an*v.arate/1200,'cur')]};}});

def({id:'swp',cat:'fin',name:'SWP Calculator',desc:'How long a corpus lasts with systematic monthly withdrawals.',keywords:'systematic withdrawal plan',
 fields:[N('c','Corpus',5000000),N('w','Monthly withdrawal',35000),N('rate','Expected return (% per year)',8,{step:.1}),N('step','Yearly withdrawal increase (%)',0)],formula:'Each month: balance = balance × (1 + r/12) − withdrawal.',
 calc:function(v){pos(v,['c','w','rate','step']);var b=v.c,m=0,w=v.w,tot=0;while(b>0&&m<1200){b=b*(1+v.rate/1200)-w;tot+=w;m++;if(m%12===0)w*=1+v.step/100;}return{res:[R(m>=1200?'Lasts':'Lasts',m>=1200?'100+ years':Math.floor(m/12)+' yrs '+(m%12)+' mo','text',{hero:1}),R('Total withdrawn',tot,'cur'),R('Balance left',Math.max(b,0),'cur')]};}});

def({id:'rule-of-72',cat:'fin',name:'Rule of 72 Calculator',desc:'Years for money to double, or the rate needed.',keywords:'double doubling time',ab:'72',
 fields:[S('mode','Find',[['yrs','Years to double'],['rate','Rate needed']]),N('x','Rate (%) or years',8)],formula:'Years ≈ 72 ÷ rate; the exact answer is ln 2 ÷ ln(1 + r).',
 calc:function(v){need(v.x>0,'Enter a value above zero');if(v.mode==='yrs')return{res:[R('Rule of 72',72/v.x,'num',{hero:1}),R('Exact',Math.log(2)/Math.log(1+v.x/100),'num')]};return{res:[R('Rate needed (%)',72/v.x,'pct',{hero:1}),R('Exact (%)',(Math.pow(2,1/v.x)-1)*100,'pct')]};}});

def({id:'rent-vs-buy',cat:'fin',name:'Rent vs Buy Calculator',desc:'Compare the wealth you end up with by buying a home or renting and investing.',keywords:'property decision home loan down payment',
 fields:[N('price','Home price',8000000),N('down','Down payment (%)',20),N('rate','Loan rate (%)',8.75,{step:.05}),N('yrs','Loan years',20),N('rent','Monthly rent now',25000),N('rentUp','Rent increase (% per year)',5),N('app','Home appreciation (% per year)',5),N('inv','Investment return (% per year)',10),N('hold','Compare after (years)',15)],
 formula:'Both paths spend the larger of EMI and rent each month. Whoever pays less invests the difference. Buyer wealth = home value − loan + investments; renter wealth = investments (starting with the down payment).',
 calc:function(v){G.cap(v,['yrs','hold'],100,'Years');pos(v,['price','down','rate','yrs','rent','rentUp','app','inv','hold']);need(v.yrs>0&&v.hold>0,'Years must be above zero');var P=v.price*(1-v.down/100),e=pmt(P,v.rate/1200,v.yrs*12),r=v.rate/1200,im=v.inv/1200,bal=P,pb=0,pr=v.price*v.down/100,rp=0,M=Math.round(v.hold*12);
  for(var k=1;k<=M;k++){var emi=k<=v.yrs*12?e:0,rent=v.rent*Math.pow(1+v.rentUp/100,Math.floor((k-1)/12));if(k<=v.yrs*12){var i=bal*r;bal=Math.max(0,bal-(e-i));}rp+=rent;pb=pb*(1+im)+Math.max(0,rent-emi);pr=pr*(1+im)+Math.max(0,emi-rent);}
  var value=v.price*Math.pow(1+v.app/100,v.hold),wb=value-bal+pb;return{res:[R(wb>=pr?'Buying comes out ahead by':'Renting comes out ahead by',Math.abs(wb-pr),'cur',{hero:1}),R('Wealth if you buy',wb,'cur'),R('Wealth if you rent and invest',pr,'cur'),R('Home value then',value,'cur'),R('Loan still owed',bal,'cur'),R('Total rent paid',rp,'cur'),R('Monthly EMI',e,'cur')],note:'Ignores maintenance, taxes, tax benefits, stamp duty and selling costs. A planning aid, not advice.'};}});
})(typeof window!=='undefined'?window.G:globalThis.G);

;
(function(G){'use strict';
var N=G.N,S=G.S,R=G.R,def=G.def,fail=G.fail;
function need(c,m){if(!c)fail(m);}
def({id:'gst',cat:'biz',name:'GST / VAT Calculator',desc:'Add or remove GST or VAT from a price, with CGST/SGST split.',keywords:'tax inclusive exclusive sales tax',
 fields:[N('a','Amount',10000),N('r','Tax rate (%)',18,{step:.5}),S('m','Amount is',[['ex','Excluding tax'],['in','Including tax']])],formula:'Excluding: tax = amount × r. Including: base = amount ÷ (1 + r).',
 calc:function(v){var r=v.r/100,base=v.m==='ex'?v.a:v.a/(1+r),tax=base*r;return{res:[R('Net amount',base,'cur'),R('Tax',tax,'cur',{hero:1}),R('Gross amount',base+tax,'cur'),R('CGST / SGST (each)',tax/2,'cur')]};}});
def({id:'discount',cat:'biz',name:'Discount Calculator',desc:'Sale price after one or two discounts.',keywords:'sale off coupon',
 fields:[N('p','Original price',2999),N('d1','Discount (%)',20),N('d2','Extra discount (%)',10)],formula:'Final = price × (1 − d1) × (1 − d2).',
 calc:function(v){var f=v.p*(1-v.d1/100)*(1-v.d2/100);return{res:[R('You pay',f,'cur',{hero:1}),R('You save',v.p-f,'cur'),R('Effective discount',(1-f/v.p)*100,'pct')]};}});
def({id:'percentage',cat:'biz',name:'Percentage Calculator',desc:'Six everyday percentage questions in one place.',keywords:'percent of change increase decrease',
 fields:[S('m','Question',[['of','What is X% of Y?'],['is','X is what % of Y?'],['chg','% change from X to Y'],['inc','Increase X by Y%'],['dec','Decrease X by Y%'],['rev','X is Y% of what?']]),N('x','X',20),N('y','Y',500)],formula:'Choose a question; each mode uses the standard percentage formula.',
 calc:function(v){var x=v.x,y=v.y,o;switch(v.m){case'of':o=R('Result',x/100*y);break;case'is':need(y!==0,'Y cannot be zero');o=R('Percent',x/y*100,'pct');break;case'chg':need(x!==0,'X cannot be zero');o=R('Change',(y-x)/Math.abs(x)*100,'pct');break;case'inc':o=R('Result',x*(1+y/100));break;case'dec':o=R('Result',x*(1-y/100));break;default:need(y!==0,'Y cannot be zero');o=R('The whole',x/(y/100));}o.hero=1;return{res:[o]};}});
def({id:'ratio',cat:'biz',name:'Ratio Calculator',desc:'Simplify a ratio or solve A:B = C:?',keywords:'proportion',
 fields:[N('a','A',12),N('b','B',18),N('c','C (optional, for A:B = C:?)',30)],formula:'Divide both parts by their GCD; for proportions, D = B × C ÷ A.',
 calc:function(v){need(v.a>0&&v.b>0,'A and B must be above zero');var g=G.gcd(v.a,v.b),r=[R('Simplified',(v.a/g)+' : '+(v.b/g),'text',{hero:1}),R('Decimal ratio',v.a/v.b,'num')];if(v.c)r.push(R('D in A:B = C:D',v.b*v.c/v.a,'num'));return{res:r};}});
def({id:'profit-margin',cat:'biz',name:'Profit Margin & Markup Calculator',desc:'Margin, markup and the price needed for a target margin.',keywords:'gross margin selling price cost',
 fields:[N('cost','Cost',600),N('price','Selling price',900),N('tm','Target margin (%)',40)],formula:'Margin = (price − cost) ÷ price; markup = (price − cost) ÷ cost; price for margin m = cost ÷ (1 − m).',
 calc:function(v){need(v.price>0&&v.cost>0,'Cost and price must be above zero');var p=v.price-v.cost;return{res:[R('Profit',p,'cur'),R('Margin',p/v.price*100,'pct',{hero:1}),R('Markup',p/v.cost*100,'pct'),R('Price for target margin',v.cost/(1-v.tm/100),'cur')]};}});
def({id:'breakeven',cat:'biz',name:'Break-even Calculator',desc:'Units and revenue needed to cover fixed costs.',keywords:'bep fixed variable cost',
 fields:[N('fc','Fixed costs',200000),N('vc','Variable cost per unit',40),N('pr','Price per unit',100),N('tp','Target profit',0)],formula:'Units = (fixed + target profit) ÷ (price − variable cost).',
 calc:function(v){need(v.pr>v.vc,'Price must exceed variable cost');var cm=v.pr-v.vc,u=(v.fc+v.tp)/cm;return{res:[R('Break-even units',Math.ceil(u),'int',{hero:1}),R('Break-even revenue',Math.ceil(u)*v.pr,'cur'),R('Contribution per unit',cm,'cur'),R('Contribution margin',cm/v.pr*100,'pct')]};}});
def({id:'salary',cat:'biz',name:'Salary Converter',desc:'Convert a salary between yearly, monthly, weekly, daily and hourly.',keywords:'pay hourly annual ctc',
 fields:[N('a','Amount',1200000),S('per','Per',[['12','Year'],['1','Month'],['52','Week'],['365','Day (calendar)']]),N('h','Hours per week',40),N('w','Weeks per year',52)],formula:'Everything is converted to a yearly figure first, then divided.',
 calc:function(v){var yr=v.per==='12'?v.a:v.per==='1'?v.a*12:v.per==='52'?v.a*v.w:v.a*365;return{res:[R('Yearly',yr,'cur',{hero:1}),R('Monthly',yr/12,'cur'),R('Weekly',yr/v.w,'cur'),R('Daily (5 days a week)',yr/v.w/5,'cur'),R('Hourly',yr/v.w/v.h,'cur')]};}});
def({id:'tip',cat:'biz',name:'Tip & Bill Split Calculator',desc:'Tip, total and each person\'s share.',keywords:'restaurant split',
 fields:[N('b','Bill',2400),N('t','Tip (%)',10),N('p','People',4)],formula:'Total = bill × (1 + tip); per person = total ÷ people.',
 calc:function(v){need(v.p>=1,'At least one person');var t=v.b*v.t/100;return{res:[R('Each pays',(v.b+t)/Math.floor(v.p),'cur',{hero:1}),R('Tip',t,'cur'),R('Total',v.b+t,'cur')]};}});
def({id:'currency',cat:'biz',name:'Currency Converter (manual rate)',desc:'Convert using a rate you enter, so it works offline.',keywords:'exchange forex money',
 fields:[N('a','Amount',100),N('rate','Rate: 1 unit of first currency =',83.5,{step:.01}),N('fee','Bank / card fee (%)',0)],formula:'Result = amount × rate × (1 − fee).',
 calc:function(v){var g=v.a*v.rate;return{res:[R('You receive',g*(1-v.fee/100),'num',{hero:1}),R('Before fee',g,'num'),R('Fee',g*v.fee/100,'num'),R('Reverse rate',1/v.rate,'num')],note:'Ganaka never fetches live rates. Enter the rate from your bank or a rates site.'};}});
def({id:'commission',cat:'biz',name:'Commission Calculator',desc:'Tiered or flat sales commission.',keywords:'sales incentive',
 fields:[N('s','Sales',500000),N('r1','Rate on first slab (%)',2),N('t','Slab limit',300000),N('r2','Rate above slab (%)',4)],formula:'Commission = min(sales, limit) × r1 + max(0, sales − limit) × r2.',
 calc:function(v){var c=Math.min(v.s,v.t)*v.r1/100+Math.max(0,v.s-v.t)*v.r2/100;return{res:[R('Commission',c,'cur',{hero:1}),R('Effective rate',v.s?c/v.s*100:0,'pct')]};}});
def({id:'invoice',cat:'biz',name:'Invoice Total Calculator',desc:'Line items with discount and tax to a printable total.',keywords:'bill quote estimate',
 fields:[G.ROWS('items','Items',['Item','Qty','Price'],[['Design work',1,15000],['Hosting',12,500]]),N('d','Discount (%)',0),N('tax','Tax (%)',18)],formula:'Subtotal = Σ qty × price; then discount, then tax on the discounted amount.',
 calc:function(v){var sub=0,rows=v.items.map(function(r){var t=(+r[1]||0)*(+r[2]||0);sub+=t;return[r[0],+r[1],+r[2],t];});var ds=sub*v.d/100,tx=(sub-ds)*v.tax/100;return{res:[R('Grand total',sub-ds+tx,'cur',{hero:1}),R('Subtotal',sub,'cur'),R('Discount',ds,'cur'),R('Tax',tx,'cur')],table:{title:'Items',cols:['Item','Qty','Price','Amount'],kinds:['text','num','cur','cur'],rows:rows}};}});
def({id:'roas',cat:'biz',name:'Ad ROAS & CPA Calculator',desc:'Return on ad spend, cost per acquisition and break-even ROAS.',keywords:'marketing cpc ctr',
 fields:[N('spend','Ad spend',50000),N('rev','Revenue from ads',200000),N('conv','Conversions',250),N('margin','Gross margin (%)',40)],formula:'ROAS = revenue ÷ spend; break-even ROAS = 1 ÷ margin.',
 calc:function(v){need(v.spend>0,'Spend must be above zero');return{res:[R('ROAS',v.rev/v.spend,'x',{hero:1}),R('Cost per acquisition',v.conv?v.spend/v.conv:0,'cur'),R('Break-even ROAS',100/v.margin,'x'),R('Profit after ad spend',v.rev*v.margin/100-v.spend,'cur')]};}});
})(typeof window!=='undefined'?window.G:globalThis.G);

;
(function(G){'use strict';
var N=G.N,S=G.S,R=G.R,def=G.def,fail=G.fail;
function need(c,m){if(!c)fail(m);}
var SEX=S('sex','Sex',[['m','Male'],['f','Female']]);
var ACT=S('act','Activity',[[1.2,'Sedentary'],[1.375,'Light (1-3 days/wk)'],[1.55,'Moderate (3-5 days/wk)'],[1.725,'Very active (6-7 days/wk)'],[1.9,'Extra active']],1.375);
function bmr(v){return 10*v.kg+6.25*v.cm-5*v.age+(v.sex==='m'?5:-161);}
var HEALTH_NOTE='For general information only. It is not medical advice.';
def({id:'bmi',cat:'health',name:'BMI Calculator',desc:'Body mass index with category and healthy weight range.',keywords:'body mass index weight height obesity',
 fields:[N('kg','Weight (kg)',70),N('cm','Height (cm)',172)],formula:'BMI = weight (kg) ÷ height (m)².',
 calc:function(v){need(v.kg>0&&v.cm>0,'Enter weight and height');var h=v.cm/100,b=v.kg/(h*h),c=b<18.5?'Underweight':b<25?'Normal':b<30?'Overweight':'Obese';return{res:[R('BMI',b,'num',{hero:1}),R('Category',c,'text'),R('Healthy weight range',G.round(18.5*h*h,1)+' to '+G.round(24.9*h*h,1)+' kg','text')],note:HEALTH_NOTE+' BMI does not account for muscle, age or ethnicity. South Asian guidance often uses a lower overweight cut-off of 23.'};}});
def({id:'bmr',cat:'health',name:'BMR Calculator',desc:'Calories your body burns at rest (Mifflin-St Jeor).',keywords:'basal metabolic rate calories',
 fields:[SEX,N('age','Age',30),N('kg','Weight (kg)',70),N('cm','Height (cm)',172)],formula:'Men: 10w + 6.25h − 5a + 5. Women: 10w + 6.25h − 5a − 161.',
 calc:function(v){need(v.kg>0&&v.cm>0&&v.age>0,'Enter valid values');return{res:[R('BMR (kcal/day)',bmr(v),'int',{hero:1})],note:HEALTH_NOTE};}});
def({id:'tdee',cat:'health',name:'Calorie (TDEE) Calculator',desc:'Daily calories for maintaining, losing or gaining weight.',keywords:'tdee maintenance deficit',
 fields:[SEX,N('age','Age',30),N('kg','Weight (kg)',70),N('cm','Height (cm)',172),ACT],formula:'TDEE = BMR × activity factor.',
 calc:function(v){need(v.kg>0&&v.cm>0&&v.age>0,'Enter valid values');var t=bmr(v)*v.act;return{res:[R('Maintain (kcal/day)',t,'int',{hero:1}),R('Lose ~0.5 kg a week',t-500,'int'),R('Lose ~1 kg a week',t-1000,'int'),R('Gain ~0.5 kg a week',t+500,'int')],note:HEALTH_NOTE+' Very low intakes should be supervised by a professional.'};}});
def({id:'ideal-weight',cat:'health',name:'Ideal Weight Calculator',desc:'Estimates from four common formulas.',keywords:'healthy weight devine robinson miller hamwi',
 fields:[SEX,N('cm','Height (cm)',172)],formula:'Devine: 50 (45.5) kg + 2.3 kg per inch over 5 ft. Robinson, Miller and Hamwi use similar bases.',
 calc:function(v){var inch=v.cm/2.54-60,m=v.sex==='m',d=(m?50:45.5)+2.3*inch,rb=(m?52:49)+(m?1.9:1.7)*inch,ml=(m?56.2:53.1)+(m?1.41:1.36)*inch,hm=(m?48:45.4)+(m?2.7:2.2)*inch;need(v.cm>=140,'Formulas apply from 4 ft 8 in (about 140 cm)');return{res:[R('Devine',d,'kg',{hero:1}),R('Robinson',rb,'kg'),R('Miller',ml,'kg'),R('Hamwi',hm,'kg')],note:HEALTH_NOTE};}});
def({id:'body-fat',cat:'health',name:'Body Fat Calculator (US Navy)',desc:'Body fat percentage from tape measurements.',keywords:'navy method waist neck hip',
 fields:[SEX,N('cm','Height (cm)',172),N('neck','Neck (cm)',38),N('waist','Waist at navel (cm)',85),N('hip','Hip (cm, women)',95)],formula:'Men: 495 ÷ (1.0324 − 0.19077 log10(waist − neck) + 0.15456 log10(height)) − 450. Women include hip.',
 calc:function(v){var f;if(v.sex==='m'){need(v.waist>v.neck,'Waist must exceed neck');f=495/(1.0324-.19077*Math.log10(v.waist-v.neck)+.15456*Math.log10(v.cm))-450;}else{need(v.waist+v.hip>v.neck,'Check measurements');f=495/(1.29579-.35004*Math.log10(v.waist+v.hip-v.neck)+.221*Math.log10(v.cm))-450;}return{res:[R('Body fat',f,'pct',{hero:1})],note:HEALTH_NOTE+' Tape-measure methods are rough estimates.'};}});
def({id:'water',cat:'health',name:'Daily Water Intake Calculator',desc:'A starting point for daily fluids.',keywords:'hydration drink',
 fields:[N('kg','Weight (kg)',70),N('ex','Exercise (minutes/day)',30),S('cl','Climate',[[0,'Temperate'],[500,'Hot or humid']])],formula:'About 33 ml per kg, plus 12 ml per minute of exercise, plus extra for heat.',
 calc:function(v){var ml=v.kg*33+v.ex*12+(+v.cl);return{res:[R('Litres per day',ml/1000,'num',{hero:1}),R('Glasses of 250 ml',Math.round(ml/250),'int')],note:HEALTH_NOTE+' Needs vary; follow medical advice if you have a condition.'};}});
def({id:'macros',cat:'health',name:'Macro Calculator',desc:'Protein, carbohydrate and fat grams from calories.',keywords:'protein carbs fat diet split',
 fields:[N('kcal','Daily calories',2200),S('sp','Split (carb/protein/fat)',[['40/30/30','Balanced 40/30/30'],['50/20/30','Higher carb 50/20/30'],['25/40/35','High protein 25/40/35'],['10/25/65','Low carb 10/25/65']])],formula:'Carbs and protein 4 kcal/g, fat 9 kcal/g.',
 calc:function(v){var p=v.sp.split('/').map(Number);return{res:[R('Carbohydrate (g)',v.kcal*p[0]/100/4,'int'),R('Protein (g)',v.kcal*p[1]/100/4,'int',{hero:1}),R('Fat (g)',v.kcal*p[2]/100/9,'int')],chart:{type:'donut',data:[['Carbs',p[0]],['Protein',p[1]],['Fat',p[2]]]},note:HEALTH_NOTE};}});
def({id:'whr',cat:'health',name:'Waist-to-Hip Ratio Calculator',desc:'Ratio and general risk band (WHO).',keywords:'waist hip ratio',
 fields:[SEX,N('w','Waist (cm)',84),N('h','Hip (cm)',98)],formula:'WHR = waist ÷ hip.',
 calc:function(v){need(v.h>0,'Hip must be above zero');var r=v.w/v.h,lim=v.sex==='m'?[.9,1]:[.85,.9],c=r<lim[0]?'Low':r<lim[1]?'Moderate':'High';return{res:[R('Ratio',r,'num',{hero:1}),R('Risk band',c,'text')],note:HEALTH_NOTE};}});
def({id:'hr-zones',cat:'health',name:'Heart-rate Zones Calculator',desc:'Training zones from maximum heart rate (Karvonen).',keywords:'cardio training bpm',
 fields:[N('age','Age',30),N('rest','Resting heart rate (bpm)',62)],formula:'Max HR ≈ 208 − 0.7 × age. Zone = rest + % × (max − rest).',
 calc:function(v){var mx=208-.7*v.age,z=[[50,60,'Very light'],[60,70,'Light (fat burn)'],[70,80,'Moderate (aerobic)'],[80,90,'Hard (threshold)'],[90,100,'Maximum']];return{res:[R('Max heart rate',mx,'int',{hero:1})],table:{title:'Zones (bpm)',cols:['Zone','From','To'],kinds:['text','int','int'],rows:z.map(function(x){return[x[2],v.rest+x[0]/100*(mx-v.rest),v.rest+x[1]/100*(mx-v.rest)];})},note:HEALTH_NOTE};}});
def({id:'heat-index',cat:'health',name:'Heat Index Calculator',desc:'How hot it feels from temperature and humidity.',keywords:'feels like humidity',
 fields:[N('t','Temperature (°C)',34),N('h','Relative humidity (%)',60)],formula:'Rothfusz regression (NWS), valid above about 27 °C (80 °F).',
 calc:function(v){var T=v.t*9/5+32,H=v.h,hi=-42.379+2.04901523*T+10.14333127*H-.22475541*T*H-.00683783*T*T-.05481717*H*H+.00122874*T*T*H+.00085282*T*H*H-.00000199*T*T*H*H;if(T<80)hi=.5*(T+61+(T-68)*1.2+H*.094);var c=(hi-32)*5/9;return{res:[R('Feels like (°C)',c,'num',{hero:1}),R('Feels like (°F)',hi,'num')],note:HEALTH_NOTE};}});
def({id:'due-date',cat:'health',name:'Pregnancy Due Date Calculator',desc:'Estimated due date from the last period (Naegele).',keywords:'pregnancy lmp conception',
 fields:[G.DA('lmp','First day of last period','2026-08-01'),N('cyc','Cycle length (days)',28)],formula:'Due date = LMP + 280 days, adjusted by (cycle − 28).',
 calc:function(v){var d=G.pd(v.lmp);need(d,'Pick a date');need(v.cyc>=15&&v.cyc<=60,'Cycle length should be 15 to 60 days');var due=G.addDays(d,280+(v.cyc-28)),w=Math.floor(G.daysBetween(d,G.today())/7);return{res:[R('Due date',G.longDate(due),'text',{hero:1}),R('Gestational age today',w>=0&&w<=42?w+' weeks':'n/a','text'),R('Conception about',G.longDate(G.addDays(due,-266)),'text')],note:HEALTH_NOTE+' Only about 5% of babies arrive on the due date.'};}});
def({id:'pace',cat:'health',name:'Running Pace Calculator',desc:'Pace, speed or finish time for a run.',keywords:'running marathon 5k 10k',
 fields:[N('d','Distance (km)',10),N('h','Hours',0),N('m','Minutes',55),N('s','Seconds',0)],formula:'Pace = time ÷ distance.',
 calc:function(v){need(v.d>0,'Distance must be above zero');var t=v.h*3600+v.m*60+v.s;need(t>0,'Enter a time');var p=t/v.d,f=function(x){return Math.floor(x/60)+':'+String(Math.round(x%60)).padStart(2,'0');};var pm=t/(v.d/1.609344);var r=[R('Pace per km',f(p),'text',{hero:1}),R('Pace per mile',f(pm),'text'),R('Speed (km/h)',v.d/(t/3600),'num')];[[5,'5 K'],[10,'10 K'],[21.0975,'Half marathon'],[42.195,'Marathon']].forEach(function(x){var s=p*x[0];r.push(R('Equivalent '+x[1],Math.floor(s/3600)+'h '+f(s%3600),'text'));});return{res:r};}});
def({id:'bsa',cat:'health',name:'Body Surface Area Calculator',desc:'BSA by Mosteller, DuBois and Haycock.',keywords:'dosing bsa',
 fields:[N('kg','Weight (kg)',70),N('cm','Height (cm)',172)],formula:'Mosteller: √(height × weight ÷ 3600).',
 calc:function(v){need(v.kg>0&&v.cm>0,'Enter values');return{res:[R('Mosteller (m²)',Math.sqrt(v.cm*v.kg/3600),'num',{hero:1}),R('DuBois (m²)',.007184*Math.pow(v.kg,.425)*Math.pow(v.cm,.725),'num'),R('Haycock (m²)',.024265*Math.pow(v.kg,.5378)*Math.pow(v.cm,.3964),'num')],note:HEALTH_NOTE};}});
def({id:'sleep',cat:'health',name:'Sleep Cycle Calculator',desc:'Best bedtimes or wake-up times in 90-minute cycles.',keywords:'bedtime wake',
 fields:[S('m','I want to',[['wake','Wake at…'],['sleep','Go to bed at…']]),G.TX('t','Time (HH:MM)','06:30')],formula:'Cycles of 90 minutes plus about 15 minutes to fall asleep.',
 calc:function(v){var m=/^(\d{1,2}):(\d{2})$/.exec(v.t);need(m&&+m[1]<24&&+m[2]<60,'Use 24-hour HH:MM');var base=+m[1]*60+ +m[2],out=[];function f(x){x=((x%1440)+1440)%1440;return String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0');}
  for(var c=6;c>=3;c--){out.push(R(c+' cycles ('+c*1.5+' h)',v.m==='wake'?f(base-c*90-15):f(base+c*90+15),'text',c===5?{hero:1}:{}));}return{res:out,note:HEALTH_NOTE};}});
def({id:'waist-height',cat:'health',name:'Waist-to-Height Ratio',desc:'A simple central-fat indicator: keep waist under half your height.',keywords:'whtr',
 fields:[N('w','Waist (cm)',84),N('h','Height (cm)',172)],formula:'WHtR = waist ÷ height. Below 0.5 is generally considered healthy.',
 calc:function(v){need(v.h>0,'Height must be above zero');var r=v.w/v.h;return{res:[R('Ratio',r,'num',{hero:1}),R('Reading',r<.4?'Very slim':r<.5?'Healthy':r<.6?'Increased risk':'High risk','text')],note:HEALTH_NOTE};}});
})(typeof window!=='undefined'?window.G:globalThis.G);

;
(function(G){'use strict';
var N=G.N,S=G.S,R=G.R,def=G.def,fail=G.fail;
function need(c,m){if(!c)fail(m);}
var GP={'A+':4,A:4,'A-':3.7,'B+':3.3,B:3,'B-':2.7,'C+':2.3,C:2,'C-':1.7,'D+':1.3,D:1,F:0};
def({id:'gpa',cat:'edu',name:'GPA Calculator (4.0 scale)',desc:'Semester GPA from letter grades and credits.',keywords:'grade point average college',
 fields:[G.ROWS('c','Courses',['Course','Grade','Credits'],[['Maths','A',4],['Physics','B+',3],['English','A-',3],['Lab','B',2]])],formula:'GPA = Σ (grade points × credits) ÷ Σ credits.',
 calc:function(v){var q=0,c=0;v.c.forEach(function(r){var g=GP[String(r[1]).toUpperCase().trim()],cr=+r[2];need(g!==undefined,'Unknown grade "'+r[1]+'". Use A, A-, B+ … F');q+=g*cr;c+=cr;});need(c>0,'Add credits');return{res:[R('GPA',q/c,'num',{hero:1}),R('Total credits',c,'num')]};}});
def({id:'cgpa',cat:'edu',name:'CGPA Calculator',desc:'Cumulative CGPA from semester SGPAs and credits.',keywords:'cumulative semester sgpa',
 fields:[G.ROWS('s','Semesters',['Semester','SGPA','Credits'],[['Sem 1',8.2,22],['Sem 2',8.6,24],['Sem 3',7.9,24]])],formula:'CGPA = Σ (SGPA × credits) ÷ Σ credits.',
 calc:function(v){var q=0,c=0;v.s.forEach(function(r){q+=(+r[1])*(+r[2]);c+=+r[2];});need(c>0,'Add credits');var g=q/c;return{res:[R('CGPA',g,'num',{hero:1}),R('Approx. percentage (×9.5)',g*9.5,'pct'),R('Total credits',c,'num')]};}});
def({id:'cgpa-percent',cat:'edu',name:'CGPA to Percentage Converter',desc:'Convert CGPA to percentage and back (CBSE and VTU style).',keywords:'convert grade percent',
 fields:[S('m','Convert',[['c2p','CGPA to percentage'],['p2c','Percentage to CGPA']]),N('x','Value',8.4,{step:.01}),S('f','Formula',[[9.5,'CBSE: ×9.5'],[10,'Direct: ×10'],[7.1,'VTU: (CGPA − 0.75) × 10']],9.5)],formula:'Percentage = CGPA × factor (VTU: (CGPA − 0.75) × 10).',
 calc:function(v){var vtu=+v.f===7.1;if(v.m==='c2p')return{res:[R('Percentage',vtu?(v.x-.75)*10:v.x*v.f,'pct',{hero:1})],note:'Check the rule your university or employer accepts.'};return{res:[R('CGPA',vtu?v.x/10+.75:v.x/v.f,'num',{hero:1})]};}});
def({id:'weighted-grade',cat:'edu',name:'Weighted Grade Calculator',desc:'Overall grade from scores and weights, and the final exam score you need.',keywords:'course grade final exam target',
 fields:[G.ROWS('a','Assessments',['Item','Score %','Weight %'],[['Assignments',88,20],['Midterm',75,30]]),N('target','Target overall grade (%)',85)],formula:'Grade = Σ score × weight ÷ Σ weight. Needed = (target − earned) ÷ remaining weight.',
 calc:function(v){var w=0,e=0;v.a.forEach(function(r){w+=+r[2];e+=(+r[1])*(+r[2])/100;});need(w>0&&w<=100,'Weights must total 1 to 100');var out=[R('Grade so far (of '+w+'% weight)',e/w*100,'pct',{hero:1}),R('Points earned',e,'num')];if(w<100)out.push(R('Needed on the remaining '+(100-w)+'%',(v.target-e)/(100-w)*100,'pct'));return{res:out};}});
def({id:'attendance',cat:'edu',name:'Attendance Calculator',desc:'Your attendance percentage and how many classes you can miss.',keywords:'bunk 75% required',
 fields:[N('att','Classes attended',42),N('tot','Classes held so far',52),N('req','Required (%)',75)],formula:'Can miss: floor(attended ÷ required − total). Need to attend: ceil((req × total − 100 × attended) ÷ (100 − req)).',
 calc:function(v){need(v.tot>0&&v.att<=v.tot,'Attended cannot exceed held');var p=v.att/v.tot*100,r=v.req/100;var out=[R('Attendance',p,'pct',{hero:1})];if(p>=v.req)out.push(R('You can still miss',Math.floor(v.att/r-v.tot),'int'));else out.push(R('Attend this many in a row',Math.ceil((r*v.tot-v.att)/(1-r)),'int'));return{res:out};}});
def({id:'marks',cat:'edu',name:'Marks & Percentage Calculator',desc:'Total, percentage and division from subject marks.',keywords:'result score',
 fields:[G.ROWS('m','Subjects',['Subject','Obtained','Maximum'],[['Maths',88,100],['Science',79,100],['English',82,100]])],formula:'Percentage = Σ obtained ÷ Σ maximum × 100.',
 calc:function(v){var o=0,m=0;v.m.forEach(function(r){o+=+r[1];m+=+r[2];});need(m>0,'Add maximum marks');var p=o/m*100;return{res:[R('Percentage',p,'pct',{hero:1}),R('Total',o+' / '+m,'text'),R('Division',p>=60?'First':p>=50?'Second':p>=35?'Pass':'Below pass','text')]};}});
def({id:'study-planner',cat:'edu',name:'Exam Study Planner',desc:'Daily study hours needed before an exam.',keywords:'revision schedule',
 fields:[N('ch','Chapters to cover',18),N('hch','Hours per chapter',3),N('rev','Revision (% extra)',30),G.DA('d','Exam date','2026-12-20'),N('off','Rest days per week',1)],formula:'Total hours = chapters × hours × (1 + revision). Study days = days left × (7 − rest) ÷ 7.',
 calc:function(v){var d=G.pd(v.d);need(d,'Pick the exam date');var left=G.daysBetween(G.today(),d);need(left>0,'Exam date must be in the future');var tot=v.ch*v.hch*(1+v.rev/100),sd=left*(7-v.off)/7;return{res:[R('Hours per study day',tot/sd,'num',{hero:1}),R('Total hours needed',tot,'num'),R('Days left',left,'int'),R('Study days',Math.floor(sd),'int')]};}});
def({id:'grade-needed',cat:'edu',name:'Final Exam Grade Calculator',desc:'The score you need on the final to reach a course grade.',keywords:'what do i need',
 fields:[N('cur','Current grade (%)',78),N('w','Final exam weight (%)',40),N('goal','Grade you want (%)',85)],formula:'Needed = (goal − current × (1 − w)) ÷ w.',
 calc:function(v){need(v.w>0&&v.w<=100,'Weight must be 1-100');var x=(v.goal-v.cur*(1-v.w/100))/(v.w/100);return{res:[R('Score needed on final',x,'pct',{hero:1}),R('Reachable?',x<=100?'Yes':'Not with this weight','text')]};}});
})(typeof window!=='undefined'?window.G:globalThis.G);

;
(function(G){'use strict';
var N=G.N,S=G.S,R=G.R,def=G.def,fail=G.fail;
function need(c,m){if(!c)fail(m);}
function nums(s){var a=String(s).split(/[\s,;]+/).filter(Boolean).map(Number);need(a.length&&a.every(isFinite),'Enter numbers separated by commas or spaces');return a;}
function ev(src,deg){try{return G.compile(src,{deg:deg})({});}catch(e){fail(e.message);}}
function bigGcd(a,b){while(b){var t=b;b=a%b;a=t;}return a<0n?-a:a;}
def({id:'calculator',cat:'math',name:'Basic Calculator',desc:'Type a sum and get the answer. Understands brackets, % and powers.',keywords:'calc arithmetic add subtract',ab:'+−',
 fields:[G.TX('e','Expression','(120 + 45) * 3 / 5 - 12%')],formula:'Evaluated by a safe built-in parser; no code is executed.',
 calc:function(v){var r=ev(v.e,false);need(isFinite(r),'Result is not a finite number');return{res:[R('Result',r,'plain',{hero:1})]};}});
def({id:'scientific',cat:'math',name:'Scientific Calculator',desc:'Trig, logs, roots, factorials and constants (π, e, φ).',keywords:'sin cos tan log ln sqrt',ab:'f(x)',
 fields:[G.TX('e','Expression','sin(30) + sqrt(144) + 5! + ln(e^2)'),S('a','Angles',[['deg','Degrees'],['rad','Radians']])],formula:'Functions: sin cos tan asin acos atan sinh cosh tanh sqrt cbrt root(x,n) abs ln log log2 exp floor ceil round fact min max pow mod gcd lcm. Constants: pi e tau phi. Use ^ for powers, ! for factorial, % for percent.',
 calc:function(v){var r=ev(v.e,v.a==='deg');need(isFinite(r),'Result is not a finite number');return{res:[R('Result',r,'plain',{hero:1}),R('Scientific notation',r.toExponential(6),'text')]};}});
def({id:'fraction',cat:'math',name:'Fraction Calculator',desc:'Add, subtract, multiply or divide fractions and see the simplest form.',keywords:'mixed number',
 fields:[G.TX('a','First fraction','3/4'),S('op','Operation',['+','-','×','÷']),G.TX('b','Second fraction','5/6')],formula:'Results are reduced by the greatest common divisor.',
 calc:function(v){function p(s){var m=/^\s*(-?\d+)\s*(?:\/\s*(\d+))?\s*$/.exec(s);need(m,'Use the form 3/4 or 2');var d=m[2]?+m[2]:1;need(d!==0,'Denominator cannot be zero');return[+m[1],d];}
  var a=p(v.a),b=p(v.b),n,d;if(v.op==='+'){n=a[0]*b[1]+b[0]*a[1];d=a[1]*b[1];}else if(v.op==='-'){n=a[0]*b[1]-b[0]*a[1];d=a[1]*b[1];}else if(v.op==='×'){n=a[0]*b[0];d=a[1]*b[1];}else{need(b[0]!==0,'Cannot divide by zero');n=a[0]*b[1];d=a[1]*b[0];}
  if(d<0){n=-n;d=-d;}var g=G.gcd(n,d)||1;n/=g;d/=g;var w=Math.trunc(n/d),r=Math.abs(n%d);return{res:[R('Result',d===1?String(n):n+'/'+d,'text',{hero:1}),R('Mixed number',d===1||!w&&!r?String(n):(w?w+' ':(n<0?'-':''))+(r?r+'/'+d:''),'text'),R('Decimal',n/d,'plain')]};}});
def({id:'quadratic',cat:'math',name:'Quadratic Equation Solver',desc:'Roots, discriminant and vertex of ax² + bx + c = 0.',keywords:'roots parabola',ab:'ax²',
 fields:[N('a','a',1),N('b','b',-3),N('c','c',2)],formula:'x = (−b ± √(b² − 4ac)) ÷ 2a.',
 calc:function(v){need(v.a!==0,'a cannot be zero');var d=v.b*v.b-4*v.a*v.c,out=[R('Discriminant',d,'plain')];if(d>=0){var s=Math.sqrt(d);out.unshift(R('x₁',(-v.b+s)/(2*v.a),'plain',{hero:1}),R('x₂',(-v.b-s)/(2*v.a),'plain'));}else{var re=-v.b/(2*v.a),im=Math.sqrt(-d)/(2*Math.abs(v.a));out.unshift(R('x₁',G.fmtPlain(re)+' + '+G.fmtPlain(im)+'i','text',{hero:1}),R('x₂',G.fmtPlain(re)+' − '+G.fmtPlain(im)+'i','text'));}out.push(R('Vertex',G.fmtPlain(-v.b/(2*v.a))+', '+G.fmtPlain(v.c-v.b*v.b/(4*v.a)),'text'));return{res:out};}});
def({id:'linear-system',cat:'math',name:'Simultaneous Equations (2 × 2)',desc:'Solve two linear equations in x and y.',keywords:'linear system cramer',
 fields:[N('a1','a₁ (x)',2),N('b1','b₁ (y)',3),N('c1','c₁',13),N('a2','a₂ (x)',1),N('b2','b₂ (y)',-1),N('c2','c₂',2)],formula:'a₁x + b₁y = c₁ and a₂x + b₂y = c₂, solved by Cramer\'s rule.',
 calc:function(v){var D=v.a1*v.b2-v.a2*v.b1;need(D!==0,'No unique solution (the lines are parallel or identical)');return{res:[R('x',(v.c1*v.b2-v.c2*v.b1)/D,'plain',{hero:1}),R('y',(v.a1*v.c2-v.a2*v.c1)/D,'plain')]};}});
def({id:'graph',cat:'math',name:'Graphing Calculator',desc:'Plot y = f(x) and read off values.',keywords:'plot function curve',ab:'y=',
 fields:[G.TX('f','y =','sin(x) * x / 3'),N('x0','x from',-10),N('x1','x to',10),S('a','Angles',[['rad','Radians'],['deg','Degrees']])],formula:'The function is sampled at 400 points. Use x as the variable.',
 calc:function(v){need(v.x1>v.x0,'"to" must exceed "from"');var f;try{f=G.compile(v.f,{vars:['x'],deg:v.a==='deg'});}catch(e){fail(e.message);}var pts=[],mn=Infinity,mx=-Infinity;for(var i=0;i<=400;i++){var x=v.x0+(v.x1-v.x0)*i/400,y=f({x:x});if(isFinite(y)){pts.push([x,y]);mn=Math.min(mn,y);mx=Math.max(mx,y);}else pts.push(null);}need(pts.some(Boolean),'Nothing to plot in this range');
  var zero=[];for(var j=1;j<pts.length;j++){if(pts[j]&&pts[j-1]&&pts[j-1][1]*pts[j][1]<0)zero.push(G.fmtPlain((pts[j-1][0]+pts[j][0])/2,4));}
  var F=function(x){return G.fmtPlain(x,6);};return{res:[R('Minimum y',F(mn),'text',{hero:1}),R('Maximum y',F(mx),'text'),R('y at x = '+G.fmtPlain(v.x0),F(f({x:v.x0})),'text'),R('Approx. x-intercepts',zero.slice(0,8).join(', ')||'none in range','text')],chart:{type:'plot',pts:pts,x0:v.x0,x1:v.x1,y0:mn,y1:mx}};}});
def({id:'prime',cat:'math',name:'Prime Number Checker & Factorizer',desc:'Is it prime? Prime factors and number of divisors.',keywords:'factors divisors',
 fields:[G.TX('n','Whole number','360360')],formula:'Trial division up to the square root of n. Works instantly up to about 10^15.',
 calc:function(v){var s=String(v.n).replace(/[,\s]/g,'');need(/^\d+$/.test(s)&&s.length<=15,'Enter a whole number up to 15 digits');var n=+s;need(n>=2,'Enter 2 or more');var f={},m=n,p=2;while(p*p<=m){while(m%p===0){f[p]=(f[p]||0)+1;m/=p;}p+=p===2?1:2;}if(m>1)f[m]=(f[m]||0)+1;var ks=Object.keys(f),isP=ks.length===1&&f[ks[0]]===1;var fs=ks.map(function(k){return f[k]>1?k+'^'+f[k]:k;}).join(' × ');
  var out=[R(isP?'Prime':'Composite',isP?'Yes, it is prime':'No, it is not prime','text',{hero:1}),R('Prime factors',fs,'text')];if(!isP){var d=1;ks.forEach(function(k){d*=f[k]+1;});out.push(R('Number of divisors',d,'int'));}return{res:out};}});
def({id:'gcd-lcm',cat:'math',name:'GCD & LCM Calculator',desc:'Greatest common divisor and least common multiple of several numbers.',keywords:'hcf',
 fields:[G.TX('n','Numbers','24, 36, 60')],formula:'Euclid\'s algorithm; LCM(a,b) = a × b ÷ GCD(a,b).',
 calc:function(v){var a=nums(v.n);need(a.length>=2&&a.every(function(x){return x>0&&Number.isInteger(x);}),'Enter two or more positive whole numbers');return{res:[R('GCD (HCF)',a.reduce(G.gcd),'plain',{hero:1}),R('LCM',a.reduce(G.lcm),'plain')]};}});
def({id:'statistics',cat:'math',name:'Statistics Calculator',desc:'Mean, median, mode, spread and quartiles for a data set.',keywords:'standard deviation variance average',
 fields:[G.TA('d','Numbers (comma, space or line separated)','12, 15, 15, 18, 22, 25, 31, 40')],formula:'Sample standard deviation uses n − 1; quartiles use linear interpolation (Excel QUARTILE.INC).',
 calc:function(v){var a=nums(v.d).sort(function(x,y){return x-y;}),n=a.length,sm=G.sum(a),mean=sm/n;function q(p){var i=(n-1)*p,l=Math.floor(i);return a[l]+(a[Math.min(l+1,n-1)]-a[l])*(i-l);}var ss=G.sum(a.map(function(x){return(x-mean)*(x-mean);})),cnt={},best=0;a.forEach(function(x){cnt[x]=(cnt[x]||0)+1;best=Math.max(best,cnt[x]);});var modes=Object.keys(cnt).filter(function(k){return cnt[k]===best;});
  return{res:[R('Mean',mean,'plain',{hero:1}),R('Median',q(.5),'plain'),R('Mode',best>1?modes.join(', '):'none','text'),R('Count',n,'int'),R('Sum',sm,'plain'),R('Min / Max',a[0]+' / '+a[n-1],'text'),R('Range',a[n-1]-a[0],'plain'),R('Q1 / Q3',G.fmtPlain(q(.25))+' / '+G.fmtPlain(q(.75)),'text'),R('Std. deviation (sample)',n>1?Math.sqrt(ss/(n-1)):0,'plain'),R('Std. deviation (population)',Math.sqrt(ss/n),'plain'),R('Variance (sample)',n>1?ss/(n-1):0,'plain')]};}});
def({id:'permutation',cat:'math',name:'Permutation & Combination Calculator',desc:'nPr and nCr, exact for large values.',keywords:'ncr npr factorial',
 fields:[N('n','n',52),N('r','r',5)],formula:'nPr = n! ÷ (n−r)!   nCr = n! ÷ (r!(n−r)!). Computed with BigInt.',
 calc:function(v){need(Number.isInteger(v.n)&&Number.isInteger(v.r)&&v.n>=0&&v.r>=0&&v.r<=v.n&&v.n<=5000,'Use whole numbers with 0 ≤ r ≤ n ≤ 5000');var p=1n;for(var i=0;i<v.r;i++)p*=BigInt(v.n-i);var f=1n;for(var j=2;j<=v.r;j++)f*=BigInt(j);return{res:[R('nCr (combinations)',(p/f).toString(),'bigint',{hero:1}),R('nPr (permutations)',p.toString(),'bigint'),R('n!',v.n<=170?G.fact(v.n):'too large','plain')]};}});
def({id:'sequence',cat:'math',name:'Arithmetic & Geometric Sequence Calculator',desc:'nth term and sum of a sequence.',keywords:'progression ap gp series',
 fields:[S('t','Type',[['ap','Arithmetic'],['gp','Geometric']]),N('a','First term',3),N('d','Common difference or ratio',4),N('n','Number of terms (n)',10)],formula:'AP: aₙ = a + (n−1)d, S = n/2 (2a + (n−1)d). GP: aₙ = a·rⁿ⁻¹, S = a(rⁿ − 1) ÷ (r − 1).',
 calc:function(v){need(Number.isInteger(v.n)&&v.n>=1,'n must be a whole number');var an,s,seq=[];for(var i=0;i<Math.min(v.n,10);i++)seq.push(v.t==='ap'?v.a+i*v.d:v.a*Math.pow(v.d,i));if(v.t==='ap'){an=v.a+(v.n-1)*v.d;s=v.n/2*(2*v.a+(v.n-1)*v.d);}else{an=v.a*Math.pow(v.d,v.n-1);s=v.d===1?v.a*v.n:v.a*(Math.pow(v.d,v.n)-1)/(v.d-1);}var o=[R('nth term',an,'plain',{hero:1}),R('Sum of n terms',s,'plain'),R('First terms',seq.map(function(x){return G.fmtPlain(x,6);}).join(', ')+(v.n>10?' …':''),'text')];if(v.t==='gp'&&Math.abs(v.d)<1)o.push(R('Sum to infinity',v.a/(1-v.d),'plain'));return{res:o};}});
def({id:'matrix',cat:'math',name:'Matrix Calculator (2×2 and 3×3)',desc:'Determinant, inverse, transpose and multiplication.',keywords:'determinant inverse',
 fields:[S('sz','Size',[['2','2 × 2'],['3','3 × 3']]),G.TA('A','Matrix A (one row per line)','2 1\n5 3'),G.TA('B','Matrix B (for A × B)','1 0\n0 1')],formula:'Determinant by cofactor expansion; inverse = adjugate ÷ determinant.',
 calc:function(v){var n=+v.sz;function M(s){var r=String(s).trim().split(/\n+/).map(function(l){return l.trim().split(/[\s,]+/).map(Number);});need(r.length===n&&r.every(function(x){return x.length===n&&x.every(isFinite);}),'Matrix must be '+n+' × '+n);return r;}
  var A=M(v.A),B=M(v.B);function det(m){if(n===2)return m[0][0]*m[1][1]-m[0][1]*m[1][0];return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);}
  var d=det(A);function fm(m){return m.map(function(r){return r.map(function(x){return G.fmtPlain(x,6);}).join('   ');}).join('\n');}
  var T=A[0].map(function(_,j){return A.map(function(r){return r[j];});}),P=A.map(function(r){return B[0].map(function(_,j){return G.sum(r.map(function(x,k){return x*B[k][j];}));});});
  var o=[R('Determinant',d,'plain',{hero:1}),R('Transpose of A',fm(T),'pre'),R('A × B',fm(P),'pre')];
  if(d!==0){var inv;if(n===2)inv=[[A[1][1]/d,-A[0][1]/d],[-A[1][0]/d,A[0][0]/d]];else{inv=[];for(var i=0;i<3;i++){inv.push([]);for(var j=0;j<3;j++){var r=[0,1,2].filter(function(x){return x!==j;}),c=[0,1,2].filter(function(x){return x!==i;});var mm=A[r[0]][c[0]]*A[r[1]][c[1]]-A[r[0]][c[1]]*A[r[1]][c[0]];inv[i].push(((i+j)%2?-1:1)*mm/d);}}}o.push(R('Inverse of A',fm(inv),'pre'));}else o.push(R('Inverse of A','does not exist (determinant is 0)','text'));return{res:o};}});
def({id:'roman',cat:'math',name:'Roman Numeral Converter',desc:'Numbers to Roman numerals and back.',keywords:'roman',
 fields:[G.TX('x','Number or numeral','2026')],formula:'Standard subtractive notation, 1 to 3999.',
 calc:function(v){var s=String(v.x).trim().toUpperCase(),T=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];function to(n){var o='';T.forEach(function(t){while(n>=t[0]){o+=t[1];n-=t[0];}});return o;}
  if(/^\d+$/.test(s)){var n=+s;need(n>=1&&n<=3999,'Use 1 to 3999');return{res:[R('Roman numeral',to(n),'text',{hero:1})]};}need(/^[MDCLXVI]+$/.test(s),'Enter digits or a Roman numeral');var val=0,mp={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};for(var i=0;i<s.length;i++){var a=mp[s[i]],b=mp[s[i+1]]||0;val+=a<b?-a:a;}need(to(val)===s,'Not a valid Roman numeral');return{res:[R('Number',val,'plain',{hero:1})]};}});
def({id:'random',cat:'math',name:'Random Number & Dice Generator',desc:'Random integers, dice rolls, coin flips and picks from a list.',keywords:'dice coin lottery picker',ab:'RNG',
 fields:[S('m','Mode',[['int','Number in a range'],['dice','Roll dice'],['coin','Flip coins'],['pick','Pick from list']]),N('a','Min / dice count / coins',1),N('b','Max / sides',100),G.TA('l','List (one per line, for Pick)','Pizza\nBurger\nSushi')],formula:'Uses the browser\'s cryptographic random source (crypto.getRandomValues). Change any input and press Calculate again for a new draw.',
 calc:function(v){function r(k){var a=new Uint32Array(1);(globalThis.crypto||{getRandomValues:function(x){x[0]=Math.random()*4294967296;}}).getRandomValues(a);return a[0]%k;}
  if(v.m==='int'){need(v.b>=v.a,'Max must be at least min');return{res:[R('Your number',v.a+r(v.b-v.a+1),'plain',{hero:1})]};}
  if(v.m==='dice'){need(v.a>=1&&v.a<=100&&v.b>=2,'1 to 100 dice, 2 or more sides');var d=[];for(var i=0;i<v.a;i++)d.push(1+r(v.b));return{res:[R('Total',G.sum(d),'plain',{hero:1}),R('Rolls',d.join(', '),'text')]};}
  if(v.m==='coin'){need(v.a>=1&&v.a<=1000,'1 to 1000 coins');var h=0;for(var j=0;j<v.a;j++)h+=r(2);return{res:[R('Heads',h,'int',{hero:1}),R('Tails',v.a-h,'int')]};}
  var l=String(v.l).split(/\n/).map(function(x){return x.trim();}).filter(Boolean);need(l.length>1,'Add at least two items');return{res:[R('Picked',l[r(l.length)],'text',{hero:1})]};}});
def({id:'average',cat:'math',name:'Average Calculator',desc:'Mean, median and weighted average.',keywords:'mean weighted',
 fields:[G.TA('d','Numbers','70, 82, 91, 64'),G.TA('w','Weights (optional, same count)','')],formula:'Weighted mean = Σ(xᵢ·wᵢ) ÷ Σwᵢ.',
 calc:function(v){var a=nums(v.d),o=[R('Mean',G.sum(a)/a.length,'plain',{hero:1}),R('Count',a.length,'int')];if(String(v.w).trim()){var w=nums(v.w);need(w.length===a.length,'Weights must match the count');o.push(R('Weighted mean',G.sum(a.map(function(x,i){return x*w[i];}))/G.sum(w),'plain'));}return{res:o};}});
def({id:'area-shapes',cat:'math',name:'Area & Perimeter Calculator',desc:'Area and perimeter of common shapes.',keywords:'geometry circle triangle rectangle',
 fields:[S('s','Shape',[['rect','Rectangle'],['circle','Circle'],['tri','Triangle (3 sides)'],['trap','Trapezoid'],['ell','Ellipse']]),N('a','a (length / radius / side 1)',8),N('b','b (width / side 2)',5),N('c','c (side 3 / base 2)',6),N('h','Height (trapezoid)',4)],formula:'Triangle area by Heron\'s formula; circle π r².',
 calc:function(v){var A,P;switch(v.s){case'rect':A=v.a*v.b;P=2*(v.a+v.b);break;case'circle':A=Math.PI*v.a*v.a;P=2*Math.PI*v.a;break;case'tri':need(v.a+v.b>v.c&&v.a+v.c>v.b&&v.b+v.c>v.a,'These sides cannot form a triangle');P=v.a+v.b+v.c;var s=P/2;A=Math.sqrt(s*(s-v.a)*(s-v.b)*(s-v.c));break;case'trap':A=(v.a+v.c)/2*v.h;P=NaN;break;default:A=Math.PI*v.a*v.b;P=Math.PI*(3*(v.a+v.b)-Math.sqrt((3*v.a+v.b)*(v.a+3*v.b)));}
  var o=[R('Area',A,'plain',{hero:1})];if(isFinite(P))o.push(R('Perimeter'+(v.s==='ell'?' (Ramanujan approx.)':''),P,'plain'));return{res:o};}});
def({id:'volume-shapes',cat:'math',name:'Volume & Surface Area Calculator',desc:'Cube, cylinder, cone, sphere and box.',keywords:'3d solid geometry',
 fields:[S('s','Solid',[['box','Box'],['cube','Cube'],['cyl','Cylinder'],['cone','Cone'],['sph','Sphere']]),N('a','a (length / side / radius)',4),N('b','b (width)',3),N('h','h (height)',5)],formula:'Standard solid-geometry formulas.',
 calc:function(v){var V,A,a=v.a,b=v.b,h=v.h,pi=Math.PI;switch(v.s){case'box':V=a*b*h;A=2*(a*b+b*h+a*h);break;case'cube':V=a*a*a;A=6*a*a;break;case'cyl':V=pi*a*a*h;A=2*pi*a*(a+h);break;case'cone':var l=Math.sqrt(a*a+h*h);V=pi*a*a*h/3;A=pi*a*(a+l);break;default:V=4/3*pi*a*a*a;A=4*pi*a*a;}return{res:[R('Volume',V,'plain',{hero:1}),R('Surface area',A,'plain')]};}});
def({id:'pythagoras',cat:'math',name:'Pythagorean Theorem Calculator',desc:'Find the missing side of a right triangle.',keywords:'hypotenuse right triangle',
 fields:[N('a','Side a (leave 0 to solve)',3),N('b','Side b (leave 0 to solve)',4),N('c','Hypotenuse c (leave 0 to solve)',0)],formula:'a² + b² = c². Leave exactly one value at 0.',
 calc:function(v){var z=[v.a,v.b,v.c].filter(function(x){return x===0;}).length;need(z===1,'Leave exactly one side as 0');var a=v.a,b=v.b,c=v.c;if(c===0)c=Math.hypot(a,b);else if(a===0){need(c>b,'c must be longer than b');a=Math.sqrt(c*c-b*b);}else{need(c>a,'c must be longer than a');b=Math.sqrt(c*c-a*a);}return{res:[R('a',a,'plain'),R('b',b,'plain'),R('c',c,'plain',{hero:1}),R('Area',a*b/2,'plain'),R('Angle A',Math.atan2(a,b)*180/Math.PI,'deg')]};}});
def({id:'scientific-notation',cat:'math',name:'Scientific Notation Converter',desc:'Standard form to scientific notation and the spelled-out number.',keywords:'exponent standard form',ab:'SN',
 fields:[G.TX('x','Number','123456789'),S('ind','Words style',[['y','Indian (lakh, crore)'],['n','International']])],formula:'a × 10ⁿ with 1 ≤ |a| < 10.',
 calc:function(v){var x=Number(String(v.x).replace(/,/g,''));need(isFinite(x),'Enter a number');var e=x.toExponential(),w=G.words(x,v.ind==='y');return{res:[R('Scientific',e.replace('e+',' × 10^').replace('e-',' × 10^-'),'text',{hero:1}),R('In words',(x<0?'minus ':'')+(w||'(too large)'),'text')]};}});
})(typeof window!=='undefined'?window.G:globalThis.G);

;
(function(G){'use strict';
var N=G.N,S=G.S,R=G.R,def=G.def,fail=G.fail;
function need(c,m){if(!c)fail(m);}
function D(v,k){var d=G.pd(v[k]);need(d,'Pick a valid date');return d;}
var HOL=[];
def({id:'date-difference',cat:'date',name:'Date Difference Calculator',desc:'Years, months, days, weeks and hours between two dates.',keywords:'days between duration',
 fields:[G.DA('a','From','2026-01-01'),G.DA('b','To','2026-10-28'),G.CB('inc','Include end date',false)],formula:'Calendar difference plus the total number of days.',
 calc:function(v){var a=D(v,'a'),b=D(v,'b');if(a>b){var t=a;a=b;b=t;}var n=G.daysBetween(a,b)+(v.inc?1:0),y=G.ymd(a,b);return{res:[R('Difference',y.y+' years, '+y.m+' months, '+y.d+' days','text',{hero:1}),R('Total days',n,'int'),R('Weeks',Math.floor(n/7)+' weeks '+(n%7)+' days','text'),R('Hours',n*24,'int'),R('Minutes',n*1440,'int')]};}});
def({id:'date-add',cat:'date',name:'Add or Subtract Days from a Date',desc:'What date is it after N days, weeks, months or years?',keywords:'date plus minus deadline',
 fields:[G.DA('a','Start date','2026-10-28'),S('sg','Operation',[['1','Add'],['-1','Subtract']]),N('y','Years',0),N('m','Months',0),N('w','Weeks',0),N('d','Days',90)],formula:'Months and years are added first (clamped to month end), then weeks and days.',
 calc:function(v){var a=D(v,'a'),s=+v.sg,r=G.addMonths(a,s*(v.y*12+v.m));r=G.addDays(r,s*(v.w*7+v.d));need(!isNaN(r)&&r.getFullYear()>=100&&r.getFullYear()<=9999,'The result is outside the supported date range (years 100 to 9999)');return{res:[R('Result',G.longDate(r),'text',{hero:1}),R('ISO date',G.iso(r),'text'),R('Days from today',G.daysBetween(G.today(),r),'int')]};}});
def({id:'age',cat:'date',name:'Age Calculator',desc:'Exact age in years, months and days, plus the next birthday.',keywords:'birthday born date of birth',
 fields:[G.DA('dob','Date of birth','1990-05-15'),G.DA('on','Age at date','')],formula:'Calendar difference from date of birth to the chosen date (today by default).',
 calc:function(v){var b=D(v,'dob'),t=v.on?D(v,'on'):G.today();need(b<=t,'Birth date is after the chosen date');var y=G.ymd(b,t),nb=new Date(t.getFullYear(),b.getMonth(),b.getDate());if(nb<=t&&!(nb.getTime()===t.getTime()))nb=new Date(t.getFullYear()+1,b.getMonth(),b.getDate());var tot=G.daysBetween(b,t);return{res:[R('Age',y.y+' years, '+y.m+' months, '+y.d+' days','text',{hero:1}),R('Total days lived',tot,'int'),R('Born on a',G.DAYS[b.getDay()],'text'),R('Next birthday',nb.getTime()===t.getTime()?'Today!':G.longDate(nb)+' (in '+G.daysBetween(t,nb)+' days)','text')]};}});
def({id:'countdown',cat:'date',name:'Countdown Calculator',desc:'Time left until a date, updated live.',keywords:'days until event timer',live:true,
 fields:[G.TX('n','Event','New Year'),G.DA('d','Date','2027-01-01'),G.TX('t','Time (24 h)','00:00')],formula:'Difference between now and the target moment.',
 calc:function(v){var d=D(v,'d'),m=/^(\d{1,2}):(\d{2})$/.exec(v.t||'00:00');need(m,'Time must be HH:MM');var T=new Date(d.getFullYear(),d.getMonth(),d.getDate(),+m[1],+m[2]),ms=T-new Date(),neg=ms<0;ms=Math.abs(ms);var s=Math.floor(ms/1000);return{res:[R(neg?(v.n||'Event')+' was':(v.n||'Event')+' in',Math.floor(s/86400)+'d '+Math.floor(s%86400/3600)+'h '+Math.floor(s%3600/60)+'m '+s%60+'s','text',{hero:1}),R('Whole days',Math.floor(s/86400),'int'),R('Weeks',G.round(s/604800,1),'num')]};}});
def({id:'working-days',cat:'date',name:'Working Days Calculator',desc:'Business days between two dates, or a date N working days ahead.',keywords:'business days weekdays holidays networkdays',
 fields:[S('m','Mode',[['between','Days between dates'],['add','Date after N working days']]),G.DA('a','Start','2026-10-28'),G.DA('b','End (between mode)','2026-12-31'),N('n','Working days to add',30),S('we','Weekend',[['06','Sat + Sun'],['5','Fri only'],['56','Fri + Sat'],['','None']]),G.TA('h','Holidays to skip (YYYY-MM-DD, one per line)','2026-11-08\n2026-12-25')],formula:'Counts days that are not weekend days and not in your holiday list.',
 calc:function(v){var a=D(v,'a'),hs={};String(v.h).split(/[\s,]+/).forEach(function(x){if(G.pd(x))hs[x.slice(0,10)]=1;});var we=String(v.we||'').split('').map(Number);function work(d){return we.indexOf(d.getDay())<0&&!hs[G.iso(d)];}
  if(v.m==='between'){var b=D(v,'b');if(a>b){var t=a;a=b;b=t;}var c=0;for(var d=new Date(a);d<=b;d=G.addDays(d,1))if(work(d))c++;return{res:[R('Working days (inclusive)',c,'int',{hero:1}),R('Calendar days',G.daysBetween(a,b)+1,'int')]};}
  need(v.n>=0&&v.n<20000,'Enter 0 to 20000');var d2=new Date(a),k=0;while(k<v.n){d2=G.addDays(d2,1);if(work(d2))k++;}return{res:[R('Date',G.longDate(d2),'text',{hero:1})]};}});
def({id:'day-of-week',cat:'date',name:'Day of the Week Calculator',desc:'Weekday, week number, day of year and leap-year check for any date.',keywords:'weekday week number iso',
 fields:[G.DA('d','Date','2026-10-28')],formula:'ISO 8601 week numbering (weeks start on Monday).',
 calc:function(v){var d=D(v,'d'),w=G.isoWeek(d),doy=G.daysBetween(new Date(d.getFullYear(),0,1),d)+1,len=G.isLeap(d.getFullYear())?366:365;return{res:[R('Day',G.DAYS[d.getDay()],'text',{hero:1}),R('ISO week',w.week+' of '+w.year,'text'),R('Day of year',doy+' of '+len,'text'),R('Leap year',G.isLeap(d.getFullYear())?'Yes':'No','text'),R('Quarter','Q'+(Math.floor(d.getMonth()/3)+1),'text')]};}});
def({id:'time-zone',cat:'date',name:'Time Zone Converter',desc:'Convert a time between world cities and zones.',keywords:'world clock utc ist est',
 fields:[G.DT('t','Date and time','2026-10-28T09:00'),S('from','From',zones(),'Asia/Kolkata'),S('to','To',zones(),'America/New_York')],formula:'Uses the browser\'s built-in IANA time-zone database (Intl), so daylight saving is handled.',
 calc:function(v){need(typeof Intl!=='undefined'&&v.t,'Pick a date and time');var m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v.t);need(m,'Pick a date and time');var guess=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5]);var off=offset(guess,v.from),utc=guess-off;var off2=offset(utc,v.from);utc=guess-off2;
  function f(z){return new Intl.DateTimeFormat('en-GB',{timeZone:z,weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(utc));}
  var rows=zones().map(function(z){return[z[1],f(z[0])];});return{res:[R('Converted time',f(v.to),'text',{hero:1}),R('UTC',new Date(utc).toISOString().slice(0,16).replace('T',' '),'text')],table:{title:'Other cities',cols:['City','Local time'],kinds:['text','text'],rows:rows}};}});
function zones(){return[['Asia/Kolkata','India (IST)'],['UTC','UTC'],['America/New_York','New York'],['America/Los_Angeles','Los Angeles'],['America/Chicago','Chicago'],['America/Sao_Paulo','São Paulo'],['Europe/London','London'],['Europe/Paris','Paris / Berlin'],['Europe/Moscow','Moscow'],['Asia/Dubai','Dubai'],['Asia/Singapore','Singapore'],['Asia/Tokyo','Tokyo'],['Asia/Shanghai','Beijing'],['Australia/Sydney','Sydney'],['Pacific/Auckland','Auckland'],['Africa/Johannesburg','Johannesburg']];}
function offset(ms,z){var p=new Intl.DateTimeFormat('en-US',{timeZone:z,hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric'}).formatToParts(new Date(ms)),o={};p.forEach(function(x){o[x.type]=+x.value;});return Date.UTC(o.year,o.month-1,o.day,o.hour,o.minute,o.second)-Math.floor(ms/1000)*1000;}
def({id:'time-duration',cat:'date',name:'Time Duration Calculator',desc:'Add up hours and minutes, or find the time between two clock times.',keywords:'hours minutes timesheet work hours',
 fields:[S('m','Mode',[['sum','Add durations'],['between','Between two times']]),G.TA('l','Durations HH:MM (one per line)','1:30\n2:45\n0:50'),G.TX('s','Start (HH:MM)','09:15'),G.TX('e','End (HH:MM)','17:40'),N('br','Break (minutes)',30)],formula:'Everything is converted to minutes.',
 calc:function(v){function pm(s){var m=/^(\d+):(\d{2})$/.exec(String(s).trim());need(m&&+m[2]<60,'Use HH:MM');return+m[1]*60+ +m[2];}function f(x){return Math.floor(x/60)+'h '+String(x%60).padStart(2,'0')+'m';}
  if(v.m==='sum'){var t=0;String(v.l).split(/\n/).filter(function(x){return x.trim();}).forEach(function(x){t+=pm(x);});return{res:[R('Total',f(t),'text',{hero:1}),R('Decimal hours',t/60,'num')]};}
  var a=pm(v.s),b=pm(v.e);if(b<a)b+=1440;var d=b-a-v.br;need(d>=0,'Break is longer than the period');return{res:[R('Worked',f(d),'text',{hero:1}),R('Decimal hours',d/60,'num')]};}});
def({id:'week-number',cat:'date',name:'Days Until Calculator',desc:'Days, weeks and working days from today to a date.',keywords:'how many days left until',
 fields:[G.DA('d','Target date','2026-12-25')],formula:'Difference between today and the target date.',
 calc:function(v){var d=D(v,'d'),n=G.daysBetween(G.today(),d),c=0;for(var x=G.today();x<d;x=G.addDays(x,1)){var w=x.getDay();if(w!==0&&w!==6)c++;}return{res:[R(n>=0?'Days left':'Days ago',Math.abs(n),'int',{hero:1}),R('Weeks',G.round(Math.abs(n)/7,1),'num'),R('Weekdays (Mon-Fri)',c,'int'),R('Target falls on',G.DAYS[d.getDay()],'text')]};}});
def({id:'unix-time',cat:'date',name:'Unix Timestamp Converter',desc:'Epoch seconds or milliseconds to a date, and back.',keywords:'epoch timestamp',ab:'UTS',
 fields:[G.TX('x','Timestamp or ISO date','1798000000')],formula:'Seconds since 1970-01-01 UTC. 13-digit values are treated as milliseconds.',
 calc:function(v){var s=String(v.x).trim(),ms;if(/^-?\d+(\.\d+)?$/.test(s)){var n=Number(s);ms=Math.abs(n)>=1e11?n:n*1000;}else{ms=Date.parse(s);need(!isNaN(ms),'Enter digits or a date like 2026-10-28T09:00:00Z');}var d=new Date(ms);need(!isNaN(d),'Out of range');return{res:[R('UTC',d.toISOString(),'text',{hero:1}),R('Seconds',Math.floor(ms/1000),'int'),R('Milliseconds',ms,'int'),R('Your local time',d.toString(),'text'),R('Relative to now',G.round((ms-Date.now())/864e5,2)+' days','text')]};}});
})(typeof window!=='undefined'?window.G:globalThis.G);

;
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

;
(function(G){'use strict';
var N=G.N,S=G.S,R=G.R,def=G.def,fail=G.fail;
function need(c,m){if(!c)fail(m);}
function hm(h){var m=Math.round(h*60);return Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m';}
def({id:'fuel-cost',cat:'travel',name:'Trip Fuel Cost Calculator',desc:'Fuel needed and cost for a journey.',keywords:'petrol diesel road trip cost',
 fields:[N('d','Distance (km)',450),N('m','Mileage (km per litre)',16),N('p','Fuel price per litre',102),N('r','Round trip?',1,{min:1,max:2,step:1})],formula:'Fuel = distance ÷ mileage; cost = fuel × price. Enter 2 in the last box for a round trip.',
 calc:function(v){need(v.m>0,'Mileage must be above zero');var d=v.d*(v.r>=2?2:1),l=d/v.m;return{res:[R('Fuel cost',l*v.p,'cur',{hero:1}),R('Fuel needed (L)',l,'num'),R('Cost per km',v.p/v.m,'cur'),R('Distance',d,'num')]};}});
def({id:'mileage',cat:'travel',name:'Fuel Mileage Calculator',desc:'Your real mileage from a full-tank fill-up.',keywords:'km per litre mpg efficiency',
 fields:[N('d','Distance since last fill (km)',520),N('l','Fuel added (litres)',32),N('p','Price per litre',102)],formula:'Mileage = distance ÷ fuel.',
 calc:function(v){need(v.l>0&&v.d>0,'Enter distance and fuel');return{res:[R('km per litre',v.d/v.l,'num',{hero:1}),R('L per 100 km',v.l/v.d*100,'num'),R('MPG (US)',v.d/1.609344/(v.l/3.785411784),'num'),R('Cost per km',v.l*v.p/v.d,'cur')]};}});
def({id:'speed-distance-time',cat:'travel',name:'Speed, Distance & Time Calculator',desc:'Find whichever of the three you do not know.',keywords:'travel time arrival',
 fields:[S('f','Find',[['t','Time'],['s','Speed'],['d','Distance']]),N('d','Distance (km)',300),N('s','Speed (km/h)',60),N('t','Time (hours)',5)],formula:'Distance = speed × time.',
 calc:function(v){if(v.f==='t'){need(v.s>0,'Speed must be above zero');return{res:[R('Time',hm(v.d/v.s),'text',{hero:1}),R('Hours',v.d/v.s,'num')]};}if(v.f==='s'){need(v.t>0,'Time must be above zero');return{res:[R('Speed (km/h)',v.d/v.t,'num',{hero:1}),R('Speed (m/s)',v.d/v.t/3.6,'num')]};}return{res:[R('Distance (km)',v.s*v.t,'num',{hero:1})]};}});
def({id:'trip-split',cat:'travel',name:'Trip Expense Splitter',desc:'Who owes whom after a group trip.',keywords:'group travel split settle expenses',
 fields:[G.ROWS('p','Who paid what',['Name','Paid'],[['Asha',8200],['Ravi',1500],['Meena',0],['Kiran',3300]])],formula:'Each person\'s balance = paid − equal share. Settlements pair the biggest debtor with the biggest creditor.',
 calc:function(v){var ps=v.p.map(function(r){return{n:String(r[0]),p:+r[1]||0};}).filter(function(x){return x.n;});need(ps.length>=2,'Add at least two people');var tot=G.sum(ps.map(function(x){return x.p;})),sh=tot/ps.length,b=ps.map(function(x){return{n:x.n,v:G.round(x.p-sh,2)};}),cr=b.filter(function(x){return x.v>0.005;}).sort(function(a,c){return c.v-a.v;}),de=b.filter(function(x){return x.v<-0.005;}).sort(function(a,c){return a.v-c.v;}),rows=[];
  var i=0,j=0;while(i<cr.length&&j<de.length){var m=Math.min(cr[i].v,-de[j].v);rows.push([de[j].n+' pays '+cr[i].n,m]);cr[i].v-=m;de[j].v+=m;if(cr[i].v<0.005)i++;if(de[j].v>-0.005)j++;}
  return{res:[R('Total spent',tot,'cur'),R('Equal share',sh,'cur',{hero:1})],table:{title:'Settle up',cols:['Payment','Amount'],kinds:['text','cur'],rows:rows.length?rows:[['Everyone is even',0]]}};}});
def({id:'ev-charge',cat:'travel',name:'EV Charging Time & Cost Calculator',desc:'How long charging takes and what it costs.',keywords:'electric vehicle kwh charger',
 fields:[N('cap','Battery capacity (kWh)',40),N('from','Charge from (%)',20),N('to','Charge to (%)',80),N('kw','Charger power (kW)',7.4),N('eff','Charging efficiency (%)',90),N('p','Electricity price per kWh',8)],formula:'Energy = capacity × (to − from); time = energy ÷ (power × efficiency).',
 calc:function(v){need(v.to>v.from&&v.kw>0&&v.eff>0,'Check the percentages and power');var e=v.cap*(v.to-v.from)/100,drawn=e/(v.eff/100);return{res:[R('Charging time',hm(drawn/v.kw),'text',{hero:1}),R('Energy added (kWh)',e,'num'),R('Energy from grid (kWh)',drawn,'num'),R('Cost',drawn*v.p,'cur')]};}});
def({id:'fuel-vs-ev',cat:'travel',name:'Petrol vs EV Running Cost',desc:'Cost per km and yearly savings of going electric.',keywords:'electric vs petrol saving',
 fields:[N('km','Distance per year (km)',12000),N('m','Petrol car mileage (km/L)',15),N('pp','Petrol price per litre',102),N('wh','EV consumption (Wh/km)',130),N('ep','Electricity price per kWh',8)],formula:'Petrol cost/km = price ÷ mileage; EV cost/km = Wh/km ÷ 1000 × tariff.',
 calc:function(v){need(v.m>0,'Mileage must be above zero');var pc=v.pp/v.m,ec=v.wh/1000*v.ep;return{res:[R('Yearly saving',(pc-ec)*v.km,'cur',{hero:1}),R('Petrol cost per km',pc,'cur'),R('EV cost per km',ec,'cur'),R('Petrol per year',pc*v.km,'cur'),R('EV per year',ec*v.km,'cur')]};}});
def({id:'carbon-trip',cat:'travel',name:'Trip Carbon Footprint Calculator',desc:'CO₂ from a journey by car, bus, train or flight.',keywords:'emissions co2 flight',
 fields:[N('d','Distance (km)',500),S('m','Mode',[[0.171,'Petrol car'],[0.153,'Diesel car'],[0.089,'Bus'],[0.041,'Train'],[0.255,'Short flight'],[0.150,'Long flight'],[0.03,'Electric car (grid avg)']]),N('p','Passengers sharing',1)],formula:'CO₂ = distance × kg per passenger-km (typical average factors; real values vary by vehicle and country).',
 calc:function(v){need(v.p>=1,'At least one passenger');var car=[0.171,0.153,0.03].indexOf(+v.m)>=0,c=v.d*v.m/(car?v.p:1);return{res:[R('CO₂ (kg)',c,'num',{hero:1}),R('Trees needed for a year (approx.)',c/21,'num')],note:'Car factors are per vehicle and are divided by passengers. Averages only.'};}});
})(typeof window!=='undefined'?window.G:globalThis.G);

;
(function(G){'use strict';
var N=G.N,S=G.S,R=G.R,def=G.def,fail=G.fail;
function need(c,m){if(!c)fail(m);}
function dur(s){s=Math.round(s*1e6)/1e6;if(s<1)return G.round(s*1000,1)+' ms';var o=[],u=[[86400,'d'],[3600,'h'],[60,'m'],[1,'s']];u.forEach(function(x){if(s>=x[0]){o.push(Math.floor(s/x[0])+x[1]);s%=x[0];}});return o.join(' ');}
function ip2n(s){var p=String(s).trim().split('.');need(p.length===4&&p.every(function(x){return /^\d{1,3}$/.test(x)&&+x<256;}),'Enter an IPv4 address like 10.0.0.0');return((+p[0]*256+ +p[1])*256+ +p[2])*256+ +p[3];}
function n2ip(n){return[n/16777216,n/65536,n/256,n].map(function(x){return Math.floor(x)%256;}).join('.');}
def({id:'uptime-sla',cat:'tech',name:'Uptime / SLA Downtime Calculator',desc:'Allowed downtime for 99%, 99.9%, 99.99% and your own target.',keywords:'nines availability slo devops sre',
 fields:[N('a','Availability target (%)',99.95,{step:.001})],formula:'Downtime = period × (1 − availability).',
 calc:function(v){need(v.a>0&&v.a<=100,'Use a value between 0 and 100');var f=1-v.a/100;var rows=[['Per day',86400],['Per week',604800],['Per 30-day month',2592000],['Per quarter',7776000],['Per year',31536000]].map(function(x){return[x[0],dur(x[1]*f)];});return{res:[R('Allowed downtime per month',dur(2592000*f),'text',{hero:1}),R('Per year',dur(31536000*f),'text')],table:{title:'Downtime budget',cols:['Period','Allowed downtime'],kinds:['text','text'],rows:rows}};}});
def({id:'composite-sla',cat:'tech',name:'Composite SLA Calculator',desc:'Availability of a system built from serial or redundant components.',keywords:'dependencies parallel redundancy',
 fields:[G.TA('a','Component availabilities (%), one per line','99.99\n99.95\n99.9'),S('m','Arrangement',[['s','Serial: all must work'],['p','Parallel: any one is enough']])],formula:'Serial: A = ∏ aᵢ. Parallel: A = 1 − ∏ (1 − aᵢ).',
 calc:function(v){var a=String(v.a).split(/[\s,]+/).filter(Boolean).map(Number);need(a.length>=1&&a.every(function(x){return x>0&&x<=100;}),'Enter percentages between 0 and 100');var t=v.m==='s'?a.reduce(function(p,x){return p*x/100;},1):1-a.reduce(function(p,x){return p*(1-x/100);},1);return{res:[R('Combined availability',t*100,'pct4',{hero:1}),R('Downtime per year',dur(31536000*(1-t)),'text')]};}});
def({id:'error-budget',cat:'tech',name:'Error Budget Calculator',desc:'How much failure your SLO allows, and how fast you are burning it.',keywords:'slo sre burn rate',
 fields:[N('slo','SLO (%)',99.9,{step:.01}),N('req','Requests in the window',10000000),N('bad','Failed requests so far',4200),N('days','Window length (days)',30),N('el','Days elapsed',12)],formula:'Budget = requests × (1 − SLO). Burn rate = (failures ÷ budget) ÷ (elapsed ÷ window).',
 calc:function(v){need(v.slo<100&&v.req>0&&v.el>0,'Check the inputs');var b=v.req*(1-v.slo/100),used=v.bad/b,br=used/(v.el/v.days);return{res:[R('Budget (failed requests)',Math.floor(b),'int'),R('Budget used',used*100,'pct',{hero:1}),R('Burn rate',br,'x'),R('Budget lasts about',br>0?G.round(v.days/br,1)+' days':'indefinitely','text')],note:'A burn rate above 1 means you will exhaust the budget before the window ends.'};}});
def({id:'cidr',cat:'tech',name:'CIDR / Subnet Calculator',desc:'Network, broadcast, mask and host range for an IPv4 block.',keywords:'subnet mask ip network vpc',
 fields:[G.TX('ip','Address','10.20.30.40'),N('p','Prefix length (/n)',22,{step:1})],formula:'Mask = 2³² − 2^(32−n); hosts = 2^(32−n) − 2.',
 calc:function(v){var ip=ip2n(v.ip),p=v.p;need(Number.isInteger(p)&&p>=0&&p<=32,'Prefix must be 0 to 32');var size=Math.pow(2,32-p),net=Math.floor(ip/size)*size,bc=net+size-1,mask=p===0?0:4294967296-size;var usable=p>=31?size:size-2;return{res:[R('Network',n2ip(net)+'/'+p,'text',{hero:1}),R('Subnet mask',n2ip(mask),'text'),R('Wildcard',n2ip(4294967295-mask),'text'),R('Broadcast',n2ip(bc),'text'),R('Usable hosts',usable,'int'),R('First host',n2ip(p>=31?net:net+1),'text'),R('Last host',n2ip(p>=31?bc:bc-1),'text'),R('Private range',(net>=167772160&&bc<=184549375)||(net>=2886729728&&bc<=2887778303)||(net>=3232235520&&bc<=3232301055)?'Yes (RFC 1918)':'No','text')]};}});
def({id:'subnet-split',cat:'tech',name:'Subnet Splitter',desc:'Divide a block into equal subnets.',keywords:'vpc subnets cidr divide',
 fields:[G.TX('ip','Network','10.0.0.0'),N('p','Current prefix',16,{step:1}),N('n','Subnets needed',8)],formula:'Extra bits = ceil(log₂ subnets).',
 calc:function(v){var ip=ip2n(v.ip);need(v.p>=0&&v.p<=30&&v.n>=1&&v.n<=4096,'Prefix 0-30, subnets 1-4096');var b=Math.ceil(Math.log2(v.n)),np=v.p+b;need(np<=30,'Not enough address space');var sz=Math.pow(2,32-np),base=Math.floor(ip/Math.pow(2,32-v.p))*Math.pow(2,32-v.p),rows=[];for(var i=0;i<Math.min(Math.pow(2,b),64);i++)rows.push([n2ip(base+i*sz)+'/'+np,n2ip(base+i*sz+1),n2ip(base+i*sz+sz-2),sz-2]);return{res:[R('New prefix','/'+np,'text',{hero:1}),R('Subnets created',Math.pow(2,b),'int'),R('Hosts per subnet',sz-2,'int')],table:{title:'Subnets'+(Math.pow(2,b)>64?' (first 64)':''),cols:['Subnet','First host','Last host','Hosts'],kinds:['text','text','text','int'],rows:rows}};}});
def({id:'transfer-time',cat:'tech',name:'Data Transfer Time Calculator',desc:'How long a file or backup takes at a given bandwidth.',keywords:'download upload bandwidth mbps',
 fields:[N('s','File size',50),S('u','Size unit',['MB','GB','TB']),N('b','Bandwidth',100),S('bu','Bandwidth unit',['Mbps','Gbps','MB/s']),N('e','Real-world efficiency (%)',85)],formula:'Time = size (bits) ÷ (bandwidth × efficiency).',
 calc:function(v){need(v.s>0&&v.b>0&&v.e>0,'Enter positive values');var by=v.s*{MB:1e6,GB:1e9,TB:1e12}[v.u],bits=by*8,bps=v.b*{Mbps:1e6,Gbps:1e9,'MB/s':8e6}[v.bu]*v.e/100;return{res:[R('Transfer time',dur(bits/bps),'text',{hero:1}),R('Effective speed (MB/s)',bps/8e6,'num')]};}});
def({id:'bdp',cat:'tech',name:'Bandwidth-Delay Product',desc:'Data in flight and the TCP window you need to fill a link.',keywords:'tcp window latency rtt throughput',
 fields:[N('bw','Bandwidth (Mbps)',1000),N('rtt','Round-trip time (ms)',80)],formula:'BDP = bandwidth × RTT.',
 calc:function(v){var bits=v.bw*1e6*v.rtt/1000;return{res:[R('BDP (KB)',bits/8/1024,'num',{hero:1}),R('BDP (MB)',bits/8/1048576,'num'),R('Single-stream limit with 64 KB window (Mbps)',65536*8/(v.rtt/1000)/1e6,'num')],note:'If the window is smaller than the BDP, one connection cannot use the full link.'};}});
def({id:'raid',cat:'tech',name:'RAID Capacity Calculator',desc:'Usable space and fault tolerance for RAID levels.',keywords:'disk storage array',
 fields:[S('l','Level',['RAID 0','RAID 1','RAID 5','RAID 6','RAID 10']),N('n','Number of disks',6),N('sz','Disk size (TB)',4)],formula:'RAID 5 = (n−1) disks usable, RAID 6 = (n−2), RAID 10 and 1 = n÷2.',
 calc:function(v){var n=Math.floor(v.n),u,t,min={ 'RAID 0':2,'RAID 1':2,'RAID 5':3,'RAID 6':4,'RAID 10':4}[v.l];need(n>=min,v.l+' needs at least '+min+' disks');if(v.l==='RAID 10')need(n%2===0,'RAID 10 needs an even number of disks');if(v.l==='RAID 0'){u=n;t='None';}else if(v.l==='RAID 1'||v.l==='RAID 10'){u=n/2;t='1 per mirror pair';}else if(v.l==='RAID 5'){u=n-1;t='1 disk';}else{u=n-2;t='2 disks';}return{res:[R('Usable capacity (TB)',u*v.sz,'num',{hero:1}),R('Raw capacity (TB)',n*v.sz,'num'),R('Efficiency',u/n*100,'pct'),R('Fault tolerance',t,'text')]};}});
def({id:'k8s-resources',cat:'tech',name:'Kubernetes Resource Calculator',desc:'Total CPU and memory for replicas, with node-count estimate.',keywords:'k8s pods requests limits nodes',
 fields:[N('rep','Replicas',12),G.TX('cpu','CPU request per pod (e.g. 250m or 0.5)','250m'),G.TX('mem','Memory request per pod (e.g. 512Mi, 1Gi)','512Mi'),N('ncpu','Node vCPUs',4),N('nmem','Node memory (GiB)',16),N('res','Reserved per node for system (%)',15)],formula:'Totals = replicas × request; nodes = max(CPU, memory) ÷ allocatable per node.',
 calc:function(v){function cpu(s){var m=/^([\d.]+)(m?)$/.exec(String(s).trim());need(m,'CPU like 250m or 0.5');return m[2]?+m[1]/1000:+m[1];}function mem(s){var m=/^([\d.]+)\s*(Ki|Mi|Gi|Ti|K|M|G|T)?$/i.exec(String(s).trim());need(m,'Memory like 512Mi or 2Gi');var f={ki:1/1048576,mi:1/1024,gi:1,ti:1024,k:1e3/1073741824,m:1e6/1073741824,g:1e9/1073741824,t:1e12/1073741824}[(m[2]||'gi').toLowerCase()];return+m[1]*f;}
  var tc=v.rep*cpu(v.cpu),tm=v.rep*mem(v.mem),ac=v.ncpu*(1-v.res/100),am=v.nmem*(1-v.res/100),nodes=Math.max(Math.ceil(tc/ac),Math.ceil(tm/am));return{res:[R('Total CPU (cores)',tc,'num'),R('Total memory (GiB)',tm,'num'),R('Nodes needed',nodes,'int',{hero:1}),R('Limiting resource',Math.ceil(tc/ac)>=Math.ceil(tm/am)?'CPU':'Memory','text')],note:'Ignores pod-per-node limits, daemonsets and bin-packing waste. Add headroom for rolling updates.'};}});
def({id:'cron',cat:'tech',name:'Cron Expression Explainer',desc:'Plain-English meaning and next run times for a cron schedule.',keywords:'crontab schedule scheduler',
 fields:[G.TX('c','Cron (5 fields)','*/15 9-17 * * 1-5')],formula:'Fields: minute hour day-of-month month day-of-week. Supports lists, ranges, steps and names.',
 calc:function(v){var f=String(v.c).trim().split(/\s+/);need(f.length===5,'Use five fields: minute hour day month weekday');var R5=[[0,59],[0,23],[1,31],[1,12],[0,7]],MN={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};
  function parse(s,i){var set={};s.toLowerCase().split(',').forEach(function(p){var st=1,m=/^(.*)\/(\d+)$/.exec(p);if(m){p=m[1];st=+m[2];}var a,b;if(p==='*'||p===''){a=R5[i][0];b=R5[i][1];}else if(p.indexOf('-')>0){var q=p.split('-');a=MN[q[0]]!==undefined?MN[q[0]]:+q[0];b=MN[q[1]]!==undefined?MN[q[1]]:+q[1];}else{a=MN[p]!==undefined?MN[p]:+p;b=m?R5[i][1]:a;}need(isFinite(a)&&isFinite(b)&&a>=R5[i][0]&&b<=R5[i][1],'Field '+(i+1)+' is out of range');need(st>=1,'Step must be 1 or more');for(var x=a;x<=b;x+=st)set[i===4&&x===7?0:x]=1;});return set;}
  var mi=parse(f[0],0),ho=parse(f[1],1),dm=parse(f[2],2),mo=parse(f[3],3),dw=parse(f[4],4),domStar=f[2]==='*',dowStar=f[4]==='*';
  function ok(d){var dmok=dm[d.getDate()],dwok=dw[d.getDay()],dayok=domStar&&dowStar?true:domStar?dwok:dowStar?dmok:(dmok||dwok);return mo[d.getMonth()+1]&&dayok&&ho[d.getHours()]&&mi[d.getMinutes()];}
  var out=[],d=new Date();d.setSeconds(0,0);d=new Date(d.getTime()+60000);for(var k=0;k<600000&&out.length<8;k++){if(ok(d))out.push(d.toString().slice(0,21));d=new Date(d.getTime()+60000);}
  var per=Object.keys(mi).length*Object.keys(ho).length;return{res:[R('Runs per matching day',per,'int',{hero:1}),R('Next runs (your time zone)',out.join('\n')||'none in the next year','pre')],note:'Day-of-month and day-of-week combine with OR when both are restricted, as in standard cron.'};}});
def({id:'password-entropy',cat:'tech',name:'Password Strength Calculator',desc:'Entropy and time to brute-force. Runs only in your browser.',keywords:'security entropy bits crack',
 fields:[G.TX('p','Password to test','correct horse battery staple'),N('gps','Attacker guesses per second',1e10)],formula:'Entropy = length × log₂(pool size). Dictionary words and patterns are much weaker than this suggests.',
 calc:function(v){var p=String(v.p);need(p.length>0,'Enter a password');var pool=(/[a-z]/.test(p)?26:0)+(/[A-Z]/.test(p)?26:0)+(/\d/.test(p)?10:0)+(/[^A-Za-z0-9]/.test(p)?33:0),bits=p.length*Math.log2(pool),sec=Math.pow(2,bits)/2/v.gps;var weak=/^(password|123456|qwerty|letmein|admin)/i.test(p)||/(.)\1{3,}/.test(p);return{res:[R('Entropy',bits,'bits',{hero:1}),R('Time to brute-force (average)',sec>3.15e17?'longer than the universe has existed':dur(sec),'text'),R('Rating',weak?'Weak (common pattern)':bits<40?'Weak':bits<60?'Fair':bits<80?'Strong':'Very strong','text')],note:'Nothing is sent anywhere. Even so, do not test your real passwords on any website.'};}});
def({id:'cloud-cost',cat:'tech',name:'Cloud Cost Estimator',desc:'Monthly cost from your own unit prices, so it never goes stale.',keywords:'aws gcp azure vm storage egress',
 fields:[G.ROWS('c','Line items',['Resource','Quantity','Unit price per month'],[['VM (4 vCPU)',3,70],['Block storage (GB)',500,0.1],['Egress (GB)',800,0.09],['Managed DB',1,120]]),N('d','Discount / reserved (%)',0),N('g','Yearly growth (%)',0)],formula:'Σ qty × price, less discount; yearly projection compounds growth monthly.',
 calc:function(v){var t=0,rows=v.c.map(function(r){var a=(+r[1]||0)*(+r[2]||0);t+=a;return[r[0],a];});var net=t*(1-v.d/100),mg=Math.pow(1+v.g/100,1/12),yr=0,m=net;for(var i=0;i<12;i++){yr+=m;m*=mg;}return{res:[R('Monthly cost',net,'cur',{hero:1}),R('Yearly (with growth)',yr,'cur'),R('Discount saves / month',t-net,'cur')],table:{title:'Items',cols:['Resource','Monthly'],kinds:['text','cur'],rows:rows}};}});
def({id:'littles-law',cat:'tech',name:"Capacity & Little's Law Calculator",desc:'Concurrency, throughput and servers needed for a load.',keywords:'queue latency performance load servers',
 fields:[N('rps','Requests per second',800),N('lat','Average latency (ms)',120),N('cap','Concurrent requests one server handles',50),N('head','Headroom (%)',30)],formula:"Little's Law: L = λ × W. Servers = ceil(L ÷ capacity × (1 + headroom)).",
 calc:function(v){need(v.cap>0,'Capacity must be above zero');var L=v.rps*v.lat/1000;return{res:[R('Concurrent requests',L,'num'),R('Servers needed',Math.ceil(L/v.cap*(1+v.head/100)),'int',{hero:1}),R('Peak per server',L/Math.ceil(L/v.cap*(1+v.head/100)),'num')]};}});
def({id:'backup-size',cat:'tech',name:'Backup Storage Calculator',desc:'Storage required for full, incremental and retention.',keywords:'retention snapshot',
 fields:[N('d','Data size (GB)',500),N('ch','Daily change (%)',3),N('days','Retention (days)',30),N('f','Full backup every (days)',7),N('c','Compression ratio (×)',1.5)],formula:'Fulls = ceil(days/f) × size; incrementals = days × size × change; both ÷ compression.',
 calc:function(v){need(v.f>0&&v.c>0,'Check the inputs');var fulls=Math.ceil(v.days/v.f),inc=v.days-fulls,tot=(fulls*v.d+inc*v.d*v.ch/100)/v.c;return{res:[R('Storage required (GB)',tot,'num',{hero:1}),R('Full backups kept',fulls,'int'),R('Incrementals kept',inc,'int'),R('Storage (TB)',tot/1000,'num')]};}});
})(typeof window!=='undefined'?window.G:globalThis.G);

;
/* Interface strings only. Calculator names and field labels stay in English.
   Translations are first drafts and need native-speaker review (see README). */
(function(G){'use strict';
G.LANGS=[['en','English','English'],['hi','हिन्दी','Hindi'],['te','తెలుగు','Telugu'],['kn','ಕನ್ನಡ','Kannada'],['ta','தமிழ்','Tamil'],['ml','മലയാളം','Malayalam']];
G.I18N={
en:{tag:'Free calculators for everyone. Works offline.',sub:'{n} calculators in {c} categories. No sign-up, no ads. Nothing you type leaves your device.',ph:'Search calculators, e.g. EMI, BMI, SIP…',all:'All',favs:'Saved',recent:'Recently used',popular:'Popular',none:'No calculator found. Try another word.',open:'Open calculator →',copyLink:'Copy link',copied:'Link copied',copyRes:'Copy result',copiedRes:'Result copied',print:'Print',fav:'Save',unfav:'Saved',settings:'Settings',language:'Language',currency:'Currency symbol',numfmt:'Number format',indian:'Indian (12,34,567)',intl:'International (1,234,567)',theme:'Theme',light:'Light',dark:'Dark',new:'New',formula:'How it is calculated',related:'Related calculators',home:'All calculators',result:'Result',inputs:'Inputs',englishNote:'Calculator names and labels are in English.',offline:'Works offline once loaded.',part:'Part of EknathaLabs',addRow:'Add row',reset:'Reset',invalid:'Enter a valid number for "{f}".',nocur:'None',skip:'Skip to content',inWords:'In words',cat_fin:'Finance',cat_biz:'Tax & Business',cat_health:'Health & Fitness',cat_edu:'Education',cat_math:'Math',cat_date:'Date & Time',cat_conv:'Converters',cat_travel:'Travel',cat_tech:'Tech & DevOps'},
hi:{tag:'सबके लिए मुफ़्त कैलकुलेटर। ऑफ़लाइन भी चलते हैं।',sub:'{c} श्रेणियों में {n} कैलकुलेटर। न साइन-अप, न विज्ञापन। आप जो लिखते हैं वह आपके डिवाइस से बाहर नहीं जाता।',ph:'कैलकुलेटर खोजें, जैसे EMI, BMI, SIP…',all:'सभी',favs:'सहेजे गए',recent:'हाल में उपयोग किए',popular:'लोकप्रिय',none:'कोई कैलकुलेटर नहीं मिला। दूसरा शब्द आज़माएँ।',open:'कैलकुलेटर खोलें →',copyLink:'लिंक कॉपी करें',copied:'लिंक कॉपी हो गया',copyRes:'नतीजा कॉपी करें',copiedRes:'नतीजा कॉपी हो गया',print:'प्रिंट',fav:'सहेजें',unfav:'सहेजा गया',settings:'सेटिंग्स',language:'भाषा',currency:'मुद्रा चिह्न',numfmt:'संख्या का प्रारूप',indian:'भारतीय (12,34,567)',intl:'अंतरराष्ट्रीय (1,234,567)',theme:'थीम',light:'हल्की',dark:'गहरी',new:'नई',formula:'यह कैसे निकाला जाता है',related:'संबंधित कैलकुलेटर',home:'सभी कैलकुलेटर',result:'नतीजा',inputs:'इनपुट',englishNote:'कैलकुलेटर के नाम और लेबल अंग्रेज़ी में हैं।',offline:'एक बार खुलने के बाद ऑफ़लाइन चलता है।',part:'EknathaLabs का हिस्सा',addRow:'पंक्ति जोड़ें',reset:'रीसेट',invalid:'"{f}" के लिए सही संख्या लिखें।',nocur:'कोई नहीं',skip:'सामग्री पर जाएँ',inWords:'शब्दों में',cat_fin:'वित्त',cat_biz:'कर और व्यापार',cat_health:'स्वास्थ्य और फ़िटनेस',cat_edu:'शिक्षा',cat_math:'गणित',cat_date:'तारीख़ और समय',cat_conv:'परिवर्तक',cat_travel:'यात्रा',cat_tech:'टेक और DevOps'},
te:{tag:'అందరికీ ఉచిత కాలిక్యులేటర్లు. ఆఫ్‌లైన్‌లో కూడా పనిచేస్తాయి.',sub:'{c} విభాగాల్లో {n} కాలిక్యులేటర్లు. సైన్-అప్ లేదు, ప్రకటనలు లేవు. మీరు టైప్ చేసేది మీ పరికరం దాటి వెళ్లదు.',ph:'కాలిక్యులేటర్ వెతకండి, ఉదా. EMI, BMI, SIP…',all:'అన్నీ',favs:'సేవ్ చేసినవి',recent:'ఇటీవల వాడినవి',popular:'ప్రసిద్ధమైనవి',none:'కాలిక్యులేటర్ దొరకలేదు. వేరే పదం ప్రయత్నించండి.',open:'కాలిక్యులేటర్ తెరవండి →',copyLink:'లింక్ కాపీ చేయండి',copied:'లింక్ కాపీ అయింది',copyRes:'ఫలితం కాపీ చేయండి',copiedRes:'ఫలితం కాపీ అయింది',print:'ప్రింట్',fav:'సేవ్',unfav:'సేవ్ అయింది',settings:'సెట్టింగ్స్',language:'భాష',currency:'కరెన్సీ చిహ్నం',numfmt:'సంఖ్య ఫార్మాట్',indian:'భారతీయ (12,34,567)',intl:'అంతర్జాతీయ (1,234,567)',theme:'థీమ్',light:'లైట్',dark:'డార్క్',new:'కొత్త',formula:'ఎలా లెక్కిస్తారు',related:'సంబంధిత కాలిక్యులేటర్లు',home:'అన్ని కాలిక్యులేటర్లు',result:'ఫలితం',inputs:'ఇన్‌పుట్‌లు',englishNote:'కాలిక్యులేటర్ పేర్లు, లేబుళ్లు ఇంగ్లీషులో ఉంటాయి.',offline:'ఒకసారి లోడ్ అయ్యాక ఆఫ్‌లైన్‌లో పనిచేస్తుంది.',part:'EknathaLabs లో భాగం',addRow:'వరుస జోడించండి',reset:'రీసెట్',invalid:'"{f}" కోసం సరైన సంఖ్య ఇవ్వండి.',nocur:'ఏదీ వద్దు',skip:'కంటెంట్‌కు వెళ్లండి',inWords:'అక్షరాల్లో',cat_fin:'ఆర్థికం',cat_biz:'పన్ను & వ్యాపారం',cat_health:'ఆరోగ్యం & ఫిట్‌నెస్',cat_edu:'విద్య',cat_math:'గణితం',cat_date:'తేదీ & సమయం',cat_conv:'మార్పిడులు',cat_travel:'ప్రయాణం',cat_tech:'టెక్ & DevOps'},
kn:{tag:'ಎಲ್ಲರಿಗೂ ಉಚಿತ ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳು. ಆಫ್‌ಲೈನ್‌ನಲ್ಲೂ ಕೆಲಸ ಮಾಡುತ್ತವೆ.',sub:'{c} ವಿಭಾಗಗಳಲ್ಲಿ {n} ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳು. ಸೈನ್-ಅಪ್ ಇಲ್ಲ, ಜಾಹೀರಾತು ಇಲ್ಲ. ನೀವು ಬರೆಯುವುದು ನಿಮ್ಮ ಸಾಧನದಿಂದ ಹೊರಹೋಗುವುದಿಲ್ಲ.',ph:'ಕ್ಯಾಲ್ಕುಲೇಟರ್ ಹುಡುಕಿ, ಉದಾ. EMI, BMI, SIP…',all:'ಎಲ್ಲಾ',favs:'ಉಳಿಸಿದ್ದು',recent:'ಇತ್ತೀಚೆಗೆ ಬಳಸಿದ್ದು',popular:'ಜನಪ್ರಿಯ',none:'ಕ್ಯಾಲ್ಕುಲೇಟರ್ ಸಿಗಲಿಲ್ಲ. ಬೇರೆ ಪದ ಪ್ರಯತ್ನಿಸಿ.',open:'ಕ್ಯಾಲ್ಕುಲೇಟರ್ ತೆರೆಯಿರಿ →',copyLink:'ಲಿಂಕ್ ನಕಲಿಸಿ',copied:'ಲಿಂಕ್ ನಕಲಾಯಿತು',copyRes:'ಫಲಿತಾಂಶ ನಕಲಿಸಿ',copiedRes:'ಫಲಿತಾಂಶ ನಕಲಾಯಿತು',print:'ಮುದ್ರಿಸಿ',fav:'ಉಳಿಸಿ',unfav:'ಉಳಿಸಲಾಗಿದೆ',settings:'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',language:'ಭಾಷೆ',currency:'ಕರೆನ್ಸಿ ಚಿಹ್ನೆ',numfmt:'ಸಂಖ್ಯೆ ಸ್ವರೂಪ',indian:'ಭಾರತೀಯ (12,34,567)',intl:'ಅಂತರರಾಷ್ಟ್ರೀಯ (1,234,567)',theme:'ಥೀಮ್',light:'ಲೈಟ್',dark:'ಡಾರ್ಕ್',new:'ಹೊಸದು',formula:'ಹೇಗೆ ಲೆಕ್ಕ ಹಾಕಲಾಗುತ್ತದೆ',related:'ಸಂಬಂಧಿತ ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳು',home:'ಎಲ್ಲಾ ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳು',result:'ಫಲಿತಾಂಶ',inputs:'ಇನ್‌ಪುಟ್‌ಗಳು',englishNote:'ಕ್ಯಾಲ್ಕುಲೇಟರ್ ಹೆಸರುಗಳು ಮತ್ತು ಲೇಬಲ್‌ಗಳು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿವೆ.',offline:'ಒಮ್ಮೆ ಲೋಡ್ ಆದ ಮೇಲೆ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ.',part:'EknathaLabs ನ ಭಾಗ',addRow:'ಸಾಲು ಸೇರಿಸಿ',reset:'ಮರುಹೊಂದಿಸಿ',invalid:'"{f}" ಗೆ ಸರಿಯಾದ ಸಂಖ್ಯೆ ನೀಡಿ.',nocur:'ಯಾವುದೂ ಇಲ್ಲ',skip:'ವಿಷಯಕ್ಕೆ ಹೋಗಿ',inWords:'ಅಕ್ಷರಗಳಲ್ಲಿ',cat_fin:'ಹಣಕಾಸು',cat_biz:'ತೆರಿಗೆ & ವ್ಯಾಪಾರ',cat_health:'ಆರೋಗ್ಯ & ಫಿಟ್‌ನೆಸ್',cat_edu:'ಶಿಕ್ಷಣ',cat_math:'ಗಣಿತ',cat_date:'ದಿನಾಂಕ & ಸಮಯ',cat_conv:'ಪರಿವರ್ತಕಗಳು',cat_travel:'ಪ್ರಯಾಣ',cat_tech:'ಟೆಕ್ & DevOps'},
ta:{tag:'அனைவருக்கும் இலவச கால்குலேட்டர்கள். ஆஃப்லைனிலும் வேலை செய்யும்.',sub:'{c} பிரிவுகளில் {n} கால்குலேட்டர்கள். பதிவு தேவையில்லை, விளம்பரம் இல்லை. நீங்கள் உள்ளிடுவது உங்கள் சாதனத்தை விட்டு வெளியே போகாது.',ph:'கால்குலேட்டரைத் தேடுங்கள், எ.கா. EMI, BMI, SIP…',all:'அனைத்தும்',favs:'சேமித்தவை',recent:'சமீபத்தில் பயன்படுத்தியவை',popular:'பிரபலமானவை',none:'கால்குலேட்டர் கிடைக்கவில்லை. வேறு சொல்லை முயலுங்கள்.',open:'கால்குலேட்டரைத் திற →',copyLink:'இணைப்பை நகலெடு',copied:'இணைப்பு நகலெடுக்கப்பட்டது',copyRes:'முடிவை நகலெடு',copiedRes:'முடிவு நகலெடுக்கப்பட்டது',print:'அச்சிடு',fav:'சேமி',unfav:'சேமிக்கப்பட்டது',settings:'அமைப்புகள்',language:'மொழி',currency:'நாணய குறி',numfmt:'எண் வடிவம்',indian:'இந்திய (12,34,567)',intl:'சர்வதேச (1,234,567)',theme:'தீம்',light:'ஒளி',dark:'இருள்',new:'புதிய',formula:'எப்படிக் கணக்கிடப்படுகிறது',related:'தொடர்புடைய கால்குலேட்டர்கள்',home:'அனைத்து கால்குலேட்டர்கள்',result:'முடிவு',inputs:'உள்ளீடுகள்',englishNote:'கால்குலேட்டர் பெயர்களும் லேபிள்களும் ஆங்கிலத்தில் உள்ளன.',offline:'ஒருமுறை ஏற்றிய பின் ஆஃப்லைனில் வேலை செய்யும்.',part:'EknathaLabs இன் பகுதி',addRow:'வரிசை சேர்',reset:'மீட்டமை',invalid:'"{f}" க்குச் சரியான எண்ணை உள்ளிடுங்கள்.',nocur:'எதுவுமில்லை',skip:'உள்ளடக்கத்துக்குச் செல்',inWords:'சொற்களில்',cat_fin:'நிதி',cat_biz:'வரி & வணிகம்',cat_health:'ஆரோக்கியம் & உடற்தகுதி',cat_edu:'கல்வி',cat_math:'கணிதம்',cat_date:'தேதி & நேரம்',cat_conv:'மாற்றிகள்',cat_travel:'பயணம்',cat_tech:'தொழில்நுட்பம் & DevOps'},
ml:{tag:'എല്ലാവർക്കും സൗജന്യ കാൽക്കുലേറ്ററുകൾ. ഓഫ്‌ലൈനിലും പ്രവർത്തിക്കും.',sub:'{c} വിഭാഗങ്ങളിൽ {n} കാൽക്കുലേറ്ററുകൾ. സൈൻ-അപ്പ് വേണ്ട, പരസ്യമില്ല. നിങ്ങൾ ടൈപ്പ് ചെയ്യുന്നത് നിങ്ങളുടെ ഉപകരണത്തിനു പുറത്തേക്കു പോകില്ല.',ph:'കാൽക്കുലേറ്റർ തിരയൂ, ഉദാ. EMI, BMI, SIP…',all:'എല്ലാം',favs:'സേവ് ചെയ്തവ',recent:'അടുത്തിടെ ഉപയോഗിച്ചവ',popular:'ജനപ്രിയം',none:'കാൽക്കുലേറ്റർ കണ്ടെത്തിയില്ല. മറ്റൊരു വാക്ക് നോക്കൂ.',open:'കാൽക്കുലേറ്റർ തുറക്കൂ →',copyLink:'ലിങ്ക് പകർത്തുക',copied:'ലിങ്ക് പകർത്തി',copyRes:'ഫലം പകർത്തുക',copiedRes:'ഫലം പകർത്തി',print:'പ്രിന്റ്',fav:'സേവ്',unfav:'സേവ് ചെയ്തു',settings:'ക്രമീകരണങ്ങൾ',language:'ഭാഷ',currency:'കറൻസി ചിഹ്നം',numfmt:'സംഖ്യാ ഫോർമാറ്റ്',indian:'ഇന്ത്യൻ (12,34,567)',intl:'അന്താരാഷ്ട്ര (1,234,567)',theme:'തീം',light:'ലൈറ്റ്',dark:'ഡാർക്ക്',new:'പുതിയത്',formula:'എങ്ങനെ കണക്കാക്കുന്നു',related:'ബന്ധപ്പെട്ട കാൽക്കുലേറ്ററുകൾ',home:'എല്ലാ കാൽക്കുലേറ്ററുകളും',result:'ഫലം',inputs:'ഇൻപുട്ടുകൾ',englishNote:'കാൽക്കുലേറ്റർ പേരുകളും ലേബലുകളും ഇംഗ്ലീഷിലാണ്.',offline:'ഒരിക്കൽ ലോഡ് ചെയ്താൽ ഓഫ്‌ലൈനിൽ പ്രവർത്തിക്കും.',part:'EknathaLabs ന്റെ ഭാഗം',addRow:'വരി ചേർക്കൂ',reset:'റീസെറ്റ്',invalid:'"{f}" എന്നതിന് ശരിയായ സംഖ്യ നൽകൂ.',nocur:'ഒന്നുമില്ല',skip:'ഉള്ളടക്കത്തിലേക്കു പോകൂ',inWords:'അക്ഷരങ്ങളിൽ',cat_fin:'ധനകാര്യം',cat_biz:'നികുതി & ബിസിനസ്',cat_health:'ആരോഗ്യം & ഫിറ്റ്നസ്',cat_edu:'വിദ്യാഭ്യാസം',cat_math:'ഗണിതം',cat_date:'തീയതി & സമയം',cat_conv:'പരിവർത്തകർ',cat_travel:'യാത്ര',cat_tech:'ടെക് & DevOps'}
};
})(typeof window!=='undefined'?window.G:globalThis.G);

;
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
