const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {createStore}=require('../static/educations/lab_notebook_store.js');
function lab(storage=new Map()){
 const nodes={};class Element{
  constructor(){this.listeners={};this.children=[];this.value='';this.dataset={};this.selectedOptions=[{textContent:'The panel needs sunlight to supply electrical energy.'}];}
  addEventListener(name,fn){this.listeners[name]=fn;}click(){this.listeners.click?.({});}replaceChildren(){this.children=[];}append(child){this.children.push(child);}
  insertRow(){const row=new Element();row.insertCell=()=>{const cell=new Element();row.children.push(cell);return cell;};this.children.push(row);return row;}
  set innerHTML(value){this.html=value;this.ports=[...value.matchAll(/data-solar-port="([^"]+)"/g)].map(match=>{const p=new Element();p.dataset.solarPort=match[1];return p;});}
  querySelectorAll(){return this.ports||[];}
 }
 const get=id=>nodes[id]??=new Element(),store=createStore({getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)});
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../static/educations/energy_sources.js'),'utf8'),{document:{getElementById:get,createElement:()=>new Element()},window:{Grade7Notebooks:store}});
 const add=label=>get('solar-shelf').children.find(b=>b.textContent===label).click(),port=id=>get('solar-drawing').ports.find(p=>p.dataset.solarPort===id).click();
 return {get,store,storage,add,port,record(answer){get('solar-answer').value=answer;get('solar-reason').value='sunlight';get('solar-record').click();}};
}
test('solar circuit needs assembly and two wires; shading changes brightness and preserves marked notes',()=>{
 const a=lab();a.record('Off');assert.match(a.get('solar-mark').textContent,/Complete the circuit/);
 ['Solar panel','Bulb holder','Bulb','Connecting wires'].forEach(a.add);a.port('p1');a.port('p2');assert.match(a.get('solar-status').textContent,/panel terminal to/);
 a.port('p1');a.port('h1');a.port('p2');a.port('h2');assert.match(a.get('solar-observation').textContent,/bulb bright/);a.record('Bright');assert.match(a.get('solar-mark').textContent,/2\/2/);
 a.add('Book');a.get('solar-partial').click();assert.match(a.get('solar-observation').textContent,/bulb dim/);a.record('Dim');a.get('solar-full').click();assert.match(a.get('solar-observation').textContent,/bulb off/);a.record('Bright');assert.match(a.get('solar-mark').textContent,/1\/2.*Expected/);
 a.get('solar-uncover').click();assert.match(a.get('solar-observation').textContent,/bulb bright/);a.get('solar-reset').click();assert.equal(a.store.load('grade7-electrical-sources').length,3);assert.equal(lab(a.storage).store.load('grade7-electrical-sources').length,3);
});
