// Exact, local SVG illustrations. Run with node tools/build_course_diagrams.cjs.
const fs = require('node:fs'), path = require('node:path');
const out = path.join(__dirname, '../educations/static/educations/course_diagrams');
fs.mkdirSync(out, {recursive:true});
const escape = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text = (x,y,s,size=22,colour='#172e48',anchor='middle') => `<text x="${x}" y="${y}" font-size="${size}" fill="${colour}" text-anchor="${anchor}">${escape(s)}</text>`;
const line = (x1,y1,x2,y2,colour='#172e48',dash='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colour}" stroke-width="3" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const rect = (x,y,w,h,fill='#d9f4ee') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#087b74" stroke-width="3"/>`;
const poly = (points,fill='#d9f4ee') => `<polygon points="${points}" fill="${fill}" stroke="#087b74" stroke-width="3"/>`;
const circle = (x,y,r,fill='#d9f4ee') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#087b74" stroke-width="3"/>`;
const formula = s => text(380,322,s,24);
const diagrams = {};
function add(key,title,body) { diagrams[key]={title,body}; }
function box(x,y,w,h,label,fill='#d9f4ee') {return rect(x,y,w,h,fill)+text(x+w/2,y+h/2+8,label);}
function axis(y,min,max,start=140,step=50) {
 let s=line(start-25,y,start+(max-min)*step+25,y);
 for(let n=min;n<=max;n++){const x=start+(n-min)*step;s+=line(x,y-6,x,y+6)+text(x,y+30,n,18);}
 return s;
}
function solid(l,w,h) {
 const x=245,y=230,dx=w*.65,dy=w*.35;
 return poly(`${x},${y-h} ${x+l},${y-h} ${x+l+dx},${y-h-dy} ${x+dx},${y-h-dy}`,'#eef8dc')+
 poly(`${x+l},${y} ${x+l+dx},${y-dy} ${x+l+dx},${y-h-dy} ${x+l},${y-h}`,'#b2dfd9')+
 rect(x,y-h,l,h)+text(x+l/2,y+30,'length')+text(x+l+dx+30,y-h/2-dy/2,'height',18)+text(x+dx/2-35,y-h-dy/2-15,'width',18);
}
add('expressions','Read an expression',box(140,75,155,95,'3x')+text(322,136,'+')+box(350,75,120,95,'2','#eef8dc')+text(210,210,'3: coefficient')+text(210,242,'x: variable')+text(410,210,'2: constant')+formula('When x = 4: 3 × 4 + 2 = 14'));
add('equations','Keep both sides equal',box(100,50,210,70,'2x + 4')+text(380,97,'=')+box(450,50,210,70,'12')+text(200,160,'subtract 4')+text(555,160,'subtract 4')+box(100,185,210,65,'2x')+text(380,230,'=')+box(450,185,210,65,'8')+formula('Divide both sides by 2: x = 4'));
add('inequality','Open or filled endpoints',text(380,46,'x < 3: exclude 3, extend left')+axis(100,-2,6)+line(115,100,390,100,'#087b74')+circle(390,100,8,'white')+poly('115,100 130,93 130,107','#087b74')+text(380,204,'x ≥ 3: include 3, extend right')+axis(248,-2,6)+line(390,248,565,248,'#087b74')+circle(390,248,8,'#087b74')+poly('565,248 550,241 550,255','#087b74'));
add('compound','Between two boundaries',text(380,65,'−2 ≤ x < 4')+axis(165,-4,6,130,48)+line(226,165,514,165,'#087b74')+circle(226,165,9,'#087b74')+circle(514,165,9,'white')+text(226,248,'include −2')+text(514,248,'exclude 4')+formula('Every value in between is included.'));
add('right_triangle','Locate the right angle first',poly('260,230 500,230 260,50')+line(260,210,280,210)+line(280,210,280,230)+text(380,265,'4 cm')+text(215,145,'3 cm')+text(430,112,'5 cm')+text(555,165,'hypotenuse',20)+formula('The hypotenuse is opposite the 90° angle.'));
add('pythagoras','Areas of the squares',rect(280,120,60,60,'#eef8dc')+rect(340,180,80,80)+poly('420,180 340,120 400,40 480,100','#d8e9ff')+poly('340,180 420,180 340,120','white')+text(310,157,'9')+text(380,228,'16')+text(413,113,'25')+text(380,293,'Areas in cm²; triangle sides are 3, 4 and 5 cm.',20)+formula('3² + 4² = 5²    →    9 + 16 = 25'));
add('length','Convert length units',box(45,85,130,80,'km')+text(215,135,'×1000',18)+box(260,85,100,80,'m')+text(401,135,'×100',18)+box(445,85,100,80,'cm')+text(585,135,'×10',18)+box(630,85,90,80,'mm')+text(380,220,'Multiply → smaller units')+text(380,255,'Divide ← larger units')+formula('2.35 m = 235 cm = 2350 mm'));
add('length_operations','Use a common unit',box(80,65,275,55,'275 cm')+box(355,65,160,55,'160 cm','#eef8dc')+text(300,155,'275 + 160 = 435 cm = 4 m 35 cm')+[0,1,2,3].map(i=>box(100+i*131,205,131,55,'131 cm')).join('')+formula('524 cm ÷ 4 = 131 cm each'));
add('perimeter','Trace the outside boundary',rect(260,65,240,150)+text(380,48,'8 cm')+text(380,247,'8 cm')+text(218,150,'5 cm')+text(545,150,'5 cm')+text(380,151,'area = 40 cm²',20)+formula('Perimeter = 8 + 5 + 8 + 5 = 26 cm'));
add('circumference','Radius and diameter',circle(380,150,90,'white')+line(290,150,470,150)+circle(380,150,3,'#172e48')+line(380,150,380,60,'#bc5c16')+text(430,113,'r = 7 cm',18)+text(380,183,'d = 14 cm',18)+text(380,273,'Circumference follows the outside curve.',20)+formula('C = πd = 44 cm  (π = 22/7)'));
add('land','One hectare',rect(280,50,200,200)+text(380,41,'100 m')+text(530,155,'100 m')+text(380,140,'1 hectare')+text(380,175,'10,000 m²')+formula('Area = 100 m × 100 m'));
let grid=rect(260,65,240,150);for(let i=1;i<8;i++)grid+=line(260+i*30,65,260+i*30,215,'#8bbdb4');for(let j=1;j<5;j++)grid+=line(260,65+j*30,500,65+j*30,'#8bbdb4');
add('rectangle','Count square units',grid+text(380,47,'8 cm')+text(215,150,'5 cm')+text(380,269,'8 columns × 5 rows',20)+formula('Area = 8 × 5 = 40 cm²'));
add('parallelogram','Height is perpendicular to the base',poly('195,215 495,215 565,90 265,90')+line(265,90,265,215,'#bc5c16','6 4')+line(265,198,282,198,'#bc5c16')+line(282,198,282,215,'#bc5c16')+text(345,254,'base = 12 cm')+text(360,157,'height = 5 cm',20)+formula('Area = base × height = 60 cm²'));
add('rhombus','Diagonals join opposite vertices',poly('255,150 380,50 505,150 380,250')+line(255,150,505,150,'#bc5c16','6 4')+line(380,50,380,250,'#bc5c16','6 4')+text(380,135,'10 cm',18)+text(427,193,'8 cm',18)+formula('Area = ½ × 10 × 8 = 40 cm²'));
add('trapezium','Use the parallel sides',poly('240,210 520,210 460,110 300,110')+text(380,89,'8 cm')+text(380,246,'14 cm')+line(300,110,300,210,'#bc5c16','6 4')+text(350,166,'5 cm',18)+formula('Area = ½ × (8 + 14) × 5 = 55 cm²'));
add('circle_area','Area fills the interior',circle(380,150,90)+line(380,150,470,150,'#bc5c16')+text(425,135,'7 cm',18)+circle(380,150,3,'#172e48')+formula('Area = πr² = 154 cm²  (π = 22/7)'));
add('border','Subtract the inner area',rect(224,40,312,208,'#eef8dc')+rect(250,66,260,156,'white')+text(380,30,'12 m outside')+text(590,150,'8 m',20)+text(380,140,'10 m × 6 m')+text(380,192,'garden',18)+text(380,277,'Path width = 1 m on every side',20)+formula('Path area = 12 × 8 − 10 × 6 = 36 m²'));
add('composite','Subtract the missing corner',poly('268,60 408,60 408,116 492,116 492,228 268,228')+line(408,60,492,60,'#bc5c16','6 4')+line(492,60,492,116,'#bc5c16','6 4')+text(380,265,'8 m total')+text(216,150,'6 m')+text(555,80,'3 m × 2 m',18)+text(555,108,'removed',18)+formula('Area = 8 × 6 − 3 × 2 = 42 m²'));
add('cubic_units','Three dimensions change units',solid(120,120,120)+text(380,38,'Every edge: 1 m = 100 cm')+text(380,289,'100 × 100 × 100 = 1,000,000',20)+formula('1 m³ = 1,000,000 cm³'));
add('cube','Three equal dimensions',solid(120,120,120)+text(380,38,'Every edge is 5 cm')+formula('Volume = 5 × 5 × 5 = 125 cm³'));
add('cuboid','Base area times height',solid(220,125,100)+text(380,50,'Length 12 cm · width 8 cm · height 5 cm')+formula('Volume = 12 × 8 × 5 = 480 cm³'));
add('cylinder','Circular base times height',`<path d="M290 90 V235 A90 25 0 0 0 470 235 V90" fill="#d9f4ee" stroke="#087b74" stroke-width="3"/><ellipse cx="380" cy="90" rx="90" ry="25" fill="#eef8dc" stroke="#087b74" stroke-width="3"/>`+line(380,90,470,90,'#bc5c16')+text(425,78,'7 cm',18)+line(510,90,510,235)+text(560,170,'10 cm')+formula('V = π × 7² × 10 = 1540 cm³  (π = 22/7)'));
add('capacity','Full capacity versus water now',rect(245,55,240,180,'white')+rect(245,127,240,108,'#bbdcff')+text(365,42,'inside length 40 cm')+text(560,140,'height 30 cm',18)+text(365,175,'water depth 18 cm',18)+text(365,212,'width into page: 25 cm',17)+text(380,275,'Full tank: 30 L · Water now: 18 L',22)+formula('1000 cm³ = 1 litre'));
let clock=circle(380,150,105,'white');for(let h=1;h<=12;h++){const a=(h*30-90)*Math.PI/180;clock+=text(380+86*Math.cos(a),157+86*Math.sin(a),h,18);}clock+=line(380,150,380+70*Math.cos(Math.PI/6),185,'#087b74')+line(380,150,380+48*Math.cos(Math.PI/18),150+48*Math.sin(Math.PI/18))+circle(380,150,4,'#172e48');
add('clock','Time of day: 3:20',clock+formula('20 minutes = ⅓ hour'));
add('time','Convert in steps of 60',box(55,90,170,85,'hours')+text(270,142,'×60',20)+box(320,90,140,85,'minutes')+text(505,142,'×60',20)+box(550,90,160,85,'seconds')+text(380,225,'Reverse direction: ÷60 at each step')+formula('0.5 hour = 30 minutes = 1800 seconds'));
add('distance','Use one unit before adding',box(90,80,350,70,'2 km = 2000 m')+text(477,125,'+')+box(515,80,150,70,'75 m','#eef8dc')+text(380,220,'2000 m + 75 m = 2075 m')+formula('2075 m ÷ 1000 = 2.075 km'));
add('speed','Average speed = total distance ÷ total time',line(100,170,660,170)+[0,1,2,3].map(i=>circle(100+i*185,170,7)+text(100+i*185,145,`${i*60} km`,18)+text(100+i*185,210,`${i} h`,18)).join('')+text(380,260,'Equal sections illustrate constant speed.',19)+formula('180 km ÷ 3 h = 60 km/h ≈ 16.67 m/s'));
let thermo=rect(340,45,35,200,'white')+rect(348,120,19,125,'#d46c38')+circle(357,245,24,'#d46c38');for(let t=0;t<=40;t+=5){const y=245-t*5;thermo+=line(380,y,395,y)+text(428,y+6,`${t} °C`,18);}
add('thermometer','Read the scale and unit',thermo+text(220,129,'25 °C')+line(260,123,340,123,'#bc5c16')+formula('Each marked interval is 5 °C.'));
add('temperature_scales','Equal steps, different zero points',line(230,65,230,250)+line(530,65,530,250)+[0,10,25].map(t=>{const y=240-t*6;return line(215,y,245,y)+line(515,y,545,y)+line(245,y,515,y,'#91ada9','6 4')+text(150,y+7,`${t} °C`,20)+text(610,y+7,`${(273.15+t).toFixed(2)} K`,20);}).join('')+formula('K = °C + 273.15 (exact offset)'));
add('temperature_change','Do not add an offset to a change',box(100,70,210,75,'18 °C')+text(380,119,'→')+box(450,70,210,75,'27 °C','#eef8dc')+text(380,201,'27 − 18 = 9 °C rise')+text(380,245,'The same rise is 9 K.')+formula('Changes use equal-sized steps on both scales.'));
add('profit','Selling price above cost price',box(190,90,320,80,'Cost: KES 800')+rect(510,90,60,80,'#eef8dc')+text(540,205,'KES 150',18)+text(540,235,'profit',18)+text(380,275,'Selling price: KES 950')+formula('Profit = 950 − 800 = KES 150'));
add('loss','Selling price below cost price',box(100,90,420,80,'Selling price: KES 2100')+box(520,90,60,80,'300','#ffe4d4')+text(550,215,'loss')+text(360,258,'Cost price: KES 2400')+formula('Loss = 2400 − 2100 = KES 300'));
add('percentage','Identify the percentage base',[0,1,2,3,4].map(i=>box(130+i*100,80,100,75,'100',i===4?'#eef8dc':'#d9f4ee')).join('')+text(380,197,'Cost price: KES 500 (five parts)')+text(380,241,'Profit: KES 100 (one part)')+formula('Percentage profit = 100 / 500 × 100% = 20%'));
add('discount','Reduce the marked price',box(100,80,440,85,'Sale price: KES 2200')+rect(540,80,60,85,'#ffe4d4')+text(590,204,'KES 300',18)+text(590,235,'discount',18)+text(350,270,'Marked price: KES 2500')+formula('12% of 2500 = 300; pay 2500 − 300'));
add('fractions','Equal parts, equivalent values',[0,1,2,3].map(i=>rect(180+i*100,80,100,100,i<2?'#8dd7c3':'white')).join('')+text(380,238,'2 of 4 equal parts shaded')+formula('2/4 = 1/2 = 0.5 = 50%'));
add('decimals','Digits show place value',box(100,70,170,100,'2')+box(295,70,170,100,'3','#eef8dc')+box(490,70,170,100,'5','#d8e9ff')+text(185,215,'ones')+text(380,215,'tenths')+text(575,215,'hundredths')+formula('2.35 = 2 + 3/10 + 5/100'));
add('review','Same dimensions, different questions',rect(260,65,240,150)+text(380,47,'2.4 m')+text(555,145,'150 cm',20)+text(380,155,'150 cm = 1.5 m',20)+text(380,271,'Perimeter = 7.8 m')+formula('Area = 2.4 × 1.5 = 3.6 m²'));
for(const [key,{title,body}] of Object.entries(diagrams)) {
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 360" width="760" height="360" role="img" aria-labelledby="title"><title id="title">${escape(title)}</title><rect width="760" height="360" rx="12" fill="#fff"/><g font-family="Arial, sans-serif">${body}</g></svg>\n`;
 fs.writeFileSync(path.join(out,`${key}.svg`),svg);
}
console.log(`Built ${Object.keys(diagrams).length} local diagrams.`);
