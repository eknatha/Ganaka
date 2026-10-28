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
