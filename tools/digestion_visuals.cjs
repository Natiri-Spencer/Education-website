/* Original vector teaching diagrams. Coordinates are local to a 750 x 400 panel. */
const P={ink:'#edf5ff',muted:'#b8cbe0',bg:'#11243a',line:'#55748f',pink:'#eea6a6',red:'#f16c7b',blue:'#5fc6f1',green:'#79d8a4',gold:'#f4cf75',purple:'#bca1f1'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const tx=(x,y,s,size=18,fill=P.ink,anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
const path=(d,stroke=P.line,width=3,fill='none',extra='')=>`<path d="${d}" stroke="${stroke}" stroke-width="${width}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const circle=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const rect=(x,y,w,h,fill,stroke=P.line,r=10)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const arrow=(x1,y1,x2,y2,color=P.gold)=>path(`M${x1} ${y1}L${x2} ${y2}`,color,3,'none','marker-end="url(#arr)"');
const chain=(x,y,n,color=P.gold,gap=26)=>Array.from({length:n},(_,i)=>(i?path(`M${x+(i-1)*gap} ${y}H${x+i*gap}`,color,3):'')+circle(x+i*gap,y,9,color)).join('');
const label=(x1,y1,x2,y2,s)=>path(`M${x1} ${y1}L${x2} ${y2}`,P.muted,1.5)+tx(x2+(x2>x1?7:-7),y2+5,s,16,P.ink,x2>x1?'start':'end');

function tract(highlight='overview'){
 let s=tx(375,22,'DIGESTIVE TRACT: front-view schematic',15,P.muted,'middle');
 s+=path('M355 43V116',P.pink,16);
 s+=path('M355 114C391 91 460 107 457 156C455 207 390 222 383 178L367 158Q350 145 355 114',P.pink,3,'#bd777b');
 s+=path('M228 116Q247 80 324 100L346 131L277 151L228 145Z','#ba8c7e',2,'#9b6758');
 s+=path('M280 148Q304 148 301 171Q297 184 287 177Z',P.green,2,'#3d9c7b');
 s+=path('M332 195Q371 172 429 189Q443 205 402 212L345 208Z','#eacb79',2,'#caa15b');
 s+=path('M383 197Q340 200 343 230Q346 246 376 243',P.pink,15);
 s+=path('M376 243H425C461 243 461 262 423 262H315C277 262 277 284 315 284H421C461 284 461 306 421 306H313C276 306 281 329 319 329H399C417 329 423 344 396 345H265',P.gold,13);
 s+=path('M254 342V236Q254 219 274 219H477Q495 219 495 239V333Q495 352 473 352H400Q375 352 375 377',P.pink,24);
 s+=path('M375 377V394',P.pink,15);
 s+=label(349,43,208,43,'Mouth');s+=label(355,86,510,65,'Oesophagus');
 s+=label(253,127,162,122,'Liver');s+=label(285,170,168,181,'Gallbladder');
 s+=label(437,146,525,138,'Stomach');s+=label(419,196,524,193,'Pancreas');
 s+=label(346,228,160,232,'Duodenum');s+=label(316,285,160,290,'Small intestine');
 s+=label(495,283,543,287,'Colon');s+=label(375,376,530,371,'Rectum / anus');
 if(highlight==='duodenum')s+=arrow(294,176,347,220,P.green)+arrow(378,204,352,231,P.blue);
 if(highlight==='ileum')s+=path('M319 329H399C417 329 423 344 396 345H265','#b5ed61',5)+tx(220,388,'Terminal ileum → colon',15,'#b5ed61');
 return s;
}
function mouth(){
 let s=tx(375,28,'CHEWING + SALIVA + STARCH DIGESTION',18,P.muted,'middle');
 s+=path('M146 100Q340 30 537 100L536 226Q340 309 146 226Z',P.pink,4,'#503047');
 for(let i=0;i<9;i++){s+=rect(170+i*38,91,29,38,'#f6f0df','#e6d8be',5);s+=rect(170+i*38,219,29,30,'#f6f0df','#e6d8be',5);}
 s+=path('M181 221Q230 161 346 193Q408 221 501 212Q420 269 279 253Z','#eb8896',2,'#c66b82');
 s+=tx(345,285,'Tongue forms a bolus',18,P.pink,'middle');
 for(const [x,y] of [[605,95],[604,223],[94,212]]){s+=circle(x,y,25,P.blue)+circle(x-19,y+7,15,P.blue)+circle(x+16,y+12,13,P.blue);}
 s+=arrow(580,108,511,153,P.blue)+arrow(580,221,500,193,P.blue)+arrow(117,212,180,188,P.blue);
 s+=tx(582,53,'Salivary glands',17,P.blue)+tx(40,332,'Starch chain',17,P.gold)+chain(54,360,7)+arrow(243,360,305,360)+tx(326,332,'Amylase starts breakdown',17,P.gold)+chain(340,360,2)+chain(430,360,3);
 s+=tx(583,353,'Bolus = soft food mass',16,P.muted,'middle');return s;
}
function swallowing(){
 let s=tx(375,28,'FOOD ENTERS THE OESOPHAGUS, NOT THE AIRWAY',17,P.muted,'middle');
 s+=path('M330 67V352',P.pink,65)+path('M470 91V352',P.blue,58);
 s+=path('M315 50Q354 21 386 62L345 103',P.pink,26);
 s+=path('M386 63L472 91',P.green,11);
 s+=tx(73,99,'Epiglottis',21,P.green)+path('M178 94L398 71',P.green,2);
 s+=tx(87,225,'Peristalsis:',21)+tx(87,254,'muscle contracts',18,P.muted)+tx(87,279,'behind the bolus',18,P.muted);
 s+=tx(331,385,'Oesophagus → stomach',18,P.pink,'middle')+tx(541,182,'Trachea',21,P.blue)+tx(541,210,'(airway)',18,P.blue);
 s+=path('M289 119L305 119M355 119L371 119M289 220L305 220M355 220L371 220',P.gold,7);return s;
}
function stomach(){
 let s=tx(375,26,'CHURNING TURNS FOOD INTO CHYME',18,P.muted,'middle');
 s+=path('M280 45L285 118C365 46 542 95 535 216C531 307 417 345 336 302Q305 284 297 248Q273 289 215 313L184 281Q266 236 258 172L255 45',P.pink,10,'#593746');
 s+=tx(42,113,'Gastric glands:',19,P.pink)+tx(42,144,'acid + pepsin',18)+tx(42,173,'gastric lipase',18)+tx(42,202,'protective mucus',17,P.muted);
 s+=tx(390,228,'CHYME',25,P.gold,'middle');
 s+=tx(572,140,'Protein',18,P.purple)+chain(566,168,5,P.purple,27)+arrow(607,193,607,240)+tx(574,270,'Peptides',18,P.purple)+chain(571,295,2,P.purple)+chain(654,295,2,P.purple);
 s+=tx(67,357,'Pepsin cuts proteins; acid creates the right conditions.',19)+tx(70,385,'Mucus separates stomach cells from acid and enzymes.',17,P.muted);return s;
}
function accessory(){
 let s=tx(375,25,'SECRETIONS ENTER THROUGH DUCTS',18,P.muted,'middle');
 s+=path('M77 87Q124 35 267 65L310 111L181 149L77 126Z','#c69b86',3,'#9b6758');
 s+=tx(101,97,'LIVER',22)+tx(99,127,'makes bile',17);
 s+=path('M170 151Q219 147 218 184Q212 211 190 205Q169 196 170 151',P.green,3,'#347e61');
 s+=tx(22,232,'GALLBLADDER',18,P.green)+tx(22,256,'Stores + concentrates',15,P.muted)+tx(22,278,'bile',15,P.muted);
 s+=path('M440 110Q528 60 677 121L667 171Q537 191 440 159Z','#e7c982',3,'#a98649');
 s+=tx(488,127,'PANCREAS',22)+tx(458,151,'enzymes + bicarbonate',17);
 s+=path('M384 228Q307 229 308 294Q309 359 386 358H526',P.pink,37);
 s+=path('M203 198L203 277L310 277',P.green,8,'none','marker-end="url(#arr)"');
 s+=path('M525 173V302H328',P.blue,8,'none','marker-end="url(#arr)"');
 s+=arrow(384,183,383,224,P.gold)+tx(380,179,'Chyme',17,P.gold,'middle');
 s+=tx(547,245,'DUODENUM',19,P.pink)+tx(552,277,'Bicarbonate',16,P.blue)+tx(552,301,'neutralises acid.',16,P.blue)+tx(420,335,'Bile emulsifies fat.',17,P.green);
 s+=tx(52,389,'Food stays in the digestive tract; secretions join it.',19,P.muted);return s;
}
function carbohydrate(){
 let s=tx(375,30,'STARCH → SMALLER CARBOHYDRATE FRAGMENTS',18,P.muted,'middle');
 s+=chain(63,129,10,P.gold,28)+chain(175,95,3,P.gold,28)+path('M175 95V129',P.gold,3);
 s+=tx(181,182,'Starch',23,P.gold,'middle')+arrow(346,129,424,129)+tx(390,80,'Pancreatic',17,P.blue,'middle')+tx(390,102,'amylase',17,P.blue,'middle');
 s+=chain(469,102,2)+chain(573,102,3)+chain(492,171,4)+path('M518 171V199',P.gold,3)+circle(518,199,9,P.gold);
 s+=tx(593,241,'Maltose, maltotriose, dextrins',17,P.gold,'middle');
 s+=path('M47 280H702',P.line,1)+tx(53,319,'Cellulose fibre',20,P.green)+chain(253,313,7,P.green,28)+tx(260,363,'No human cellulase → some fibre reaches colon',18,P.muted);return s;
}
function proteins(){
 let s=rect(30,36,688,82,'#1d334b')+tx(53,64,'ACTIVATION',15,P.green)+tx(53,96,'Enteropeptidase: trypsinogen → trypsin → other proteases',19);
 s+=chain(44,195,8,P.purple,28)+arrow(272,195,331,195)+chain(361,173,3,P.purple)+chain(483,173,2,P.purple)+chain(583,173,3,P.purple);
 s+=tx(139,244,'Protein chain',20,P.purple,'middle')+tx(517,244,'Smaller peptides',20,P.purple,'middle');
 s+=tx(55,288,'Trypsin, chymotrypsin and elastase cut within chains.',19);
 s+=chain(114,347,4,P.purple)+arrow(239,347,302,347)+circle(351,347,10,P.purple)+chain(405,347,3,P.purple)+tx(511,353,'Carboxypeptidase removes',16)+tx(511,377,'an amino acid from an end.',16);return s;
}
function fats(){
 let s=tx(35,32,'FAT DIGESTION',19,P.gold)+circle(122,121,53,P.gold)+tx(122,200,'Large droplet',17,P.gold,'middle')+arrow(188,121,243,121,P.green);
 for(const [x,y,r] of [[291,99,21],[335,137,17],[280,155,14],[340,83,13]])s+=circle(x,y,r,P.gold);
 s+=tx(300,223,'Bile: emulsification',17,P.green,'middle')+arrow(368,121,431,121,P.blue)+tx(400,72,'Lipase',17,P.blue,'middle');
 for(let i=0;i<4;i++)s+=circle(476+i*55,115,9,P.gold)+circle(479+i*55,154,5,P.gold);
 s+=tx(572,199,'Fatty acids + monoglycerides',17,P.gold,'middle');
 s+=path('M30 254H720',P.line,1)+tx(35,287,'NUCLEIC ACIDS',18,P.blue);
 for(let i=0;i<10;i++){const y=333+Math.sin(i*.8)*20;s+=circle(50+i*25,y,6,P.blue)+circle(50+i*25,666-y,6,P.purple)+path(`M${50+i*25} ${y}V${666-y}`,P.muted,1);}
 s+=arrow(331,331,418,331)+tx(374,301,'RNase / DNase',16,P.blue,'middle');
 for(let i=0;i<5;i++)s+=circle(470+i*42,333,7,i%2?P.blue:P.purple);
 s+=tx(565,379,'Nucleotides',18,P.muted,'middle');return s;
}
function brush(){
 let s=tx(375,29,'ENZYMES AT THE CELL SURFACE FINISH DIGESTION',17,P.muted,'middle');
 for(let i=0;i<8;i++){
 const x=50+i*82;s+=rect(x,222,78,142,'#594d62',P.pink,8)+circle(x+39,315,16,'#9581ac');
 for(let j=0;j<8;j++)s+=path(`M${x+6+j*9} 223V200`,P.pink,4);
 s+=circle(x+39,193,9,i%2?P.blue:P.green);
 }
 s+=tx(31,392,'Absorptive cells (enterocytes)',18,P.muted)+tx(488,392,'Microvilli = brush border',18,P.pink);
 s+=tx(53,81,'Disaccharide',18,P.gold)+chain(97,115,2,P.gold)+arrow(129,140,129,178)+tx(243,81,'Small peptide',18,P.purple)+chain(279,115,3,P.purple)+arrow(317,140,317,178)+tx(505,81,'Nucleotide',18,P.blue)+circle(558,115,10,P.blue)+arrow(558,140,558,178);
 s+=tx(88,163,'Sugar enzymes',14,P.green)+tx(275,163,'Peptidases',14,P.green)+tx(526,163,'Phosphatases, etc.',14,P.green);return s;
}
function villus(transport=false){
 let s=tx(375,25,transport?'ABSORPTION: ACROSS CELLS, THEN INTO VESSELS':'ZOOM: FOLDS → VILLI → MICROVILLI',17,P.muted,'middle');
 s+=rect(20,68,168,101,'#1d334b')+path('M30 149Q45 81 60 149Q75 81 90 149Q105 81 120 149Q135 81 150 149Q165 81 179 149',P.pink,5)+tx(104,193,'Folds in gut lining',15,P.muted,'middle');
 s+=path('M276 367C285 314 293 202 316 104Q342 37 378 54Q419 72 430 180L455 367',P.pink,18,'#614650');
 s+=path('M315 377L322 244L330 145Q340 84 365 81Q398 76 409 148L430 377',P.red,7);
 s+=path('M325 377L337 240L345 145Q350 112 364 107Q387 100 394 144L416 377',P.blue,5);
 s+=path('M373 377V180Q373 151 385 151Q397 151 397 180V377',P.green,11);
 for(let i=0;i<10;i++){const y=105+i*24,x=316-i*3.5;s+=path(`M${x-11} ${y}L${x-24} ${y-7}`,P.pink,2);}
 for(let i=0;i<10;i++){const y=112+i*24,x=427+i*2.4;s+=path(`M${x+6} ${y}L${x+20} ${y-6}`,P.pink,2);}
 s+=tx(245,59,'Villus',19,P.pink,'middle');
 if(!transport){
 s+=label(428,116,485,93,'Microvilli');s+=label(431,188,485,177,'One-cell-thick epithelium');s+=label(413,270,485,251,'Blood capillaries');s+=label(388,325,485,325,'Lacteal (lymph)');
 s+=rect(39,239,125,91,'#594d62',P.pink);for(let i=0;i<13;i++)s+=path(`M${44+i*9} 239V217`,P.pink,3);s+=circle(100,288,15,'#9581ac')+tx(102,360,'One cell enlarged',15,P.muted,'middle');
 }else{
 s+=arrow(471,207,585,207,P.red)+tx(600,198,'BLOOD',19,P.red)+tx(529,238,'Sugars + amino acids',17,P.blue)+tx(534,265,'→ portal vein → liver',17,P.muted);
 s+=arrow(449,325,585,325,P.green)+tx(600,317,'LYMPH',19,P.green)+tx(500,355,'Chylomicrons → bloodstream',16,P.gold);
 s+=tx(30,236,'Gut lumen:',17)+tx(30,261,'nutrients cross',16,P.muted)+tx(30,284,'the epithelial cells',16,P.muted);
 }return s;
}
function colon(){
 let s=tx(375,28,'MICROBIAL FERMENTATION + WATER RECOVERY',18,P.muted,'middle');
 s+=rect(65,68,607,245,'#6e4a4e',P.pink,30)+rect(90,90,557,202,'#362e3b','#362e3b',25);
 s+=tx(108,121,'COLON LUMEN',16,P.muted)+chain(118,187,6,P.gold,25)+tx(115,229,'Undigested fibre',16,P.gold);
 for(const [x,y,a] of [[368,137,15],[474,187,-20],[347,249,25],[556,126,30]])s+=`<g transform="translate(${x} ${y}) rotate(${a})">${rect(-21,-9,42,18,P.green,P.green,9)}${path('M-25 -4q-15 -17 -21 0',P.green,2)}${circle(-7,-1,2,'#23644c')}${circle(7,2,2,'#23644c')}</g>`;
 s+=tx(425,265,'Gut bacteria',18,P.green,'middle');
 s+=path('M84 352H657',P.red,13)+tx(681,358,'Blood',15,P.red);
 s+=arrow(197,285,197,333,P.blue)+arrow(323,285,323,333,P.green)+arrow(514,285,514,333,P.blue);
 s+=tx(162,389,'Water + salts',17,P.blue)+tx(351,389,'Short-chain fatty acids',17,P.green);
 s+=tx(103,55,'Colon lining has no villi.',15,P.muted);return s;
}
function egestion(){
 let s=tx(375,26,'RECTUM → ANAL SPHINCTERS → OUTSIDE BODY',18,P.muted,'middle');
 s+=path('M292 64Q262 114 284 180Q310 230 316 270H431Q435 232 464 176Q487 109 454 64',P.pink,15,'#593746');
 s+=path('M315 269V320H432V269',P.pink,14,'#593746');
 s+=rect(297,283,151,21,P.purple,P.purple,9)+rect(300,312,147,19,P.green,P.green,9);
 s+=label(291,142,153,125,'Rectum');s+=label(439,291,520,275,'Anal sphincters');s+=label(434,323,520,326,'Anus');
 s+=arrow(373,340,373,370,P.gold)+tx(373,395,'EGESTION: faeces leave the body',18,P.gold,'middle');
 s+=tx(44,242,'Temporary',18,P.muted)+tx(44,268,'storage',18,P.muted);return s;
}
function visual(id){return ({overview:()=>tract(),mouth,swallow:swallowing,stomach,duodenum:accessory,carbohydrate,protein:proteins,fat:fats,brush,villi:()=>villus(),absorption:()=>villus(true),ileum:()=>tract('ileum'),colon,egestion}[id]||(()=>tract()))();}

function pointAlong(points,p){let i=Math.min(points.length-2,Math.floor(p*(points.length-1))),q=p*(points.length-1)-i;return [points[i][0]+(points[i+1][0]-points[i][0])*q,points[i][1]+(points[i+1][1]-points[i][1])*q];}
function motion(id,t){
 const a=[],dot=(x,y,r,color)=>a.push({x,y,r,color});
 if(id==='overview'||id==='ileum'){
 const route=id==='ileum'?[[400,329],[320,329],[265,343],[255,280],[255,239],[300,219],[476,219],[495,280],[475,352],[376,377]]:[[355,44],[355,115],[401,133],[423,174],[381,200],[345,232],[423,243],[315,262],[422,284],[315,305],[399,329],[265,343],[255,240],[478,220],[495,330],[376,377]];
 for(let i=0;i<3;i++){const [x,y]=pointAlong(route,(t*.045+i/3)%1);dot(x,y,6,'#f4cf75');}
 }
 if(id==='mouth')for(let i=0;i<17;i++)dot(278+(i%5)*24+Math.sin(t*3+i)*8,145+Math.floor(i/5)*13+Math.cos(t*3+i)*5,4,'#f4cf75');
 if(id==='swallow'){const y=105+(t*28)%218;dot(330,y,15,'#f4cf75');for(let i=0;i<3;i++)dot(297+i*32,y-25,5,'#b5ed61');}
 if(id==='stomach')for(let i=0;i<23;i++){const u=t*.65+i*.8;dot(398+Math.cos(u)*(55+(i%3)*8),207+Math.sin(u)*57,3.8,i%2?'#bca1f1':'#f4cf75');}
 if(id==='duodenum'){
 for(let i=0;i<5;i++){let p=(t*.2+i/5)%1,[x,y]=pointAlong([[203,198],[203,277],[309,277]],p);dot(x,y,4,'#79d8a4');[x,y]=pointAlong([[525,177],[525,302],[330,302]],p);dot(x,y,4,'#5fc6f1');}
 }
 if(['carbohydrate','protein','fat'].includes(id))for(let i=0;i<8;i++)dot(354+((t*30+i*16)%70),id==='protein'?195:121,3,id==='protein'?'#bca1f1':'#f4cf75');
 if(id==='brush')for(let i=0;i<12;i++){const p=(t*.18+i/12)%1;dot(90+(i%7)*84,150+p*170,3.5,i%2?'#bca1f1':'#f4cf75');}
 if(id==='villi'||id==='absorption'){
 for(let i=0;i<12;i++){const p=(t*.13+i/12)%1;let x,y;if(i%2){[x,y]=pointAlong([[266,124],[309,164],[335,191],[344,256],[325,367]],p);dot(x,y,3.5,'#5fc6f1');}else{[x,y]=pointAlong([[473,155],[427,195],[385,224],[385,367]],p);dot(x,y,4.5,'#f4cf75');}}
 }
 if(id==='colon')for(let i=0;i<20;i++){const p=(t*.17+i/20)%1;dot(125+(i%7)*70,215+p*124,3,i%2?'#5fc6f1':'#79d8a4');}
 if(id==='egestion')for(let i=0;i<4;i++)dot(345+i*17,130+((t*23+i*38)%210),8,'#b68a63');
 return a;
}
module.exports={visual,motion,P,tx,esc};
