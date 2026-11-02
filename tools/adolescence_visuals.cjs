/* Original, fully clothed learner diagrams; illustrative proportions, not growth standards. */
module.exports=({g,art,C,clamp,mix,text,block,rect,ellipse,line,label,picture})=>{
 const grad=(x,y,r,light,dark)=>{const a=g.createRadialGradient(x-r*.3,y-r*.4,1,x,y,r);a.addColorStop(0,light);a.addColorStop(1,dark);return a;};
 function path(points,fill){g.beginPath();for(const[cmd,...v]of points)g[cmd](...v);g.fillStyle=fill;g.fill();}
 function person(x,ground,scale=1,kind='girl',stage=.5,faceOnly=false){
  g.save();g.translate(x,ground);g.scale(scale,scale);
  const skin=grad(-4,-310,65,'#c88c65','#74452f'),shirt=kind==='girl'?'#44b5aa':'#e6ae4e',shade=kind==='girl'?'#247f7d':'#b77b31';
  const shoulders=kind==='boy'?mix(30,44,stage):mix(29,34,stage),hips=kind==='girl'?mix(29,43,stage):mix(29,32,stage);
  if(!faceOnly){
   ellipse(0,-1,72,9,'#07132277');
   // Long trousers, two legs, shoes and loosely fitting everyday clothing.
   path([['moveTo',-hips,-165],['lineTo',hips,-165],['quadraticCurveTo',hips+4,-104,26,-21],['lineTo',8,-21],['lineTo',0,-128],['lineTo',-9,-21],['lineTo',-27,-21],['quadraticCurveTo',-hips-5,-105,-hips,-165]],'#354e6c');
   line([[-1,-132],[-1,-166]],'#527297',1.3);
   rect(-35,-27,33,22,'#c5d1df',7);rect(4,-27,34,22,'#c5d1df',7);line([[-33,-10],[-4,-10]],'#6b819a',2);line([[7,-10],[35,-10]],'#6b819a',2);
   const sleeve=g.createLinearGradient(-60,0,60,0);sleeve.addColorStop(0,shade);sleeve.addColorStop(.5,shirt);sleeve.addColorStop(1,shade);
   path([['moveTo',-shoulders,-262],['quadraticCurveTo',-shoulders-20,-256,-shoulders-24,-223],['lineTo',-shoulders-17,-179],['lineTo',-shoulders-2,-181],['lineTo',-shoulders-6,-223],['lineTo',-shoulders+7,-241],['lineTo',shoulders-7,-241],['lineTo',shoulders+6,-223],['lineTo',shoulders+2,-181],['lineTo',shoulders+17,-179],['lineTo',shoulders+24,-223],['quadraticCurveTo',shoulders+20,-256,shoulders,-262],['closePath']],sleeve);
   for(const sign of [-1,1]){ellipse(sign*(shoulders+10),-171,9,13,skin);for(let i=0;i<4;i++)rect(sign*(shoulders+10)-6+i*3,-171,2.8,14-i*.8,'#b77957',1.4);}
   path([['moveTo',-14,-270],['quadraticCurveTo',-25,-267,-shoulders,-261],['quadraticCurveTo',-shoulders+5,-218,-hips-3,-161],['quadraticCurveTo',0,-151,hips+3,-161],['quadraticCurveTo',shoulders-5,-218,shoulders,-261],['quadraticCurveTo',25,-267,14,-270],['closePath']],sleeve);
   line([[-hips,-169],[hips,-169]],shade,1.2);line([[-13,-266],[0,-260],[13,-266]],'#bce9e177',2);
   rect(-11,-287,22,28,skin,5);
  }
  // Recognizable head, ears, hair, eyebrows, eyes, nose and relaxed expression.
  ellipse(-25,-316,6,10,skin);ellipse(25,-316,6,10,skin);
  ellipse(0,-319,26,35,skin);
  if(kind==='girl'){
   path([['moveTo',-28,-309],['quadraticCurveTo',-35,-355,-5,-357],['quadraticCurveTo',31,-358,29,-309],['lineTo',20,-330],['quadraticCurveTo',6,-343,-22,-330],['closePath']],'#1f2429');
   for(const sign of [-1,1])for(let i=0;i<8;i++)ellipse(sign*(29+i*.7),-310+i*6,5.2,5.7,'#25292c');
  }else {for(let i=0;i<19;i++){const a=Math.PI+i/18*Math.PI;ellipse(Math.cos(a)*23,-337+Math.sin(a)*11,7,7,'#20262b');}}
  line([[-16,-325],[-7,-326]],'#382b29',1.5);line([[7,-326],[16,-325]],'#382b29',1.5);
  ellipse(-11,-319,2.2,2.6,'#18252f');ellipse(11,-319,2.2,2.6,'#18252f');
  line([[0,-318],[-2,-307],[2,-306]],'#925b43',1);g.beginPath();g.arc(0,-307,11,.55,2.6);g.strokeStyle='#714534';g.lineWidth=1.3;g.stroke();
  if(kind==='boy'&&stage>.7)for(let i=0;i<8;i++)ellipse(-10+i*3,-298+Math.sin(i)*1.4,.6,.7,'#4b3b32');
  g.restore();
 }
 function cohort(t){text('GROWING UP · LEARNING TOGETHER',435,163,18,C.teal,'center');person(280,557,.97,'girl',.55);person(590,557,1.02,'boy',.55);rect(65,480,125,51,'#1b344e');block('Your body. Your pace.',78,501,105,15,C.gold,20);rect(695,480,125,51,'#1b344e');block('Kindness and privacy.',708,501,103,15,C.gold,20);}
 function growth(scene,t,kind=null){const local=t-scene.start,p=clamp(local/18),girl=kind==='girl',boy=kind==='boy';
  if(kind){text('ILLUSTRATIVE STAGES · CHANGES TAKE YEARS',435,163,16,C.teal,'center');person(270,551,.78,kind,.1);person(584,551,mix(.78,1.03,p),kind,p);text('Earlier in puberty',270,577,16,C.muted,'center');text('Later in puberty',584,577,16,C.gold,'center');line([[390,350],[452,350]],C.teal,2);line([[442,342],[452,350],[442,358]],C.teal,2);
   if(girl){label('Breast development',655,230,584,551-244*mix(.78,1.03,p),C.pink);label('Hips may widen',640,390,584+34*mix(.78,1.03,p),551-160*mix(.78,1.03,p),C.gold);}
   else {label('Shoulders broaden',60,223,584+40*mix(.78,1.03,p),551-256*mix(.78,1.03,p),C.gold);label('Facial hair may grow',617,270,584,551-298*mix(.78,1.03,p),C.teal);rect(63,450,165,74,'#1b344e');block('Reproductive organs mature beneath clothing.',76,474,140,15,C.muted,20);}
  }else {person(278,550,mix(.76,1.02,p),'girl',p);person(588,550,mix(.74,1.06,p),'boy',p);text('Girls',278,578,16,C.teal,'center');text('Boys',588,578,16,C.gold,'center');for(const[x,s]of [[278,mix(.76,1.02,p)],[588,mix(.74,1.06,p)]]){const top=550-357*s;line([[x-82,550],[x-82,top],[x-65,top]],C.teal,1.5);line([[x-90,550],[x-72,550]],C.teal,1.5);}text('Growth is gradual; drawings are not height predictions.',435,164,17,C.muted,'center');}
 }
 function hormones(t){person(220,557,.97,'girl',.4);ellipse(220,230,20,13,'#65dbd099');text('Brain signals',95,175,19,C.teal);line([[170,183],[217,227]],C.teal);const x1=274,x2=504;g.beginPath();g.moveTo(x1,248);g.bezierCurveTo(470,230,340,402,x2,394);g.strokeStyle='#4c8dbe';g.lineWidth=5;g.stroke();for(let i=0;i<8;i++){const q=(t*.1+i/8)%1,u=1-q;const x=u*u*u*x1+3*u*u*q*470+3*u*q*q*340+q*q*q*x2,y=u*u*u*248+3*u*u*q*230+3*u*q*q*402+q*q*q*394;ellipse(x,y,3.5,3.5,C.gold);}
  text('Hormones travel in blood',510,210,20,C.gold);for(const[s,y]of [['Skin and hair',270],['Bones and muscles',355],['Reproductive organs',440]]){rect(515,y-28,277,63,'#1b344e');text(s,652,y+10,18,C.text,'center');line([[503,394],[515,y]],C.teal,1.5);}text('A simplified message pathway',435,569,16,C.muted,'center');}
 function skin(t){text('ENLARGED SKIN MODEL',435,163,17,C.teal,'center');const gradSkin=g.createLinearGradient(0,343,0,530);gradSkin.addColorStop(0,'#d5a482');gradSkin.addColorStop(1,'#8e5d48');rect(80,351,495,180,gradSkin);line([[82,351],[573,351]],'#f3c39f',5);const hair=clamp((t-69)/17);g.beginPath();g.moveTo(268,476);g.bezierCurveTo(224,442,261,395,252,351);g.lineTo(236,351-mix(60,133,hair));g.strokeStyle='#433c38';g.lineWidth=8;g.stroke();ellipse(263,467,18,31,'#ad6c59','#e6ad8e',2);label('Hair follicle',90,553,263,468);label('Body hair grows',82,207,240,258,C.gold);
  g.beginPath();g.moveTo(460,350);g.bezierCurveTo(455,380,488,392,467,425);for(let i=0;i<5;i++)g.bezierCurveTo(435,409+i*13,500,421+i*13,463,435+i*13);g.strokeStyle='#e5bdd0';g.lineWidth=4;g.stroke();label('Sweat gland',340,554,466,456,C.teal);for(let i=0;i<3;i++){const p=(t*.26+i/3)%1;ellipse(458+Math.sin(i)*9,342-p*51,3,4,'#76d2dc',null);}
  rect(606,221,206,298,'#1b344e');g.save();g.translate(708,1090);g.scale(2.25,2.25);person(0,0,1,'boy',.3,true);g.restore();for(const[x,y]of [[688,355],[729,354],[718,377]])ellipse(x,y,2.6,2.6,'#c97970');text('Oilier skin',708,474,17,C.gold,'center');text('Spots can happen',708,499,14,C.muted,'center');}
 function periods(t){picture(art.anatomy,100,130,675,450);label('Uterus',660,255,445,284);label('Inner lining',65,380,438,306,C.pink);label('Vagina',652,528,441,469);rect(60,139,750,34,'#102138dd',5);text('Menstruation: blood and lining leave the uterus',435,164,17,C.gold,'center');for(let i=0;i<9;i++){const q=(t*.065+i/9)%1;ellipse(440+Math.sin(i*4)*3,310+q*168,2.4,3.1,'#ed9cae');}text('A normal process · not a wound',435,571,18,C.teal,'center');}
 function voice(t){text('VOICE BOX AND VOCAL CORDS · SCHEMATIC',435,164,16,C.teal,'center');g.save();g.translate(260,620);g.scale(1.2,1.2);person(0,0,1,'boy',.4);g.restore();ellipse(260,290,18,13,'#f4ce6a66',C.gold,2);label('Voice box (larynx)',65,199,260,290,C.gold);line([[280,290],[480,292]],C.teal,1.5);rect(482,210,325,165,'#1b344e');const p=clamp((t-181)/15),len=mix(110,205,p);for(const y of [260,313]){g.beginPath();g.moveTo(538,y);g.quadraticCurveTo(538+len/2,y+Math.sin(t*9)*3,538+len,y);g.strokeStyle=C.teal;g.lineWidth=6;g.stroke();}text('Vocal cords grow',645,352,18,C.gold,'center');g.beginPath();for(let i=0;i<280;i++){const x=504+i,y=453+Math.sin(i/mix(8,17,p)-t*5)*24;i?g.lineTo(x,y):g.moveTo(x,y);}g.strokeStyle=C.teal;g.lineWidth=2;g.stroke();text('The voice can become deeper',645,518,18,C.text,'center');text('Temporary voice cracks are common',435,569,17,C.muted,'center');}
 function icon(kind,x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);g.strokeStyle=C.teal;g.lineWidth=3;
  if(kind==='wash'){rect(-22,-20,44,49,'#74c3ca',8);rect(-15,-30,30,12,'#d9eef0',4);ellipse(0,4,8,10,'#e8f9fa');}
  if(kind==='clothes'){path([['moveTo',-15,-23],['lineTo',-35,-10],['lineTo',-24,6],['lineTo',-16,0],['lineTo',-16,31],['lineTo',17,31],['lineTo',17,0],['lineTo',25,6],['lineTo',35,-10],['lineTo',15,-23],['quadraticCurveTo',0,-10,-15,-23]],'#e6ae4e');}
  if(kind==='sleep'){ellipse(0,0,28,28,C.gold);ellipse(12,-8,25,25,'#20374f');text('z',22,-18,20,C.teal);}
  if(kind==='water'){path([['moveTo',0,-32],['bezierCurveTo',-45,13,-17,35,0,35],['bezierCurveTo',22,35,43,11,0,-32]],'#75cddd');}
  if(kind==='meal'){ellipse(0,4,32,25,'#d2dde4');ellipse(0,4,26,19,'#1d3b4d');ellipse(-10,2,11,10,'#80b57b');ellipse(10,6,10,8,'#e5ad65');ellipse(4,-6,7,6,'#d7ca9b');}
  if(kind==='move'){line([[-23,22],[-7,-14],[7,-2],[20,21]],C.gold,8);ellipse(-7,-31,8,8,C.gold);line([[-6,-12],[-24,2],[-34,-5]],C.teal,5);}
  if(kind==='pad'){rect(-18,-31,36,63,'#d9e9ef',13);rect(-26,-7,52,19,'#afcfdc',7);rect(-12,-24,24,48,'#f1f6f8',9);}
  if(kind==='hands'){g.strokeStyle=C.gold;g.lineWidth=6;line([[-20,14],[18,14]],C.gold,8);for(let i=0;i<4;i++)line([[-18+i*9,13],[-18+i*9,-16+i*2]],C.gold,5);for(let i=0;i<3;i++)ellipse(-20+i*20,-30,3,5,C.teal);}
  if(kind==='help'){rect(-31,-25,62,44,'#70bfb9',10);path([['moveTo',-16,17],['lineTo',-21,30],['lineTo',0,18]],'#70bfb9');text('?',0,7,28,'#102138','center');}
  g.restore();}
 function care(scene,t){const list=[['wash','Wash regularly'],['clothes','Clean clothes'],['water','Drink water'],['meal','Varied meals'],['move','Stay active'],['sleep','Enough sleep']];list.forEach(([kind,s],i)=>{const x=65+(i%3)*250,y=151+Math.floor(i/3)*211;rect(x,y,231,189,'#20374f');icon(kind,x+115,y+71,1.1);text(s,x+115,y+139,18,C.text,'center');if(t-scene.start>i*2.5)line([[x+190,y+19],[x+198,y+27],[x+211,y+11]],C.teal,3);});}
 function periodcare(t){const list=[['pad','PREPARE','A clean product and a spare if possible'],['hands','CHANGE','Follow instructions and wash hands'],['help','ASK','Seek support for pain, heavy bleeding or worries']];list.forEach(([kind,title,detail],i)=>{const x=65+i*250;rect(x,197,230,324,'#20374f');icon(kind,x+115,284,1.3);text(title,x+115,370,20,C.gold,'center');block(detail,x+22,412,185,18,C.text,26);});text('Periods are a normal part of life.',435,568,20,C.teal,'center');}
 function timing(t){text('COMMON STARTING RANGES · NOT FINISHING DATES',435,164,17,C.teal,'center');const x=219,w=553;for(let age=7;age<=15;age++){const xx=x+(age-7)/8*w;text(String(age),xx,217,16,C.muted,'center');line([[xx,226],[xx,372]],'#29445e',1);}text('Age in years',435,195,15,C.muted,'center');for(const[s,a,b,y,color]of [['Girls',8,13,266,C.teal],['Boys',9,14,336,C.gold]]){text(s,89,y+8,22,C.text);rect(x+(a-7)/8*w,y-18,(b-a)/8*w,35,color,7);text(`${a}–${b}`,x+(a+b-14)/16*w,y+6,17,'#102138','center');}rect(87,418,696,113,'#20374f');block('Classmates can be at different stages. Puberty is not a race.',111,449,645,22,C.text,30);text('If timing or symptoms worry you, ask a trusted adult or health worker.',435,571,16,C.gold,'center');}
 function review(t){cohort(t);rect(77,140,721,50,'#20374f');text('GROWTH · BODY HAIR · PERSONAL CARE · RESPECT',437,172,19,C.gold,'center');}
 return (scene,t)=>{if(scene.id==='intro')cohort(t);else if(scene.id==='hormones')hormones(t);else if(scene.id==='growth')growth(scene,t);else if(scene.id==='skin')skin(t);else if(['girls','boys'].includes(scene.id))growth(scene,t,scene.id==='girls'?'girl':'boy');else if(scene.id==='periods')periods(t);else if(scene.id==='voice')voice(t);else if(scene.id==='care')care(scene,t);else if(scene.id==='periodcare')periodcare(t);else if(scene.id==='timing')timing(t);else review(t);};
};
