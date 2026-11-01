/* Five-minute Grade 7 anatomical animation; original motion and editable labels. */
const fs=require('node:fs'),path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const {once}=require('node:events');
const sharp=require('sharp');
const story=require('./fertilization_story.json');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'exports/fertilization'),WORK=path.join(ROOT,'tmp/fertilization');
const FF=path.join(ROOT,'Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const W=1920,H=1080,FPS=24,DURATION=300,S=1.5,AX=100,AY=130,AS=675/1536;
fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(WORK,{recursive:true});
const eggArt='data:image/png;base64,'+fs.readFileSync(path.join(OUT,'assets/human-egg-cutaway.png')).toString('base64');
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

// Scene design and deterministic animation for the Grade 7 fertilisation lesson.
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const mix=(a,b,p)=>a+(b-a)*p;
const OVERVIEW=new Set(['intro','anatomy','entry','cervix','uterus','recap']);
const native=(x,y)=>[AX+x*AS,AY+y*AS];
const PATH=[[775,928],[775,820],[777,704],[777,590],[775,520],[767,421],[730,325],[658,240],[559,186],[467,169],[370,144],[282,106],[215,83],[167,85]].map(([x,y])=>native(x,y));
const EGG_SITE=native(167,85);
const notes={
 intro:['Follow the journey through the organs.','See one sperm enter the egg.','Find out what happens to the others.'],
 anatomy:['Vagina → cervix → uterus → tube','Fertilisation: usually in a tube.','Ovaries release eggs.'],
 entry:['Semen contains sperm cells.','Tails help sperm swim.','Tract movements also help transport.'],
 cervix:['Cervix: a narrow passage.','Mucus changes near ovulation.','Many sperm remain behind.'],
 uterus:['Fewer sperm reach the tubes.','Some routes have no egg.','Defence cells help clear sperm.'],
 tube:['The wider tube is the usual site.','Sperm prepare inside the tract.','This preparation is capacitation.'],
 layers:['Outer cells surround the egg.','A clear coat protects the egg.','The cell membrane lies inside.'],
 fusion:['Track the highlighted sperm.','Its membrane joins the egg membrane.','ONE sperm enters the egg.'],
 block:['Sperm entry triggers changes.','The coat and membrane change.','Additional sperm stay outside.'],
 others:['Many never reach the egg.','Some are lost or cleared earlier.','Unused sperm break down over time.'],
 zygote:['Zygote = fertilised egg.','Genetic information from both parents.','One cell → two cells → four cells.'],
 recap:['Where does fertilisation happen?','How many sperm fertilise one egg?','What happens to the others?']
};
function stageKey(scene,t){if(scene.id==='tube'&&t<scene.start+4)return Math.floor((t-scene.start)*6);if(scene.id==='zygote')return t<264?'one':t<273?'two':'four';return 'normal';}
function labels(){const list=[['Fallopian tube',150,95,225,170],['Ovary',285,330,61,322],['Uterus',768,320,665,295],['Cervix',775,535,667,405],['Vagina',775,790,665,535]];
 return list.map(([name,px,py,x,y])=>{const[a,b]=native(px,py);return `<path d="M${a} ${b}L${x+35} ${y-4}" stroke="#d5e4f5" stroke-width="1.2" fill="none"/><circle cx="${a}" cy="${b}" r="2.5" fill="#f4ce6a"/><rect x="${x-5}" y="${y-19}" width="${name.length*8+18}" height="27" rx="5" fill="#102138"/>${tx(x+3,y,name,15)}`;}).join('');}
function overview(scene){return `<image href="${art}" x="${AX}" y="${AY}" width="${1536*AS}" height="${1024*AS}"/>${labels()}`;}
function tubeWalls(){let s='<path d="M35 126H840V147Q800 135 760 146T680 148T600 144T520 147T440 145T360 148T280 144T200 147T120 145T35 149Z" fill="#704957" opacity=".8"/><path d="M35 584H840V565Q800 577 760 566T680 564T600 568T520 565T440 567T360 564T280 568T200 565T120 567T35 563Z" fill="#704957" opacity=".8"/>';
 for(let i=0;i<48;i++){const x=45+i*17,y=146+Math.sin(i*.75)*3;s+=`<path d="M${x} ${y}q3 7 8 12M${x} ${710-y}q3-7 8-12" stroke="#d08c9c" stroke-width="1.1" fill="none" opacity=".46"/>`;}return s;}
function cleavage(t){const cells=t<273?[[372,350,72,131],[483,350,62,131]]:[[372,288,69,67],[481,288,66,67],[372,411,69,68],[481,411,66,68]];
 return `<ellipse cx="425" cy="350" rx="139" ry="150" fill="#6c4350"/>`+cells.map(([x,y,rx,ry],i)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#blastomere)" stroke="#f8d1a3" stroke-width="1.5"/><ellipse cx="${x-12}" cy="${y-4}" rx="14" ry="17" fill="#ae869b" opacity=".8"/>`).join('');}
function micro(scene,t){let s=tubeWalls()+`<image href="${eggArt}" x="220" y="135" width="430" height="430"/>`;
 if(scene.id==='layers')s+=`${tx(62,190,'Outer cells',15,C.muted)}<path d="M156 186L286 225" stroke="#b3c9df" fill="none"/>${tx(640,475,'Protective coat',15,C.gold)}<path d="M652 457L572 421" stroke="#f4ce6a" fill="none"/>${tx(52,530,'Cell membrane',15,C.teal)}<path d="M173 520L330 455" stroke="#65dbd0" fill="none"/>`;
 if(scene.id==='zygote'&&t>=264)s+=cleavage(t);
 return s;
}
function side(scene,cue,t){let s=tx(880,156,'LEARNING FOCUS',13,C.teal)+block(880,188,scene.focus,20,337,C.text,27);
 s+=notes[scene.id].map((v,i)=>block(880,258+i*59,v,17,335,i===0?C.gold:C.muted,23)).join('');
 const lines=scene.id==='recap'&&cue.text.startsWith('Check:')?['A fallopian tube.','One sperm fertilises one egg.','Other sperm are eventually cleared.']:scene.id==='fusion'?['Track one cell into the egg.','Other sperm remain outside.']:scene.id==='block'?['Protective biological changes.','No electric force field.']:scene.id==='others'?['Clearing happens over time.','Other sperm do not join the zygote.']:scene.id==='zygote'?['Cell number increases.','Implantation is a later process.']:scene.id==='layers'?['Zona pellucida = protective coat.','Enzymes help sperm pass the layers.']:['Coloured markers are enlarged.','The drawing shows a few sperm.'];
 if(scene.id==='others')return s+box(878,428,348,133,'#102138')+tx(892,450,'EXAMPLE: DEFENCE CELL CLEARING',12,C.teal)+`<path d="M1043 474Q1052 459 1067 467Q1087 458 1099 475Q1119 482 1106 500Q1111 521 1091 525Q1070 538 1055 523Q1034 521 1040 503Q1029 488 1043 474Z" fill="#867b9d" stroke="#c9b1d5" stroke-width="2"/><ellipse cx="1080" cy="496" rx="14" ry="21" fill="#56496d"/>`+tx(895,550,'A model of clearing sperm or remains.',13,C.muted);
 s+=box(878,428,348,133,'#102138')+tx(893,452,scene.id==='recap'?'CHECK YOUR ANSWERS':'REMEMBER',13,C.teal)+lines.map((v,i)=>block(895,484+i*37,v,16,312,C.gold,22)).join('');return s;
}
function svg(cue,t=cue.start){const scene=story[cue.chapter],caption=wrap(cue.text,1150,21);if(caption.length>3)throw Error('Caption too long');const y=635-(caption.length-1)*13;
 let main;if(OVERVIEW.has(scene.id))main=overview(scene);else if(scene.id==='tube'&&t<scene.start+4){const q=clamp((t-scene.start)/4);main=`<g opacity="${1-q}">${overview(scene)}</g><g opacity="${q}" transform="translate(435 350) scale(${.35+q*.65}) translate(-435 -350)">${micro(scene,t)}</g>`;}else main=micro(scene,t);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1280 720"><defs><radialGradient id="blastomere" cx="35%" cy="30%"><stop stop-color="#ffe3b7"/><stop offset=".55" stop-color="#e8b081"/><stop offset="1" stop-color="#a56360"/></radialGradient><clipPath id="main"><rect x="36" y="126" width="803" height="458" rx="12"/></clipPath></defs><rect width="1280" height="720" fill="#0b1729"/><g font-family="Arial,sans-serif">${tx(35,30,'CBE STEM ACADEMY · GRADE 7 INTEGRATED SCIENCE',14,C.teal)}${tx(1245,30,`${cue.chapter+1} / ${story.length}`,14,C.muted,'end')}${tx(35,75,scene.title,30)}${tx(35,105,OVERVIEW.has(scene.id)?'THE HUMAN REPRODUCTIVE TRACT · ANATOMICAL CUTAWAY':'MICROSCOPIC CLOSE-UP · INSIDE A FALLOPIAN TUBE',13,C.muted)}${box(35,125,805,460,'#102138')}${box(860,125,385,460)}<g clip-path="url(#main)">${main}</g>${side(scene,cue,t)}${box(35,601,1210,83)}${caption.map((line,i)=>tx(640,y+i*26,line,21,C.text,'middle')).join('')}${tx(35,704,'Teaching model: cells enlarged, colours illustrative, cell numbers simplified and time compressed.',11,C.muted)}${tx(1245,704,'References: NICHD / NIH · NCBI · OpenStax',11,C.muted,'end')}<rect x="35" y="713" width="1210" height="4" fill="#294057"/></g></svg>`;
}

const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function dot(frame,x,y,r,color,alpha=1){x=Math.round(x*S);y=Math.round(y*S);r=Math.max(1,Math.round(r*S));const c=rgb(color);for(let dy=-r;dy<=r;dy++){const yy=y+dy;if(yy<0||yy>=H)continue;const span=Math.floor(Math.sqrt(r*r-dy*dy));for(let dx=-span;dx<=span;dx++){const xx=x+dx;if(xx<0||xx>=W)continue;const i=(yy*W+xx)*3;for(let k=0;k<3;k++)frame[i+k]=frame[i+k]*(1-alpha)+c[k]*alpha;}}}
function line(frame,x1,y1,x2,y2,color,width=1,alpha=1){const n=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)));for(let i=0;i<=n;i++)dot(frame,x1+(x2-x1)*i/n,y1+(y2-y1)*i/n,width,color,alpha);}
function ring(frame,x,y,rx,ry,color,alpha=.7){for(let i=0;i<160;i++){const a=i*Math.PI/80;dot(frame,x+rx*Math.cos(a),y+ry*Math.sin(a),1.15,color,alpha);}}
function fillRect(frame,x,y,w,h,color,alpha=1){const c=rgb(color);for(let yy=Math.round(y*S);yy<Math.min(H,Math.round((y+h)*S));yy++)for(let xx=Math.max(0,Math.round(x*S));xx<Math.min(W,Math.round((x+w)*S));xx++){if(yy<0)continue;const i=(yy*W+xx)*3;for(let k=0;k<3;k++)frame[i+k]=frame[i+k]*(1-alpha)+c[k]*alpha;}}

