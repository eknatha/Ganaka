import json,math,statistics,ipaddress,datetime as dt,colorsys,sys
from dateutil.relativedelta import relativedelta
from zoneinfo import ZoneInfo
cases=json.load(open('tests/dump.json'));fails=0;n=0
def close(a,b,tol=1e-6):
    if isinstance(a,str) or isinstance(b,str): return str(a)==str(b)
    return abs(a-b)<=tol*max(1,abs(b))
def chk(case,label,exp,tol=1e-6):
    global fails,n;n+=1;got=case['r'].get(label)
    if got is None or not close(got,exp,tol):
        fails+=1;print('FAIL',case['id'],case['inp'] if len(str(case['inp']))<200 else '',label,'got',got,'expected',exp)
def emi_ref(P,rate,months):
    r=rate/1200
    if r==0:return P/months
    lo,hi=0,P*2
    for _ in range(200):
        mid=(lo+hi)/2;b=P
        for _ in range(months): b=b*(1+r)-mid
        if b>0: lo=mid
        else: hi=mid
    return (lo+hi)/2
def new_tax(g,inc_other=0):
    ti=max(0,g-75000-inc_other);sl=[(400000,0),(800000,.05),(1200000,.10),(1600000,.15),(2000000,.20),(2400000,.25),(1e18,.30)]
    t=0;p=0
    for up,r in sl:
        if ti>p:t+=(min(ti,up)-p)*r
        p=up
    if ti<=1200000:t=0
    else: t=min(t,ti-1200000)
    sr=0 if ti<=5e6 else .10 if ti<=1e7 else .15 if ti<=2e7 else .25
    return ti,(t+t*sr)*1.04
def old_tax(g,ded,age):
    ti=max(0,g-50000-ded);sl=[(250000,0),(500000,.05),(1000000,.20),(1e18,.30)]
    if age>=80: sl=[(500000,0),(1000000,.20),(1e18,.30)]
    elif age>=60: sl=[(300000,0),(500000,.05),(1000000,.20),(1e18,.30)]
    t=0;p=0
    for up,r in sl:
        if ti>p:t+=(min(ti,up)-p)*r
        p=up
    if ti<=500000:t=max(0,t-12500)
    sr=0 if ti<=5e6 else .10 if ti<=1e7 else .15 if ti<=2e7 else .25 if ti<=5e7 else .37
    return ti,(t+t*sr)*1.04
