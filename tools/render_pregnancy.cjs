/* Grade 7 implantation and pregnancy: deterministic 1080p anatomical animation. */
const fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process'),{once}=require('node:events');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const story=require('./pregnancy_story.json');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'exports/pregnancy'),WORK=path.join(ROOT,'tmp/pregnancy');
const FF=path.join(ROOT,'Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const W=1920,H=1080,FPS=24,DURATION=300;
fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(WORK,{recursive:true});
const C={bg:'#0b1729',panel:'#142b43',text:'#edf5ff',muted:'#b9cedf',teal:'#65dbd0',gold:'#f4ce6a',pink:'#f2a9b8'};
const canvas=createCanvas(W,H),g=canvas.getContext('2d');
let art={};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,p)=>a+(b-a)*p;
function text(s,x,y,size=18,color=C.text,align='left'){g.font=`${size>=27?'600 ':''}${size}px Arial`;g.fillStyle=color;g.textAlign=align;g.fillText(s,x,y);}
function wrap(s,width,size=18){g.font=`${size}px Arial`;let line='',lines=[];for(const word of s.split(/\s+/)){const next=line?line+' '+word:word;if(g.measureText(next).width>width&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
function block(s,x,y,width,size=18,color=C.text,leading=26){wrap(s,width,size).forEach((s,i)=>text(s,x,y+i*leading,size,color));}
function rect(x,y,w,h,fill=C.panel,r=12){g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();}
function ellipse(x,y,rx,ry,fill,stroke=null,width=1){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
function line(points,color=C.muted,width=1.5){g.beginPath();g.moveTo(...points[0]);points.slice(1).forEach(p=>g.lineTo(...p));g.strokeStyle=color;g.lineWidth=width;g.stroke();}
function label(s,x,y,px,py,color=C.text){line([[px,py],[x+8,y-5]],color,1);ellipse(px,py,2.5,2.5,C.gold);const width=wrap(s,250,15)[0].length*8;rect(x-6,y-20,width+15,29,'#0b1729',5);text(s,x,y,15,color);}
function picture(image,x,y,w,h){g.drawImage(image,x,y,w,h);}
function duration(file){const b=fs.readFileSync(file);let rate;for(let i=12;i+8<=b.length;){const name=b.toString('ascii',i,i+4),n=b.readUInt32LE(i+4);if(name==='fmt ')rate=b.readUInt32LE(i+16);if(name==='data')return n/rate;i+=8+n+n%2;}throw Error('Invalid WAV');}
const cues=[];
story.forEach((s,i)=>{const voice=s.narration.map((text,j)=>({text,file:path.join(WORK,`voice-${i}-${j}.wav`),chapter:i}));voice.forEach(c=>c.raw=duration(c.file));const raw=voice.reduce((a,c)=>a+c.raw,0),span=s.end-s.start,tempo=Math.max(.85,raw/(span-.5*voice.length));if(tempo>1.3)throw Error(`Narration too fast: ${s.id} ${tempo}`);let t=s.start;for(const c of voice){c.tempo=tempo;c.start=t;c.duration=c.raw/tempo+.5;t+=c.duration;c.end=t;cues.push(c);}cues.at(-1).end=s.end;cues.at(-1).duration=s.end-cues.at(-1).start;console.log(`${s.id}: ${span}s, tempo ${tempo.toFixed(2)}`);});
const stamp=t=>{let n=Math.round(t*1000);return `${String(Math.floor(n/3600000)).padStart(2,'0')}:${String(Math.floor(n/60000)%60).padStart(2,'0')}:${String(Math.floor(n/1000)%60).padStart(2,'0')}.${String(n%1000).padStart(3,'0')}`;};
fs.writeFileSync(path.join(OUT,'pregnancy.vtt'),'WEBVTT\n\n'+cues.map(c=>`${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(OUT,'pregnancy.srt'),cues.map((c,i)=>`${i+1}\n${stamp(c.start).replace('.',',')} --> ${stamp(c.end).replace('.',',')}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(OUT,'transcript.txt'),story.map(s=>s.title+'\n'+s.narration.join(' ')).join('\n\n'));
fs.writeFileSync(path.join(OUT,'chapters.json'),JSON.stringify(story.map(({id,title,start,end})=>({id,title,start,end})),null,2));
function cell(x,y,r,color='#efc693'){const grad=g.createRadialGradient(x-r*.3,y-r*.35,1,x,y,r);grad.addColorStop(0,'#ffedc9');grad.addColorStop(.65,color);grad.addColorStop(1,'#b77673');ellipse(x,y,r,r,grad,'#ffe2bf',1.2);ellipse(x-2,y+1,r*.23,r*.26,'#a17b9d');}
function blastocyst(x,y,r,t,coat=false){ellipse(x,y,r,r,'#9e795342','#f4c27d',2);for(let i=0;i<26;i++){const a=i*Math.PI/13;cell(x+Math.cos(a)*r*.94,y+Math.sin(a)*r*.94,r*.13,'#e8a290');}for(let i=0;i<12;i++){const a=i*2.4,rr=Math.sqrt(i/12)*r*.32;cell(x-r*.38+Math.cos(a)*rr,y+r*.38+Math.sin(a)*rr,r*.145,'#c58fac');}if(coat){g.beginPath();g.ellipse(x,y,r*1.15,r*1.15,0,.2+clamp(t/20)*1.3,Math.PI*2);g.strokeStyle='#d8c3a7';g.lineWidth=4;g.stroke();}}
const route=[[173,85],[217,83],[282,106],[370,144],[467,169],[559,186],[658,240],[730,325],[767,421]].map(([x,y])=>[100+x*675/1536,130+y*675/1536]);
function along(p){p=clamp(p,0,.99999);const z=p*(route.length-1),i=Math.floor(z),q=z-i;return[mix(route[i][0],route[i+1][0],q),mix(route[i][1],route[i+1][1],q)];}
function organOverview(scene,t){picture(art.anatomy,100,130,675,450);label('Fallopian tube',60,172,195,170);label('Uterus',690,310,440,300);label('Uterine lining',575,450,443,338);label('Cervix',650,515,440,375);label('Vagina',650,560,440,476);const local=t-scene.start;
 if(scene.id==='journey'){const p=clamp(local/22),[x,y]=along(p);ellipse(x,y,14,14,'#17384a','#f4ce6a',1.5);let n=p<.3?1:p<.55?2:p<.78?4:8;for(let i=0;i<n;i++){const a=i*Math.PI*2/n;cell(x+(n===1?0:Math.cos(a)*7),y+(n===1?0:Math.sin(a)*7),n===1?8:4.5);}text(n===1?'Zygote':`${n} cells · enlarged marker`,70,558,18,C.gold);}
 else {ellipse(440,305,15+Math.sin(t*1.4)*2,15,'#65dbd022',C.teal,2);text('The uterus is also called the womb.',70,558,19,C.gold);}}
function microscope(scene,t){const local=t-scene.start;
 if(scene.id==='implantation'&&local>20){const z=1+.025*Math.sin(local*.08);g.save();g.translate(438,350);g.scale(z,z);picture(art.implant,-402,-268,804,536);g.restore();label('Blastocyst',525,178,500,283);label('Uterine lining',70,530,290,485);label('Inner cells',85,250,332,339,C.teal);return;}
 const tissue=g.createLinearGradient(0,398,0,585);tissue.addColorStop(0,'#ecb0b3');tissue.addColorStop(.12,'#cd7c91');tissue.addColorStop(1,'#663b58');rect(36,408,803,177,tissue,0);
 for(let i=0;i<32;i++){ellipse(48+i*25,419+Math.sin(i)*3,12,20,'#d5849c','#f1b4bd',.7);ellipse(48+i*25,424+Math.sin(i)*3,3.5,6,'#9b5678');}
 for(let i=0;i<8;i++){g.beginPath();g.moveTo(70+i*105,590);g.bezierCurveTo(40+i*105,534,120+i*105,513,85+i*105,467);g.strokeStyle='#bd5c79';g.lineWidth=6;g.stroke();}
 const q=scene.id==='implantation'?clamp(local/17):0,y=mix(285,423,q);blastocyst(440,y,66,t,scene.id==='blastocyst');
 if(scene.id==='implantation'){g.save();g.globalAlpha=q;for(let i=0;i<6;i++){line([[408+i*12,y+45],[400+i*14,480+Math.sin(i)*7]],'#edb08f',3);}g.restore();text(q<.4?'APPROACH':q<.8?'ATTACH':'EMBED IN THE LINING',68,166,19,C.gold);}
 else {label('Outer cells',620,222,494,245,C.gold);label('Fluid-filled space',72,240,444,275);label('Inner cells',95,350,418,309,C.teal);text('Microscopic view · cells are enlarged',68,166,17,C.gold);}
 label('Uterine lining',600,550,620,456);}
function uterus(scene,t,imageKey){const local=t-scene.start;
 const z=1+.012*Math.sin(local*.1);g.save();g.translate(437,350);g.scale(z,z);picture(art.pregnant,-337,-220,675,450);g.restore();
 label('Placenta',65,225,328,228,C.pink);label('Umbilical cord',65,333,432,282,C.gold);label('Uterus wall',658,220,590,275);label('Amniotic fluid',645,420,548,380,C.teal);label('Cervix',650,552,444,507);
 text('Late pregnancy · anatomical teaching view',64,164,17,C.gold);
 if(scene.id==='placenta'){
  const points=[[359,240],[375,261],[392,280],[416,288],[444,305],[470,309]];
  const point=q=>{const n=q*(points.length-1),i=Math.min(points.length-2,Math.floor(n)),p=n-i;return[mix(points[i][0],points[i+1][0],p),mix(points[i][1],points[i+1][1],p)];};
  for(let i=0;i<5;i++){let q=(local*.13+i/5)%1;let[x,y]=point(q);ellipse(x,y-2.5,2.7,2.7,C.teal);[x,y]=point(1-q);ellipse(x,y+3,2.7,2.7,C.gold);}text('Teal: towards baby     Gold: towards placenta',65,571,15,C.teal);
 }
 if(scene.id==='protection'){label('Amniotic sac',650,470,525,425,C.teal);}
 if(scene.id==='third'){label('Head-down',65,466,407,410,C.gold);}
}
function fetalCloseup(scene,t){const local=t-scene.start,z=1+clamp(local/26)*.04,key=scene.id==='first'?'f12':scene.id==='second'?'f20':'f8';g.save();g.translate(435,346);g.scale(z,z);picture(art[key],-176,-176,352,352);g.restore();if(key==='f8'){label('Early head region',60,205,495,245);label('Limb buds',70,420,425,337);}else {text('DEVELOPMENTAL CLOSE-UP',65,165,16,C.teal);label('Developing limbs',65,458,407,382);}const age={f8:8,f12:12,f20:20}[key];text(`${key==='f8'?'Embryo':'Fetus'} · around ${age} pregnancy weeks`,435,559,20,C.gold,'center');}
function timeline(t){const p=clamp((t-259)/16),week=p*40;const x=88,y=305,w=690;const colours=['#b987c9','#65c9bc','#e6bf6b'];const bounds=[0,13,28,40];for(let i=0;i<3;i++){rect(x+bounds[i]/40*w,y,(bounds[i+1]-bounds[i])/40*w-2,48,colours[i],5);text(['FIRST','SECOND','THIRD'][i],x+(bounds[i]+bounds[i+1])/80*w,y+31,17,'#102138','center');}for(let n=0;n<=40;n+=4){const xx=x+n/40*w;line([[xx,y+51],[xx,y+60]],C.muted);text(String(n),xx,y+82,16,C.muted,'center');}line([[x+week/40*w,y-15],[x+week/40*w,y+50]],C.text,3);text('Pregnancy weeks: counted from the last menstrual period',435,228,22,C.text,'center');text('Fertilisation usually occurs about two weeks into this count.',435,428,19,C.gold,'center');text('40 pregnancy weeks ≈ 38 weeks after fertilisation',435,482,23,C.teal,'center');text('About nine months · individual timing varies',435,529,20,C.muted,'center');}
function side(scene,t,cue){text('LEARNING FOCUS',885,156,13,C.teal);block(scene.focus,885,190,330,22,C.text,28);scene.notes.forEach((s,i)=>block(s,885,285+i*70,326,17,i===0?C.gold:C.muted,24));rect(881,490,343,76,'#0c2036');const review=scene.id==='review'&&cue.text.startsWith('Check:');block(review?'Uterine lining · exchange · about 40 weeks':scene.id==='implantation'?'Implantation is gradual, over several days.':scene.id==='placenta'?'Exchange across the placenta; two blood supplies.':'Watch the labels. Explain each stage in your own words.',895,516,312,16,C.teal,23);}
function render(t){let index=cues.findIndex(c=>t>=c.start&&t<c.end);if(index<0)index=cues.length-1;const cue=cues[index],scene=story[cue.chapter];g.resetTransform();g.fillStyle=C.bg;g.fillRect(0,0,W,H);g.scale(1.5,1.5);
 text('CBE STEM ACADEMY · GRADE 7 INTEGRATED SCIENCE',35,30,14,C.teal);text(`${cue.chapter+1} / ${story.length}`,1245,30,14,C.muted,'right');text(scene.title,35,75,30);text('LIVING THINGS AND ENVIRONMENT · HUMAN DEVELOPMENT',35,105,13,C.muted);rect(35,125,805,460,'#102138');rect(860,125,385,460);g.save();g.beginPath();g.roundRect(36,126,803,458,11);g.clip();
 if(['intro','journey','review'].includes(scene.id))organOverview(scene,t);else if(['blastocyst','implantation'].includes(scene.id))microscope(scene,t);else if(['embryo','first','second'].includes(scene.id))fetalCloseup(scene,t);else if(scene.id==='gestation')timeline(t);else uterus(scene,t);g.restore();side(scene,t,cue);
 rect(35,601,1210,83);const caption=wrap(cue.text,1150,21);if(caption.length>3)throw Error('Caption overflow');const y=643-(caption.length-1)*13;caption.forEach((s,i)=>text(s,640,y+i*26,21,C.text,'center'));
 text('Teaching model: sizes and timing simplified. Original anatomical teaching illustrations.',35,705,10,C.muted);text('Sources: NIH / NICHD · NHS · OWH',1245,705,10,C.muted,'right');rect(35,713,1210,4,'#294057',0);rect(35,713,1210*t/300,4,C.teal,0);
}
function run(args){const r=spawnSync(FF,['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8',maxBuffer:2e6});if(r.status!==0)throw Error(r.stderr);}
(async()=>{
 const mapping={anatomy:'female-reproductive-anatomy.png',pregnant:'pregnant-uterus-cutaway.png',implant:'implantation-cutaway.png',f8:'embryo-8-weeks.png',f12:'fetus-12-weeks.png',f20:'fetus-20-weeks.png'};
 for(const[key,file]of Object.entries(mapping))art[key]=await loadImage(path.join(OUT,'assets',file));
 if(process.argv.includes('--preview')){const sharp=require('sharp'),tiles=[];for(let i=0;i<story.length;i++){const s=story[i],t=s.start+(s.end-s.start)*.65;render(t);const png=canvas.toBuffer('image/png');fs.writeFileSync(path.join(WORK,s.id+'.png'),png);tiles.push({input:await sharp(png).resize(640,360).toBuffer(),left:i%3*640,top:Math.floor(i/3)*360});}await sharp({create:{width:1920,height:1440,channels:3,background:C.bg}}).composite(tiles).png().toFile(path.join(WORK,'storyboard.png'));return;}
 const filters=cues.map((c,i)=>`[${i}:a]atempo=${c.tempo.toFixed(8)},apad,atrim=duration=${c.duration.toFixed(8)},asetpts=PTS-STARTPTS[a${i}]`).join(';')+';'+cues.map((_,i)=>`[a${i}]`).join('')+`concat=n=${cues.length}:v=0:a=1,alimiter=limit=0.92,apad,atrim=duration=300[a]`;
 run([...cues.flatMap(c=>['-i',c.file]),'-filter_complex',filters,'-map','[a]','-ar','48000','-ac','1',path.join(OUT,'narration.wav')]);
 const pending=path.join(OUT,'pregnancy-grade7.rendering.mp4'),output=path.join(OUT,'pregnancy-grade7-5min.mp4');
 const encoder=spawn(FF,['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0','-i',path.join(OUT,'narration.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t','300','-movflags','+faststart',pending],{stdio:['pipe','ignore','pipe']});
 let errors='';encoder.stderr.on('data',d=>errors+=d);encoder.stdin.on('error',()=>{});const finished=once(encoder,'close');
 for(let f=0;f<300*FPS;f++){render(f/FPS);if(!encoder.stdin.write(canvas.data()))await once(encoder.stdin,'drain');if(f%(30*FPS)===0)console.log(`Rendered ${f/FPS} / 300 seconds`);}
 encoder.stdin.end();const[status]=await finished;if(status)throw Error(errors);fs.renameSync(pending,output);render(141);fs.writeFileSync(path.join(OUT,'poster.png'),canvas.toBuffer('image/png'));console.log(output);
})().catch(e=>{console.error(e);process.exit(1);});
