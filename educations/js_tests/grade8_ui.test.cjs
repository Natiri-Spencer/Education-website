const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const model=require('../static/educations/grade8_model.js'),visuals=require('../static/educations/grade8_visuals.js'),{createStore}=require('../static/educations/lab_notebook_store.js');
function lab(storage=new Map()){
 const nodes={},queue=new Map();let now=0,sequence=0;
 class Element{constructor(){this.children=[];this.dataset={};this.events={};this.attrs={};this.value='';this.hidden=false;this.selectedOptions=[{textContent:'Selected setup'}];this.classList={add(){},remove(){}};}addEventListener(k,fn){this.events[k]=fn;}click(){this.events.click?.({});}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}querySelectorAll(){return this.children;}focus(){}insertRow(){const row=new Element();row.insertCell=()=>{const c=new Element();row.append(c);return c;};this.append(row);return row;}createTHead(){const head=new Element();this.append(head);return head;}createTBody(){const body=new Element();this.append(body);return body;}}
 const get=id=>nodes[id]??=new Element(),buttons=Object.keys(model.labs).map(id=>Object.assign(new Element(),{dataset:{g8Open:id}})),store=createStore({getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)});get('g8-speed').value='1';
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../static/educations/grade8_labs.js'),'utf8'),{window:{Grade8Science:model,Grade8Visuals:visuals,Grade7Notebooks:store},document:{getElementById:get,querySelectorAll:()=>buttons,createElement:()=>new Element(),body:new Element()},performance:{now:()=>now},requestAnimationFrame:fn=>{queue.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>queue.delete(id)});
 function tick(ms=20000){now+=ms;const pending=[...queue.values()];queue.clear();pending.forEach(fn=>fn(now));}
 function open(id){buttons.find(b=>b.dataset.g8Open===id).click();get('g8-tabs').children.find(b=>b.dataset.g8Tab==='procedure').click();get('g8-lesson-content').children.at(-1).click();}
 function assemble(){for(const id of model.required(buttons.find(b=>model.labs[b.dataset.g8Open].title===get('g8-experiment-title').textContent).dataset.g8Open,get('g8-osmosis-mode').value||'potato'))get('g8-bench').events.drop({preventDefault(){},dataTransfer:{getData:()=> 'g8:'+id}});}
 function mode(value){get('g8-osmosis-mode').value=value;get('g8-osmosis-mode').events.change();}
 function record(id,stage,variant='potato'){const target=model.stages(id,variant)[stage-1];get('g8-answer-observation').value=target.observation;get('g8-answer-explanation').value=target.explanation;get('g8-answer-process').value='Osmosis';get('g8-record').click();}
 return {get,open,assemble,mode,tick,record,store,storage};
}
test('oxygen requires apparatus and collection, supports pause, and saves marked records through reset and reload',()=>{const a=lab();a.open('oxygen');assert(a.get('g8-action').disabled);a.assemble();assert(!a.get('g8-action').disabled);for(let i=0;i<3;i++){a.get('g8-action').click();a.tick();}a.get('g8-action').click();assert(a.get('g8-record').disabled);a.get('g8-pause').click();a.tick(10000);assert(a.get('g8-action').disabled);assert.equal(a.get('g8-pause').textContent,'Resume animation');a.get('g8-pause').click();a.tick();for(let i=0;i<2;i++){a.get('g8-action').click();a.tick();}assert.equal(a.get('g8-action').textContent,'Experiment complete');a.record('oxygen',6);assert.match(a.get('g8-mark').textContent,/2\/2/);a.get('g8-reset').click();assert.equal(a.store.load('grade8-science-oxygen').length,1);assert.equal(lab(a.storage).store.load('grade8-science-oxygen').length,1);});
test('all experiments complete and osmosis setup notebooks remain separate',()=>{const a=lab();for(const id of ['osmosis','diffusion','elements']){a.open(id);for(const variant of id==='osmosis'?['potato','retained']:['potato']){if(id==='osmosis')a.mode(variant);a.assemble();for(let i=0;i<model.stages(id,variant).length;i++){a.get('g8-action').click();a.tick();}assert.equal(a.get('g8-action').textContent,'Experiment complete');a.record(id,model.stages(id,variant).length,variant);assert.match(a.get('g8-mark').textContent,id==='osmosis'&&['potato','retained'].includes(variant)?/3\/3/:/2\/2/);const key='grade8-science-'+id+(id==='osmosis'?'-'+variant:'');assert.equal(a.store.load(key).length,1);}a.get('g8-back').click();}a.get('g8-notebooks').click();assert.equal(a.get('g8-notebook-books').children.length,7);a.open('osmosis');a.mode('retained');a.get('g8-clear-notes').click();assert.equal(a.store.load('grade8-science-osmosis-retained').length,0);assert.equal(a.store.load('grade8-science-osmosis-potato').length,1);});
test('leaving an unfinished animation requires replay before advancing or recording',()=>{const a=lab();a.open('oxygen');a.assemble();a.get('g8-action').click();a.get('g8-back').click();assert.equal(a.get('g8-dashboard').inert,false);a.open('oxygen');assert(a.get('g8-action').disabled);assert(a.get('g8-record').disabled);a.get('g8-replay').click();a.tick();assert(!a.get('g8-action').disabled);assert(!a.get('g8-record').disabled);});
test('reagents pour into their matching apparatus and reject incorrect chemicals',()=>{
 const a=lab();a.open('oxygen');a.assemble();a.get('g8-action').click();a.tick();
 const drop=(id,target)=>a.get('g8-bench').events.drop({preventDefault(){},dataTransfer:{getData:()=> 'g8:'+id},target:{closest:()=>({dataset:{g8PourTarget:target}})}});
 assert.match(a.get('g8-drawing').innerHTML,/data-g8-pour-target="trough"/);
 drop('peroxide','trough');assert.match(a.get('g8-feedback').textContent,/Check the current step/);
 drop('water','trough');a.tick();assert.match(a.get('g8-drawing').innerHTML,/data-g8-pour-target="flask"/);
 drop('catalyst','flask');a.tick();assert.match(a.get('g8-drawing').innerHTML,/data-g8-pour-target="funnel"/);
 const bottle=a.get('g8-shelf').children.find(b=>b.children[0].textContent.startsWith('Hydrogen peroxide'));
 assert.equal(bottle.disabled,false);bottle.click();
 a.get('g8-bench').events.click({target:{closest:()=>({dataset:{g8PourTarget:'funnel'}})}});a.tick();
 assert.match(a.get('g8-observation').textContent,/Bubbles form/);
});
test('bench controls offer pouring only and retain apparatus on the bench',()=>{
 const a=lab();a.open('oxygen');a.assemble();a.get('g8-action').click();a.tick();
 const rows=a.get('g8-bench-items').children;
 assert.equal(rows.length,3);
 for(const row of rows){assert.equal(row.children.length,2);assert.match(row.children[1].textContent,/^Pour/);}
 const water=rows.find(r=>r.children[0].textContent==='Distilled water');
 water.children[1].click();a.tick();
 assert.match(a.get('g8-observation').textContent,/full of water/);
 assert(a.get('g8-shelf').children.some(b=>b.children[0].textContent.startsWith('Conical flask')&&b.disabled));
});
test('procedure buttons arrange oxygen apparatus and run each step in order',()=>{
 const a=lab();a.open('oxygen');
 const step=i=>a.get('g8-procedure').children[i].children[0];
 assert.match(a.get('g8-feedback').textContent,/arrange the apparatus/);
 for(let i=0;i<6;i++){
  assert.equal(step(i).disabled,false);step(i).click();
  assert.equal(a.get('g8-procedure').children[i].className,'g8-current');
  assert(step(Math.min(i+1,5)).disabled);a.tick();
 }
 assert.equal(a.get('g8-action').textContent,'Experiment complete');
});

