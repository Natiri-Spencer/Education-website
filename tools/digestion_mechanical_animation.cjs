/* Mechanical movement and nutrient transport, composited over the human anatomy. */
const {P,tx}=require('./digestion_visuals.cjs');
const SCALE=2.94,OX=144,OY=414;
const TARGETS=new Set(['mouth','swallow','stomach','villi','absorption','ileum']);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function box(x,y,w,h,opacity=.94){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#07182a" fill-opacity="${opacity}" stroke="#537088"/>`;}
function overlay(id){
 if(id==='mouth')return box(24,332,700,49)+tx(40,353,'CHEW: break food up',12,P.gold)+tx(279,353,'MIX: tongue rolls food',12,P.pink)+tx(519,353,'BOLUS: ready to swallow',12,P.green)+tx(40,371,'Watch the lower jaw move and the food pieces gather into one soft ball.',12,P.muted);
 if(id==='swallow')return box(12,18,188,368,1)+tx(26,40,'PERISTALSIS: magnified',12,P.gold)+tx(27,334,'Red: muscles contract behind',10.6,P.red)+tx(27,351,'Pale: muscles relax ahead',10.6,P.green)+tx(27,372,'The squeezing wave moves down.',10.3,P.muted);
 if(id==='stomach')return box(25,333,697,49)+tx(40,354,'CHURNING = squeezing + mixing',13,P.pink)+tx(40,373,'Larger food pieces become a softer mixture called chyme.',12,P.muted);
 if(['villi','absorption','ileum'].includes(id))return box(495,321,248,77)+`<circle cx="508" cy="338" r="4" fill="${P.blue}"/>`+tx(519,342,'Simple sugars → blood',11.5,P.blue)+`<circle cx="508" cy="361" r="4" fill="${P.purple}"/>`+tx(519,365,'Amino acids → blood',11.5,P.purple)+`<circle cx="508" cy="384" r="5" fill="${P.gold}"/>`+tx(519,388,'Fat packets → lacteal',11.5,P.gold)+`<path d="M478 142L421 173L395 190" fill="none" stroke="${P.blue}" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M478 226L426 220L350 245" fill="none" stroke="${P.gold}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
 return '';
}
const cache=new Map();
function region(W,H,cx,cy,rx,ry){
 const key=[W,H,cx,cy,rx,ry].join();if(cache.has(key))return cache.get(key);
 const x0=Math.max(0,Math.floor(OX+(cx-rx)*SCALE)),x1=Math.min(W-1,Math.ceil(OX+(cx+rx)*SCALE));
 const y0=Math.max(0,Math.floor(OY+(cy-ry)*SCALE)),y1=Math.min(H-1,Math.ceil(OY+(cy+ry)*SCALE));
 const cols=[],rows=[];
 for(let x=x0;x<=x1;x++){const local=(x-OX)/SCALE,n=(local-cx)/rx;cols.push({x,local,mask:Math.pow(Math.max(0,1-n*n),2)});}
 for(let y=y0;y<=y1;y++){const local=(y-OY)/SCALE,n=(local-cy)/ry;rows.push({y,local,mask:Math.pow(Math.max(0,1-n*n),2)});}
 const value={cols,rows};cache.set(key,value);return value;
}
function warp(frame,base,W,H,cx,cy,rx,ry,mode,a,b=0){
 const r=region(W,H,cx,cy,rx,ry);
 for(const row of r.rows){
  let wave=1,center=0,factor=0;
  if(mode==='stomach')wave=Math.exp(-Math.pow((row.local-b)/27,2));
  if(mode==='oesophagus'){
   center=394+(row.local-170)*.27;
   const contract=.48*Math.exp(-Math.pow((row.local-(b-23))/15,2));
   const relax=.23*Math.exp(-Math.pow((row.local-(b+23))/20,2));factor=1/(1-contract+relax)-1;
  }
  for(const col of r.cols){
   const m=col.mask*row.mask;if(m<.002)continue;
   let dx=0,dy=0;
   if(mode==='jaw')dy=a*m;
   if(mode==='tongue'){const bulge=Math.exp(-Math.pow((col.local-b)/19,2));dy=-a*bulge*row.mask;dx=-a*.24*bulge*row.mask;}
   if(mode==='stomach'){dx=a*wave*m*(col.local-cx)/rx;dy=a*.25*wave*m;}
   if(mode==='oesophagus')dx=(col.local-center)*factor*m;
   const sx=clamp(col.x+dx*SCALE,0,W-2),sy=clamp(row.y+dy*SCALE,0,H-2),ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
   const p=(iy*W+ix)*3,q=p+W*3,out=(row.y*W+col.x)*3;
   for(let c=0;c<3;c++)frame[out+c]=Math.round((base[p+c]*(1-fx)+base[p+3+c]*fx)*(1-fy)+(base[q+c]*(1-fx)+base[q+3+c]*fx)*fy);
  }
 }
}
function ellipse(frame,W,H,x,y,rx,ry,color,alpha=1,seed=0,texture=false){
 x=OX+x*SCALE;y=OY+y*SCALE;rx=Math.max(1,rx*SCALE);ry=Math.max(1,ry*SCALE);const [cr,cg,cb]=rgb(color);
 const minY=Math.max(0,Math.floor(y-ry)),maxY=Math.min(H-1,Math.ceil(y+ry));
 for(let yy=minY;yy<=maxY;yy++){
  const ny=(yy-y)/ry,span=rx*Math.sqrt(Math.max(0,1-ny*ny)),minX=Math.max(0,Math.floor(x-span)),maxX=Math.min(W-1,Math.ceil(x+span));
  for(let xx=minX;xx<=maxX;xx++){
   const nx=(xx-x)/rx,d=nx*nx+ny*ny;if(d>1)continue;
   const edge=Math.min(1,(1-d)*8),grain=texture?(((xx*13+yy*7+seed*11)%19)-9)*.008:0;
   const shade=texture?clamp(1.05-.18*nx-.2*ny+grain,.52,1.3):1,a=alpha*edge,i=(yy*W+xx)*3;
   frame[i]=frame[i]*(1-a)+Math.min(255,cr*shade)*a;frame[i+1]=frame[i+1]*(1-a)+Math.min(255,cg*shade)*a;frame[i+2]=frame[i+2]*(1-a)+Math.min(255,cb*shade)*a;
  }
 }
}
function line(frame,W,H,x1,y1,x2,y2,color,width=1.5){const steps=Math.ceil(Math.hypot(x2-x1,y2-y1)*1.1);for(let i=0;i<=steps;i++){const p=i/steps;ellipse(frame,W,H,x1+(x2-x1)*p,y1+(y2-y1)*p,width,width,color);}}
function arrow(frame,W,H,x1,y1,x2,y2,color){line(frame,W,H,x1,y1,x2,y2,color,1);const a=Math.atan2(y2-y1,x2-x1);for(const sign of [-1,1])line(frame,W,H,x2,y2,x2-6*Math.cos(a+sign*.5),y2-6*Math.sin(a+sign*.5),color,1);}
function food(frame,W,H,x,y,r,seed=0,alpha=1){ellipse(frame,W,H,x,y,r,r*.8,'#b49261',alpha,seed,true);ellipse(frame,W,H,x-r*.2,y-r*.25,r*.28,r*.2,'#deca9c',alpha*.65);}
function mouthState(t,duration){
 const p=clamp(t/duration),roll=smooth((p-.35)/.4),swallow=smooth((p-.82)/.18),chewing=1-smooth((p-.38)/.2);
 return {p,roll,swallow,chewing,jaw:7.5*Math.sin(t*4.8)*chewing,count:Math.round(8+20*Math.min(1,p/.4)),fragmentRadius:7-4.5*clamp(p/.45)};
}
function mouth(frame,base,W,H,t,duration){
 const s=mouthState(t,duration);
 warp(frame,base,W,H,288,174,86,59,'jaw',s.jaw);
 warp(frame,base,W,H,295,136,63,27,'tongue',7*s.roll,252+s.roll*95);
 if(s.roll<.94){
  for(let i=0;i<s.count;i++){
   const startX=256+(i%6)*12,startY=120+Math.floor(i/6)*4;
   const x=startX+(347-startX)*s.roll+Math.sin(t*6+i)*2*s.chewing;
   const y=startY+(133-startY)*s.roll+Math.cos(t*5+i)*2*s.chewing+s.jaw*.2;
   food(frame,W,H,x,y,s.fragmentRadius*(.75+(i%3)*.15),i);
  }
 }
 if(s.roll>.35){const a=smooth((s.roll-.35)/.5),x=347+(385-347)*s.swallow,y=133+(158-133)*s.swallow;food(frame,W,H,x,y,9.5,a*17,a);}
}
function tubeRadius(y,bolusY){return 17-12*Math.exp(-Math.pow((y-(bolusY-30))/16,2))+8*Math.exp(-Math.pow((y-(bolusY+25))/23,2));}
function peristalsis(frame,base,W,H,t){
 const phase=(t%5)/5,by=91+phase*197,nativeY=175+phase*125;
 warp(frame,base,W,H,416,246,38,92,'oesophagus',0,nativeY);
 food(frame,W,H,394+(nativeY-170)*.27,nativeY,5.5,4);
 // Magnified cutaway: inner radius narrows behind, widens ahead of the bolus.
 const x0=Math.round(OX+47*SCALE),x1=Math.round(OX+157*SCALE),y0=Math.round(OY+63*SCALE),y1=Math.round(OY+313*SCALE);
 for(let yy=y0;yy<=y1;yy++){
  const y=(yy-OY)/SCALE,inner=tubeRadius(y,by),outer=inner+14;
  const contraction=Math.exp(-Math.pow((y-(by-30))/16,2));
  for(let xx=x0;xx<=x1;xx++){
   const x=(xx-OX)/SCALE,d=Math.abs(x-102);if(d>outer)continue;
   let r,g,b;
   if(d<inner){r=93;g=48;b=55;}
   else{const q=(d-inner)/14,shade=.78+.24*Math.sin(q*Math.PI);r=(213+20*contraction)*shade;g=(125-30*contraction)*shade;b=(124-28*contraction)*shade;}
   const grain=((xx*3+yy*7)%11)-5,i=(yy*W+xx)*3;frame[i]=clamp(r+grain,0,255);frame[i+1]=clamp(g+grain,0,255);frame[i+2]=clamp(b+grain,0,255);
  }
 }
 food(frame,W,H,102,by,12,7);
 const cy=by-30,ry=by+25;
 if(cy>67){arrow(frame,W,H,55,cy,88,cy,P.red);arrow(frame,W,H,149,cy,116,cy,P.red);}
 if(ry<309){arrow(frame,W,H,83,ry,60,ry,P.green);arrow(frame,W,H,121,ry,145,ry,P.green);}
}
function stomach(frame,base,W,H,t,duration){
 const p=clamp(t/duration),wy=100+(t%4.5)/4.5*175;
 warp(frame,base,W,H,526,184,99,97,'stomach',9,wy);
 ellipse(frame,W,H,529,185,61,53,'#c3ab7c',.26+.15*p,0,true);
 const n=16+Math.floor(p*18),r=7*(1-p)+2.6*p;
 for(let i=0;i<n;i++){
  const angle=i*2.399+t*.9,radial=.36+(i%5)*.11;
  const x=529+Math.cos(angle)*68*radial,y=185+Math.sin(angle)*59*radial;
  food(frame,W,H,x,y,r*(.8+(i%3)*.12),i,.94);
 }
 for(let i=0;i<9;i++){const q=(t*.24+i/9)%1;ellipse(frame,W,H,495+(i%3)*26,111+q*72,1.8,3.1,'#cde6ed',.8);}
 if(p>.65)for(let i=0;i<13;i++){
  const q=(t*.24+i/13)%1,pts=[[477,217],[428,225],[382,213],[355,219],[322,261]],pos=along(pts,q);
  food(frame,W,H,pos[0],pos[1],2.1,i,.75);
 }
}
function along(points,p){p=clamp(p);const i=Math.min(points.length-2,Math.floor(p*(points.length-1))),q=p*(points.length-1)-i;return [points[i][0]+(points[i+1][0]-points[i][0])*q,points[i][1]+(points[i+1][1]-points[i][1])*q];}
const BLOOD=[[477,139],[433,162],[415,177],[397,190],[376,210],[377,265],[385,310],[425,360]];
const LYMPH=[[477,225],[443,219],[423,216],[403,226],[345,245],[342,280],[333,318],[331,354]];
function absorption(frame,base,W,H,t){
 for(let i=0;i<8;i++){
  const kind=i%3,q=(t*.115+i/8)%1,route=kind===2?LYMPH:BLOOD,[x,y]=along(route,q),color=kind===0?P.blue:kind===1?P.purple:P.gold;
  if(q>.25&&q<.43)ellipse(frame,W,H,x,y,8,10,color,.10);
  if(kind===2&&q>.43){
   ellipse(frame,W,H,x,y,5.1,5.1,P.gold,.95,0,true);
   for(let k=0;k<4;k++)ellipse(frame,W,H,x+Math.cos(k*Math.PI/2)*2.3,y+Math.sin(k*Math.PI/2)*2.3,1.2,1.2,'#fff0bd');
  }else if(kind===2){for(let k=0;k<3;k++)ellipse(frame,W,H,x+k*2.2,y,1.7,1.7,color);}
  else{ellipse(frame,W,H,x,y,kind===0?3.5:3,kind===0?3.5:3,color,1,0,true);}
 }
}
function apply(frame,base,chapter,t,W,H){
 if(!TARGETS.has(chapter.id))return false;
 const local=t-chapter.start,duration=chapter.end-chapter.start;
 if(chapter.id==='mouth')mouth(frame,base,W,H,local,duration);
 else if(chapter.id==='swallow')peristalsis(frame,base,W,H,local);
 else if(chapter.id==='stomach')stomach(frame,base,W,H,local,duration);
 else absorption(frame,base,W,H,local);
 return true;
}
module.exports={apply,overlay,mouthState,tubeRadius,BLOOD,LYMPH,along};
