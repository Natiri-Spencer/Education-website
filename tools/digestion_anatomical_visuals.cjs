/* Human anatomical artwork with separately authored, editable teaching labels. */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../exports/digestion/anatomy');
const {tx,esc,P}=require('./digestion_visuals.cjs');
const assets={
 full:'human-digestive-system.png',upper:'upper-digestive-organs.png',mouth:'mouth-and-throat.png',
 villus:'intestinal-villus.png',colon:'colon-and-microbiome.png',rectum:'rectum-and-anal-canal.png'
};
const images=Object.fromEntries(Object.entries(assets).map(([key,name])=>[key,'data:image/png;base64,'+fs.readFileSync(path.join(ROOT,name)).toString('base64')]));
function callout(x,y,px,py,label,color='#f5f7fb'){
 const width=Math.max(70,label.length*7.7+18),left=x;
 return `<path d="M${px} ${py}L${x+width/2} ${y+10}" fill="none" stroke="#c5d9e8" stroke-width="1.3"/><circle cx="${px}" cy="${py}" r="2.6" fill="${color}"/><rect x="${left}" y="${y-5}" width="${width}" height="25" rx="5" fill="#07182a" fill-opacity=".86"/>${tx(left+9,y+12,label,13,color)}`;
}
const image=(key)=>`<image href="${images[key]}" x="0" y="0" width="750" height="400" preserveAspectRatio="xMidYMid meet"/>`;
function dotsChain(x,y,n,color){return Array.from({length:n},(_,i)=>`<circle cx="${x+i*16}" cy="${y}" r="4.5" fill="${color}"/>`).join('');}
function reaction(kind){
 const box='<rect x="27" y="319" width="696" height="67" rx="9" fill="#07182a" fill-opacity=".94" stroke="#537088"/>';
 if(kind==='carbohydrate')return box+tx(43,340,'PANCREATIC AMYLASE',12,P.blue)+dotsChain(60,363,9,P.gold)+tx(224,368,'→',23)+tx(265,340,'Maltose / maltotriose / dextrins',13,P.gold)+dotsChain(290,364,2,P.gold)+dotsChain(350,364,3,P.gold)+dotsChain(430,364,4,P.gold);
 if(kind==='protein')return box+tx(43,340,'PANCREATIC PROTEASES',12,P.purple)+dotsChain(60,363,9,P.purple)+tx(224,368,'→',23)+dotsChain(279,363,3,P.purple)+dotsChain(355,363,2,P.purple)+tx(414,368,'→',23)+tx(463,368,'amino acids',16,P.purple);
 if(kind==='fat')return box+tx(43,340,'LIPASE + BILE-SALT EMULSIFICATION',12,P.gold)+tx(46,367,'Triglycerides → fatty acids + monoglycerides',15,P.gold)+tx(452,342,'RNase / DNase',13,P.blue)+tx(452,369,'RNA / DNA → nucleotides',14,P.blue);
 return '';
}
function fullLabels(ileum=false){
 let s=callout(15,53,350,28,'Mouth')+callout(10,103,377,106,'Oesophagus')+callout(10,173,330,183,'Liver')+callout(10,225,326,204,'Gallbladder',P.green)+callout(565,128,410,187,'Stomach')+callout(565,185,385,225,'Pancreas',P.gold)+callout(565,245,372,276,'Small intestine')+callout(565,300,430,264,'Colon')+callout(565,355,368,353,'Rectum / anus');
 if(ileum)s+=callout(20,324,360,312,'Ileum',P.green)+callout(20,367,307,300,'Ileocaecal region',P.green);
 return s;
}
function anatomy(id){
 if(id==='overview')return image('full')+fullLabels(false);
 if(['mouth','swallow'].includes(id))return image('mouth')+callout(10,59,275,110,'Teeth')+callout(10,120,296,138,'Tongue')+callout(10,202,280,176,'Salivary glands',P.blue)+callout(565,65,385,110,'Pharynx')+callout(565,134,373,166,'Epiglottis',P.green)+callout(565,235,429,276,'Oesophagus',P.gold)+callout(565,304,388,276,'Trachea: airway',P.blue);
 if(['stomach','duodenum','carbohydrate','protein','fat'].includes(id)){
  let s=image('upper')+callout(20,30,275,80,'Liver')+callout(10,180,211,196,'Gallbladder',P.green)+callout(585,45,551,183,'Stomach')+callout(585,280,488,302,'Pancreas',P.gold)+callout(10,285,296,340,'Duodenum');
  if(id==='stomach')s+=callout(628,145,540,164,'Gastric folds')+callout(190,253,360,208,'Pylorus');
  if(id==='duodenum')s+=callout(284,363,302,260,'Bile / pancreatic ducts',P.green);
  return s+reaction(id);
 }
 if(['villi','brush','absorption','ileum'].includes(id)){
  let s=image('villus')+callout(528,39,383,35,'Microvilli',P.pink)+callout(520,124,418,155,'Epithelial layer')+callout(520,205,376,210,'Blood capillaries',P.red)+callout(520,284,345,230,'Central lacteal',P.green);
  if(id==='ileum')s+='<rect x="14" y="12" width="166" height="193" rx="8" fill="#07182a" stroke="#537088"/><svg x="24" y="18" width="145" height="167" viewBox="230 0 300 400">'+image('full')+'<ellipse cx="360" cy="312" rx="47" ry="30" fill="none" stroke="#b5ed61" stroke-width="5"/></svg>'+tx(29,197,'Location: ileum',11,P.green);
  if(id==='brush')s+=callout(37,11,126,240,'Enzymes at brush border',P.blue);
  if(id==='absorption')s+='<rect x="498" y="337" width="244" height="58" rx="7" fill="#07182a" fill-opacity=".94"/>'+tx(512,357,'Sugars + amino acids → blood',13,P.blue)+tx(512,379,'Most long-chain fat → lymph',13,P.gold);
  return s;
 }
 if(id==='colon')return image('colon')+callout(12,20,200,110,'Colon wall')+callout(11,300,237,191,'Undigested remains',P.gold)+callout(470,5,583,64,'Magnified bacteria',P.purple)+callout(530,140,575,127,'Mucus layer')+callout(520,235,570,255,'Crypts: no villi')+callout(500,357,575,309,'Blood capillaries',P.red);
 if(id==='egestion')return image('rectum')+callout(16,47,317,47,'Sigmoid colon')+callout(20,139,399,157,'Rectum')+callout(15,221,394,221,'Faeces stored',P.gold)+callout(496,232,413,306,'Internal anal sphincter')+callout(496,301,445,319,'External anal sphincter')+callout(544,366,385,355,'Anus');
 return image('full');
}
function along(points,p){const index=Math.min(points.length-2,Math.floor(p*(points.length-1))),q=p*(points.length-1)-index;return [points[index][0]+(points[index+1][0]-points[index][0])*q,points[index][1]+(points[index+1][1]-points[index][1])*q];}
function motion(id,t){
 const dots=[],add=(x,y,r,color)=>dots.push({x,y,r,color});
 const route=[[350,28],[368,75],[377,106],[384,149],[408,183],[384,201],[359,215],[348,245],[394,265],[358,280],[393,296],[349,311],[308,294],[307,240],[357,240],[419,235],[429,274],[400,320],[368,353]];
 if(id==='overview'||id==='ileum')for(let i=0;i<3;i++){const[x,y]=along(route,(t*.024+i/3)%1);add(x,y,3.5,P.gold);}
 if(id==='mouth')for(let i=0;i<9;i++)add(291+Math.sin(t*2+i)*13,128+Math.cos(t*2+i)*8,2.5,P.gold);
 if(id==='swallow')for(let i=0;i<2;i++){const[x,y]=along([[350,120],[385,131],[395,170],[406,220],[427,290]],(t*.12+i*.5)%1);add(x,y,4.5,P.gold);}
 if(id==='stomach')for(let i=0;i<16;i++)add(532+Math.sin(t*.75+i)*40,188+Math.cos(t*.75+i)*47,2.8,i%2?P.gold:P.purple);
 if(id==='duodenum')for(let i=0;i<4;i++){const p=(t*.12+i*.25)%1;let[x,y]=along([[277,190],[286,232],[299,260],[311,285]],p);add(x,y,2.6,P.green);[x,y]=along([[493,308],[437,308],[375,301],[313,285]],p);add(x,y,2.6,P.blue);}
 if(['carbohydrate','protein','fat'].includes(id))for(let i=0;i<5;i++)add(226+(t*20+i*7)%30,365,2.2,id==='protein'?P.purple:P.gold);
 if(['villi','brush','absorption'].includes(id))for(let i=0;i<12;i++){const p=(t*.10+i/12)%1;const[x,y]=along(i%2?[[475,148],[416,177],[392,193],[361,213],[355,302],[384,355]]:[[476,206],[427,213],[402,228],[344,246],[333,301],[330,352]],p);add(x,y,i%2?2.4:3.1,i%2?P.blue:P.gold);}
 if(id==='colon')for(let i=0;i<12;i++){const[x,y]=along([[570,110],[570,159],[570,220],[579,298]],(t*.09+i/12)%1);add(x+(i%3)*13,y,2,i%2?P.blue:P.green);}
 if(id==='egestion')for(let i=0;i<2;i++){const[x,y]=along([[394,214],[394,249],[391,290],[385,331],[385,365]],(t*.06+i*.5)%1);add(x,y,3.5,'#c9a376');}
 return dots;
}
module.exports={anatomy,motion};
