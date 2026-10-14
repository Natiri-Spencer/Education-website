((root)=>{
 const units={'cm³':1,'m³':1000000,mL:1,L:1000};
 const activities={
  cuboids:{title:'Rectangular Prisms — Volume',formula:'Volume = L × W × H',steps:['Measure the length using the ruler and enter it.','Measure and enter the width.','Measure and enter the height.','Multiply length × width × height. Enter the volume in cm³.','Verify your results and explain your calculation.']},
  cylinders:{title:'Cylinders — Volume',formula:'Volume = π × r² × h (use π = 3.142)',steps:['Measure the radius from the centre to the edge.','Measure the cylinder height.','Calculate 3.142 × radius × radius × height.','Round the volume to two decimal places in cm³.','Verify and record your result.']},
  fixed:{title:'Volume of Fixed Measurement',formula:'Volume = L × W × H',steps:['Read the fixed dimensions on the solid.','Enter its length, width and height.','Multiply the three measurements.','Enter the volume with cubic units.','Verify, then try a new fixed example.']},
  converting:{title:'Converting Between Units',formula:'1 L = 1,000 mL; 1 m³ = 1,000,000 cm³',steps:['Read the starting value and unit.','Identify the unit you are converting to.','Choose the conversion factor.','Enter the equivalent value.','Verify and record the conversion.']},
  units:{title:'Understanding Units of Measurement',formula:'Length: cm • Area: cm² • Volume: cm³',steps:['Inspect the highlighted length, face or solid.','Identify whether it shows length, area, volume or capacity.','Choose a suitable unit for this measurement.','Verify and read the correction.']},
  relationship:{title:'Relationship Between Volume and Capacity',formula:'1 cm³ = 1 mL; 1,000 cm³ = 1 L',steps:['Measure the inside length, width and height.','Calculate the full inside volume in cm³.','Express the capacity in mL and L.','Adjust the water level and calculate the water present.','Verify and describe how volume and capacity are related.']}
 };
 function convert(value,from,to){return Number.isFinite(value)&&units[from]&&units[to]?value*units[from]/units[to]:null;}
 function expected(activity,state){const volume=state.l*state.w*state.h;
  if(activity==='cuboids'||activity==='fixed')return {l:state.l,w:state.w,h:state.h,volume};
  if(activity==='cylinders')return {radius:state.r,height:state.h,volume:Math.round(3.142*state.r**2*state.h*100)/100};
  if(activity==='relationship')return {volume,ml:volume,litres:volume/1000,water:volume*state.fill/100};
  if(activity==='converting')return {converted:convert(state.value,state.from,state.to)};
  return {unit:['cm','cm²','cm³','mL'][state.unitTask]};
 }
 function grade(activity,state,answers){const correct=expected(activity,state),checks=Object.entries(correct).map(([key,value])=>({key,expected:value,correct:typeof value==='number'?answers[key]!==''&&answers[key]!=null&&Number.isFinite(Number(answers[key]))&&Math.abs(Number(answers[key])-value)<=Math.max(activity==='cylinders'&&key==='volume'?.0051:1e-8,Math.abs(value)*1e-9):answers[key]===value}));return {score:checks.filter(c=>c.correct).length,total:checks.length,checks};}
 function calculate(input){if(typeof input!=='string'||input.length>200)return null;const value=input.replace(/×/g,'*').replace(/÷/g,'/').replace(/\s/g,'');if(!/^[0-9.+*/()-]+$/.test(value))return null;const tokens=value.match(/\d*\.?\d+|[()+*/-]/g);if(!tokens||tokens.join('')!==value)return null;let i=0;function atom(){if(tokens[i]==='-'){i++;return -atom();}if(tokens[i]==='+'){i++;return atom();}if(tokens[i]==='('){i++;const n=sum();if(tokens[i++]!==')')throw Error();return n;}const n=Number(tokens[i++]);if(!Number.isFinite(n))throw Error();return n;}function product(){let n=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=atom();n=op==='*'?n*b:n/b;}return n;}function sum(){let n=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();n=op==='+'?n+b:n-b;}return n;}try{const n=sum();return i===tokens.length&&Number.isFinite(n)?n:null;}catch(_){return null;}}
 const api={activities,convert,expected,grade,calculate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Grade7Capacity=api;
})(typeof window!=='undefined'?window:globalThis);