test('water pours directly from the shelf at step two without preplacing a bottle',()=>{
 const a=lab();a.open('oxygen');
 const source=label=>a.get('g8-shelf').children.find(b=>b.children[0].textContent.startsWith(label));
 for(const label of ['Conical flask','Bung and delivery tube','Dropping funnel','Water trough','Gas jar'])source(label).click();
 a.get('g8-procedure').children[0].children[0].click();a.tick();
 assert.equal(a.get('g8-procedure').children[1].className,'g8-current');
 const water=a.get('g8-bench-items').children.find(r=>r.children[0].textContent==='Distilled water');
 assert.equal(water.children[1].disabled,false);
 source('Distilled water').click();assert.equal(a.get('g8-pause').hidden,false);
 a.tick();assert.equal(a.get('g8-procedure').children[2].className,'g8-current');
 assert.match(a.get('g8-observation').textContent,/full of water/);
});

test('osmosis starts water pouring after placing only the potato cups, including after reset',()=>{
 const a=lab();a.open('osmosis');
 for(let attempt=0;attempt<2;attempt++){
  for(const name of ['Raw Irish potato','Boiled Irish potato'])a.get('g8-shelf').children.find(b=>b.children[0].textContent.startsWith(name)).click();
  const dishes=a.get('g8-shelf').children.find(b=>b.children[0].textContent.startsWith('Shallow dishes'));
  assert(dishes.disabled);
  const water=a.get('g8-bench-items').children.find(r=>r.children[0].textContent==='Distilled water').children[1];
  assert.equal(water.disabled,false);water.click();a.tick();
  assert.equal(a.get('g8-procedure').children[2].className,'g8-current');
  a.get('g8-reset').click();
 }
});
test('osmosis pours water then salt solution without needing the ruler first',()=>{
 const a=lab();a.open('osmosis');
 const source=name=>a.get('g8-shelf').children.find(b=>b.children[0].textContent.startsWith(name));
 for(const name of ['Raw Irish potato','Boiled Irish potato','Shallow dishes'])source(name).click();
 a.get('g8-procedure').children[0].children[0].click();a.tick();
 const control=name=>a.get('g8-bench-items').children.find(r=>r.children[0].textContent===name).children[1];
 assert.equal(control('Distilled water').disabled,false);
 assert.equal(control('Salt solution').disabled,true);
 control('Distilled water').click();assert(control('Salt solution').disabled);a.tick();
 assert.equal(control('Salt solution').disabled,false);control('Salt solution').click();a.tick();
 assert.equal(a.get('g8-procedure').children[3].className,'g8-current');
 assert.match(a.get('g8-observation').textContent,/starting solution levels are marked/);
});
test('removed combined setup falls back to the potato experiment',()=>{
 const a=lab();a.open('osmosis');a.mode('combined');
 assert.equal(a.get('g8-osmosis-mode').value,'potato');
 assert.equal(a.get('g8-bench-items').children.length,2);
 assert.match(a.get('g8-procedure').children[0].children[0].textContent,/ready dishes/);
});
test('water can be poured as soon as the apparatus is arranged, without a separate setup click',()=>{
 const a=lab();a.open('oxygen');a.assemble();
 const water=a.get('g8-bench-items').children.find(r=>r.children[0].textContent==='Distilled water');
 assert.equal(water.children[1].disabled,false);water.children[1].click();a.tick();
 assert.equal(a.get('g8-procedure').children[2].className,'g8-current');
 assert.match(a.get('g8-observation').textContent,/full of water/);
});

 test('oxygen completes from procedure controls without preloading shelf items',()=>{
 const a=lab();a.open('oxygen');
 for(let i=0;i<6;i++){const button=a.get('g8-procedure').children[i].children[0];assert.equal(button.disabled,false);button.click();a.tick();}
 assert.equal(a.get('g8-action').textContent,'Experiment complete');
 assert.match(a.get('g8-drawing').innerHTML,/Glowing splint relights/);
 a.record('oxygen',6);assert.match(a.get('g8-mark').textContent,/2\/2/);
 a.get('g8-reset').click();assert.equal(a.get('g8-procedure').children[0].children[0].disabled,false);
 });
