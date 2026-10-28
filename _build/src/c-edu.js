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
