import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const edition=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [packageRoot,executablePath,filter]=process.argv.slice(2);
if(!packageRoot||!executablePath)throw new Error('Pass existing package and browser paths. No installation.');
const require=createRequire(path.join(packageRoot,'package.json'));
const {chromium}=require('playwright'), sharp=require('sharp');
const qa=path.join(edition,'qa/fullbook/diagrams');
await fs.mkdir(qa,{recursive:true});
const files=(await fs.readdir(path.join(edition,'resources')))
 .filter(f=>f.endsWith('.svg') && (!filter || new RegExp(filter).test(f))).sort();
if (!files.length) throw new Error('SVG filter selected no files.');
const browser=await chromium.launch({executablePath,headless:true});
const reports=[], thumbs=[];
try {
 const page=await browser.newPage({viewport:{width:960,height:800},deviceScaleFactor:1});
 for(const file of files) {
  await page.goto(pathToFileURL(path.join(edition,'resources',file)).href,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  const report=await page.evaluate(()=>{
   const svg=document.documentElement, vb=svg.viewBox.baseVal;
   const text=[...document.querySelectorAll('text')].map(el=>{
    const b=el.getBBox();return{label:el.textContent,box:[b.x,b.y,b.width,b.height]};
   });
   const outside=text.filter(t=>t.box[0]<vb.x-1||t.box[1]<vb.y-1||
     t.box[0]+t.box[2]>vb.x+vb.width+1||t.box[1]+t.box[3]>vb.y+vb.height+1);
   const overlaps=[];
   for(let i=0;i<text.length;i++)for(let j=i+1;j<text.length;j++){
    const a=text[i].box,b=text[j].box;
    if(Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0])>2&&
       Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1])>2)
     overlaps.push([text[i].label,text[j].label]);
   }
   return {width:vb.width,height:vb.height,textCount:text.length,outside,overlaps};
  });
  reports.push({file,...report});
  await page.setViewportSize({width:report.width,height:report.height});
  const png=path.join(qa,file.replace('.svg','.png'));
  await page.screenshot({path:png});
  const thumb=await sharp(png).resize({width:540,height:350,fit:'inside'}).toBuffer();
  thumbs.push({file,buffer:thumb,metadata:await sharp(thumb).metadata()});
 }
 for(let start=0;start<thumbs.length;start+=6) {
  const group=thumbs.slice(start,start+6), layers=[];
  group.forEach((item,index)=>{
   const x=(index%2)*570+15,y=Math.floor(index/2)*390+30;
   layers.push({input:item.buffer,left:x,top:y});
   const label='<svg width="540" height="24"><text x="0" y="17" font-family="Arial" font-size="14" fill="#172b43">'+item.file+'</text></svg>';
   layers.push({input:Buffer.from(label),left:x,top:y-25});
  });
  await sharp({create:{width:1140,height:1170,channels:3,background:'#e4eaf0'}}).composite(layers)
   .png().toFile(path.join(qa,'contact-'+String(start/6+1).padStart(2,'0')+'.png'));
 }
 await fs.writeFile(path.join(qa,'svg-inspection.json'),JSON.stringify(reports,null,2));
 const problems=reports.filter(r=>r.outside.length||r.overlaps.length);
 console.log(JSON.stringify({files:files.length,problems},null,2));
 if(problems.length)process.exitCode=1;
}finally{await browser.close();}
