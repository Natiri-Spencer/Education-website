/* Five-minute Grade 7 anatomical animation; original motion and editable labels. */
const fs=require('node:fs'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const {once}=require('node:events');
const sharp=require('sharp');
const story=require('./male_reproductive_story.json');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'exports/male-reproductive-system'),WORK=path.join(ROOT,'tmp/male-reproductive-system');
const FF=path.join(ROOT,'Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const W=1920,H=1080,FPS=24,DURATION=300,S=1.5,AX=100,AY=130,AS=675/1536;
fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(WORK,{recursive:true});

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
const ART=fs.readFileSync(path.join(OUT,'assets/blausen-pelvis-source.png')).toString('base64');
const T=([x,y])=>[260+x*.7,135+y*.7];
// Registered to the normal left-hand panel of BruceBlaus's medical illustration.
const DUCT=[[220,555],[250,544],[268,516],[273,473],[267,426],[254,375],[238,331],[215,282],[197,239],[187,209],[190,180],[206,150],[232,128],[270,110],[315,103],[363,106],[410,120],[448,145],[473,178],[482,208],[471,235],[449,252],[430,269],[420,289]].map(T);
const URETHRA=[[420,289],[416,311],[407,329],[394,338],[377,336],[345,323],[305,309],[263,293],[222,281],[190,278],[169,286],[151,306],[138,336],[124,370],[109,407],[94,447],[82,484],[65,520]].map(T);
const EPIDIDYMIS=[[221,419],[240,421],[254,437],[264,461],[267,489],[260,518],[243,540],[220,555]].map(T);
const GLAND=[[481,211],[471,235],[449,252],[430,269],[420,289]].map(T);
const parts=[['Bladder',...T([345,180]),70,195,'bladder'],['Sperm duct',...T([187,209]),62,275,'duct'],['Penis',...T([100,363]),62,367,'urethra'],['Urethra',...T([109,407]),62,446,'urethra'],['Scrotum',...T([276,535]),630,553,'scrotum'],['Testis',...T([206,493]),647,504,'testes'],['Epididymis',...T([265,479]),642,450,'epididymis'],['Prostate',...T([432,290]),650,365,'glands'],['Seminal vesicle',...T([482,211]),644,273,'glands']];
function anatomy(id){let s=`<svg x="260" y="135" width="390.6" height="438.2" viewBox="2 0 558 626"><image href="data:image/png;base64,${ART}" width="1157" height="732"/></svg>`;
 s+=parts.map(([name,px,py,x,y,key])=>{const active=id===key||id==='map'||id==='quiz',color=active?C.gold:C.muted,w=name.length*8+16;return `<path d="M${px} ${py}L${x+w/2} ${y-4}" fill="none" stroke="${color}" stroke-width="1.1"/><circle cx="${px}" cy="${py}" r="2.5" fill="${color}"/><rect x="${x}" y="${y-17}" width="${w}" height="26" rx="5" fill="#102138"/>${tx(x+8,y+1,name,15,color)}`;}).join('');
 return s;
}
const notes={intro:['Name each main part.','Explain what each part does.','Follow the sperm pathway.'],map:['Front of body ← | → Back','Organs shown inside the pelvis.','One side of paired organs shown.'],testes:['Testes = two; testis = one.','Make sperm in tiny coiled tubes.','Also make testosterone.'],scrotum:['Skin pouch around the testes.','Helps control temperature.','Slightly cooler than the body.'],epididymis:['A coiled tube beside each testis.','Sperm mature here.','Stores sperm for a time.'],duct:['Sperm duct = vas deferens.','Carries sperm to the joining tube.','Muscle squeezes help transport.'],glands:['Seminal vesicles add nutrient fluid.','Prostate also adds fluid.','Sperm + fluids = semen.'],urethra:['Urethra = tube through the penis.','Carries urine or semen.','Normally at different times.'],journey:['1. Testis → epididymis','2. Sperm duct → joining tube','3. Urethra → outside'],sperm:['Head: genetic information.','Middle piece: releases energy.','Tail: helps the sperm swim.'],puberty:['Bodies develop at different times.','Keep the outside clean.','Ask a trusted adult for help.'],quiz:['Which organs make sperm?','Where do sperm mature?','What is semen?']};
function side(scene,cue){let s=tx(880,155,'LEARNING FOCUS',13,C.teal)+block(880,187,scene.focus,20,335,C.text,27);
 s+=notes[scene.id].map((line,i)=>block(880,260+i*56,line,17,330,i===0?C.gold:C.muted,23)).join('');
 if(scene.id==='sperm')s+=`${box(878,416,348,147,'#102138')}${tx(893,441,'Magnified sperm cell',13,C.muted)}<ellipse cx="940" cy="492" rx="24" ry="15" fill="#f1cd86"/><path d="M963 492H1010" stroke="#e8a6a3" stroke-width="14"/>${tx(940,540,'Head',12,C.gold,'middle')}${tx(1006,562,'Middle piece',12,C.gold,'middle')}${tx(1155,540,'Tail',12,C.gold,'middle')}`;
 else if(scene.id==='quiz'&&cue.text.startsWith('Check:'))s+=`${box(878,421,348,139,'#102138')}${tx(895,447,'ANSWERS',13,C.teal)}${tx(895,476,'Testes make sperm.',16)}${tx(895,505,'Epididymis: sperm mature.',16)}${tx(895,534,'Semen: sperm plus gland fluids.',15)}`;
 else if(['epididymis','testes'].includes(scene.id))s+=`${box(878,421,348,139,'#102138')}${tx(893,445,'Coiled tubes · enlarged model',13,C.muted)}<path d="M900 480q20 -30 40 0t40 0t40 0t40 0t40 0t40 0t40 0" fill="none" stroke="#e5b882" stroke-width="12"/><path d="M900 517q20 -30 40 0t40 0t40 0t40 0t40 0t40 0t40 0" fill="none" stroke="#e5b882" stroke-width="12"/>`;
 else s+=`${box(878,421,348,139,'#102138')}${tx(893,446,'REMEMBER THE DIFFERENCE',13,C.teal)}${block(895,480,scene.id==='glands'?'Sperm are cells. Semen is the fluid mixture.':scene.id==='scrotum'?'The scrotum holds the testes. The testes make sperm.':scene.id==='puberty'?'Respect your body. Respect other people.':'The bladder stores urine. Sperm do not enter the bladder.',18,310,C.gold,28)}`;
 return s;
}
function svg(cue){const scene=story[cue.chapter],caption=wrap(cue.text,1150,21);if(caption.length>3)throw Error('Caption too long');const y=635-(caption.length-1)*13;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1280 720"><defs><radialGradient id="bladder"><stop stop-color="#e4a8a6"/><stop offset="1" stop-color="#9c5c76"/></radialGradient><radialGradient id="organ"><stop stop-color="#efaeb5"/><stop offset="1" stop-color="#a75973"/></radialGradient><radialGradient id="sac"><stop stop-color="#b98285"/><stop offset="1" stop-color="#6c455e"/></radialGradient><radialGradient id="testis"><stop stop-color="#f4d8b5"/><stop offset="1" stop-color="#d89889"/></radialGradient></defs><rect width="1280" height="720" fill="#0b1729"/><g font-family="Arial, sans-serif">${tx(35,30,'CBE STEM ACADEMY · GRADE 7 INTEGRATED SCIENCE',14,C.teal)}${tx(1245,30,`${cue.chapter+1} / ${story.length}`,14,C.muted,'end')}${tx(35,75,scene.title,30)}${tx(35,105,'MALE REPRODUCTIVE SYSTEM · HUMAN PELVIS · ANATOMICAL CUTAWAY',13,C.muted)}${box(35,125,805,460,'#102138')}${box(860,125,385,460)}${anatomy(scene.id)}${side(scene,cue)}${box(35,601,1210,83)}${caption.map((line,i)=>tx(640,y+i*26,line,21,C.text,'middle')).join('')}${tx(35,704,'Human anatomical cutaway. Sperm markers enlarged; biological time compressed.',11,C.muted)}${tx(1245,704,'Art: BruceBlaus / Blausen Medical · CC BY-SA 4.0 · Adapted',11,C.muted,'end')}<rect x="35" y="713" width="1210" height="4" fill="#294057"/></g></svg>`;
}

const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function dot(frame,x,y,r,color,alpha=1){x=Math.round(x*S);y=Math.round(y*S);r=Math.max(1,Math.round(r*S));const c=rgb(color);for(let dy=-r;dy<=r;dy++){const yy=y+dy;if(yy<0||yy>=H)continue;const span=Math.floor(Math.sqrt(r*r-dy*dy));for(let dx=-span;dx<=span;dx++){const xx=x+dx;if(xx<0||xx>=W)continue;const i=(yy*W+xx)*3;for(let k=0;k<3;k++)frame[i+k]=frame[i+k]*(1-alpha)+c[k]*alpha;}}}
function line(frame,x1,y1,x2,y2,color,width=1,alpha=1){const n=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)));for(let i=0;i<=n;i++)dot(frame,x1+(x2-x1)*i/n,y1+(y2-y1)*i/n,width,color,alpha);}
function ring(frame,x,y,rx,ry,color,alpha=.7){for(let i=0;i<160;i++){const a=i*Math.PI/80;dot(frame,x+rx*Math.cos(a),y+ry*Math.sin(a),1.15,color,alpha);}}
function fillRect(frame,x,y,w,h,color,alpha=1){const c=rgb(color);for(let yy=Math.round(y*S);yy<Math.min(H,Math.round((y+h)*S));yy++)for(let xx=Math.max(0,Math.round(x*S));xx<Math.min(W,Math.round((x+w)*S));xx++){if(yy<0)continue;const i=(yy*W+xx)*3;for(let k=0;k<3;k++)frame[i+k]=frame[i+k]*(1-alpha)+c[k]*alpha;}}
const along=(points,p)=>{p=Math.max(0,Math.min(.999999,p));const n=Math.floor(p*(points.length-1)),q=p*(points.length-1)-n;return[points[n][0]+(points[n+1][0]-points[n][0])*q,points[n][1]+(points[n+1][1]-points[n][1])*q];};
function marker(frame,route,p,color=C.gold){const[x,y]=along(route,p);dot(frame,x,y,8,color,.16);dot(frame,x,y,3.8,color);}
function frameFor(base,scene,t){const frame=Buffer.from(base),local=t-scene.start,p=local/(scene.end-scene.start),pulse=.45+.3*Math.sin(local*2);
 const sourceFocus={testes:[206,493,58,81],scrotum:[208,489,85,101],epididymis:[257,483,22,72],duct:[188,206,24,65],glands:[474,218,28,49],urethra:[110,407,39,92]};let f=sourceFocus[scene.id];if(['map','intro'].includes(scene.id))f=Object.values(sourceFocus)[Math.floor(local/3)%6];if(f){const[x,y]=T(f);ring(frame,x,y,f[2]*.7,f[3]*.7,C.gold,pulse);}
 if(scene.id==='testes')for(let i=0;i<7;i++){const[x,y]=T([178+(i*11+local*5)%52,451+i%5*15]);dot(frame,x,y,2,C.gold,.75);}
 if(scene.id==='epididymis'){for(let i=0;i<4;i++)marker(frame,EPIDIDYMIS,(local/9+i/4)%1);for(let i=0;i<3;i++){const q=(local*.12+i/3)%1;dot(frame,905+q*285,480+12*Math.sin(q*Math.PI*14),3,C.gold);}}
 if(['duct','journey'].includes(scene.id)){for(let i=0;i<DUCT.length-1;i++)line(frame,...DUCT[i],...DUCT[i+1],C.gold,.65,.45);}
 if(['urethra','journey'].includes(scene.id)){for(let i=0;i<URETHRA.length-1;i++)line(frame,...URETHRA[i],...URETHRA[i+1],C.teal,.65,.5);}
 if(scene.id==='duct')for(let i=0;i<4;i++)marker(frame,DUCT,(local/14+i/4)%1);
 if(scene.id==='glands'){const[x,y]=T([430,286]);ring(frame,x,y,31,28,C.teal,pulse);for(let i=0;i<3;i++)marker(frame,GLAND,(local/3+i/3)%1,C.teal);}
 if(scene.id==='urethra')for(let i=0;i<4;i++)marker(frame,URETHRA,(local/9+i/4)%1,C.teal);
 if(scene.id==='journey'){const q=(local%20)/20;if(q<.15)marker(frame,EPIDIDYMIS,q/.15);else if(q<.65)marker(frame,DUCT,(q-.15)/.5);else marker(frame,URETHRA,(q-.65)/.35);if(q>.55)for(let i=0;i<3;i++)marker(frame,GLAND,(local/2+i/3)%1,C.teal);}
 if(scene.id==='sperm')for(let x=1010;x<1204;x+=2)dot(frame,x,492+Math.sin((x-1010)/27-local*5)*((x-1010)/194)*16,2.1,C.gold);
 fillRect(frame,35,713,Math.floor(1210*t/DURATION),4,C.teal);return frame;
}
function run(args){const r=spawnSync(FF,['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8',maxBuffer:2e6});if(r.status!==0)throw Error(r.stderr);}
function timestamp(t){const ms=Math.round(t*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;}
fs.writeFileSync(path.join(OUT,'male-reproductive-system.vtt'),'WEBVTT\n\n'+cues.map(c=>`${timestamp(c.start)} --> ${timestamp(c.end)}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(OUT,'male-reproductive-system.srt'),cues.map((c,i)=>`${i+1}\n${timestamp(c.start).replace('.',',')} --> ${timestamp(c.end).replace('.',',')}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(OUT,'transcript.txt'),story.map(s=>`${s.title}\n${s.narration.join(' ')}`).join('\n\n'));
fs.writeFileSync(path.join(OUT,'chapters.json'),JSON.stringify(story.map(({id,title,start,end})=>({id,title,start,end})),null,2));
(async()=>{
 if(process.argv.includes('--preview')){
  const tiles=[];for(let i=0;i<story.length;i++){const scene=story[i],t=scene.start+(scene.end-scene.start)*.65,cue=cues.find(c=>t>=c.start&&t<c.end),base=await sharp(Buffer.from(svg(cue))).removeAlpha().raw().toBuffer();const image=await sharp(frameFor(base,scene,t),{raw:{width:W,height:H,channels:3}}).png().toBuffer();await fs.promises.writeFile(path.join(WORK,`${scene.id}.png`),image);tiles.push({input:await sharp(image).resize(640,360).toBuffer(),left:i%3*640,top:Math.floor(i/3)*360});}
  await sharp({create:{width:1920,height:Math.ceil(story.length/3)*360,channels:3,background:'#0b1729'}}).composite(tiles).png().toFile(path.join(WORK,'storyboard.png'));console.log('Storyboard ready.');return;
 }
 const filters=cues.map((c,i)=>`[${i}:a]atempo=${c.tempo.toFixed(8)},apad,atrim=duration=${c.duration.toFixed(8)},asetpts=PTS-STARTPTS[a${i}]`).join(';')+';'+cues.map((_,i)=>`[a${i}]`).join('')+`concat=n=${cues.length}:v=0:a=1,alimiter=limit=0.92[a]`;
 run([...cues.flatMap(c=>['-i',c.file]),'-filter_complex',filters,'-map','[a]','-ar','48000','-ac','1',path.join(OUT,'narration.wav')]);
 const pending=path.join(OUT,'male-reproductive-system-grade7.rendering.mp4'),output=path.join(OUT,'male-reproductive-system-grade7-human-anatomy-5min.mp4');
 const encoder=spawn(FF,['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0','-i',path.join(OUT,'narration.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t',String(DURATION),'-movflags','+faststart',pending],{stdio:['pipe','ignore','pipe']});
 let errors='';encoder.stderr.on('data',d=>errors+=d);const finished=once(encoder,'close');let current=-1,base;
 for(let f=0;f<DURATION*FPS;f++){const t=f/FPS;let index=Math.max(0,current);while(index<cues.length-1&&t>=cues[index].end)index++;if(index!==current){current=index;base=await sharp(Buffer.from(svg(cues[index]))).removeAlpha().raw().toBuffer();}const frame=frameFor(base,story[cues[index].chapter],t);if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');if(f%(FPS*30)===0)console.log(`Rendered ${t} / 300 seconds`);}
 encoder.stdin.end();const[status]=await finished;if(status)throw Error(errors);fs.renameSync(pending,output);
 const cue=cues.find(c=>story[c.chapter].id==='map');await sharp(Buffer.from(svg(cue))).png().toFile(path.join(OUT,'poster.png'));console.log(output);
})().catch(e=>{console.error(e);process.exit(1);});