const along=(points,p)=>{p=clamp(p,0,.999999);const n=Math.floor(p*(points.length-1)),q=p*(points.length-1)-n;return[mix(points[n][0],points[n+1][0],q),mix(points[n][1],points[n+1][1],q)];};
function oval(frame,x,y,rx,ry,angle,color,alpha=1){const c=rgb(color),ca=Math.cos(angle),sa=Math.sin(angle),r=Math.ceil(Math.max(rx,ry)*S);const cx=Math.round(x*S),cy=Math.round(y*S);
 for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const u=(dx*ca+dy*sa)/(rx*S),v=(-dx*sa+dy*ca)/(ry*S),d=u*u+v*v;if(d>1)continue;const xx=cx+dx,yy=cy+dy;if(xx<0||xx>=W||yy<0||yy>=H)continue;const light=.82+.18*Math.sqrt(1-d),i=(yy*W+xx)*3;for(let k=0;k<3;k++)frame[i+k]=frame[i+k]*(1-alpha)+c[k]*light*alpha;}}
function sperm(frame,x,y,heading,t,color=C.text,alpha=1,size=1,motion=1){const ca=Math.cos(heading),sa=Math.sin(heading),len=62*size;let prev=[x,y];
 for(let i=1;i<=22;i++){const q=i/22,side=Math.sin(q*9-t*6)*6*size*q*motion,px=x-ca*len*q-sa*side,py=y-sa*len*q+ca*side;line(frame,...prev,px,py,color,.65*size,alpha*(1-q*.35));prev=[px,py];}
 oval(frame,x,y,5.8*size,2.9*size,heading,color,alpha);oval(frame,x+ca*2*size,y+sa*2*size,2.3*size,1.5*size,heading,'#ffffff',alpha*.55);
}
function microState(t){const p=clamp((t-170)/33);let x;
 if(p<.25)x=mix(640,590,p/.25);else if(p<.5)x=mix(590,535,(p-.25)/.25);else x=mix(535,448,(p-.5)/.5);
 return {x,y:350,entered:p>=.5,insideCount:p>=.5?1:0,alpha:p>.88?mix(1,.12,(p-.88)/.12):1};}
