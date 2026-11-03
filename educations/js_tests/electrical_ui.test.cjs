const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const engine=require('../static/educations/electrical_model.js'),art=require('../static/educations/electrical_apparatus.js');
function laboratory(storage=new Map()){
 const nodes={},methods=['simple','bulbs','cells'];let buttons;
 class Element{
  constructor(){this.value='';this.hidden=false;this.disabled=false;this.checked=false;this.children=[];this.dataset={};this.style={};this.attributes={};this.textContent='';this._html='';}
  setAttribute(k,v){this.attributes[k]=v;}replaceChildren(...c){this.children=c;}append(...c){this.children.push(...c);}
  set innerHTML(value){this._html=value;this.terminals=[...value.matchAll(/data-ee-terminal="([^"]+)"/g)].map(m=>Object.assign(new Element(),{dataset:{eeTerminal:m[1]}}));this.parts=[...value.matchAll(/data-ee-part="([^"]+)"/g)].map(m=>Object.assign(new Element(),{dataset:{eePart:m[1]}}));}
  get innerHTML(){return this._html;}
  querySelectorAll(s){if(s==='[data-ee-method]')return buttons;if(s==='[data-ee-item]')return get('ee-shelf-items').children;if(s==='[data-ee-terminal]')return this.terminals||[];if(s==='option')return this.children;return [];}
  querySelector(s){let m=s.match(/data-ee-terminal="([^"]+)"/);if(m)return this.terminals?.find(n=>n.dataset.eeTerminal===m[1]);m=s.match(/data-ee-part="([^"]+)"/);if(m)return this.parts?.find(n=>n.dataset.eePart===m[1]);if(s==='option[value="b2"]')return this.children.find(o=>o.value==='b2');return null;}
  insertRow(){const row=new Element();row.insertCell=()=>{const c=new Element();row.children.push(c);return c;};this.children.push(row);return row;}
  createSVGPoint(){return {x:0,y:0,matrixTransform(){return {x:this.x,y:this.y};}};}getScreenCTM(){return {inverse:()=>({})};}addEventListener(){}focus(){}
 }
 const get=id=>nodes[id]??=new Element();buttons=methods.map(m=>Object.assign(new Element(),{dataset:{eeMethod:m}}));get('ee-current').children=['main','b1','b2'].map(value=>Object.assign(new Element(),{value}));get('ee-voltage').children=['source','b1','b2'].map(value=>Object.assign(new Element(),{value}));
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../static/educations/electrical_energy.js'),'utf8'),{window:{Grade7Electrical:engine,Grade7ElectricalApparatus:art,scrollTo(){}},document:{getElementById:get,createElement:()=>new Element(),createElementNS:()=>new Element(),querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});
 const blank={closest:()=>null},positions={c1:[100,150],c2:[300,150],switch:[500,150],ammeter:[700,150],b1:[100,370],b2:[300,370],voltmeter:[500,370]};
 const fill=(id,value)=>{get('ee-'+id).value=value;get('ee-'+id).oninput();};
 const wire=(a,b)=>{for(const id of [a,b]){const port=get('ee-drawing').querySelector(`[data-ee-terminal="${id}"]`);assert(port,'Port '+id+' exists');port.onkeydown({key:'Enter',preventDefault(){},stopPropagation(){}});}};
 const place=(id,x,y)=>{get('ee-shelf-items').children.find(b=>b.dataset.eeItem===id).onclick();if(id!=='wires')get('ee-drawing').onclick({clientX:x,clientY:y,target:blank});};
 const assemble=()=>{for(const b of get('ee-shelf-items').children)if(!b.disabled){const id=b.dataset.eeItem;place(id,...(positions[id]||[400,260]));}};
 const build=(settings={})=>{assemble();const b=engine.layout({method:'simple',bulbs:'series',cells:'series',current:'main',voltage:'source',...settings});for(const pair of b.pairs.concat([['v+',b.voltageTarget[0]],['v-',b.voltageTarget[1]]]))wire(...pair);};
 const check=()=>get('ee-check').onclick(),sw=()=>get('ee-switch').onclick();
 const record=(current,voltage,brightness)=>{fill('prediction','I predict a change in brightness.');fill('conclusion','The meter readings support my comparison.');for(const[id,v]of Object.entries({current,voltage,brightness}))fill('answer-'+id,v);get('ee-record').onclick();};
 const choose=(id,value)=>{get('ee-'+id).value=value;get('ee-'+id).onchange();};
 const removeProbe=id=>get('ee-wires').children.find(b=>b.textContent.includes(id)).onclick();
 return {get,fill,wire,place,assemble,build,check,sw,record,choose,removeProbe,storage,method:m=>buttons[methods.indexOf(m)].onclick()};
}
test('apparatus stays on shelf until learner chooses a bench position; no target slots',()=>{
 const a=laboratory();assert(!a.get('ee-drawing').innerHTML.includes('ee-placeholder'));a.get('ee-shelf-items').children[0].onclick();assert(!a.get('ee-drawing').innerHTML.includes('data-ee-part='));a.get('ee-drawing').onclick({clientX:170,clientY:125,target:{closest:()=>null}});assert(a.get('ee-drawing').innerHTML.includes('translate(170 125)'));assert(a.get('ee-switch').disabled);
});
test('correct wiring is not assessed or powered until learner explicitly checks',()=>{
 const a=laboratory();a.build();assert(a.get('ee-record').disabled);a.sw();assert.equal(a.get('electrical-lab-app').dataset.powered,'false');a.check();assert.equal(a.get('ee-check').dataset.checked,'true');a.sw();assert.equal(a.get('electrical-lab-app').dataset.powered,'true');assert(a.get('ee-drawing').innerHTML.includes('data-ee-reading="0.30 A"'));a.record('.30','3.00','bright');assert.equal(a.get('ee-mark').textContent,'3/3. Correct.');const note=JSON.parse(a.storage.get('grade7-electrical-simple'))[0];assert(note.prediction&&note.conclusion);a.get('ee-reset').onclick();assert(a.get('ee-notebook-title').textContent.includes('1 entries'));
});
test('selecting a parallel challenge keeps learner wiring and demands manual revision',()=>{
 const a=laboratory();a.method('bulbs');a.build({method:'bulbs'});a.check();a.sw();a.record('.15','3','dim');const n=a.get('ee-wire-count').textContent;a.choose('bulbs','parallel');assert.equal(a.get('ee-wire-count').textContent,n);assert(a.get('ee-switch').disabled);a.check();assert.equal(a.get('ee-check').dataset.checked,'false');a.get('ee-clear-wires').onclick();a.build({method:'bulbs',bulbs:'parallel'});a.check();a.sw();a.record('.60','3','bright');assert.equal(a.get('ee-mark').textContent,'3/3. Correct.');assert(a.get('ee-notebook-title').textContent.includes('2 entries'));
});
test('current and voltage choices do not auto-reposition meters or reconnect probes',()=>{
 const a=laboratory();a.method('bulbs');a.choose('bulbs','parallel');a.choose('current','b1');a.build({method:'bulbs',bulbs:'parallel',current:'b1'});a.check();assert.equal(a.get('ee-check').dataset.checked,'true');a.sw();a.record('.30','3','bright');const n=a.get('ee-wire-count').textContent;a.choose('voltage','b1');assert.equal(a.get('ee-wire-count').textContent,n);a.check();assert.equal(a.get('ee-check').dataset.checked,'false');a.removeProbe('V+');a.removeProbe('V−');a.wire('v+','b1+');a.wire('v-','b1-');a.check();a.sw();a.record('.30','3','bright');assert.equal(a.get('ee-mark').textContent,'3/3. Correct.');
});
test('incorrect wiring receives feedback only after Check and cannot be energized',()=>{
 const a=laboratory();a.build();a.wire('a+','c1+');assert.equal(a.get('electrical-lab-app').dataset.fault,'false');assert(a.get('ee-check-results').hidden);a.check();assert.equal(a.get('electrical-lab-app').dataset.fault,'true');assert(a.get('ee-check-results').children.some(n=>n.textContent.includes('bypasses')));a.sw();assert.equal(a.get('electrical-lab-app').dataset.powered,'false');
});
test('overlapping apparatus must be separated; keyboard movement and return-to-shelf work',()=>{
 const a=laboratory();a.build();const d=a.get('ee-drawing');for(let i=0;i<10;i++)d.onkeydown({key:'ArrowLeft',target:{closest:()=>({dataset:{eePart:'c2'}})},preventDefault(){}});a.check();assert(a.get('ee-check-results').children.some(n=>n.textContent.includes('Leave space')));d.onkeydown({key:'Delete',target:{closest:()=>({dataset:{eePart:'c2'}})},preventDefault(){}});assert(!a.get('ee-drawing').innerHTML.includes('data-ee-part="c2"'));assert(!a.get('ee-shelf-items').children.find(b=>b.dataset.eeItem==='c2').disabled);
});
test('notebooks remain separate and old entries still load after reset and reload',()=>{
 const storage=new Map(),a=laboratory(storage);a.build();a.check();a.sw();a.record('.30','3','bright');a.method('cells');a.choose('cells','parallel');a.build({method:'cells',cells:'parallel'});a.check();a.sw();a.record('.15','1.5','dim');assert.equal(a.get('ee-mark').textContent,'3/3. Correct.');const b=laboratory(storage);assert(b.get('ee-notebook-title').textContent.includes('1 entries'));b.method('cells');assert(b.get('ee-notebook-title').textContent.includes('1 entries'));
});
test('prediction and conclusion are saved for review, not automatically marked correct',()=>{
 const a=laboratory();a.build();a.check();a.sw();a.get('ee-record').onclick();assert.match(a.get('ee-mark').textContent,/prediction.*conclusion/);a.fill('prediction','My prediction');a.fill('conclusion','My evidence');a.get('ee-record').onclick();assert.equal(a.get('ee-mark').textContent,'Enter current, voltage and brightness.');
});


test('final step opens the notebook and completes only after tested results are saved',()=>{
 const a=laboratory();const last=()=>a.get('ee-steps').children[5];
 assert.match(last().children[1].textContent,/Record & check/);
 let focused=false;a.get('ee-answer-current').focus=()=>{focused=true;};last().children[2].onclick();assert(focused);
 a.build();a.check();assert(a.get('ee-record').disabled);a.record('.30','3','bright');assert(!a.storage.has('grade7-electrical-simple'));assert.notEqual(last().className,'ee-step-done');
 a.sw();assert(!a.get('ee-record').disabled);a.record('.30','3','bright');assert.equal(last().className,'ee-step-done');assert.equal(JSON.parse(a.storage.get('grade7-electrical-simple')).length,1);
});
