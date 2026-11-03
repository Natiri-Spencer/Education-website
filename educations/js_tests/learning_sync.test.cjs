const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('learning/static/learning/workspace.js','utf8');
function client({scope='u1',eligible=true,storage=new Map(),remote=[],putStatus=200}={}){
 const calls=[],config={scope,eligible,authenticated:scope!=='guest',api:'/learning/api/work/',assets:'/learning/api/attachments/'};
 const native={get length(){return storage.size;},key:i=>[...storage.keys()][i],getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 const context={location:{pathname:'/educations/whiteboard/'},FormData:class{},document:{getElementById:id=>id==='academy-config'?{textContent:JSON.stringify(config)}:null,querySelectorAll:()=>[],querySelector:()=>null,cookie:'csrftoken=test',readyState:'loading',addEventListener(){}},fetch:async(url,options)=>{
  calls.push({url,options});const get=options.method==='GET';return {ok:get||putStatus===200,status:get?200:putStatus,json:async()=>get?{work:remote}:{revision:putStatus===409?2:1,payload:{format:1,raw:'online newer'},error:'Test failure'}};
 },localStorage:native,setTimeout,clearTimeout,console};context.window=context;
 vm.runInNewContext(source,context);
 return {api:context.AcademyStorage,storage,calls};
}
test('existing unowned work is never automatically loaded into an account',async()=>{
 const storage=new Map([['eduportal.whiteboards.v1','old shared work']]),c=client({storage});await c.api.ready;
 assert.equal(c.api.getItem('eduportal.whiteboards.v1'),null);assert.equal(storage.get('eduportal.whiteboards.v1'),'old shared work');
});
test('account namespaces keep learners and guest drafts separate',async()=>{
 const shared=new Map(),a=client({storage:shared}),b=client({storage:shared,scope:'u2'}),guest=client({storage:shared,scope:'guest',eligible:false});await Promise.all([a.api.ready,b.api.ready,guest.api.ready]);a.api.setItem('grade7-notes','owner1');b.api.setItem('grade7-notes','owner2');assert.equal(a.api.getItem('grade7-notes'),'owner1');assert.equal(guest.api.getItem('grade7-notes'),null);assert.equal(b.api.getItem('grade7-notes'),'owner2');
});
test('online copy hydrates before controllers consume saved data',async()=>{
 const c=client({remote:[{key:'eduportal.whiteboards.v1',revision:3,payload:{format:1,raw:'server copy'},deleted:false}]});await c.api.ready;assert.equal(c.api.getItem('eduportal.whiteboards.v1'),'server copy');assert.equal(JSON.parse(c.api.getItem('@meta:eduportal.whiteboards.v1')).revision,3);
});
test('failed save keeps durable dirty work for reconnection',async()=>{
 const c=client({putStatus:503});await c.api.ready;c.api.setItem('grade7-notes','offline draft');await c.api.flush();assert.equal(c.api.getItem('grade7-notes'),'offline draft');assert.equal(JSON.parse(c.api.getItem('@meta:grade7-notes')).dirty,true);
 const again=client({storage:c.storage});await again.api.ready;await again.api.flush();assert.equal(JSON.parse(again.api.getItem('@meta:grade7-notes')).dirty,false);assert.equal(JSON.parse(again.calls.find(c=>c.options.method==='PUT').options.body).payload.raw,'offline draft');
});
test('revision conflict preserves the device copy and sends the expected account scope',async()=>{
 const c=client({putStatus:409});await c.api.ready;c.api.setItem('grade7-notes','my edit');await c.api.flush();assert.equal(c.api.getItem('grade7-notes'),'my edit');assert(JSON.parse(c.api.getItem('@meta:grade7-notes')).dirty);assert.equal(c.calls.find(c=>c.options.method==='PUT').options.headers['X-Academy-Scope'],'u1');
});
test('quota errors preserve the previous revision and local draft',async()=>{
 const c=client({putStatus:413});await c.api.ready;c.api.setItem('grade7-notes','important');await c.api.flush();assert.equal(c.api.getItem('grade7-notes'),'important');assert(JSON.parse(c.api.getItem('@meta:grade7-notes')).dirty);
});
test('deletions survive a page reload and propagate as revisioned tombstones',async()=>{
 const c=client();await c.api.ready;c.api.setItem('grade7-notes','delete me');await c.api.flush();c.api.removeItem('grade7-notes');
 const again=client({storage:c.storage});await again.api.ready;await again.api.flush();const deletion=again.calls.find(c=>c.options.method==='DELETE');assert(deletion);assert.equal(JSON.parse(deletion.options.body).revision,1);
});
