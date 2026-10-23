((root)=>{
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),near=(a,b,tolerance=6)=>distance(a,b)<=tolerance;
 function progress(state,activity='circle8'){
  const shapes=state.shapes||[],tools=state.tools||[],origin=shapes.find(s=>s.type==='point'&&s.label==='O')?.points[0];
  if(!origin)return {done:-1,checks:Array(activity==='sector8'?10:5).fill(false)};
  const circle=shapes.find(s=>s.type==='circle'&&near(s.points[0],origin)&&Math.abs(s.radius-140)<=4);
  const compass=tools.find(t=>t.id==='compass'&&near(t,origin)&&Math.abs((t.radius||100)-140)<=4);
  const radial=shapes.filter(s=>s.type==='line').map(s=>near(s.points[0],origin)?s.points[1]:near(s.points[1],origin)?s.points[0]:null).filter(p=>p&&circle&&Math.abs(distance(p,origin)-circle.radius)<=6);
  const labelled=(name,point)=>shapes.some(s=>s.type==='point'&&s.label===name&&near(s.points[0],point));
  const first=radial.find(p=>labelled('A',p))||radial[0];
  const second=first&&radial.find(p=>{
   const u={x:first.x-origin.x,y:first.y-origin.y},v={x:p.x-origin.x,y:p.y-origin.y};
   return Math.abs((u.x*v.x+u.y*v.y)/(Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y)))<.06;
  });
  const sector=shapes.find(s=>s.type==='sector'&&near(s.sourceCenter||s.points[0],origin)&&Math.abs(distance(s.points[0],s.points[1])-140)<=6&&Math.abs(sectorAngle(s.points)-90)<4&&first&&second&&((near(s.sourcePoints?.[1]||s.points[1],first)&&near(s.sourcePoints?.[2]||s.points[2],second))||(near(s.sourcePoints?.[2]||s.points[2],first)&&near(s.sourcePoints?.[1]||s.points[1],second))));
  const checks=[true,!!(compass||circle),!!circle,!!first,!!first&&labelled('A',first)];
  if(activity==='sector8')checks.push(!!second,!!second&&labelled('B',second),!!sector,!!sector?.detached,!!sector?.detached);
  let done=-1;while(checks[done+1])done++;return {done,checks,origin,circle,first,second,sector};
 }
 function sectorAngle(points){const [o,a,b]=points;return ((Math.atan2(b.y-o.y,b.x-o.x)-Math.atan2(a.y-o.y,a.x-o.x))*180/Math.PI+360)%360;}
 function rotationDelta(previous,current){let delta=current-previous;while(delta>Math.PI)delta-=2*Math.PI;while(delta<-Math.PI)delta+=2*Math.PI;return delta;}
 function validateDrawing(value){
  if(!value||value.version!==1||!Array.isArray(value.shapes)||!Array.isArray(value.tools)||value.shapes.length>2000||value.tools.length>10)return null;
  const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=10000&&Math.abs(p.y)<=10000;
  const types={point:1,line:2,circle:1,arc:1,sector:3,pencil:2,angle:3};
  if(value.shapes.some(s=>!s||!types[s.type]||!Array.isArray(s.points)||s.points.length<types[s.type]||s.points.length>10000||!s.points.every(point)||(['circle','arc'].includes(s.type)&&(!Number.isFinite(s.radius)||s.radius<=0||s.radius>2000))||(s.type==='arc'&&(!Number.isFinite(s.startAngle)||!Number.isFinite(s.sweep)))||(s.label!==undefined&&(typeof s.label!=='string'||s.label.length>20))||(s.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(s.color))||(s.sourcePoints!==undefined&&(!Array.isArray(s.sourcePoints)||s.sourcePoints.length!==3||!s.sourcePoints.every(point)))||(s.sourceCenter!==undefined&&!point(s.sourceCenter))))return null;
  if(value.tools.some(t=>!['ruler','divider','compass','protractor','eraser'].includes(t.id)||!point(t)||!Number.isFinite(t.rotation)||(t.radius!==undefined&&(!Number.isFinite(t.radius)||t.radius<4||t.radius>400))))return null;
  return JSON.parse(JSON.stringify({shapes:value.shapes,tools:value.tools,zoom:Number.isFinite(value.zoom)?Math.max(.75,Math.min(2,value.zoom)):1,ink:/^#[0-9a-f]{6}$/i.test(value.ink)?value.ink:'#284861'}));
 }
 const api={distance,near,progress,sectorAngle,rotationDelta,validateDrawing};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Grade8Drawing=api;
})(typeof window!=='undefined'?window:globalThis);
