(function(root){
 'use strict';
 const M=root.CourseMath,NS='http://www.w3.org/2000/svg';
 const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const label=(x,y,s,size=20)=>`<text x="${x}" y="${y}" font-size="${size}" fill="#142e45" text-anchor="middle">${esc(s)}</text>`;
 const line=(x,y,x2,y2,colour='#142e45',dash='')=>`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${colour}" stroke-width="3" stroke-dasharray="${dash}"/>`;
 const polygon=(p,colour='#d0eee6')=>`<polygon points="${p}" fill="${colour}" stroke="#087b74" stroke-width="3"/>`;
 const rect=(x,y,w,h,colour='#d0eee6')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${colour}" stroke="#087b74" stroke-width="3"/>`;
 const circle=(x,y,r,colour='#d0eee6')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${colour}" stroke="#087b74" stroke-width="3"/>`;
 const frame=(title,body)=>`<svg xmlns="${NS}" viewBox="0 0 760 340" role="img" aria-labelledby="course-live-title"><title id="course-live-title">${esc(title)}</title><rect width="760" height="340" fill="white"/><g font-family="Arial,sans-serif">${body}</g></svg>`;
 function areaDrawing(result){
  const {shape,m}=result;let body='';const f=M.fmt;
  if(shape==='rectangle'||shape==='parallelogram'){
   const s=Math.min(40,320/m.b,160/m.h),w=m.b*s,h=m.h*s,x=350-w/2,y=220-h,skew=shape==='parallelogram'?Math.min(65,h/2):0;
   body=polygon(`${x},220 ${x+w},220 ${x+w+skew},${y} ${x+skew},${y}`)+line(x+skew,y,x+skew,220,'#b65618','6 4')+label(x+w/2,252,`base ${f(m.b)} cm`)+label(x+w+skew+77,y+h/2,`h ${f(m.h)} cm`,18);
   if(shape==='rectangle'&&Number.isInteger(m.b)&&Number.isInteger(m.h)&&m.b<=20&&m.h<=20){for(let i=1;i<m.b;i++)body+=line(x+i*s,y,x+i*s,220,'#9bcac1');for(let i=1;i<m.h;i++)body+=line(x,y+i*s,x+w,y+i*s,'#9bcac1');}
  }else if(shape==='rhombus'){
   const s=Math.min(20,340/m.a,180/m.b),w=m.a*s,h=m.b*s;
   body=polygon(`${380-w/2},155 380,${155-h/2} ${380+w/2},155 380,${155+h/2}`)+line(380-w/2,155,380+w/2,155,'#b65618','6 4')+line(380,155-h/2,380,155+h/2,'#b65618','6 4')+label(380,285,`diagonals: ${f(m.a)} cm and ${f(m.b)} cm`);
  }else if(shape==='trapezium'){
   const s=Math.min(20,360/Math.max(m.a,m.b),160/m.h),top=m.a*s,bottom=m.b*s,h=m.h*s;
   body=polygon(`${380-bottom/2},230 ${380+bottom/2},230 ${380+top/2},${230-h} ${380-top/2},${230-h}`)+line(380,230-h,380,230,'#b65618','6 4')+label(380,210-h,`${f(m.a)} cm`)+label(380,265,`${f(m.b)} cm`)+label(380+Math.max(top,bottom)/2+70,230-h/2,`h ${f(m.h)} cm`,18);
  }else if(shape==='circle'){
   const r=Math.min(m.r*12,100);body=circle(380,155,r)+line(380,155,380+r,155,'#b65618')+label(380+r/2,140,`${f(m.r)} cm`,18);
  }else if(shape==='border'){
   const s=Math.min(20,360/(m.l+2*m.t),190/(m.w+2*m.t)),w=(m.l+2*m.t)*s,h=(m.w+2*m.t)*s,x=380-w/2,y=150-h/2;
   body=rect(x,y,w,h,'#e5f1b9')+rect(x+m.t*s,y+m.t*s,m.l*s,m.w*s,'white')+label(380,145,`inner ${f(m.l)} × ${f(m.w)} cm`,18)+label(380,285,`border width ${f(m.t)} cm on every side`,18);
  }else if(shape==='composite'){
   const s=Math.min(23,350/m.l,180/m.h),w=m.l*s,h=m.h*s,cw=m.cutL*s,ch=m.cutH*s,x=380-w/2,y=150-h/2;
   body=polygon(`${x},${y} ${x+w-cw},${y} ${x+w-cw},${y+ch} ${x+w},${y+ch} ${x+w},${y+h} ${x},${y+h}`)+line(x+w-cw,y,x+w,y,'#b65618','6 4')+line(x+w,y,x+w,y+ch,'#b65618','6 4')+label(380,285,`outer ${f(m.l)} × ${f(m.h)} cm; remove ${f(m.cutL)} × ${f(m.cutH)} cm`,18);
  }
  return frame(`${shape} area model; measurements in centimetres`,label(380,32,'Lengths in cm · drawing fitted to the space',18)+body);
 }
 function volumeDrawing(result){
  const {shape,m,fill}=result,f=M.fmt;let body='';
  if(shape==='cylinder'){
   const s=Math.min(16,110/m.r,160/m.h),r=m.r*s,h=m.h*s,x=380,y=245,ellipse=r*.24,waterY=y-h*fill/100;
   body=`<path d="M${x-r} ${y-h} V${y} A${r} ${ellipse} 0 0 0 ${x+r} ${y} V${y-h}" fill="#f4faf9" stroke="#087b74" stroke-width="3"/>`;
   if(fill>0)body+=`<path d="M${x-r} ${waterY} V${y} A${r} ${ellipse} 0 0 0 ${x+r} ${y} V${waterY}" fill="#b5d9ff"/><ellipse cx="${x}" cy="${waterY}" rx="${r}" ry="${ellipse}" fill="#cce5ff" stroke="#407aa7"/>`;
   body+=`<ellipse cx="${x}" cy="${y-h}" rx="${r}" ry="${ellipse}" fill="none" stroke="#087b74" stroke-width="3"/>`+line(x,y-h,x+r,y-h,'#b65618')+label(380,55,`radius ${f(m.r)} cm; height ${f(m.h)} cm`,18);
  }else{
   const s=Math.min(10,280/(m.l+m.w*.6),165/(m.h+m.w*.3)),w=m.l*s,h=m.h*s,dx=m.w*s*.6,dy=m.w*s*.3,x=360-(w+dx)/2,y=245,waterH=h*fill/100;
   body=polygon(`${x+w},${y} ${x+w+dx},${y-dy} ${x+w+dx},${y-h-dy} ${x+w},${y-h}`,'#eef6f2')+rect(x,y-h,w,h,'#f8fcfb');
   if(fill>0)body+=polygon(`${x+w},${y} ${x+w+dx},${y-dy} ${x+w+dx},${y-waterH-dy} ${x+w},${y-waterH}`,'#a2cdf4')+rect(x,y-waterH,w,waterH,'#b5d9ff')+polygon(`${x},${y-waterH} ${x+w},${y-waterH} ${x+w+dx},${y-waterH-dy} ${x+dx},${y-waterH-dy}`,'#cce5ff');
   body+=polygon(`${x},${y-h} ${x+w},${y-h} ${x+w+dx},${y-h-dy} ${x+dx},${y-h-dy}`,'none')+label(380,55,`${f(m.l)} × ${f(m.w)} × ${f(m.h)} cm`,20);
  }
  return frame(`${shape} model, ${fill}% full`,label(380,30,'Dimensions in cm; blue region shows current contents',18)+body+label(380,300,`Fill ${fill}% · water depth ${f(result.depth)} cm`,20));
 }
 function inequalityDrawing(result){
  const pos=n=>80+(n+10)*30,y=165;let body=line(55,y,705,y);
  for(let n=-10;n<=10;n++){body+=line(pos(n),y-5,pos(n),y+5)+label(pos(n),y+29,n,14);}
  const endpoint=(n,closed)=>circle(pos(n),y,8,closed?'#087b74':'white');
  if(result.compound)body+=line(pos(result.a),y,pos(result.b),y,'#087b74')+endpoint(result.a,result.includeA)+endpoint(result.b,result.includeB);
  else {const left=result.op.startsWith('<'),end=left?55:705;body+=line(pos(result.a),y,end,y,'#087b74')+polygon(left?`${end},${y} ${end+13},${y-7} ${end+13},${y+7}`:`${end},${y} ${end-13},${y-7} ${end-13},${y+7}`,'#087b74')+endpoint(result.a,result.op.includes('='));}
  if(result.x>=-10&&result.x<=10)body+=polygon(`${pos(result.x)},${y+40} ${pos(result.x)-7},${y+55} ${pos(result.x)+7},${y+55}`,'#f7bb75')+label(pos(result.x),y+80,`test ${result.x}`,16);
  else body+=label(380,245,'The test value is outside this visible number-line window.',18);
  return frame(result.statement,label(380,60,result.statement,30)+body+label(380,305,'Open circle: excluded · Filled circle: included',18));
 }
 function equationDrawing(state){const [left,right]=M.equationText(state).split(' = ');return frame('An equation with equal left and right values',line(190,180,570,180)+polygon('380,180 340,235 420,235','#e5f1b9')+line(220,95,220,180)+line(540,95,540,180)+rect(70,80,270,65)+rect(440,80,240,65)+label(380,55,'Equal values on both sides',25)+label(205,122,left,Math.max(14,28-left.length/2))+label(560,122,right,26)+label(380,290,'Apply the same operation to both sides.',20));}
 function element(tag,text,attrs={}){const el=document.createElement(tag);if(text!==null)el.textContent=text;for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);return el;}
 const options=(select,items)=>items.forEach(([value,text])=>select.append(element('option',text,{value})));
 function feedback(node,message,error=false){node.textContent=message;node.dataset.state=error?'error':'ok';}
 function field(grid,key,title,value,onChange,{type='number',min='.1',max='1000',step='.1'}={}){
  const wrapper=element('label',title),input=element('input',null,{type,'data-field':key});
  if(type==='checkbox')input.checked=Boolean(value);else {input.value=String(value);if(type==='number'||type==='range'){input.min=min;input.max=max;input.step=step;input.inputMode='decimal';}}
  wrapper.append(input);grid.append(wrapper);input.addEventListener(type==='checkbox'?'change':'input',onChange);return input;
 }
 function predict(stage,labelText,getAnswer,status){
  const form=element('form',null,{class:'course-sim-predict'}),wrapper=element('label',labelText),input=element('input',null,{type:'number',step:'any','data-prediction':''}),button=element('button','Check prediction',{type:'submit'});
  wrapper.append(input);form.append(wrapper,button);stage.append(form);
  form.addEventListener('submit',event=>{event.preventDefault();try{feedback(status,M.checkAnswer(input.value,getAnswer())?'Correct. Explain the method you used.':'Try again. Check the formula, boundary or units before recalculating.');}catch(error){feedback(status,error.message,true);}});
 }
 const AREA_FIELDS={rectangle:[['b','Base',8],['h','Height',5]],parallelogram:[['b','Base',12],['h','Perpendicular height',5]],rhombus:[['a','Diagonal 1',10],['b','Diagonal 2',8]],trapezium:[['a','Parallel side 1',8],['b','Parallel side 2',14],['h','Perpendicular height',5]],circle:[['r','Radius',7]],border:[['l','Inner length',10],['w','Inner width',6],['t','Border width',1]],composite:[['l','Outer length',8],['h','Outer height',6],['cutL','Removed width',3],['cutH','Removed height',2]]};
 const VOLUME_FIELDS={cube:[['s','Edge length',5]],cuboid:[['l','Inside length',40],['w','Inside width',25],['h','Inside height',30]],cylinder:[['r','Inside radius',7],['h','Inside height',10]]};
 function mountMeasurement(stage,data){
  const isArea=data.kind==='area',definitions=isArea?AREA_FIELDS:VOLUME_FIELDS;
  stage.append(element('p',isArea?'Enter all lengths in centimetres. Predict the shaded area in cm². For circles, use π = 22/7.':'Use centimetres for all inside dimensions. Predict the full volume in cm³. Capacity assumes these are the inside dimensions of a container. Use π = 22/7 for cylinders.'));
  const choiceLabel=element('label','Shape'),choice=element('select',null,{'data-shape-choice':''});
  options(choice,Object.keys(definitions).map(key=>[key,key==='composite'?'L shape':key==='border'?'Rectangular border':key[0].toUpperCase()+key.slice(1)]));choice.value=definitions[data.shape]?data.shape:(isArea?'rectangle':'cuboid');choiceLabel.append(choice);stage.append(choiceLabel);
  const fields=element('fieldset'),legend=element('legend','Change the measurements'),grid=element('div',null,{class:'course-sim-controls'});fields.append(legend,grid);stage.append(fields);
  const canvas=element('div',null,{class:'course-sim-canvas'}),reading=element('div','Make a prediction, then check it or show the worked calculation.',{class:'course-sim-reading','data-reading':''}),status=element('p','',{class:'course-sim-feedback',role:'status'});
  stage.append(canvas);let inputs={},current,reveal=false;
  function render(){
   try{const values=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,input.value]));current=isArea?M.area(choice.value,values):M.volume(choice.value,values);canvas.innerHTML=isArea?areaDrawing(current):volumeDrawing(current);reading.textContent=reveal?(isArea?current.formula:`Full volume: ${current.formula}. Full capacity: ${M.fmt(current.litres,6)} L. At ${current.fill}%: ${M.fmt(current.water,6)} cm³ (${M.fmt(current.waterLitres,6)} L). Displayed results are rounded where needed.`):'Make a prediction, then check it or show the worked calculation.';feedback(status,'');}
   catch(error){current=null;canvas.replaceChildren();reading.textContent='Check the measurements.';feedback(status,error.message,true);}
  }
  function changed(){reveal=false;render();}
  function build(){inputs={};grid.replaceChildren();for(const [key,title,value]of definitions[choice.value])inputs[key]=field(grid,key,`${title} (cm)`,value,changed);if(!isArea)inputs.fill=field(grid,'fill','Fill (%)',60,changed,{type:'range',min:'0',max:'100',step:'5'});changed();}
  choice.addEventListener('change',build);build();
  predict(stage,isArea?'Your predicted area (cm²)':'Your predicted full volume (cm³)',()=>{if(!current)throw Error('Correct the measurements first.');return isArea?current.value:current.full;},status);
  const revealButton=element('button','Show worked calculation',{type:'button','data-reveal':''});revealButton.addEventListener('click',()=>{reveal=true;render();});stage.append(status,revealButton,reading);
  if(!isArea)stage.append(element('p','1000 cm³ = 1 L. The fill percentage changes the current contents, while full capacity stays the same.'));
 }
 function mountInequality(stage,data){
  stage.append(element('p','Set a comparison, predict whether a value satisfies it, then check. The line includes fractional values, not just the integers labelled.'));
  const typeLabel=element('label','Comparison type'),type=element('select',null,{'data-inequality-type':''});options(type,[['simple','Simple inequality'],['compound','Compound inequality (and)']]);type.value=data.compound==='true'?'compound':'simple';typeLabel.append(type);stage.append(typeLabel);
  const grid=element('div',null,{class:'course-sim-controls'}),canvas=element('div',null,{class:'course-sim-canvas'}),reading=element('p','',{class:'course-sim-reading'}),status=element('p','',{class:'course-sim-feedback',role:'status'});stage.append(grid,canvas,reading);
  let inputs={},symbol,current,showIntegers=false;
  function render(){try{current=M.inequality({compound:type.value==='compound',a:inputs.a.value,b:inputs.b?.value,x:inputs.x.value,includeA:inputs.includeA?.checked,includeB:inputs.includeB?.checked,op:symbol?.value});canvas.innerHTML=inequalityDrawing(current);reading.textContent=showIntegers?`Integer solutions shown between −10 and 10: ${current.integers.join(', ')||'none'}. Fractional solutions may also be included.`:`Comparison: ${current.statement}. Is ${current.x} included?`;feedback(status,'');}catch(error){current=null;canvas.replaceChildren();reading.textContent='Check the boundaries.';feedback(status,error.message,true);}}
  function changed(){showIntegers=false;render();}
  function build(){inputs={};grid.replaceChildren();const compound=type.value==='compound';inputs.a=field(grid,'a',compound?'Lower boundary':'Boundary',compound?-2:3,changed,{min:'-10',max:'10',step:'.5'});
   if(compound){inputs.b=field(grid,'b','Upper boundary',4,changed,{min:'-10',max:'10',step:'.5'});inputs.includeA=field(grid,'includeA','Include lower boundary',true,changed,{type:'checkbox'});inputs.includeB=field(grid,'includeB','Include upper boundary',false,changed,{type:'checkbox'});}
   else{const wrapper=element('label','Symbol');symbol=element('select',null,{'data-symbol':''});options(symbol,[['<','< less than'],['<=','≤ at most'],['>','> greater than'],['>=','≥ at least']]);symbol.addEventListener('change',changed);wrapper.append(symbol);grid.append(wrapper);}
   inputs.x=field(grid,'x','Test value',3,changed,{min:'-100',max:'100',step:'.5'});changed();
  }
  type.addEventListener('change',build);build();
  const answerLabel=element('label','Your prediction'),answer=element('select',null,{'data-membership-prediction':''});options(answer,[['','Choose a prediction'],['yes','Yes, it satisfies the inequality'],['no','No, it does not satisfy it']]);answerLabel.append(answer);stage.append(answerLabel);
  const check=element('button','Check prediction',{type:'button'});check.addEventListener('click',()=>{if(!current){feedback(status,'Correct the boundaries first.',true);return;}if(!answer.value){feedback(status,'Choose yes or no first.',true);return;}const correct=(answer.value==='yes')===current.contains;feedback(status,`${correct?'Correct.':'Try again.'} ${current.x} ${current.contains?'satisfies':'does not satisfy'} ${current.statement}. Check both comparisons and whether the endpoint is included.`);});
  const integers=element('button','Show integer examples',{type:'button'});integers.addEventListener('click',()=>{showIntegers=true;render();});const actions=element('div',null,{class:'course-learning-tools'});actions.append(check,integers);stage.append(actions,status);
 }
 const PRESETS=[{label:'x + 8 = 21',args:[1,8,21]},{label:'5x = 35',args:[5,0,35]},{label:'2x + 4 = 12',args:[2,4,12]},{label:'x / 4 = 9',args:[[1,4],0,9]},{label:'3x − 6 = 12',args:[3,-6,12]}];
 function mountEquations(stage){
  stage.append(element('p','Choose an equation. Apply the same operation to both sides until the unknown is isolated as x = a number. Predict x and check by substitution. The balance drawing represents equality, not physical masses.'));
  const choiceLabel=element('label','Starting equation'),choice=element('select',null,{'data-equation-preset':''});options(choice,PRESETS.map((item,index)=>[index,item.label]));choiceLabel.append(choice);stage.append(choiceLabel);
  const canvas=element('div',null,{class:'course-sim-canvas'}),reading=element('p','',{class:'course-sim-reading','data-reading':''}),history=element('ol',null,{'aria-label':'Equation steps'}),status=element('p','',{class:'course-sim-feedback',role:'status'});stage.append(canvas,reading,history);
  let state,count=0;
  function render(){canvas.innerHTML=equationDrawing(state);reading.textContent=`${M.equationText(state)}${M.solved(state)?' — unknown isolated. Substitute into the starting equation to check.':''}`;}
  function reset(){state=M.equation(...PRESETS[Number(choice.value)].args);count=0;history.replaceChildren();feedback(status,'');render();}
  choice.addEventListener('change',reset);reset();
  const grid=element('div',null,{class:'course-sim-controls'}),opLabel=element('label','Operation on both sides'),operation=element('select',null,{'data-operation':''});options(operation,[['subtract','Subtract'],['add','Add'],['divide','Divide by'],['multiply','Multiply by']]);opLabel.append(operation);grid.append(opLabel);const amount=field(grid,'amount','Whole-number amount',8,()=>{},{min:'-100',max:'100',step:'1'});stage.append(grid);
  const apply=element('button','Apply to both sides',{type:'button','data-apply':''});apply.addEventListener('click',()=>{try{if(count>=12)throw Error('You have tried 12 steps. Reset and look for inverse operations that simplify the equation.');state=M.applyEquation(state,operation.value,amount.value);count++;history.append(element('li',`${operation.selectedOptions[0].textContent} ${amount.value} on both sides: ${M.equationText(state)}`));render();feedback(status,M.solved(state)?'Unknown isolated. Check your answer in the starting equation.':'Both sides remain equal. Choose your next inverse operation.');}catch(error){feedback(status,error.message,true);}});
  const resetButton=element('button','Reset equation',{type:'button'});resetButton.addEventListener('click',reset);const actions=element('div',null,{class:'course-learning-tools'});actions.append(apply,resetButton);stage.append(actions);
  predict(stage,'Your predicted value of x',()=>{const q=M.solution(state);return q.n/q.d;},status);stage.append(status);
 }
 function mount(stage,data){if(stage.dataset.mounted)return;stage.replaceChildren();if(data.kind==='area'||data.kind==='volume')mountMeasurement(stage,data);else if(data.kind==='inequalities')mountInequality(stage,data);else if(data.kind==='equations')mountEquations(stage);else throw Error('This activity is not available. Use the diagram and written lesson.');stage.dataset.mounted='true';}
 root.CourseSimulations={mount};
})(typeof globalThis!=='undefined'?globalThis:this);