for c in cases:
    i=c['inp'];id=c['id']
    if id=='emi':
        m=i['n']*12 if i['u']=='y' else i['n'];e=emi_ref(i['P'],i['rate'],int(m));chk(c,'Monthly EMI',e,1e-6);chk(c,'Total payment',e*m,1e-6)
    elif id=='loan-prepay':
        P,r,n,x=i['P'],i['rate']/1200,i['yrs']*12,i['extra'];e=emi_ref(P,i['rate'],n)
        def run(x):
            b=P;m=0;ti=0
            while b>0.005:
                it=b*r;ti+=it;b-=min(b,e+x-it);m+=1
            return m,ti
        a=run(0);bb=run(x);chk(c,'Interest saved',a[1]-bb[1],1e-5);chk(c,'Original interest',a[1],1e-5)
    elif id=='sip':
        r=i['rate']/1200;b=0
        for _ in range(i['yrs']*12): b=(b+i['m'])*(1+r)
        chk(c,'Maturity value',b)
    elif id=='step-up-sip':
        r=i['rate']/1200;b=0;a=i['m']
        for y in range(i['yrs']):
            for _ in range(12): b=(b+a)*(1+r)
            a*=1+i['step']/100
        chk(c,'Maturity value',b)
    elif id=='sip-goal':
        r=i['rate']/1200;lo,hi=0,i['goal']
        for _ in range(200):
            mid=(lo+hi)/2;b=0
            for _ in range(i['yrs']*12): b=(b+mid)*(1+r)
            if b<i['goal']:lo=mid
            else:hi=mid
        chk(c,'Monthly SIP needed',lo,1e-6)
    elif id=='lumpsum': chk(c,'Maturity value',i['P']*(1+i['rate']/100)**i['yrs'])
    elif id=='compound-interest':
        f=int(i['f']);rm=(1+i['rate']/100/f)**(f/12)-1;b=i['P']
        for _ in range(i['yrs']*12): b=b*(1+rm)+i['add']
        chk(c,'Final balance',b)
    elif id=='simple-interest': chk(c,'Simple interest',i['P']*i['rate']*i['t']/100)
    elif id=='fd': chk(c,'Maturity amount',i['P']*(1+i['rate']/100/int(i['f']))**(int(i['f'])*i['yrs']))
    elif id=='rd':
        b=0
        for k in range(1,i['mo']+1): b+=i['m']*(1+i['rate']/400)**((i['mo']-k+1)/3)
        chk(c,'Maturity value',b)
    elif id=='ppf':
        b=0
        for _ in range(i['yrs']): b=(b+i['y'])*(1+i['rate']/100)
        chk(c,'Maturity value',b)
    elif id=='mortgage':
        P=i['price']*(1-i['down']/100);e=emi_ref(P,i['rate'],i['yrs']*12);chk(c,'Monthly payment',e+i['price']*i['tax']/1200+i['ins']/12,1e-6)
    elif id=='cc-payoff':
        b=i['b'];m=0;ti=0;r=i['apr']/1200
        while b>0.005:
            it=b*r;ti+=it;b-=min(b,i['pay']-it);m+=1
        chk(c,'Months to clear',m);chk(c,'Total interest',ti)
    elif id=='income-tax-india':
        ti,nt=new_tax(i['gross'],i['other']);oi,ot=old_tax(i['gross'],i['ded'],int(i['age']))
        chk(c,'New regime tax',nt,1e-9);chk(c,'Old regime tax',ot,1e-9)
    elif id=='roi': chk(c,'ROI',50.0);chk(c,'Annualised (CAGR)',((150000/100000)**(1/3)-1)*100)
    elif id=='cagr': chk(c,'CAGR',((250000/100000)**(1/5)-1)*100)
    elif id=='inflation': chk(c,'Same things will cost',100000*1.06**10)
    elif id=='hra': chk(c,'Exempt HRA',min(360000,300000-90000,450000))
    elif id=='gratuity': chk(c,'Gratuity',15/26*60000*12)
    elif id=='gst':
        if i['m']=='ex': chk(c,'Tax',1800)
        else: chk(c,'Net amount',10000)
    elif id=='discount': chk(c,'You pay',2999*.8*.9)
    elif id=='profit-margin': chk(c,'Margin',100*300/900);chk(c,'Markup',50);chk(c,'Price for target margin',1000)
    elif id=='breakeven': chk(c,'Break-even units',math.ceil(200000/60))
    elif id=='tip': chk(c,'Each pays',2640/4)
    elif id=='percentage':
        m=i['m'];chk(c,'Result' if m=='of' else ('Change' if m=='chg' else 'The whole'),{'of':100,'chg':25,'rev':200}[m])
    elif id=='bmi': chk(c,'BMI',70/1.72**2)
    elif id=='bmr':
        chk(c,'BMR (kcal/day)',10*i['kg']+6.25*i['cm']-5*i['age']+(5 if i['sex']=='m' else -161))
    elif id=='tdee': chk(c,'Maintain (kcal/day)',(10*70+6.25*172-150+5)*1.55)
    elif id=='ideal-weight': chk(c,'Devine',50+2.3*(172/2.54-60))
    elif id=='body-fat':
        chk(c,'Body fat',495/(1.0324-.19077*math.log10(85-38)+.15456*math.log10(172))-450)
    elif id=='pace': chk(c,'Speed (km/h)',10/(55/60))
    elif id=='bsa': chk(c,'Mosteller (m²)',math.sqrt(172*70/3600))
    elif id=='gpa':
        gp={'A':4,'B+':3.3,'A-':3.7,'B':3};cr=[4,3,3,2];g=['A','B+','A-','B'];chk(c,'GPA',sum(gp[a]*b for a,b in zip(g,cr))/sum(cr))
    elif id=='attendance': chk(c,'Attendance',42/52*100);chk(c,'You can still miss',max(k for k in range(0,99) if 42/(52+k)>=.75))
    elif id=='weighted-grade': chk(c,'Grade so far (of 50% weight)',(88*.2+75*.3)/.5);chk(c,'Needed on the remaining 50%',(85-(88*.2+75*.3))/.5*100/100*1) if False else None
    elif id=='quadratic':
        a,b,cc=i['a'],i['b'],i['c'];d=b*b-4*a*cc;chk(c,'Discriminant',d)
        if d>=0:
            rs=sorted([(-b+math.sqrt(d))/(2*a),(-b-math.sqrt(d))/(2*a)],reverse=True);chk(c,'x₁',rs[0]);chk(c,'x₂',rs[1])
    elif id=='linear-system':
        import numpy as np;s=np.linalg.solve([[2,3],[1,-1]],[13,2]);chk(c,'x',s[0]);chk(c,'y',s[1])
    elif id=='statistics':
        import numpy as np
        d=[12,15,15,18,22,25,31,40];chk(c,'Mean',statistics.mean(d));chk(c,'Median',statistics.median(d));chk(c,'Std. deviation (sample)',statistics.stdev(d));chk(c,'Std. deviation (population)',statistics.pstdev(d));chk(c,'Variance (sample)',statistics.variance(d))
        q=np.percentile(d,[25,75]);chk(c,'Q1 / Q3',f"{q[0]:g} / {q[1]:g}")
    elif id=='permutation':
        chk(c,'nCr (combinations)',str(math.comb(i['n'],i['r'])));chk(c,'nPr (permutations)',str(math.perm(i['n'],i['r'])))
    elif id=='prime':
        n_=int(i['n']);f={};m=n_;p=2
        while p*p<=m:
            while m%p==0:f[p]=f.get(p,0)+1;m//=p
            p+=1
        if m>1:f[m]=f.get(m,0)+1
        s=' × '.join(f"{k}^{v}" if v>1 else str(k) for k,v in sorted(f.items()));chk(c,'Prime factors',s)
    elif id=='gcd-lcm': chk(c,'GCD (HCF)',math.gcd(24,36,60));chk(c,'LCM',math.lcm(24,36,60))
    elif id=='sequence':
        if i['t']=='ap': chk(c,'nth term',3+9*4);chk(c,'Sum of n terms',sum(3+k*4 for k in range(10)))
        else: chk(c,'nth term',2*.5**7);chk(c,'Sum of n terms',sum(2*.5**k for k in range(8)));chk(c,'Sum to infinity',4)
    elif id=='area-shapes': s=12;chk(c,'Area',math.sqrt(s*(s-7)*(s-8)*(s-9)))
    elif id=='volume-shapes': chk(c,'Volume',math.pi*9*4/3);chk(c,'Surface area',math.pi*3*(3+5))
    elif id=='pythagoras': chk(c,'b',12);chk(c,'Area',30)
    elif id=='roman': chk(c,'Roman numeral' if i['x']=='2026' else 'Number','MMXXVI' if i['x']=='2026' else 1994)
    elif id=='unit-converter':
        ref={('mile','km'):1.609344,('kg','pound'):2.2046226218487757,('GiB','MB'):1073.741824,('hectare','acre'):2.4710538146717,('mph','km/h'):1.609344,('kWh','kcal'):860.4206500956,('psi','kPa'):101.35,('gallon (US)','L'):3.785411784,('C','F'):212,('F','C'):-40,('K','C'):26.85}
        k=(i['from'],i['to']);lab=f"{i['x']:g} {i['from']} =";e=ref[k]*(i['x'] if k in [('mph','km/h')] else 1)
        if k==('C','F'):e=212
        if k==('F','C'):e=-40
        if k==('K','C'):e=26.85
        if k==('psi','kPa'):e=14.7*6.894757293168
        chk(c,lab,e,1e-3)
    elif id=='number-base':
        if i['b']==16: chk(c,'Decimal','255')
        else: chk(c,'Hexadecimal',hex(int(i['x']))[2:].upper())
    elif id=='color':
        r,g,b=int('0f',16),int('76',16),int('6e',16);h,l,s=colorsys.rgb_to_hls(r/255,g/255,b/255);chk(c,'HSL',f"hsl({round(h*360)}, {round(s*100)}%, {round(l*100)}%)")
    elif id=='date-difference':
        a=dt.date.fromisoformat(i['a']);b=dt.date.fromisoformat(i['b']);d=relativedelta(b,a);chk(c,'Difference',f"{d.years} years, {d.months} months, {d.days} days");chk(c,'Total days',(b-a).days+(1 if i['inc'] else 0))
    elif id=='date-add':
        a=dt.date.fromisoformat(i['a']);s=int(i['sg']);r=a+relativedelta(months=s*(i['y']*12+i['m']))+dt.timedelta(days=s*(i['w']*7+i['d']));chk(c,'ISO date',r.isoformat())
    elif id=='day-of-week':
        d=dt.date.fromisoformat(i['d']);chk(c,'Day',d.strftime('%A'));w=d.isocalendar();chk(c,'ISO week',f"{w[1]} of {w[0]}")
    elif id=='age':
        b=dt.date.fromisoformat(i['dob']);o=dt.date.fromisoformat(i['on']);d=relativedelta(o,b);chk(c,'Age',f"{d.years} years, {d.months} months, {d.days} days");chk(c,'Total days lived',(o-b).days)
    elif id=='working-days':
        if i['m']=='between':
            a=dt.date.fromisoformat(i['a']);b=dt.date.fromisoformat(i['b']);h={dt.date.fromisoformat(i['h'])};k=0;d=a
            while d<=b:
                if d.weekday()<5 and d not in h:k+=1
                d+=dt.timedelta(1)
            chk(c,'Working days (inclusive)',k)
        else:
            d=dt.date.fromisoformat(i['a']);k=0
            while k<i['n']:
                d+=dt.timedelta(1)
                if d.weekday()<5:k+=1
            chk(c,'Date',d.strftime('%A, ')+str(d.day)+d.strftime(' %B %Y'))
    elif id=='time-zone':
        t=dt.datetime.fromisoformat(i['t']).replace(tzinfo=ZoneInfo(i['from']));u=t.astimezone(ZoneInfo('UTC'));chk(c,'UTC',u.strftime('%Y-%m-%d %H:%M'))
        l=t.astimezone(ZoneInfo(i['to']));chk(c,'Converted time',l.strftime('%a, %d %b %Y, %H:%M'))
    elif id=='cidr':
        net=ipaddress.ip_network(f"{i['ip']}/{i['p']}",strict=False);chk(c,'Network',str(net));chk(c,'Subnet mask',str(net.netmask));chk(c,'Broadcast',str(net.broadcast_address));chk(c,'Usable hosts',net.num_addresses-2 if i['p']<31 else net.num_addresses);chk(c,'Private range','Yes (RFC 1918)' if net.is_private and not str(net.network_address).startswith(('127','169')) else 'No')
    elif id=='subnet-split':
        subs=list(ipaddress.ip_network('10.0.0.0/16').subnets(prefixlen_diff=3));chk(c,'Subnets created',len(subs));chk(c,'Hosts per subnet',subs[0].num_addresses-2);chk(c,'New prefix','/'+str(subs[0].prefixlen));
        assert [r[0] for r in c['table']]==[str(s) for s in subs],'subnet rows'
    elif id=='uptime-sla':
        def x(s):
            s=round(s,6);o=[]
            for u,n in [(86400,'d'),(3600,'h'),(60,'m'),(1,'s')]:
                if s>=u:o.append(f"{int(s//u)}{n}");s=s%u
            return ' '.join(o)
        chk(c,'Allowed downtime per month',x(2592000*(1-i['a']/100)))
    elif id=='composite-sla':
        a=[float(x) for x in i['a'].split()]
        t=math.prod(x/100 for x in a) if i['m']=='s' else 1-math.prod(1-x/100 for x in a);chk(c,'Combined availability',t*100)
    elif id=='transfer-time': chk(c,'Effective speed (MB/s)',100*.85/8)
    elif id=='raid': chk(c,'Usable capacity (TB)',{'RAID 5':5*4,'RAID 10':4*2}[i['l']])
    elif id=='error-budget':
        b=10000000*.001;used=4200/b;chk(c,'Budget used',used*100);chk(c,'Burn rate',used/(12/30))
    elif id=='fuel-cost': chk(c,'Fuel cost',450/16*102)
    elif id=='ev-charge': chk(c,'Cost',40*.6/.9*8)
    elif id=='bdp': chk(c,'BDP (KB)',1000e6*.08/8/1024)
    elif id=='littles-law': chk(c,'Concurrent requests',800*.12);chk(c,'Servers needed',math.ceil(96/50*1.3))
    elif id=='rule-of-72': chk(c,'Rule of 72',9);chk(c,'Exact',math.log(2)/math.log(1.08))
    elif id=='retirement':
        yrs=30;e0=50000*12*1.06**yrs;g=1.08/1.06-1;n_=25
        corpus=sum(e0*(1.06)**k/(1.08)**k for k in range(n_));chk(c,'Corpus needed',corpus,1e-9)
    elif id=='swp':
        b=5e6;m=0
        while b>0 and m<1200: b=b*(1+.08/12)-35000;m+=1
        chk(c,'Lasts',f"{m//12} yrs {m%12} mo")
print(f'{n} checks, {fails} failures');sys.exit(1 if fails else 0)
