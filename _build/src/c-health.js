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
