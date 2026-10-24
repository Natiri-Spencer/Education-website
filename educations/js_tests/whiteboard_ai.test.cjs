const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../static/educations/whiteboard_selection.js');
const A=require('../static/educations/whiteboard_ai.js');
const P=require('../static/educations/whiteboard_persistence.js');
const G=require('../static/educations/whiteboard_gestures.js');
const D=require('../static/educations/whiteboard_dialogs.js');
const bounds=item=>({x:item.x||0,y:item.y||0,w:item.w||10,h:item.h||10});

test('selection actions send selected and nearby context, excluding image data and points',()=>{
 const board={title:'Algebra',notes:'lesson',items:[{id:'a',type:'text',format:'math',text:'x^2=4',x:0,y:0,w:100,h:30},{id:'b',type:'path',points:[[1,2],[3,4]],x:120,y:0,w:10,h:10},{id:'far',type:'image',src:'data:image/png;base64,secret',x:1000,y:1000,w:10,h:10}]};
 const context=S.buildContext(board,'a','check',bounds);assert.equal(context.scope,'selection');assert.deepEqual(context.sourceIds,['a']);assert.equal(context.items.length,2);assert.equal(context.items[1].pointCount,2);assert.equal('points' in context.items[1],false);assert.equal(JSON.stringify(context).includes('secret'),false);
 assert.equal(S.needsImage(context),false);
});
test('board actions cap context and identify visual source work',()=>{const board={items:[{id:'draw',type:'path',points:[[0,0]],x:0,y:0},...Array.from({length:69},(_,i)=>({id:String(i),type:'sticky',text:'n'+i,x:i,y:0}))]};const context=S.buildContext(board,null,'summarize',bounds);assert.equal(context.items.length,60);assert.equal(S.needsImage(context),true);assert.throws(()=>S.buildContext({items:[]},null,'practice',bounds));});
test('AI results are validated and insertions retain provenance',()=>{const result=A.validateResult({title:'Hint',explanation:'Try factoring.',insertText:'Look for two factors.',insertFormat:'paragraph',warnings:[]});const item=A.insertion(result,'hint',['q1'],{x:4,y:5});assert.equal(item.aiGenerated,true);assert.deepEqual(item.aiSourceIds,['q1']);assert.match(item.text,/Look for/);});
test('AI request sends CSRF and reports endpoint errors',async()=>{let options;const result=await A.request('/ai/','token',{action:'hint'},null,async(_url,value)=>{options=value;return{ok:true,json:async()=>({result:{title:'H',explanation:'E',insertText:'I',insertFormat:'paragraph',warnings:[]}})}});assert.equal(options.headers['X-CSRFToken'],'token');assert.equal(result.title,'H');await assert.rejects(()=>A.request('/ai/','x',{},null,async()=>({ok:false,status:503,json:async()=>({error:'not configured'})})),/not configured/);});
test('persistence skips damaged boards and saves the active board',()=>{const values={};const storage={getItem:k=>values[k],setItem:(k,v)=>values[k]=v};values.k=JSON.stringify({activeId:'good',boards:[{id:'bad'},{id:'good'}]});const loaded=P.load(storage,'k',raw=>{if(raw.id==='bad')throw Error('bad');return raw});assert.equal(loaded.board.id,'good');P.save(storage,'k',loaded.library,{id:'good',items:[]},value=>JSON.parse(JSON.stringify(value)));assert.equal(JSON.parse(values.k).activeId,'good');});
test('gesture helper distinguishes draw, pan and clear',()=>{assert.equal(G.touchIntent(1),'draw');assert.equal(G.touchIntent(2),'pan-zoom');assert.equal(G.touchIntent(4),'clear');});
test('dialog helper opens once, focuses and closes',()=>{let opened=0,closed=0,focused=0;const dialog={open:false,showModal(){this.open=true;opened++},close(){this.open=false;closed++}};D.open(dialog,{focus(){focused++}});D.open(dialog);D.close(dialog);assert.deepEqual([opened,focused,closed],[1,1,1]);});
