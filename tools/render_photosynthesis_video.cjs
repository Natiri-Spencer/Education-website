/* Build a narrated summary; --one-minute includes every procedure step. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawn,spawnSync} = require('node:child_process');
const {once} = require('node:events');
const sharp = require('sharp');
const root=path.resolve(__dirname,'..');
const longVersion=process.argv.includes('--one-minute');
const duration=longVersion?60:20;
const suffix=longVersion?'60s':'20s';
const work=path.join(root,longVersion?'tmp/photosynthesis-video-60s':'tmp/photosynthesis-video');
const output=path.join(root,'exports/photosynthesis');
const ffmpeg=path.join(root,'Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const context={window:{}};vm.createContext(context);
for(const name of ['photosynthesis_model.js','photosynthesis_visuals.js'])vm.runInContext(fs.readFileSync(path.join(root,'educations/static/educations',name),'utf8'),context);
const slots=longVersion?[10,4,5.5,4.5,7.5,11.5,4.5,12.5]:[4.5,2.5,4.5,4,4.5];
const titles=longVersion?['Destarch · 48 hours','Cover both leaf surfaces','Expose to sunlight','Remove leaf and paper','Heat the leaf in water','Remove chlorophyll with ethanol','Rinse and soften','Iodine: compare both areas']:['Destarch and cover','Expose to sunlight','Prepare the starch test','Rinse and add iodine','Compare the evidence'];
const captions=longVersion?[
 ['48 HOURS IN DARKNESS: no photosynthesis.','Respiration uses stored food, reducing existing starch.'],
 ['Cover the middle strip on BOTH surfaces.','Opaque black paper blocks light; clips hold it in place.'],
 ['Place the plant in good light for several hours.','The exposed areas receive light; the covered strip does not.'],
 ['Detach the leaf with forceps and remove the paper.','Remember where the covered strip was.'],
 ['HOT WATER: kills tissue and stops chemical reactions.','It also helps testing solutions penetrate the leaf.'],
 ['ETHANOL removes chlorophyll, making iodine colours visible.','Use a hot-water bath: ethanol is flammable. No naked flame.'],
 ['Rinse the leaf in warm water to soften it.','Spread it flat on a white tile for a clear colour comparison.'],
 ['BLUE-BLACK: starch present. YELLOW-BROWN: no starch detected.','Light is needed for starch production in this green leaf.']
]:[
 ['Destarch the plant; cover BOTH sides','of the middle strip with black paper.'],
 ['Expose the plant to sunlight.','Only uncovered areas receive light.'],
 ['Hot water → ethanol in a hot-water bath.','Ethanol removes the green chlorophyll.'],
 ['Rinse the leaf, then add iodine.','Exposed areas turn blue-black.'],
 ['Covered strip: yellow-brown. Exposed areas: blue-black.','Light is needed for starch production.']
];
const lines=fs.readFileSync(path.join(output,longVersion?'narration-60s.txt':'narration.txt'),'utf8').trim().split(/\r?\n/);
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function run(args){const result=spawnSync(ffmpeg,['-y','-hide_banner','-loglevel','error',...args],{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);}
function wavDuration(file){const b=fs.readFileSync(file);let rate=0;for(let i=12;i+8<=b.length;){const label=b.toString('ascii',i,i+4),size=b.readUInt32LE(i+4);if(label==='fmt ')rate=b.readUInt32LE(i+16);if(label==='data')return size/rate;i+=8+size+(size%2);}throw Error('Invalid WAV');}
fs.mkdirSync(output,{recursive:true});
for(let i=0;i<slots.length;i++){
 const input=path.join(work,`narration-${i}.wav`),duration=wavDuration(input);
 const tempo=Math.max(1,duration/(slots[i]-.08));
 run(['-i',input,'-af',`atempo=${tempo.toFixed(6)},apad,atrim=duration=${slots[i]},afade=t=out:st=${slots[i]-.045}:d=0.045`,'-ar','48000','-ac','1',path.join(work,`timed-${i}.wav`)]);
}
run([...Array.from({length:slots.length},(_,i)=>['-i',path.join(work,`timed-${i}.wav`)]).flat(),'-filter_complex',Array.from({length:slots.length},(_,i)=>`[${i}:a]`).join('')+`concat=n=${slots.length}:v=0:a=1,alimiter=limit=0.92[a]`,'-map','[a]',path.join(work,`narration-${suffix}.wav`)]);
function sceneAt(t){
 let index=0,start=0;while(index<slots.length-1&&t>=start+slots[index])start+=slots[index++];
 const local=t-start,p=local/slots[index];let stage,progress;
 if(longVersion){stage=index+1;progress=Math.min(1,p/.75);}
 else {
 if(index===0){stage=local<1.7?1:2;progress=local<1.7?local/1.7:(local-1.7)/(slots[0]-1.7);}
 if(index===1){stage=3;progress=p;}
 if(index===2){stage=local<1.2?5:6;progress=local<1.2?local/1.2:(local-1.2)/(slots[2]-1.2);}
 if(index===3){stage=local<1?7:8;progress=local<1?local:(local-1)/(slots[3]-1);}
 if(index===4){stage=8;progress=1;}
 }
 const simulation=context.window.PhotosynthesisVisuals.scene({stage,progress,preparing:false,running:progress<1});
 const progressWidth=1168*Math.min(1,t/duration);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="#0c172a"/><g font-family="Arial,sans-serif"><text x="56" y="44" fill="#b5ed61" font-size="15" letter-spacing="2">GRADE 9 · INTEGRATED SCIENCE</text><text x="56" y="87" fill="#f3f7ff" font-size="31" font-weight="700">Does a leaf need light to make starch?</text><text x="1224" y="44" fill="#b9cee3" font-size="16" text-anchor="end">${index+1} / ${slots.length} · ${escape(titles[index])}</text><rect x="56" y="108" width="1168" height="438" rx="16" fill="#11243a"/><svg x="256" y="111" width="768" height="435" viewBox="0 0 900 510">${simulation}</svg><rect x="56" y="562" width="1168" height="107" rx="14" fill="#1a334b"/><text x="640" y="600" fill="#f3f7ff" font-size="24" font-weight="700" text-anchor="middle">${escape(captions[index][0])}</text><text x="640" y="636" fill="${index===slots.length-1?'#b5ed61':'#c8d9e9'}" font-size="24" text-anchor="middle">${escape(captions[index][1])}</text><text x="56" y="695" fill="#9fb7d1" font-size="14">${(longVersion?index===5:index===2)?'ETHANOL: use a hot-water bath; never a naked flame.':'Virtual demonstration · Experiment times are compressed.'}</text><text x="1224" y="695" fill="#9fb7d1" font-size="14" text-anchor="end">${Math.min(duration,Math.floor(t)).toString().padStart(2,'0')} / ${duration} sec</text><rect x="56" y="708" width="1168" height="4" rx="2" fill="#263e58"/><rect x="56" y="708" width="${progressWidth}" height="4" rx="2" fill="#b5ed61"/></g></svg>`;
}
function vttTime(seconds){return `00:${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toFixed(3).padStart(6,'0')}`;}
let start=0;fs.writeFileSync(path.join(output,`photosynthesis-light-${suffix}.vtt`),'WEBVTT\n\n'+slots.map((duration,i)=>{const cue=`${vttTime(start)} --> ${vttTime(start+duration)}\n${lines[i]}\n`;start+=duration;return cue;}).join('\n'));
(async()=>{
 const video=path.join(output,`photosynthesis-light-${suffix}.mp4`);
 const encoder=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s','1280x720','-r','24','-i','pipe:0','-i',path.join(work,`narration-${suffix}.wav`),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t',String(duration),'-movflags','+faststart',video],{stdio:['pipe','ignore','pipe']});
 let errors='';encoder.stderr.on('data',chunk=>errors+=chunk);const finished=once(encoder,'close');
 for(let frame=0;frame<duration*24;frame++){
  const svg=Buffer.from(sceneAt(frame/24));
  const raw=await sharp(svg).removeAlpha().raw().toBuffer();
  if(!encoder.stdin.write(raw))await once(encoder.stdin,'drain');
  if(frame%120===0)console.log(`Rendered ${frame/24} seconds`);
 }
 encoder.stdin.end();const [status]=await finished;if(status)throw Error(errors);
 await sharp(Buffer.from(sceneAt(duration-2))).png().toFile(path.join(output,`photosynthesis-poster-${suffix}.png`));
 console.log(video);
})().catch(error=>{console.error(error);process.exit(1)});
