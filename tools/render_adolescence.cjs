/* Grade 7 physical changes during adolescence: deterministic 1080p anatomical animation. */
const fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process'),{once}=require('node:events');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const story=require('./adolescence_story.json');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'exports/adolescence'),WORK=path.join(ROOT,'tmp/adolescence');
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
fs.writeFileSync(path.join(OUT,'adolescence.vtt'),'WEBVTT\n\n'+cues.map(c=>`${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(OUT,'adolescence.srt'),cues.map((c,i)=>`${i+1}\n${stamp(c.start).replace('.',',')} --> ${stamp(c.end).replace('.',',')}\n${c.text}\n`).join('\n'));
fs.writeFileSync(path.join(OUT,'transcript.txt'),story.map(s=>s.title+'\n'+s.narration.join(' ')).join('\n\n'));
fs.writeFileSync(path.join(OUT,'chapters.json'),JSON.stringify(story.map(({id,title,start,end})=>({id,title,start,end})),null,2));

const drawVisual=require('./adolescence_visuals.cjs')({g,art,C,clamp,mix,text,block,rect,ellipse,line,label,picture});
function side(scene,t,cue){
 text('LEARNING FOCUS',885,156,13,C.teal);block(scene.focus,885,190,330,22,C.text,28);
 scene.notes.forEach((s,i)=>block(s,885,285+i*70,326,17,i===0?C.gold:C.muted,24));
 rect(881,490,343,76,'#0c2036');
 block(scene.id==='review'&&cue.text.startsWith('Check:')?'Growth, body hair, regular washing and different timing.':scene.id==='timing'?'Different bodies. Different timing. Equal respect.':scene.id==='periods'?'A period is not an illness or a sign of being unclean.':'Learn the science. Respect privacy. Ask when you need support.',895,516,312,16,C.teal,23);
}
function render(t){
 let index=cues.findIndex(c=>t>=c.start&&t<c.end);if(index<0)index=cues.length-1;
 const cue=cues[index],scene=story[cue.chapter];g.resetTransform();g.fillStyle=C.bg;g.fillRect(0,0,W,H);g.scale(1.5,1.5);
 text('CBE STEM ACADEMY · GRADE 7 INTEGRATED SCIENCE',35,30,14,C.teal);text(`${cue.chapter+1} / ${story.length}`,1245,30,14,C.muted,'right');text(scene.title,35,75,30);text('LIVING THINGS AND ENVIRONMENT · VIDEO 5 · ADOLESCENCE',35,105,13,C.muted);
 rect(35,125,805,460,'#102138');rect(860,125,385,460);g.save();g.beginPath();g.roundRect(36,126,803,458,11);g.clip();drawVisual(scene,t);g.restore();side(scene,t,cue);
 rect(35,601,1210,83);const caption=wrap(cue.text,1150,21);if(caption.length>3)throw Error('Caption overflow');const y=643-(caption.length-1)*13;caption.forEach((s,i)=>text(s,640,y+i*26,21,C.text,'center'));
 text('Teaching diagrams: changes are gradual, proportions illustrative, and individual bodies vary.',35,705,10,C.muted);text('References: NIH · NHS · Sydney Children’s Hospitals · UNICEF',1245,705,10,C.muted,'right');rect(35,713,1210,4,'#294057',0);rect(35,713,1210*t/300,4,C.teal,0);
}
function run(args){const r=spawnSync(FF,['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8',maxBuffer:2e6});if(r.status!==0)throw Error(r.stderr);}
(async()=>{
 const mapping={anatomy:'female-reproductive-anatomy.png'};
 for(const[key,file]of Object.entries(mapping))art[key]=await loadImage(path.join(OUT,'assets',file));
 if(process.argv.includes('--preview')){const sharp=require('sharp'),tiles=[];for(let i=0;i<story.length;i++){const s=story[i],t=s.start+(s.end-s.start)*.65;render(t);const png=canvas.toBuffer('image/png');fs.writeFileSync(path.join(WORK,s.id+'.png'),png);tiles.push({input:await sharp(png).resize(640,360).toBuffer(),left:i%3*640,top:Math.floor(i/3)*360});}await sharp({create:{width:1920,height:1440,channels:3,background:C.bg}}).composite(tiles).png().toFile(path.join(WORK,'storyboard.png'));return;}
 const filters=cues.map((c,i)=>`[${i}:a]atempo=${c.tempo.toFixed(8)},apad,atrim=duration=${c.duration.toFixed(8)},asetpts=PTS-STARTPTS[a${i}]`).join(';')+';'+cues.map((_,i)=>`[a${i}]`).join('')+`concat=n=${cues.length}:v=0:a=1,alimiter=limit=0.92,apad,atrim=duration=300[a]`;
 run([...cues.flatMap(c=>['-i',c.file]),'-filter_complex',filters,'-map','[a]','-ar','48000','-ac','1',path.join(OUT,'narration.wav')]);
 const pending=path.join(OUT,'adolescence-grade7.rendering.mp4'),output=path.join(OUT,'adolescence-grade7-5min.mp4');
 const encoder=spawn(FF,['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0','-i',path.join(OUT,'narration.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t','300','-movflags','+faststart',pending],{stdio:['pipe','ignore','pipe']});
 let errors='';encoder.stderr.on('data',d=>errors+=d);encoder.stdin.on('error',()=>{});const finished=once(encoder,'close');
 for(let f=0;f<300*FPS;f++){render(f/FPS);if(!encoder.stdin.write(canvas.data()))await once(encoder.stdin,'drain');if(f%(30*FPS)===0)console.log(`Rendered ${f/FPS} / 300 seconds`);}
 encoder.stdin.end();const[status]=await finished;if(status)throw Error(errors);fs.renameSync(pending,output);render(12);fs.writeFileSync(path.join(OUT,'poster.png'),canvas.toBuffer('image/png'));console.log(output);
})().catch(e=>{console.error(e);process.exit(1);});
