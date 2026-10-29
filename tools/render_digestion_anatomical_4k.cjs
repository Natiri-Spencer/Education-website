/* 4K anatomical revision. Copies the approved AAC narration without re-encoding. */
const fs=require('node:fs'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const {once}=require('node:events');
const sharp=require('sharp');
const {P,tx,esc}=require('./digestion_visuals.cjs');
const {anatomy:visual,motion}=require('./digestion_anatomical_visuals.cjs');
const story=require('./digestion_story.json');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'exports/digestion'),WORK=path.join(ROOT,'tmp/digestion-video');
const FFMPEG=path.join(ROOT,'Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const DURATION=300,FPS=24,W=3840,H=2160;
function wavDuration(file){const b=fs.readFileSync(file);let rate=0;for(let i=12;i+8<=b.length;){const label=b.toString('ascii',i,i+4),size=b.readUInt32LE(i+4);if(label==='fmt ')rate=b.readUInt32LE(i+16);if(label==='data')return size/rate;i+=8+size+(size%2);}throw Error('Invalid WAV');}
const cues=[];
for(let chapter=0;chapter<story.length;chapter++)for(let cue=0;cue<story[chapter].narration.length;cue++){
 const file=path.join(WORK,`voice-${chapter}-${cue}.wav`);
 cues.push({chapter,cue,file,rawDuration:wavDuration(file),text:story[chapter].narration[cue]});
}
const rawTotal=cues.reduce((n,c)=>n+c.rawDuration,0),pause=.10;
const speed=rawTotal/(DURATION-pause*cues.length);
let cursor=0;
for(const cue of cues){cue.start=cursor;cue.duration=cue.rawDuration/speed+pause;cursor+=cue.duration;cue.end=cursor;}
cues.at(-1).duration+=DURATION-cursor;cues.at(-1).end=DURATION;
for(let i=0;i<story.length;i++){const chapter=cues.filter(c=>c.chapter===i);story[i].start=chapter[0].start;story[i].end=chapter.at(-1).end;}
console.log(`Narration: ${rawTotal.toFixed(1)}s; voice tempo ${speed.toFixed(3)}; final ${DURATION}s.`);
function cleanSpeech(s){return s.replaceAll('B twelve','B12').replaceAll('R N ase','RNase').replaceAll('D N ase','DNase').replaceAll('R N A','RNA').replaceAll('D N A','DNA');}
function estimatedWidth(s,size){return [...s].reduce((n,c)=>n+(/[ilI.,:;'!| ]/.test(c)?.27:/[WMwm]/.test(c)?.82:/[A-Z]/.test(c)?.64:.51)*size,0);}
function wrap(s,width,size){const lines=[];let line='';for(const word of s.split(/\s+/)){const next=line?line+' '+word:word;if(line&&estimatedWidth(next,size)>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
function multiline(x,y,lines,size=16,color=P.ink,leading=20){return lines.map((line,i)=>tx(x,y+i*leading,line,size,color)).join('');}
function route(id){const names=['Mouth','Oesophagus','Stomach','Duodenum','Small intestine','Colon','Anus'];const active={overview:-1,mouth:0,swallow:1,stomach:2,duodenum:3,carbohydrate:4,protein:4,fat:4,brush:4,villi:4,absorption:4,ileum:4,colon:5,egestion:6}[id];return names.map((name,i)=>tx(53+i*174,113,name,14,i===active?'#b5ed61':'#91a9c3')+(i<6?tx(184+i*174,113,'→',16,'#55748f'):'')).join('');}
function cardPanel(cards){const height=(400-(cards.length-1)*9)/cards.length;return cards.map(([heading,body],i)=>{
 const x=812,y=138+i*(height+9),size=cards.length===5?11.7:12.2;
 const heads=wrap(heading,380,size),bodySize=cards.length===5?13.5:14.5;
 const bodies=wrap(body,380,bodySize);
 return `<rect x="${x}" y="${y}" width="428" height="${height}" rx="10" fill="#1c334c" stroke="#344e6a"/>${multiline(x+15,y+20,heads,size,'#80d8cd',15)}${multiline(x+15,y+20+heads.length*15,bodies,bodySize,P.ink,17)}`;
 }).join('');}
function svgFor(cue){
 const chapter=story[cue.chapter],caption=wrap(cleanSpeech(cue.text),1120,22);
 if(caption.length>3)throw Error(`Caption too long: ${cue.text}`);
 const capY=612-(caption.length-1)*14;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1280 720"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#f4cf75"/></marker></defs><rect width="1280" height="720" fill="#0c172a"/><g font-family="Arial,sans-serif">${tx(40,32,'GRADE 9 · INTEGRATED SCIENCE',14,'#b5ed61')}${tx(1240,32,`${cue.chapter+1} / ${story.length} · ${chapter.location}`,14,P.muted,'end')}${tx(40,76,chapter.title,30)}${route(chapter.id)}<rect x="40" y="132" width="752" height="410" rx="14" fill="#11243a"/><svg x="48" y="138" width="735" height="392" viewBox="0 0 750 400">${visual(chapter.id)}</svg>${cardPanel(chapter.cards)}<rect x="40" y="559" width="1200" height="114" rx="14" fill="#1a334b"/>${caption.map((line,i)=>tx(640,capY+i*28,line,22,P.ink,'middle')).join('')}${tx(40,697,'Anatomical illustrations; movement overlays and transit times are schematic.',12,'#91a9c3')}${tx(1240,697,'Sources: NIDDK · OpenStax · NCBI / NIH',12,'#91a9c3','end')}<rect x="40" y="709" width="1200" height="4" rx="2" fill="#263e58"/></g></svg>`;
}
function time(seconds){const ms=Math.round(seconds*1000);return `${Math.floor(ms/3600000).toString().padStart(2,'0')}:${Math.floor(ms/60000)%60}`.replace(/:(\d)$/i,':0$1')+`:${(Math.floor(ms/1000)%60).toString().padStart(2,'0')}.${(ms%1000).toString().padStart(3,'0')}`;}
function run(args){const result=spawnSync(FFMPEG,['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8',maxBuffer:2e6});if(result.status!==0)throw Error(result.stderr);}
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function disc(buffer,x,y,r,color){const [rr,gg,bb]=rgb(color);x=Math.round(x);y=Math.round(y);r=Math.round(r);for(let dy=-r;dy<=r;dy++){const yy=y+dy;if(yy<0||yy>=H)continue;const span=Math.floor(Math.sqrt(r*r-dy*dy));for(let dx=-span;dx<=span;dx++){const xx=x+dx;if(xx<0||xx>=W)continue;const index=(yy*W+xx)*3;buffer[index]=rr;buffer[index+1]=gg;buffer[index+2]=bb;}}}
function animatedFrame(base,chapter,t){const frame=Buffer.from(base);for(const dot of motion(chapter.id,t-chapter.start))disc(frame,(48+dot.x*.98)*3,(138+dot.y*.98)*3,dot.r*.98*3,dot.color);const width=Math.floor(3600*t/DURATION);for(let y=2127;y<2139;y++)for(let x=120;x<120+width;x++){const i=(y*W+x)*3;frame[i]=181;frame[i+1]=237;frame[i+2]=97;}return frame;}
fs.writeFileSync(path.join(OUT,'digestion-5-minute.vtt'),'WEBVTT\n\n'+cues.map(c=>`${time(c.start)} --> ${time(c.end)}\n${wrap(cleanSpeech(c.text),92,1).join('\n')}\n`).join('\n'));
fs.writeFileSync(path.join(OUT,'chapters.json'),JSON.stringify(story.map(s=>({title:s.title,start:s.start,end:s.end})),null,2));
(async()=>{
 if(process.argv.includes('--preview')){
  const tiles=[];for(let i=0;i<story.length;i++){
   const cue=cues.find(c=>c.chapter===i),file=path.join(ROOT,'tmp/digestion-4k',`chapter-${i+1}.png`);
   await sharp(Buffer.from(svgFor(cue))).png().toFile(file);
   tiles.push({input:await sharp(file).resize(640,360).toBuffer(),left:(i%3)*640,top:Math.floor(i/3)*360});
  }
  await sharp({create:{width:1920,height:1800,channels:3,background:'#0c172a'}}).composite(tiles).png().toFile(path.join(ROOT,'tmp/digestion-4k','storyboard.png'));
  console.log('Previewed all 14 chapter layouts.');return;
 }
 const output=path.join(OUT,'digestion-human-anatomy-5-min-4k.mp4');
 const encoder=spawn(FFMPEG,['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0','-i',path.join(OUT,'digestion-from-ingestion-to-egestion-5-min.mp4'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p','-c:a','copy','-t',String(DURATION),'-movflags','+faststart',output],{stdio:['pipe','ignore','pipe']});
 let errors='';encoder.stderr.on('data',data=>errors+=data);const finished=once(encoder,'close');
 let cueIndex=-1,base;
 for(let f=0;f<DURATION*FPS;f++){
  const t=f/FPS;let index=Math.max(0,cueIndex);while(index<cues.length-1&&t>=cues[index].end)index++;
  if(index!==cueIndex){cueIndex=index;base=await sharp(Buffer.from(svgFor(cues[index]))).removeAlpha().raw().toBuffer();}
  const frame=animatedFrame(base,story[cues[index].chapter],t);
  if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');
  if(f%(FPS*15)===0)console.log(`Rendered ${t} / ${DURATION} seconds`);
 }
 encoder.stdin.end();const [status]=await finished;if(status)throw Error(errors);
 await sharp(Buffer.from(svgFor(cues.find(c=>story[c.chapter].id==='villi')))).png().toFile(path.join(OUT,'digestion-anatomy-4k-poster.png'));
 console.log(output);
})().catch(error=>{console.error(error);process.exit(1)});
