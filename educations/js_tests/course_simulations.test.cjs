const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../static/educations/course_simulation_model.js');
test('area models use perpendicular heights, half-diagonals and subtract missing regions',()=>{
 assert.equal(M.area('rectangle',{b:8,h:5}).value,40);
 assert.equal(M.area('parallelogram',{b:12,h:5}).value,60);
 assert.equal(M.area('rhombus',{a:10,b:8}).value,40);
 assert.equal(M.area('trapezium',{a:8,b:14,h:5}).value,55);
 assert.equal(M.area('circle',{r:7}).value,154);
 assert.equal(M.area('border',{l:10,w:6,t:1}).value,36);
 assert.equal(M.area('composite',{l:8,h:6,cutL:3,cutH:2}).value,42);
 assert.throws(()=>M.area('composite',{l:8,h:6,cutL:8,cutH:2}),/smaller/);
 assert.throws(()=>M.area('rectangle',{b:'',h:5}),/Enter/);
 assert.throws(()=>M.area('rectangle',{b:-2,h:5}),/between/);
 assert.match(M.area('circle',{r:3}).formula,/≈/);
});
test('volume and capacity distinguish full internal volume from current contents',()=>{
 assert.equal(M.volume('cube',{s:5,fill:100}).full,125);
 assert.equal(M.volume('cube',{s:5,fill:100}).litres,.125);
 const tank=M.volume('cuboid',{l:40,w:25,h:30,fill:60});
 assert.equal(tank.full,30000);assert.equal(tank.litres,30);assert.equal(tank.waterLitres,18);assert.equal(tank.depth,18);
 assert.equal(M.volume('cylinder',{r:7,h:10,fill:0}).full,1540);
 assert.equal(M.volume('cylinder',{r:7,h:10,fill:0}).water,0);
 assert.throws(()=>M.volume('cube',{s:5,fill:101}),/between/);
});
test('inequalities handle inclusive endpoints and fractional test values',()=>{
 assert.equal(M.inequality({a:3,x:3,op:'<'}).contains,false);
 assert.equal(M.inequality({a:3,x:3,op:'<='}).contains,true);
 assert.equal(M.inequality({a:-2,x:-3,op:'>='}).contains,false);
 const input={compound:true,a:-2,b:4,includeA:true,includeB:false};
 assert.equal(M.inequality({...input,x:-2}).contains,true);
 assert.equal(M.inequality({...input,x:4}).contains,false);
 assert.equal(M.inequality({...input,x:2.5}).contains,true);
 assert.deepEqual(M.inequality({...input,x:0}).integers,[-2,-1,0,1,2,3]);
 assert.throws(()=>M.inequality({...input,a:5,x:0}),/smaller/);
});
test('equation operations preserve the solution, including rational coefficients',()=>{
 let state=M.equation(2,4,12);
 state=M.applyEquation(state,'subtract',4);assert.equal(M.equationText(state),'2x = 8');
 state=M.applyEquation(state,'divide',2);assert.equal(M.equationText(state),'x = 4');assert(M.solved(state));
 assert.equal(M.qtext(M.solution(M.equation([1,4],0,9))),'36');
 for(const operation of ['add','subtract','multiply','divide'])for(const amount of [-7,-2,1,3,8]){
  const initial=M.equation(3,-6,12),next=M.applyEquation(initial,operation,amount);
  assert.deepEqual(M.solution(next),M.solution(initial));
 }
 assert.throws(()=>M.applyEquation(state,'divide',0),/nonzero/);
 assert.throws(()=>M.applyEquation(state,'multiply',0),/nonzero/);
 assert.throws(()=>M.applyEquation(state,'add',1.5),/whole number/);
 assert.throws(()=>M.applyEquation(state,'add',''),/Enter/);
});
test('predictions accept sensible rounding and reject blank and invalid numbers',()=>{
 assert(M.checkAnswer('28.29',M.area('circle',{r:3}).value));
 assert(!M.checkAnswer('28.2',M.area('circle',{r:3}).value));
 assert.throws(()=>M.checkAnswer('',0),/Enter/);
 assert.throws(()=>M.checkAnswer('NaN',0),/between/);
});
