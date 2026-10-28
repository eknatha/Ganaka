const G=require('../src/all.js');
let crashes=0,total=0,slow=[];const rnd=(()=>{let s=12345;return()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;}})();
const picks=[0,1,-1,0.5,100,1e6,1e12,-5,1e-6,365,12,3.7,60,1e15,99999999];
for(const c of G.CALCS){let worst=0;for(let k=0;k<150;k++){const v={};c.fields.forEach(f=>{if(f.t==='n')v[f.id]=k<3?[0,-1,1e12][k]:picks[Math.floor(rnd()*picks.length)];else if(f.t==='s')v[f.id]=f.opts[Math.floor(rnd()*f.opts.length)][0];else if(f.t==='rows')v[f.id]=f.def.map(r=>r.map(x=>rnd()<.2?'':String(rnd()<.5?x:picks[Math.floor(rnd()*picks.length)])));else if(f.t==='c')v[f.id]=rnd()<.5;else if(f.t==='d'||f.t==='dt')v[f.id]=rnd()<.15?'':f.def;else v[f.id]=rnd()<.2?'':f.def;});
 total++;const t0=Date.now();try{const o=c.calc(v);if(o.res.some(r=>r.value===undefined||r.value===null||(typeof r.value==='string'&&/NaN|undefined|Infinity/.test(r.value)))){console.log('BADSTR',c.id,JSON.stringify(v).slice(0,150));crashes++;}}catch(e){if(!e.user&&!/^(Unexpected|Missing|Unknown)/.test(e.message)){crashes++;if(crashes<25)console.log('CRASH',c.id,e.constructor.name,e.message,JSON.stringify(v).slice(0,140));}}worst=Math.max(worst,Date.now()-t0);}
 if(worst>300)slow.push([c.id,worst]);}
console.log({total,crashes,slow});
