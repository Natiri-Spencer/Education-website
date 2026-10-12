const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {catalogue,createStore}=require('../static/educations/lab_notebook_store.js');
function memory(seed={}){const values=new Map(Object.entries(seed));return {values,getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};}
test('catalogue covers all fifteen Grade 7 investigations with separate storage',()=>{
    assert.equal(catalogue.length,15);assert.equal(new Set(catalogue.map(book=>book.key)).size,15);assert.equal(new Set(catalogue.map(book=>book.id)).size,15);assert(catalogue.every(book=>book.columns.length>=3&&book.prompt));
});
test('all existing notebook formats can be read without changing saved entries',()=>{
    const storage=memory();const store=createStore(storage);
    catalogue.forEach(book=>{
        const entry=book.id==='apparatus'||book.id==='hibiscus'||book.id==='evaporation'||book.id==='ee-sources'?['Stage','Answer','Mark']:book.id==='commercial'?{sample:'water',indicator:'red',changed:false,cells:['Water','Red litmus','No change','Red','Inconclusive','2/2']}:book.id.startsWith('ee-')?{setup:'Parallel',current:'.60',voltage:'3',brightness:'bright',mark:'3/3'}:book.id.startsWith('mag-')?{test:'Iron',answers:'Movement',mark:'2/2'}:{stage:'Inspect',answer:'Observation',mark:'2/2'};
        storage.setItem(book.key,JSON.stringify([entry]));const before=storage.getItem(book.key),rows=store.rows(book);assert.equal(rows.length,1);assert.equal(rows[0].length,book.columns.length);assert.equal(storage.getItem(book.key),before);
    });
    const oldAttraction=store.rows(catalogue.find(book=>book.id==='mag-attraction'));assert.equal(oldAttraction[0][2],'Not recorded');
});
test('saved records survive a fresh store and stay isolated from other experiments',()=>{
    const storage=memory(),store=createStore(storage);store.save(catalogue[0].key,[['task','Beaker','Hold liquid','1/1']]);const reload=createStore(storage);assert.equal(reload.load(catalogue[0].key).length,1);assert.equal(reload.load(catalogue[1].key).length,0);reload.save(catalogue[1].key,[]);assert.equal(reload.load(catalogue[0].key).length,1);
});
test('malformed and blocked storage do not crash notebooks',()=>{
    const storage=memory({bad:'{invalid',object:'{}',mixed:'[null,42,"text",["Valid"]]'}),store=createStore(storage);assert.deepEqual(store.load('bad'),[]);assert.deepEqual(store.load('object'),[]);assert.deepEqual(store.load('mixed'),[['Valid']]);const blocked=createStore({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});assert.deepEqual(blocked.load('new'),[]);assert.equal(blocked.save('new',[['session note']]),false);assert.deepEqual(blocked.load('new'),[['session note']]);
});
class Element {
    constructor(){this.children=[];this._text='';this.hidden=false;this.value='';this.dataset={};this.attributes={};this.style={};const classes=new Set();this.classList={add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name),toggle(){}};}
    set textContent(value){this._text=String(value);this.children=[];}
    get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this._text='';this.children=children;}
    setAttribute(name,value){this.attributes[name]=value;}
    insertRow(){const row=new Element();row.insertCell=()=>{const cell=new Element();row.append(cell);return cell;};this.append(row);return row;}
    addEventListener(){}
    querySelector(){return this.detail??=new Element();}
}
test('notebook hub displays saved work, keeps notes per experiment and prints all fifteen',()=>{
    const nodes={},get=id=>nodes[id]??=new Element(),storage=memory(),store={catalogue,...createStore(storage)};store.save(catalogue[0].key,[['Task','Beaker','Hold liquids','1/1. Correct.']]);let prints=0;
    const body=new Element(),listeners={};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../static/educations/lab_notebooks.js'),'utf8'),{window:{Grade7Notebooks:store,scrollTo(){},addEventListener:(name,handler)=>listeners[name]=handler,print(){assert(body.classList.contains('grade7-notebook-print'));prints++;}},document:{body,getElementById:get,createElement:()=>new Element(),querySelectorAll:()=>[]}});
    get('open-lab-notebooks').onclick();assert.equal(get('nb-list').children.length,15);assert(get('nb-rows').textContent.includes('Beaker'));get('nb-note').value='My observation';get('nb-list').children[1].onclick();assert.equal(store.load('grade7-lab-reflections-v1')[0].text,'My observation');assert.equal(get('nb-note').value,'');get('nb-list').children[0].onclick();assert.equal(get('nb-note').value,'My observation');get('nb-print-all').onclick();assert.equal(prints,1);assert.equal(get('nb-print').children.length,15);assert(get('nb-print').textContent.includes('My observation'));assert(get('nb-print').textContent.includes('Fractional distillation'));listeners.afterprint();assert(!body.classList.contains('grade7-notebook-print'));
});
test('hibiscus notebook records incorrect and correct classifications without deleting history',()=>{
    const source=fs.readFileSync(path.join(__dirname,'../static/educations/virtual_labs.js'),'utf8'),a=source.indexOf('    function recordHibiscus('),b=source.indexOf("    document.getElementById('hibiscus-clear-notebook')",a),entries=[],storage=memory(),store=createStore(storage),body=new Element();
    const context={samples:{lemon:{name:'Lemon juice',colour:'Pink',className:'acid',explanation:'Pink indicates an acid.'}},state:{sample:'lemon'},hibiscusEntries:entries,notebookStore:store,renderHibiscusNotebook:()=>store.render(body,entries,5)};vm.createContext(context);vm.runInContext(source.slice(a,b),context);context.recordHibiscus('base');context.recordHibiscus('acid');assert.equal(entries.length,2);assert(entries[0][4].startsWith('0/1.'));assert(entries[1][4].startsWith('1/1.'));assert.equal(createStore(storage).load('grade7-hibiscus-notebook-v1').length,2);
});
test('evaporation records and marks observations, then keeps them when apparatus resets',()=>{
    const source=fs.readFileSync(path.join(__dirname,'../static/educations/evaporation.js'),'utf8'),a=source.indexOf('    get("save").onclick'),b=source.indexOf('    // Leaving the experiment',a),nodes={},get=id=>nodes[id]??=new Element(),storage=memory(),store=createStore(storage),notebook=[];
    const context={get,document:{createElement:()=>new Element()},window:{clearTimeout(){}},root:{querySelectorAll:()=>[],querySelector:()=>new Element()},notebookStore:store,notebook,entries:0,poured:true,level:100,prediction:'salt',placed:[],returned:true,hot:false,coolTimer:null,residueLabels:{solution:'Salt solution'},waterLabels:{vapour:'It escapes as water vapour'},observedResidue:()=> 'solution',stageName:()=> 'Before heating',tell(){},pauseHeating(){},render(){},renderNotebook:()=>store.render(get('log'),notebook,3)};
    vm.runInNewContext(source.slice(a,b),context);get('residue').value='solution';get('water-answer').value='vapour';get('note').value='Clear salt water';get('save').onclick();assert.equal(notebook.length,1);assert(notebook[0][1].includes('Clear salt water'));assert(notebook[0][2].startsWith('2/2'));get('reset').onclick();assert.equal(notebook.length,1);assert(get('log').textContent.includes('Clear salt water'));assert.equal(createStore(storage).load('grade7-evaporation-notebook-v1').length,1);
});
test('commercial notebook restores evidence, saves complete marked rows and survives reset',()=>{
    const source=fs.readFileSync(path.join(__dirname,'../static/educations/commercial_indicators.js'),'utf8'),a=source.indexOf('    root.querySelector("#ci-save").onclick'),b=source.indexOf('    root.querySelector("#commercial-fullscreen")',a),nodes={},get=id=>nodes[id]??=new Element(),storage=memory(),store=createStore(storage);
    store.save('grade7-commercial-notebook-v1',[{sample:'water',indicator:'blue',changed:false,cells:['Water','Blue litmus','Blue','Blue (no change)','Inconclusive','2/2']}]);
    const notebook=createStore(storage).load('grade7-commercial-notebook-v1'),v={sample:'water',indicator:'red',prediction:'Red',inference:'neutral',reason:'Both papers stay unchanged',result:{colour:'Red',changed:false}};
    const context={root:{querySelector:get},bench:new Element(),prediction:new Element(),window:{clearTimeout(){}},document:{createElement:()=>new Element()},notebookStore:store,notebook,vessels:[v],selected:0,sequence:1,dropperReady:false,loadedIndicator:null,busy:false,timer:null,activeVessel:()=>v,solutions:{water:{name:'Distilled water'}},indicators:{red:{name:'Red litmus paper'}},renderRecord(){},renderDropper(){},tell(){},renderNotebook:()=>store.render(get('#ci-log'),notebook.map(entry=>entry.cells),6)};
    vm.runInNewContext(source.slice(a,b),context);get('#ci-save').onclick();assert.equal(notebook.length,2);assert.equal(notebook[1].cells.length,6);assert(notebook[1].cells[4].includes('Both papers stay unchanged'));assert(notebook[1].cells[5].startsWith('2/2'));get('#ci-reset').onclick();assert.equal(notebook.length,2);assert(get('#ci-log').textContent.includes('Distilled water'));assert.equal(createStore(storage).load('grade7-commercial-notebook-v1').length,2);
});
