globalThis.G=globalThis.G||{};
['core','c-fin','c-biz','c-health','c-edu','c-math','c-date','c-conv','c-travel','c-tech','content'].forEach(f=>require('./'+f+'.js'));
module.exports=globalThis.G;
