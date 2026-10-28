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
