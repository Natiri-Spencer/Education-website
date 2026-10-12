const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const engine=require('../static/educations/electrical_model.js');

// Exercise learner actions against the UI controller without requiring a browser.
function laboratory(storage=new Map()) {
    const nodes={},methods=['simple','bulbs','cells'];let buttons;
    class Element {
        constructor(){this.value='';this.hidden=false;this.disabled=false;this.children=[];this.dataset={};this.attributes={};this.textContent='';this._html='';}
        setAttribute(name,value){this.attributes[name]=value;}
        replaceChildren(...children){this.children=children;}
        append(...children){this.children.push(...children);}
        set innerHTML(value){this._html=value;this.terminals=Array.from(value.matchAll(/data-ee-terminal="([^"]+)"/g),match=>{const node=new Element();node.dataset.eeTerminal=match[1];return node;});}
        get innerHTML(){return this._html;}
        querySelectorAll(selector){if(selector==='[data-ee-method]')return buttons;if(selector==='[data-ee-item]')return get('ee-shelf-items').children;if(selector==='[data-ee-terminal]')return this.terminals||[];if(selector==='option')return this.children;return [];}
        querySelector(selector){const terminal=selector.match(/data-ee-terminal="([^"]+)"/);if(terminal)return this.terminals.find(node=>node.dataset.eeTerminal===terminal[1]);if(selector==='option[value="b2"]')return this.children.find(option=>option.value==='b2');return null;}
        insertRow(){const row=new Element();row.insertCell=()=>{const cell=new Element();row.children.push(cell);return cell;};this.children.push(row);return row;}
        addEventListener(){}
        focus(){}
    }
    const get=id=>nodes[id]??=new Element();
    buttons=methods.map(method=>{const node=new Element();node.dataset.eeMethod=method;return node;});
    get('ee-current').children=['main','b1','b2'].map(value=>Object.assign(new Element(),{value}));get('ee-voltage').children=['source','b1','b2'].map(value=>Object.assign(new Element(),{value}));
    const context={window:{Grade7Electrical:engine,matchMedia:()=>({matches:false}),scrollTo(){}},document:{getElementById:get,createElement:()=>new Element(),createElementNS:()=>new Element(),querySelectorAll:()=>[]},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)}};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../static/educations/electrical_energy.js'),'utf8'),context);
    const clickPort=id=>{const port=get('ee-drawing').terminals.find(port=>port.dataset.eeTerminal===id);assert(port,'Terminal '+id+' exists');port.onclick();};
    const choose=(id,value)=>{get('ee-'+id).value=value;get('ee-'+id).onchange();};
    const wire=(a,b)=>{clickPort(a);clickPort(b);};
    const assemble=()=>get('ee-shelf-items').children.forEach(button=>button.onclick());
    const build=settings=>{assemble();const board=engine.layout({method:'simple',bulbs:'series',cells:'series',current:'main',voltage:'source',...settings});board.pairs.concat([['v+',board.voltageTarget[0]],['v-',board.voltageTarget[1]]]).forEach(([a,b])=>wire(a,b));};
    const record=(current,voltage,brightness)=>{for(const [id,value]of Object.entries({current,voltage,brightness})){get('ee-answer-'+id).value=value;get('ee-answer-'+id).oninput();}get('ee-record').onclick();};
    return {get,choose,wire,assemble,build,record,switch:()=>get('ee-switch').onclick(),method:method=>buttons[methods.indexOf(method)].onclick(),storage};
}
test('learner builds a circuit, operates the switch, reads meters and saves a marked entry',()=>{
    const lab=laboratory();assert(lab.get('ee-record').disabled);lab.build();assert(!lab.get('ee-record').disabled);assert(lab.get('ee-drawing').innerHTML.includes('Switch open'));lab.switch();assert(lab.get('ee-drawing').innerHTML.includes('animateMotion'));lab.record('.30','3.00','bright');assert.equal(lab.get('ee-mark').textContent,'3/3. Correct.');assert.equal(JSON.parse(lab.storage.get('grade7-electrical-simple')).length,1);lab.get('ee-reset').onclick();assert(lab.get('ee-notebook-title').textContent.includes('1 entries'));assert(lab.get('ee-record').disabled);
});
test('changing bulb arrangement requires learner rewiring and preserves notebook history',()=>{
    const lab=laboratory();lab.method('bulbs');lab.build({method:'bulbs'});lab.switch();lab.record('.15','3.00','dim');lab.choose('bulbs','parallel');assert.equal(lab.get('ee-wire-count').textContent,'0 wires');assert(lab.get('ee-record').disabled);assert(lab.get('ee-notebook-title').textContent.includes('1 entries'));lab.build({method:'bulbs',bulbs:'parallel'});lab.switch();lab.record('.60','3.00','bright');assert.equal(lab.get('ee-mark').textContent,'3/3. Correct.');
});
test('learner relocates ammeter to a parallel branch and reconnects voltmeter',()=>{
    const lab=laboratory();lab.method('bulbs');lab.choose('bulbs','parallel');lab.choose('current','b1');lab.build({method:'bulbs',bulbs:'parallel',current:'b1'});lab.switch();lab.record('.30','3.00','bright');assert.equal(lab.get('ee-mark').textContent,'3/3. Correct.');const before=Number.parseInt(lab.get('ee-wire-count').textContent);lab.choose('voltage','b1');assert.equal(Number.parseInt(lab.get('ee-wire-count').textContent),before-2);assert(lab.get('ee-record').disabled);lab.wire('v+','b1+');lab.wire('v-','b1-');lab.switch();lab.record('.30','3.00','bright');assert.equal(lab.get('ee-mark').textContent,'3/3. Correct.');
});
test('cell comparisons and notebooks stay separate and persist across reload',()=>{
    const storage=new Map(),lab=laboratory(storage);lab.build();lab.switch();lab.record('.30','3','bright');lab.method('cells');lab.choose('cells','parallel');lab.build({method:'cells',cells:'parallel'});lab.switch();lab.record('.15','1.50','dim');assert.equal(lab.get('ee-mark').textContent,'3/3. Correct.');lab.method('simple');assert(lab.get('ee-notebook-title').textContent.includes('1 entries'));const reload=laboratory(storage);assert(reload.get('ee-notebook-title').textContent.includes('1 entries'));reload.method('cells');assert(reload.get('ee-notebook-title').textContent.includes('1 entries'));
});
test('incorrect wiring prevents energizing and blank notebook answers are rejected',()=>{
    const lab=laboratory();lab.build();lab.wire('a+','c1+');lab.switch();assert(!lab.get('ee-drawing').innerHTML.includes('animateMotion'));assert(lab.get('ee-record').disabled);assert(lab.get('ee-feedback').textContent.includes('bypasses'));const clean=laboratory();clean.build();clean.get('ee-record').onclick();assert.equal(clean.get('ee-mark').textContent,'Enter current, voltage and brightness.');
});
