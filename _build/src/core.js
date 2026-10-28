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
