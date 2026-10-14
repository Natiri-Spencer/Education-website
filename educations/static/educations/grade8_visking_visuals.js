((root)=>{
 const label=(x,y,value,size=14)=>`<text x="${x}" y="${y}" text-anchor="middle" style="font-size:${size}px">${value}</text>`;
 const dot=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#ffffffaa" stroke-width="1"/>`;
 function scene(stage,p,placed,f,mode){
  const sugar=mode==='retained',t=stage>=5?1:stage===4?p:0,scale=sugar?f.bag:1;
  const width=49*scale,top=185-(sugar?12*t:0),bottom=390+(sugar?14*t:0),waterY=stage===2?425-240*p:185+(sugar?22*t:0);
  const bag=`M250 ${top} C${250-width*.9} ${top+24} ${250-width} 270 ${250-width} 320 Q${250-width} 375 250 ${bottom} Q${250+width} 375 ${250+width} 320 C${250+width} 270 ${250+width*.9} ${top+24} 250 ${top}Z`;
  let v=`<g class="g8-visking-scene"><defs><linearGradient id="visking-water" x2="0" y2="1"><stop stop-color="#a4e1f5" stop-opacity=".55"/><stop offset="1" stop-color="#55b5df" stop-opacity=".75"/></linearGradient><linearGradient id="visking-glass"><stop stop-color="#e3f6ff" stop-opacity=".6"/><stop offset=".3" stop-color="#fff" stop-opacity=".06"/><stop offset=".8" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#9fbcca" stop-opacity=".65"/></linearGradient><linearGradient id="visking-bag"><stop stop-color="#e9d8a1" stop-opacity=".65"/><stop offset=".4" stop-color="#fff9e4" stop-opacity=".25"/><stop offset="1" stop-color="#c5ae71" stop-opacity=".65"/></linearGradient><clipPath id="visking-interior"><path d="${bag}"/></clipPath><marker id="visking-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill="#1682dc"/></marker></defs><rect width="900" height="550" fill="#f6fbfd"/><path d="M0 430 H900 V550 H0Z" fill="#d5e0e6"/>${label(450,32,sugar?'OSMOSIS USING VISKING TUBING':'VISKING TUBING: SALT DIFFUSION COMPARISON',20)}`;
  if(placed.has('beakers')){
   v+='<ellipse cx="250" cy="434" rx="180" ry="13" fill="#718a9b" opacity=".15"/><path d="M80 110 V410 Q80 430 102 430 H398 Q420 430 420 410 V110" fill="url(#visking-glass)" stroke="#6b8f9f" stroke-width="4"/>';
   if(stage>=2)v+=`<path data-visking-water-level="${waterY}" d="M85 ${waterY} H415 V408 Q415 425 397 425 H103 Q85 425 85 408Z" fill="url(#visking-water)"/><ellipse cx="250" cy="${waterY}" rx="165" ry="9" fill="#b7edff" stroke="#6ebada" stroke-width="2"/>`;
   v+='<ellipse cx="250" cy="110" rx="170" ry="12" fill="#edf7fc88" stroke="#7298a9" stroke-width="4"/><path d="M95 131 V397" stroke="#fff" stroke-width="7" opacity=".8"/>';
   if(placed.has('tubing')){
    v+=`<path data-visking-bag-height="${bottom-top}" data-visking-bag-width="${width*2}" d="${bag}" fill="url(#visking-bag)" stroke="#aa9462" stroke-width="2.5"/>`;
    if(stage>=3){v+=`<g clip-path="url(#visking-interior)"><rect x="170" y="${stage===3?390-190*p:200}" width="160" height="200" fill="#fff1b8" fill-opacity=".4"/>`;
     for(let i=0;i<10;i++){const spread=sugar?1:1+2*t;v+=dot(250+(i%3-1)*22*spread,230+Math.floor(i/3)*40,sugar?7:3.5,'#e6b637');}
     for(let i=0;i<16+Math.round(sugar?16*t:0);i++)v+=dot(250+Math.sin(i*4.1+p*2)*width*.72,220+(i*31)%157,3.5,'#2aace8');
     v+='</g>';
     if(!sugar)for(let i=0;i<8;i++)v+=dot(250+(i%2?1:-1)*(60+95*t),245+i%4*40,3.5,'#e6b637');
    }
    v+=`<path d="M250 ${top} L234 ${top-20} L249 ${top-30} L266 ${top-20}Z M250 ${bottom} L233 ${bottom+18} Q250 ${bottom+24} 268 ${bottom+18}Z" fill="#efe0b3" stroke="#ab9766"/><path d="M240 ${top} H261 M240 ${top+4} H261 M240 ${bottom} H262 M240 ${bottom+4} H262" stroke="#b39759" stroke-width="4"/>`;
    if(stage>=4&&sugar){for(let i=0;i<3;i++){const y=245+i*48;v+=`<path d="M${135-i*4} ${y-20} Q165 ${y} ${245-width} ${y}" fill="none" stroke="#1682dc" stroke-width="3" marker-end="url(#visking-arrow)"/>`;const q=(p*2+i/3)%1;v+=dot(135+(105-width)*q,y-20+20*q,4,'#159de2');}}
   }
   v+=label(110,83,'Distilled water',13)+`<path d="M110 88 L135 195" stroke="#416677" stroke-width="1.5"/>`+label(250,460,sugar?'Concentrated sugar solution':'Salt solution',14);
  }
  v+=`<rect x="475" y="92" width="400" height="300" rx="12" fill="#fff" stroke="#8db7cd"/>${label(675,118,'ENLARGED MEMBRANE VIEW',15)}<path d="M665 155 V310" stroke="#bda36a" stroke-width="16"/><path d="M665 182 V194 M665 235 V247 M665 286 V298" stroke="#eef7fb" stroke-width="16"/>${label(570,144,'Outside: dilute',12)}${label(770,144,'Inside: concentrated',12)}`;
  for(let i=0;i<10;i++){const q=stage>=4?(p*1.5+i/10)%1:i/10;v+=dot(510+q*330,170+i%4*36,4,'#219ce1');}
  for(let i=0;i<7;i++)v+=dot(sugar?715+i%3*48:stage>=4?520+((i/7+t*.5)%1)*320:715+i%3*48,190+i%3*48,sugar?8:4,'#e4b43b');
  v+=`<path d="M570 252 H745" stroke="#1682dc" stroke-width="4" marker-end="url(#visking-arrow)"/><path d="M740 210 H605" stroke="#1682dc" stroke-width="1.5" marker-end="url(#visking-arrow)"/>${label(675,333,sugar?'Net water movement into the bag':'Salt ions can diffuse through the tubing',13)}${label(675,359,sugar?'Water enters; large solute stays inside':'Salt is not permanently trapped',12)}${label(675,380,'Blue = water; gold = dissolved solute',11)}`;
  if(stage===2||stage===3){const x=stage===2?125:250,tip=stage===2?waterY:top+30;v+=`<g data-visking-pour="${stage===2?'water':'solution'}"><path d="M${x-15} 55 H${x+15} V86 H${x-15}Z" fill="#a2d7ed" stroke="#6f9dab"/><path d="M${x} 86 V${tip}" stroke="#53bee5" stroke-width="5"/></g>`;}
  v+=`<rect x="25" y="480" width="850" height="48" rx="8" fill="#e4f2fa"/>${label(450,501,stage<4?'Pour water first, then solution into the tubing and seal it.':sugar?'Water enters through the membrane; the bag swells.':'Small salt ions diffuse out; sustained swelling is not assumed.',13)}${label(450,519,'Illustrative particles and accelerated time; sugar mode uses tubing that retains sucrose.',10)}</g>`;
  return v;
 }
 const api={scene};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Grade8ViskingVisuals=api;
})(typeof window!=='undefined'?window:globalThis);