function coatReaction(frame,t){const q=clamp((t-187)/14);if(!q)return;
 for(let i=0;i<22;i++){const a=-1.2+i/21*2.6;if(i/22>q)continue;const x=430+152*Math.cos(a),y=350+181*Math.sin(a);dot(frame,x,y,1.6,C.gold,.72);}
 for(let i=0;i<12;i++){const a=-1.1+i/11*2.4,x=410+124*Math.cos(a),y=350+142*Math.sin(a),q2=clamp((t-187-i*.35)/6);if(q2>0&&q2<1)dot(frame,x+q2*17,y+Math.sin(a)*q2*12,2,'#f7cf75',Math.sin(q2*Math.PI)*.8);}
}
function otherSperm(frame,scene,t){const rows=[[730,245,600,258],[760,447,600,440],[680,512,577,494],[754,180,624,204]];
 rows.forEach(([sx,sy,ex,ey],i)=>{let q=clamp((t-143-i*3)/44),alpha=.75,motion=1;
  if(scene.id==='others'){const local=t-scene.start;alpha=1-clamp((local-i*4)/12);motion=1-clamp((local-i*4)/10);}
  if(scene.id==='zygote')alpha=.0;
  const x=mix(sx,ex,q),y=mix(sy,ey,q),heading=Math.atan2(ey-sy,ex-sx);if(alpha>.02)sperm(frame,x,y,heading,t+i,C.muted,alpha,.72,motion);
 });
}
function frameFor(base,scene,t){const frame=Buffer.from(base),local=t-scene.start;
 if(OVERVIEW.has(scene.id)||scene.id==='tube'&&local<4){
  let start=0,span=1;if(scene.id==='entry'){start=0;span=.25;}else if(scene.id==='cervix'){start=.15;span=.27;}else if(scene.id==='uterus'){start=.35;span=.58;}else if(scene.id==='tube'){start=.9;span=.1;}
  if(['entry','cervix','uterus'].includes(scene.id)){
   for(let i=0;i<12;i++){const q=(local/(scene.id==='uterus'?19:15)+i/12)%1,p=start+span*q,[x0,y0]=along(PATH,p),next=along(PATH,clamp(p+.01)),spread=Math.sin(i*8)*((scene.id==='entry')?9:5);let alpha=.8;
    if(scene.id==='cervix'&&i>5)alpha*=1-clamp((q-.4)/.4);if(scene.id==='uterus'&&i>3)alpha*=1-clamp((q-.4)/.5);
    sperm(frame,x0+spread,y0,Math.atan2(next[1]-y0,next[0]-x0),t+i,C.muted,alpha,.28);
   }
   const p=start+span*clamp(local/(scene.end-scene.start)),[x,y]=along(PATH,p),[nx,ny]=along(PATH,clamp(p+.01));sperm(frame,x,y,Math.atan2(ny-y,nx-x),t,C.teal,1,.4);
  }
  if(['intro','anatomy','tube','recap'].includes(scene.id))ring(frame,...EGG_SITE,26,19,C.gold,.6+.2*Math.sin(local*2));
  if(scene.id==='anatomy')dot(frame,...EGG_SITE,5,C.gold);
 }else{
  otherSperm(frame,scene,t);
  if(scene.id==='others'){const q=clamp(local/18),alpha=q>.68?1-clamp((q-.68)/.32):1;sperm(frame,mix(943,1080,q),496,0,t,C.muted,alpha,.48,1-q);}
  if(scene.id==='tube'||scene.id==='layers')sperm(frame,mix(760,640,clamp((t-122)/48)),350,Math.PI,t,C.teal,1,1);
  if(scene.id==='fusion'){const state=microState(t);sperm(frame,state.x,state.y,Math.PI,t,C.teal,state.alpha,1,state.entered?.55:1);}
  if(['fusion','block','others','zygote'].includes(scene.id))coatReaction(frame,t);
  if(scene.id==='block'||scene.id==='others'||scene.id==='zygote'&&t<264){
   // Two pronuclei share one cell. Their envelopes do not fuse into one another.
   const p=clamp((t-203)/55);oval(frame,mix(365,393,p),337,19,21,0,'#79d7d9',.78);oval(frame,mix(474,446,p),360,19,21,0,'#f4ce6a',.78);
   ring(frame,mix(365,393,p),337,23,25,C.teal,.35);ring(frame,mix(474,446,p),360,23,25,C.gold,.35);
  }
 }
 fillRect(frame,35,713,Math.floor(1210*t/DURATION),4,C.teal);return frame;
}

