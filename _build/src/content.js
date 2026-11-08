/* Ganaka content: plain-language explanations, assumptions and caution messages.
   English only for now. Other languages fall back to English until translated.
   Keep every line short and free of jargon. */
(function (G) {
  'use strict';
  function yrsOf(v) { var n = v.u === 'm' ? v.n / 12 : v.n; return Math.round(n * 10) / 10; }
  function N(x) { return Math.round(x * 100) / 100; }

  // ---- "What does this mean?" and "Assumptions". say() builds one sentence from the actual result.
  // F(kind, value) formats a number the same way the result panel does.
  G.INFO = {
    'emi': {
      mean: "EMI is the fixed amount you pay every month. Early on, most of it is interest; over time more goes to principal. A longer tenure lowers the EMI but raises the total interest.",
      assume: "Fixed interest rate, equal monthly payments, no processing fees, insurance or part-payments. Floating-rate loans change the EMI when the rate changes.",
      say: function (v, o, F) { return "Over " + yrsOf(v) + " years you would repay " + F('cur', o.res[2].value) + " on a " + F('cur', v.P) + " loan. About " + N(o.res[3].value) + "% of that is interest."; }
    },
    'loan-prepay': {
      mean: "Paying a little extra each month goes straight to principal, so the loan ends sooner and you pay less interest overall.",
      assume: "Fixed rate, the extra amount is paid every month without a break, and the lender allows part-payments without a penalty."
    },
    'sip': {
      mean: "A SIP invests a fixed amount every month. The result shows what it could grow to if it earned the same return every year. Real returns go up and down.",
      assume: "A constant yearly return, investments made at the start of each month, and no fees, exit loads or taxes. Actual market returns are uneven.",
      say: function (v, o, F) { return "Investing " + F('cur', v.m) + " a month for " + v.yrs + " years puts in " + F('cur', o.res[1].value) + ". At the assumed return it could grow to about " + F('cur', o.res[0].value) + ", but that is not guaranteed."; }
    },
    'step-up-sip': {
      mean: "A step-up SIP raises your monthly amount every year, usually in line with your salary. This often builds a much larger corpus than a flat SIP.",
      assume: "A constant yearly return and a fixed yearly increase. Fees, taxes and market ups and downs are not included."
    },
    'sip-goal': {
      mean: "This works backwards from your target to the monthly amount you would need to invest to reach it.",
      assume: "A constant yearly return. If markets earn less, you will need a higher monthly amount or more time."
    },
    'lumpsum': {
      mean: "This shows how a one-time investment could grow if it earned the same return every year.",
      assume: "A constant yearly return, no withdrawals, and no fees or taxes. Real returns change from year to year.",
      say: function (v, o, F) { return "Your " + F('cur', v.P) + " could become about " + F('cur', o.res[0].value) + " in " + v.yrs + " years, roughly " + N(o.res[2].value) + " times the original, if the assumed return holds."; }
    },
    'compound-interest': {
      mean: "Compound interest means you earn interest on your earlier interest too. The longer the time, the bigger the effect.",
      assume: "A fixed rate and the compounding you choose. Monthly additions are made at the end of each month. Taxes and fees are not included.",
      say: function (v, o, F) { return "You put in " + F('cur', o.res[1].value) + " and end with about " + F('cur', o.res[0].value) + ", so " + F('cur', o.res[2].value) + " of it is interest."; }
    },
    'fd': {
      mean: "A fixed deposit pays a set rate for a set time. More frequent compounding gives a slightly higher effective yield.",
      assume: "The rate stays the same for the whole tenure and interest is reinvested. Tax on interest and premature-withdrawal penalties are not included.",
      say: function (v, o, F) { return "Your " + F('cur', v.P) + " deposit grows to about " + F('cur', o.res[0].value) + ", earning " + F('cur', o.res[1].value) + " in interest before tax."; }
    },
    'rd': {
      mean: "A recurring deposit works like a small FD every month. Each instalment earns interest only for the months it stays in.",
      assume: "Quarterly compounding, equal monthly deposits and no missed payments. Banks may round slightly differently."
    },
    'ppf': {
      mean: "PPF is a long-term government savings scheme with yearly deposits and interest that is currently tax-free.",
      assume: "The rate is fixed at the value you enter, but the government revises it every quarter. Deposit limits and rules can change."
    },
    'mortgage': {
      mean: "Your real monthly cost includes more than the loan payment. Property tax and insurance are added on top.",
      assume: "Fixed rate, equal payments, and tax and insurance spread evenly over 12 months. HOA fees, maintenance and closing costs are not included."
    },
    'loan-eligibility': {
      mean: "Lenders limit how much of your income can go to EMIs. This estimates the loan that fits inside that limit.",
      assume: "Lenders also look at credit score, job stability, age and existing debts, so your offer may be higher or lower.",
      say: function (v, o, F) { return "With these numbers a lender may allow an EMI of about " + F('cur', o.res[1].value) + ", which supports a loan of roughly " + F('cur', o.res[0].value) + "."; }
    },
    'cc-payoff': {
      mean: "Credit cards charge high interest, so paying only a little each month keeps you in debt for a long time. A higher payment saves a lot.",
      assume: "No new purchases, a fixed interest rate, and the same payment every month. Late fees and minimum-due rules are not included.",
      say: function (v, o, F) { return "Paying " + F('cur', v.pay) + " a month clears the balance in " + o.res[0].value + " months and costs " + F('cur', o.res[1].value) + " in interest."; }
    },
    'retirement': {
      mean: "This estimates how much you need on the day you retire, so your savings can pay for your expenses as prices rise.",
      assume: "Steady inflation and returns, expenses that rise with inflation, and no pension or other income. A small change in assumptions can change the answer a lot."
    },
    'swp': {
      mean: "A systematic withdrawal plan takes a fixed amount from your corpus every month while the rest stays invested.",
      assume: "A constant return. If markets fall early on, your corpus can run out sooner than shown."
    },
    'cagr': {
      mean: "CAGR is the steady yearly growth rate that would take you from the starting value to the ending value.",
      assume: "It smooths out the ups and downs. The real path between the two dates was probably bumpier.",
      say: function (v, o) { return "The value grew at an average of " + N(o.res[0].value) + "% a year over " + v.y + " years."; }
    },
    'roi': {
      mean: "ROI is the total gain or loss as a percentage of what you put in. It does not show how long it took.",
      assume: "Fees, taxes and the time value of money are not included. For different time periods, compare CAGR instead."
    },
    'inflation': {
      mean: "Inflation makes the same money buy less over time. This shows what today's amount may be worth later.",
      assume: "A steady yearly inflation rate. Real inflation changes from year to year and differs for different goods."
    },
    'income-tax-india': {
      mean: "This compares your tax under the old and new regimes and shows which one costs less for the numbers you entered.",
      assume: function () { return "Salaried individual, slabs and rebates for " + G.TAX.fy + ", standard deduction, surcharge and 4% cess. Capital gains, business income and special cases are not included."; },
      say: function (v, o, F) { var best = String(o.res[0].value), save = o.res[1].value; return save > 0 ? ("The " + best.toLowerCase() + " costs you less. You would save about " + F('cur', save) + " a year.") : "Both regimes give about the same tax for these numbers."; }
    },
    'hra': {
      mean: "Part of your HRA can be tax-free. The exempt amount is the lowest of three figures, shown in the formula below.",
      assume: "Applies only if you pay rent and choose the old tax regime. Rent receipts or landlord PAN may be needed for larger claims."
    },
    'gratuity': {
      mean: "Gratuity is a lump sum paid by an employer after long service, based on your last drawn salary and years worked.",
      assume: "Eligibility and limits depend on the law and your employer. The usual minimum service period and recent labour-code changes may apply to you."
    },
    'epf': {
      mean: "This estimates your provident fund balance at retirement from your own and your employer's contributions.",
      assume: "Salary rises at the rate you enter, the interest rate stays fixed, and contributions follow the standard EPF and EPS split. Real credited interest is decided each year."
    },
    'nps': {
      mean: "NPS builds a retirement corpus. Part of it must buy an annuity (a pension), and the rest can be taken as a lump sum.",
      assume: "A constant return, and an annuity rate that you enter. Real annuity rates and withdrawal rules are set by the scheme."
    },
    'gst': {
      mean: "GST is a tax added to the price. You can add it to a price before tax, or remove it from a price that already includes it.",
      assume: "A single rate applied to the whole amount. Some goods are exempt or have cess, and mixed bills may need different rates."
    },
    'salary': {
      mean: "This converts pay between hourly, daily, weekly, monthly and yearly figures so you can compare offers fairly.",
      assume: "Pay is spread evenly across the hours and weeks you enter. Taxes, bonuses and unpaid leave are not included."
    },
    'bmi': {
      mean: "BMI compares your weight with your height. It is a quick screening number for adults, not a measure of health or body fat.",
      assume: "Adult formula. It does not account for muscle, age, sex or body shape, and the ranges are not suitable for children.",
      say: function (v, o) { return "A BMI of " + N(o.res[0].value) + " falls in the “" + o.res[1].value + "” range for adults. Use it as a starting point for a conversation with a doctor, not as a diagnosis."; }
    },
    'bmr': {
      mean: "BMR is the energy your body uses at rest. It is the starting point for estimating your daily calorie needs.",
      assume: "Uses the Mifflin-St Jeor equation, which works best for adults of average build. Real values vary from person to person."
    },
    'tdee': {
      mean: "TDEE is roughly how many calories you burn in a day, including activity. Eating less or more than this changes your weight over time.",
      assume: "The activity level you pick is an estimate, and most people overestimate it. Treat the results as a starting point and adjust by how you feel."
    },
    'ideal-weight': {
      mean: "These formulas give a rough weight range for your height. They are guides, not targets.",
      assume: "Based on height and sex only. They ignore muscle mass, bone structure, age and health."
    },
    'body-fat': {
      mean: "This estimates body fat from tape measurements. It is useful for tracking change over time.",
      assume: "Tape-measure methods can be off by several percentage points. Measure the same way each time for the best trend."
    },
    'whr': {
      mean: "Waist-to-hip ratio shows where your body carries fat. A higher ratio is linked with higher health risk.",
      assume: "Measurements must be taken carefully and the same way each time. The bands are general guides for adults."
    },
    'waist-height': {
      mean: "Keeping your waist below half your height is a simple rule of thumb linked with lower health risk.",
      assume: "A general guide for adults. It does not replace a medical check-up."
    },
    'water': {
      mean: "This gives a rough daily water target based on your weight and activity.",
      assume: "Needs also depend on food, climate and health. Drinks and food both contribute to your total intake."
    },
    'hr-zones': {
      mean: "Heart-rate zones help you aim for easy, steady or hard effort during exercise.",
      assume: "Max heart rate is estimated from age and can be off by around 10 beats either way. A fitness test gives a more accurate figure."
    },
    'heat-index': {
      mean: "The heat index is how hot it feels when humidity is combined with the air temperature.",
      assume: "Calculated for shade and light wind. Direct sun can make it feel hotter, and the formula works best above about 27 °C."
    },
    'due-date': {
      mean: "Your due date is counted as 280 days from the first day of your last period, adjusted for your cycle length.",
      assume: "Assumes a regular cycle and ovulation about two weeks before the next period. A dating scan is usually more accurate."
    },
    'uptime-sla': {
      mean: "This turns an availability percentage like 99.9% into the actual downtime you can allow per day, month or year.",
      assume: "Counts all downtime equally. Real SLAs often exclude planned maintenance and have their own measurement rules."
    },
    'error-budget': {
      mean: "An error budget is the amount of failure your service can have and still meet its target. A burn rate above 1 means you are using it too fast.",
      assume: "Failures are counted evenly across the window. Bursty outages use up the budget faster than the average suggests."
    },
    'password-entropy': {
      mean: "Entropy measures how many guesses a random password would need. More length and more kinds of characters mean a higher score.",
      assume: "Assumes every character is chosen at random. Real passwords made from words, names or patterns are far easier to guess than the score suggests."
    },
    'raid': {
      mean: "RAID combines several disks to improve speed, safety or both. The trade-off is that some capacity is used for protection.",
      assume: "Equal-size disks and no hot spare. RAID protects against disk failure, but it does not protect against deletion, corruption or ransomware."
    },
    'backup-size': {
      mean: "This estimates the storage you need for a backup schedule, based on how much data changes and how long you keep copies.",
      assume: "A steady daily change rate and a typical compression ratio. Real data compresses and changes unevenly, so keep some spare room."
    },
    'cloud-cost': {
      mean: "This adds up the monthly cost of the resources you list and projects it forward.",
      assume: "Uses the prices you enter. It does not include taxes, support plans, data-transfer tiers or price changes."
    },
    'cidr': {
      mean: "A CIDR block describes a range of IP addresses. The number after the slash is how many bits belong to the network.",
      assume: "IPv4 addressing. Some networks reserve extra addresses, so the usable count can be lower on your cloud provider."
    },
    'gpa': {
      mean: "GPA is the average of your grade points, weighted by credits. Courses with more credits count for more.",
      assume: "Uses the grade points you enter. Different schools use different scales and rounding."
    },
    'cgpa-percent': {
      mean: "Universities convert CGPA to percentage in different ways. Pick the formula your university or employer accepts.",
      assume: "Only the formulas listed here are supported. Ask your institution if it publishes a different one."
    },
    'working-days': {
      mean: "This counts the days between two dates that are not weekends or holidays you list.",
      assume: "Weekend days follow your selection and only the holidays you add are skipped. Regional or company holidays must be added by you."
    },
    'date-difference': {
      mean: "This shows the gap between two dates in years, months and days, and the total number of days.",
      assume: "Calendar dates only, with no time of day or time zone."
    },
    'currency': {
      mean: "This converts an amount using the rate you enter, then removes any fee percentage.",
      assume: "No live rates are used, so nothing leaves your device. Enter the rate from your bank or a rate site."
    },
    'fuel-cost': {
      mean: "This estimates what a trip will cost in fuel, from the distance, your car's mileage and the fuel price.",
      assume: "Steady mileage. City traffic, speed, load, air-conditioning and hills can change real fuel use by a lot."
    }
  };

  // ---- Caution messages for tools where relying blindly on the number could cost real money or health.
  // One short note per group, shown under the results.
  G.CAUTION = {
    groups: {
      loans:      { title: 'Loans & credit',               text: "Real loans add fees, insurance and rate changes, and each lender uses its own rules. Check the bank's official schedule and total cost before you commit." },
      invest:     { title: 'Investments & goals',          text: "Returns here are assumptions, not promises, and real markets go up and down. Fees, taxes and inflation reduce what you actually keep." },
      savings:    { title: 'Deposits & savings schemes',   text: "Rates and rules change, and interest may be taxable. Confirm the current rate and conditions with your bank or the scheme's official site." },
      retire:     { title: 'Retirement & long-term plans', text: "No one can predict returns, inflation or future spending over decades. Review the plan every year and consider advice from a certified planner." },
      tax:        { title: 'Tax & salary',                 text: "Tax slabs, limits and exemptions change often and depend on your full situation. Treat this as an estimate and confirm with a qualified professional or the official portal before you file." },
      body:       { title: 'Body metrics',                 text: "These are general guides, not a diagnosis, and they cannot see your muscle, age or medical history. Talk to a doctor or dietitian before making big changes to diet or exercise." },
      exercise:   { title: 'Exercise, water & heat safety', text: "Formulas give averages, not personal limits. If you have a heart, kidney or other health condition or take medicines, follow your doctor's advice, and stop if you feel unwell." },
      pregnancy:  { title: 'Pregnancy',                    text: "This is only an estimate from the dates you enter, and few babies arrive exactly on it. Your doctor's scan and advice decide your actual due date." },
      security:   { title: 'Passwords & security',         text: "A high score does not make a password safe if it is reused, guessed or leaked. Use a password manager and two-factor sign-in, and avoid testing passwords you really use." },
      reliability:{ title: 'Uptime & reliability',         text: "These figures assume ideal, independent failures. Check them against real incident data and the exclusions in your provider's actual SLA." },
      capacity:   { title: 'Capacity & cost planning',     text: "These are planning estimates only. Real prices, traffic and performance differ, so test under load and check the provider's current price list before you commit." },
      data:       { title: 'Data protection',              text: "RAID is not a backup, and storage sizes here are estimates. Keep separate, tested copies of anything you cannot afford to lose." },
      network:    { title: 'Network changes',              text: "Check ranges against your network plan before you apply them. A wrong or overlapping subnet can cut off services." },
      schedule:   { title: 'Scheduled jobs',               text: "Jobs run on the server's clock and time zone, which may differ from yours. Test with a harmless command first." },
      deadlines:  { title: 'Dates & deadlines',            text: "For legal, visa, contract or exam deadlines, confirm how days are counted and which holidays apply with the official source." },
      timezone:   { title: 'Time zones',                   text: "Daylight-saving rules differ by place and change over time. Confirm important meeting times with the other person." },
      education:  { title: 'Grades & results',             text: "Schools and boards use their own formulas and rounding. Check your institution's official method before using this for applications or results." },
      exchange:   { title: 'Currency conversion',          text: "The rate is whatever you enter, and banks add margins and fees. Check the live rate and charges before you pay or transfer." },
      travel:     { title: 'Trip costs',                   text: "Real fuel use, tolls, traffic and charging losses vary. Keep a buffer in your budget for long trips." }
    },
    map: {
      'emi': 'loans', 'loan-prepay': 'loans', 'mortgage': 'loans', 'loan-eligibility': 'loans', 'cc-payoff': 'loans', 'debt-snowball': 'loans', 'rent-vs-buy': 'loans',
      'sip': 'invest', 'step-up-sip': 'invest', 'sip-goal': 'invest', 'lumpsum': 'invest', 'compound-interest': 'invest', 'cagr': 'invest', 'roi': 'invest', 'inflation': 'invest',
      'fd': 'savings', 'rd': 'savings', 'ppf': 'savings', 'epf': 'savings', 'nps': 'savings',
      'retirement': 'retire', 'swp': 'retire', 'fire': 'retire',
      'income-tax-india': 'tax', 'hra': 'tax', 'gratuity': 'tax', 'salary': 'tax', 'gst': 'tax',
      'bmi': 'body', 'bmr': 'body', 'tdee': 'body', 'ideal-weight': 'body', 'body-fat': 'body', 'whr': 'body', 'waist-height': 'body', 'bsa': 'body', 'macros': 'body',
      'water': 'exercise', 'hr-zones': 'exercise', 'heat-index': 'exercise',
      'due-date': 'pregnancy',
      'password-entropy': 'security',
      'uptime-sla': 'reliability', 'composite-sla': 'reliability', 'error-budget': 'reliability',
      'k8s-resources': 'capacity', 'cloud-cost': 'capacity', 'transfer-time': 'capacity', 'bdp': 'capacity', 'littles-law': 'capacity',
      'raid': 'data', 'backup-size': 'data',
      'cidr': 'network', 'subnet-split': 'network',
      'cron': 'schedule',
      'date-add': 'deadlines', 'date-difference': 'deadlines', 'working-days': 'deadlines',
      'time-zone': 'timezone',
      'gpa': 'education', 'cgpa': 'education', 'cgpa-percent': 'education', 'weighted-grade': 'education', 'grade-needed': 'education', 'attendance': 'education',
      'currency': 'exchange',
      'fuel-cost': 'travel', 'mileage': 'travel', 'ev-charge': 'travel', 'fuel-vs-ev': 'travel'
    }
  };
})(typeof window !== 'undefined' ? (window.G = window.G || {}) : (globalThis.G = globalThis.G || {}));
