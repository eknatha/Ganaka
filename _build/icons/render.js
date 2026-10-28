const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch(),svg=fs.readFileSync(path.join(__dirname,'icon.svg'),'utf8');
for(const s of [192,512]){const p=await b.newPage({viewport:{width:s,height:s}});await p.setContent(`<style>body{margin:0}svg{width:${s}px;height:${s}px;display:block}</style>${svg}`);await p.screenshot({path:path.join(__dirname,`icon-${s}.png`)});}
await b.close();})();