function run(args){const r=spawnSync(FF,['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8',maxBuffer:2e6});if(r.status!==0)throw Error(r.stderr);}
function timestamp(t){const ms=Math.round(t*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;}
fs.writeFileSync(path.join(OUT,'fertilization.vtt'),'WEBVTT\n\n'+cues.map(c=>`${timestamp(c.start)} --> ${timestamp(c.end)}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(OUT,'fertilization.srt'),cues.map((c,i)=>`${i+1}\n${timestamp(c.start).replace('.',',')} --> ${timestamp(c.end).replace('.',',')}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(OUT,'transcript.txt'),story.map(s=>`${s.title}\n${s.narration.join(' ')}`).join('\n\n'));
fs.writeFileSync(path.join(OUT,'chapters.json'),JSON.stringify(story.map(({id,title,start,end})=>({id,title,start,end})),null,2));
(async()=>{
 if(process.argv.includes('--preview')){
  const tiles=[];for(let i=0;i<story.length;i++){const scene=story[i],t=scene.start+(scene.end-scene.start)*.65,cue=cues.find(c=>t>=c.start&&t<c.end),base=await sharp(Buffer.from(svg(cue,t))).removeAlpha().raw().toBuffer();const image=await sharp(frameFor(base,scene,t),{raw:{width:W,height:H,channels:3}}).png().toBuffer();await fs.promises.writeFile(path.join(WORK,`${scene.id}.png`),image);tiles.push({input:await sharp(image).resize(640,360).toBuffer(),left:i%3*640,top:Math.floor(i/3)*360});}
  await sharp({create:{width:1920,height:Math.ceil(story.length/3)*360,channels:3,background:'#0b1729'}}).composite(tiles).png().toFile(path.join(WORK,'storyboard.png'));console.log('Storyboard ready.');return;
 }
 const filters=cues.map((c,i)=>`[${i}:a]atempo=${c.tempo.toFixed(8)},apad,atrim=duration=${c.duration.toFixed(8)},asetpts=PTS-STARTPTS[a${i}]`).join(';')+';'+cues.map((_,i)=>`[a${i}]`).join('')+`concat=n=${cues.length}:v=0:a=1,alimiter=limit=0.92,apad,atrim=duration=300[a]`;
 run([...cues.flatMap(c=>['-i',c.file]),'-filter_complex',filters,'-map','[a]','-ar','48000','-ac','1',path.join(OUT,'narration.wav')]);
 const pending=path.join(OUT,'fertilization-grade7.rendering.mp4'),output=path.join(OUT,'fertilization-grade7-5min.mp4');
 const encoder=spawn(FF,['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0','-i',path.join(OUT,'narration.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t',String(DURATION),'-movflags','+faststart',pending],{stdio:['pipe','ignore','pipe']});
 let errors='';encoder.stderr.on('data',d=>errors+=d);const finished=once(encoder,'close');let current=-1,base,lastKey;
 for(let f=0;f<DURATION*FPS;f++){const t=f/FPS;let index=Math.max(0,current);while(index<cues.length-1&&t>=cues[index].end)index++;const key=index+'-'+stageKey(story[cues[index].chapter],t);if(key!==lastKey){lastKey=key;current=index;base=await sharp(Buffer.from(svg(cues[index],t))).removeAlpha().raw().toBuffer();}const frame=frameFor(base,story[cues[index].chapter],t);if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');if(f%(FPS*30)===0)console.log(`Rendered ${t} / 300 seconds`);}
 encoder.stdin.end();const[status]=await finished;if(status)throw Error(errors);fs.renameSync(pending,output);
 const pt=190,pcue=cues.find(c=>pt>=c.start&&pt<c.end),pbase=await sharp(Buffer.from(svg(pcue,pt))).removeAlpha().raw().toBuffer();await sharp(frameFor(pbase,story[pcue.chapter],pt),{raw:{width:W,height:H,channels:3}}).png().toFile(path.join(OUT,'poster.png'));console.log(output);
})().catch(e=>{console.error(e);process.exit(1);});
