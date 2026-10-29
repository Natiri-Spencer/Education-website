/* Five-minute Grade 7 anatomical animation; original motion and editable labels. */
const fs=require('node:fs'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const {once}=require('node:events');
const sharp=require('sharp');
const story=require('./female_reproductive_story.json');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'exports/female-reproductive-system'),WORK=path.join(ROOT,'tmp/female-reproductive-system');
const FF=path.join(ROOT,'Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const W=1920,H=1080,FPS=24,DURATION=300,S=1.5,AX=100,AY=130,AS=675/1536;
fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(WORK,{recursive:true});
const art='data:image/png;base64,'+fs.readFileSync(path.join(OUT,'assets/female-reproductive-anatomy.png')).toString('base64');
const C={text:'#eef6ff',muted:'#b3c9df',gold:'#f4ce6a',teal:'#65dbd0',pink:'#ee9dad',red:'#e97889'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const tx=(x,y,text,size=18,color=C.text,anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(text)}</text>`;
function wrap(text,width,size){let line='',lines=[];for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(next.length*size*.51>width&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
const block=(x,y,text,size=18,width=320,color=C.text,leading=25)=>wrap(text,width,size).map((line,i)=>tx(x,y+i*leading,line,size,color)).join('');
const box=(x,y,w,h,fill='#1b334d')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="#34516d"/>`;
function duration(file){const b=fs.readFileSync(file);let rate;for(let i=12;i+8<=b.length;){const name=b.toString('ascii',i,i+4),n=b.readUInt32LE(i+4);if(name==='fmt ')rate=b.readUInt32LE(i+16);if(name==='data')return n/rate;i+=8+n+(n%2);}throw Error('Invalid narration WAV');}
const cues=[];
story.forEach((scene,i)=>{const voice=scene.narration.map((text,j)=>({text,file:path.join(WORK,`voice-${i}-${j}.wav`),chapter:i}));voice.forEach(c=>c.raw=duration(c.file));const raw=voice.reduce((n,c)=>n+c.raw,0),span=scene.end-scene.start,tempo=Math.max(.85,raw/(span-.55*voice.length));let t=scene.start;
 if(tempo<.65||tempo>1.3)throw Error(`Revise narration pace in ${scene.id}: ${tempo.toFixed(2)}`);
 for(const cue of voice){cue.tempo=tempo;cue.start=t;cue.duration=cue.raw/tempo+.55;t+=cue.duration;cue.end=t;cues.push(cue);}cues.at(-1).end=scene.end;cues.at(-1).duration=scene.end-cues.at(-1).start;
 console.log(`${scene.id}: ${span}s, narration ${raw.toFixed(1)}s, tempo ${tempo.toFixed(2)}`);
});
const parts=[
 ['Fallopian tube',430,135,580,35,'tubes'],['Ovary',285,330,50,450,'ovaries'],['Fimbriae',125,275,24,560,'tubes'],
 ['Uterus',968,350,1125,430,'uterus'],['Endometrium',895,290,1110,525,'cycle'],['Cervix',795,535,1100,665,'cervix'],['Vagina',805,795,1110,860,'vagina']
];
function labels(id){return parts.map(([name,px,py,x,y,key])=>{const active=id===key||id==='map'||id.startsWith('quiz'),color=active?C.gold:C.muted,w=name.length*17+28;
 return `<path d="M${px} ${py}L${x+w/2} ${y}" fill="none" stroke="${color}" stroke-width="3"/><circle cx="${px}" cy="${py}" r="5" fill="${color}"/><rect x="${x}" y="${y-24}" width="${w}" height="43" rx="8" fill="#07182b" fill-opacity=".94"/>${tx(x+14,y+7,name,30,color)}`;
}).join('');}
const notes={
 intro:['Identify the main organs.','Connect each structure to its function.','Trace the direction of egg movement.'],
 location:['Pelvis: lower part of the trunk.','Front view; internal organs exposed for learning.'],
 map:['Two ovaries and two tubes.','One uterus; cervix below it.','The vagina leads to the outside.'],
 ovaries:['Eggs develop inside follicles.','Ovaries also produce hormones.'],
 tubes:['Tubes lead towards the uterus.','Fimbriae guide a released egg.','A small gap separates tube and ovary.'],
 uterus:['Wall: muscular tissue.','Lining: the endometrium.'],
 cervix:['Narrow lower part of the uterus.','Its canal opens into the vagina.','Produces mucus.'],
 vagina:['A muscular canal.','Route for menstrual flow.','Urine uses the separate urethra.'],
 ovulation:['1. A follicle develops.','2. The egg is released.','3. Fimbriae guide the egg.'],
 transport:['The egg does not swim.','Cilia beat; muscle gently contracts.'],
 cycle:['The lining builds up.','If no pregnancy, the lining sheds.'],
 quiz1:['Answer 1: the ovaries.','Answer 2: the endometrium of the uterus.'],
 quiz2:['Answer: cilia and muscle contractions.','Ovary → fallopian tube → towards uterus.']
};
function side(scene){let content=tx(880,156,'LEARNING FOCUS',13,C.teal)+block(880,187,scene.focus,20,337,C.text,27);const list=notes[scene.id];
 content+=list.map((line,i)=>block(880,260+i*62,line,17,335,i===0?C.gold:C.muted,23)).join('');
 if(['ovaries','ovulation'].includes(scene.id))content+=`<rect x="878" y="400" width="348" height="156" rx="10" fill="#102138"/><ellipse cx="1033" cy="480" rx="105" ry="52" fill="url(#ovary)" stroke="#f1b8ac" stroke-width="2"/><circle cx="979" cy="478" r="12" fill="#ba768a" stroke="#ffe1cc"/><circle cx="1007" cy="447" r="9" fill="#cf8b9c" stroke="#ffe1cc"/>${tx(892,424,'Magnified follicle development',13,C.muted)}`;
 if(scene.id==='transport')content+=`<rect x="878" y="380" width="348" height="176" rx="10" fill="#102138"/>${tx(892,405,'Magnified tube lining',14,C.muted)}<path d="M895 430H1210M895 528H1210" stroke="#dc8b9c" stroke-width="12"/>${tx(1052,550,'Direction: towards the uterus →',13,C.gold,'middle')}`;
 if(['uterus','cycle'].includes(scene.id))content+=`<rect x="878" y="390" width="348" height="166" rx="10" fill="#102138"/>${tx(892,414,'Magnified lining cross-section',13,C.muted)}<rect x="895" y="495" width="312" height="32" fill="#bc6b7e"/>${tx(1050,548,'Schematic change in thickness',12,C.muted,'middle')}`;
 return content;
}
function svg(cue){const scene=story[cue.chapter],caption=wrap(cue.text,1150,21);if(caption.length>3)throw Error('Caption too long');const y=635-(caption.length-1)*13;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1280 720"><defs><radialGradient id="ovary"><stop stop-color="#f3c7ac"/><stop offset="1" stop-color="#be778b"/></radialGradient></defs><rect width="1280" height="720" fill="#0b1729"/><g font-family="Arial, sans-serif">${tx(35,30,'CBE STEM ACADEMY · GRADE 7 INTEGRATED SCIENCE',14,C.teal)}${tx(1245,30,`${cue.chapter+1} / ${story.length}`,14,C.muted,'end')}${tx(35,75,scene.title,31)}${tx(35,105,'FEMALE REPRODUCTIVE SYSTEM · ANATOMICAL CUTAWAY',13,C.muted)}${box(35,125,805,460,'#102138')}${box(860,125,385,460)}<g transform="translate(${AX} ${AY}) scale(${AS})"><image href="${art}" width="1536" height="1024"/>${labels(scene.id)}</g>${side(scene)}${box(35,601,1210,83)}${caption.map((line,i)=>tx(640,y+i*26,line,21,C.text,'middle')).join('')}${tx(35,704,'Organs shown in cutaway. Eggs and movement are enlarged; biological time is compressed.',11,C.muted)}${tx(1245,704,'Scientific references: NICHD / NIH · OpenStax',11,C.muted,'end')}<rect x="35" y="713" width="1210" height="4" fill="#294057"/></g></svg>`;
}
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function dot(frame,x,y,r,color,alpha=1){x=Math.round(x*S);y=Math.round(y*S);r=Math.max(1,Math.round(r*S));const c=rgb(color);for(let dy=-r;dy<=r;dy++){const yy=y+dy;if(yy<0||yy>=H)continue;const span=Math.floor(Math.sqrt(r*r-dy*dy));for(let dx=-span;dx<=span;dx++){const xx=x+dx;if(xx<0||xx>=W)continue;const i=(yy*W+xx)*3;for(let k=0;k<3;k++)frame[i+k]=frame[i+k]*(1-alpha)+c[k]*alpha;}}}
function line(frame,x1,y1,x2,y2,color,width=1,alpha=1){const n=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)));for(let i=0;i<=n;i++)dot(frame,x1+(x2-x1)*i/n,y1+(y2-y1)*i/n,width,color,alpha);}
function ring(frame,x,y,rx,ry,color,alpha=.7){for(let i=0;i<160;i++){const a=i*Math.PI/80;dot(frame,x+rx*Math.cos(a),y+ry*Math.sin(a),1.15,color,alpha);}}
function fillRect(frame,x,y,w,h,color,alpha=1){const c=rgb(color);for(let yy=Math.round(y*S);yy<Math.min(H,Math.round((y+h)*S));yy++)for(let xx=Math.max(0,Math.round(x*S));xx<Math.min(W,Math.round((x+w)*S));xx++){if(yy<0)continue;const i=(yy*W+xx)*3;for(let k=0;k<3;k++)frame[i+k]=frame[i+k]*(1-alpha)+c[k]*alpha;}}
const native=(x,y)=>[AX+x*AS,AY+y*AS];
const along=(points,p)=>{p=Math.max(0,Math.min(1,p));const n=Math.min(points.length-2,Math.floor(p*(points.length-1))),q=p*(points.length-1)-n;return[points[n][0]+(points[n+1][0]-points[n][0])*q,points[n][1]+(points[n+1][1]-points[n][1])*q];};
const TUBE=[[225,280],[155,250],[112,200],[112,135],[150,95],[215,83],[280,106],[355,140],[438,161],[520,176],[560,188]];
function frameFor(base,scene,t){const frame=Buffer.from(base),local=t-scene.start,p=local/(scene.end-scene.start),pulse=.4+.4*(.5+.5*Math.sin(local*2.3));
 const highlights={ovaries:[285,330,125,80],tubes:[150,240,115,145],uterus:[768,320,225,210],cervix:[775,535,76,70],vagina:[775,790,95,175],cycle:[768,320,178,165],quiz1:[285,330,125,80],quiz2:[390,145,180,80]};
 let focus=highlights[scene.id];if(scene.id==='map'||scene.id==='intro'||scene.id==='location')focus=Object.values(highlights)[Math.floor(local/3)%5];
 if(focus){const[x,y]=native(focus[0],focus[1]);ring(frame,x,y,focus[2]*AS,focus[3]*AS,C.gold,pulse);}
 if(['ovaries','ovulation'].includes(scene.id)){
  const grow=scene.id==='ovaries'?(local%8)/8:Math.min(1,p/.42),r=12+grow*18;
  dot(frame,1070,480,r,C.pink,.78);ring(frame,1070,480,r+2,r+2,'#ffe1c5',.9);if(scene.id==='ovaries'||p<=.42)dot(frame,1070,480,5+grow*3,C.gold);
  if(scene.id==='ovulation'){
   const release=Math.max(0,Math.min(1,(p-.42)/.5)),[nx,ny]=along(TUBE,release*.44),[x,y]=native(nx,ny);
   dot(frame,x,y,13,C.gold,.18);dot(frame,x,y,6.5,C.gold);dot(frame,x-1.5,y-1.5,2,'#fff2bb');
   if(p>.42){const ex=1070+release*111,ey=480-release*34;dot(frame,ex,ey,10,C.gold,.22);dot(frame,ex,ey,5.5,C.gold);}
  }
 }
 if(scene.id==='transport'){
  const[nx,ny]=along(TUBE,.40+.55*p),[x,y]=native(nx,ny);dot(frame,x,y,12,C.gold,.17);dot(frame,x,y,6,C.gold);
  const q=(local%7)/7,eggX=920+q*270;
  const half=x=>41-9*Math.exp(-Math.pow((x-(eggX-28))/23,2))+3*Math.exp(-Math.pow((x-(eggX+24))/27,2));
  fillRect(frame,888,422,329,113,'#102138');
  for(let x=895;x<=1210;x+=2){dot(frame,x,479-half(x),4.5,'#dc8b9c');dot(frame,x,479+half(x),4.5,'#dc8b9c');}
  for(let i=0;i<21;i++){const bx=900+i*14,wave=Math.sin(local*5-i*.7),root=476+half(bx);line(frame,bx,root,bx+10*wave,root-22-3*Math.cos(local*5-i*.7),C.teal,1.2);}
  dot(frame,eggX,477,12,C.gold,.17);dot(frame,eggX,477,6.5,C.gold);
 }
 if(['uterus','cycle'].includes(scene.id)){
  const cycle=scene.id==='cycle'?p:(local%9)/9,thickness=cycle<.67?15+cycle/.67*52:67-(cycle-.67)/.33*52;
  fillRect(frame,895,495-thickness,312,thickness,'#e68b9c',.9);
  for(let i=0;i<12;i++)line(frame,906+i*25,490,909+i*25,499-thickness,'#f1b0b9',.8,.55);
  if(scene.id==='cycle'&&p>.67)for(let i=0;i<5;i++){const q=(local*.14+i/5)%1;const[x,y]=native(770+Math.sin(i*3)*13,300+q*625);dot(frame,x,y,2.6,C.red,.8);}
 }
 if(scene.id==='vagina')for(let i=0;i<3;i++){const q=(local*.16+i/3)%1;const[x,y]=native(775,590+q*310);dot(frame,x,y,3,C.teal,.7);}
 const progress=Math.floor(1210*t/DURATION);fillRect(frame,35,713,progress,4,C.teal);return frame;
}
function run(args){const r=spawnSync(FF,['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8',maxBuffer:2e6});if(r.status!==0)throw Error(r.stderr);}
function timestamp(t){const ms=Math.round(t*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;}
fs.writeFileSync(path.join(OUT,'female-reproductive-system.vtt'),'WEBVTT\n\n'+cues.map(c=>`${timestamp(c.start)} --> ${timestamp(c.end)}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(OUT,'transcript.txt'),story.map(s=>`${s.title}\n${s.narration.join(' ')}`).join('\n\n'));
fs.writeFileSync(path.join(OUT,'chapters.json'),JSON.stringify(story.map(({id,title,start,end})=>({id,title,start,end})),null,2));
(async()=>{
 if(process.argv.includes('--preview')){
  const tiles=[];for(let i=0;i<story.length;i++){const scene=story[i],t=scene.start+(scene.end-scene.start)*.65,cue=cues.find(c=>t>=c.start&&t<c.end),base=await sharp(Buffer.from(svg(cue))).removeAlpha().raw().toBuffer();const image=await sharp(frameFor(base,scene,t),{raw:{width:W,height:H,channels:3}}).png().toBuffer();await fs.promises.writeFile(path.join(WORK,`${scene.id}.png`),image);tiles.push({input:await sharp(image).resize(640,360).toBuffer(),left:i%3*640,top:Math.floor(i/3)*360});}
  await sharp({create:{width:1920,height:1800,channels:3,background:'#0b1729'}}).composite(tiles).png().toFile(path.join(WORK,'storyboard.png'));console.log('Storyboard ready.');return;
 }
 const filters=cues.map((c,i)=>`[${i}:a]atempo=${c.tempo.toFixed(8)},apad,atrim=duration=${c.duration.toFixed(8)},asetpts=PTS-STARTPTS[a${i}]`).join(';')+';'+cues.map((_,i)=>`[a${i}]`).join('')+`concat=n=${cues.length}:v=0:a=1,alimiter=limit=0.92[a]`;
 run([...cues.flatMap(c=>['-i',c.file]),'-filter_complex',filters,'-map','[a]','-ar','48000','-ac','1',path.join(OUT,'narration.wav')]);
 const pending=path.join(OUT,'female-reproductive-system-grade7.rendering.mp4'),output=path.join(OUT,'female-reproductive-system-grade7-5min.mp4');
 const encoder=spawn(FF,['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0','-i',path.join(OUT,'narration.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t',String(DURATION),'-movflags','+faststart',pending],{stdio:['pipe','ignore','pipe']});
 let errors='';encoder.stderr.on('data',d=>errors+=d);const finished=once(encoder,'close');let current=-1,base;
 for(let f=0;f<DURATION*FPS;f++){const t=f/FPS;let index=Math.max(0,current);while(index<cues.length-1&&t>=cues[index].end)index++;if(index!==current){current=index;base=await sharp(Buffer.from(svg(cues[index]))).removeAlpha().raw().toBuffer();}const frame=frameFor(base,story[cues[index].chapter],t);if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');if(f%(FPS*30)===0)console.log(`Rendered ${t} / 300 seconds`);}
 encoder.stdin.end();const[status]=await finished;if(status)throw Error(errors);fs.renameSync(pending,output);
 const cue=cues.find(c=>story[c.chapter].id==='map');await sharp(Buffer.from(svg(cue))).png().toFile(path.join(OUT,'poster.png'));console.log(output);
})().catch(e=>{console.error(e);process.exit(1);});
