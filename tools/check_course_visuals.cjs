// Browser QA using the installed Chrome and its DevTools protocol; no npm dependencies.
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.join(__dirname,'../tmp/course-visual-qa');fs.mkdirSync(output,{recursive:true});
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',[
 '--headless=new','--no-first-run','--no-default-browser-check','--disable-sync','--disable-background-networking',
 '--disable-extensions','--disable-component-update','--remote-debugging-address=127.0.0.1','--remote-debugging-port=8767',
 `--user-data-dir=${path.join(output,'chrome-profile')}`,'about:blank'
],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
(async()=>{
 let target;for(let attempt=0;attempt<100;attempt++){try{target=(await(await fetch('http://127.0.0.1:8767/json/list')).json()).find(t=>t.type==='page');if(target)break;}catch{}await delay(100);}
 if(!target)throw Error('Chrome did not open its local debugging endpoint.');
 const socket=new WebSocket(target.webSocketDebuggerUrl);browser=socket;
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let sequence=0;const pending=new Map(),events=new Map(),requests=[],errors=[];
 socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(Error(JSON.stringify(message.error))):p.resolve(message.result);}
  else {if(message.method==='Network.requestWillBeSent')requests.push(message.params.request.url);if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);events.get(message.method)?.(message.params);}};
 function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
 async function evaluate(expression){const value=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(value.exceptionDetails)throw Error(value.exceptionDetails.exception?.description||value.exceptionDetails.text);return value.result.value;}
 async function wait(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(50);}throw Error(`Timed out: ${expression}`);}
 async function navigate(url){requests.length=0;const ready=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error(`Page load timed out: ${url}`)),15000);events.set('Page.loadEventFired',()=>{clearTimeout(timeout);events.delete('Page.loadEventFired');resolve();});});await Promise.all([send('Page.navigate',{url}),ready]);}
 async function screenshot(name){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name),Buffer.from(shot.data,'base64'));}
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const value=(selector,input,event='input')=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(String(input))};e.dispatchEvent(new Event(${JSON.stringify(event)},{bubbles:true}));})()`);
 const text=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).textContent`);
 async function open(item){await navigate(`http://127.0.0.1:8766/qa/${item.id}.html`);assert(!requests.some(url=>/course_simulation_model|course_simulations\./.test(url)),'simulation files downloaded before opening');await click('[data-open-simulation]');await wait(`document.querySelector('[data-simulation-stage]').dataset.mounted==='true'`);assert(requests.some(url=>/course_simulation_model/.test(url)));}
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*']});
 await send('Emulation.setDeviceMetricsOverride',{width:1365,height:900,deviceScaleFactor:1,mobile:false});
 const index=await(await fetch('http://127.0.0.1:8766/qa/index.json')).json();
 await open(index.find(item=>item.diagram==='rectangle'));
 const areaExpected={rectangle:'40 cm²',parallelogram:'60 cm²',rhombus:'40 cm²',trapezium:'55 cm²',circle:'154 cm²',border:'36 cm²',composite:'42 cm²'};
 for(const [shape,result]of Object.entries(areaExpected)){await value('[data-shape-choice]',shape,'change');await click('[data-reveal]');assert((await text('[data-reading]')).includes(result),shape);}
 await value('[data-field=cutL]',8);assert((await text('.course-sim-feedback')).includes('smaller'));
 await value('[data-shape-choice]','rectangle','change');await value('[data-field=b]',10);await value('[data-prediction]',50);await evaluate(`document.querySelector('.course-sim-predict').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))`);assert.match(await text('.course-sim-feedback'),/Correct/);
 await evaluate(`document.querySelector('.course-simulation').scrollIntoView()`);await screenshot('area-desktop.png');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),'mobile overflow in area lesson');await evaluate(`document.querySelector('.course-simulation').scrollIntoView()`);await screenshot('area-mobile.png');
 await open(index.find(item=>item.diagram==='capacity'));await click('[data-reveal]');assert.match(await text('[data-reading]'),/30 L.*18 L/);
 await value('[data-shape-choice]','cube','change');await click('[data-reveal]');assert.match(await text('[data-reading]'),/0.125 L/);
 await value('[data-shape-choice]','cylinder','change');await value('[data-field=fill]',100);await click('[data-reveal]');assert.match(await text('[data-reading]'),/1540 cm³.*1.54 L/);
 await evaluate(`document.querySelector('.course-simulation').scrollIntoView()`);await screenshot('volume-mobile.png');
 await open(index.find(item=>item.kind==='equations'));await value('[data-equation-preset]',2,'change');await value('[data-field=amount]',4);await click('[data-apply]');await value('[data-operation]','divide','change');await value('[data-field=amount]',2);await click('[data-apply]');assert.match(await text('[data-reading]'),/x = 4.*isolated/);
 await value('[data-field=amount]',0);await click('[data-apply]');assert.match(await text('.course-sim-feedback'),/nonzero/);await value('[data-prediction]',4);await evaluate(`document.querySelector('.course-sim-predict').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))`);assert.match(await text('.course-sim-feedback'),/Correct/);
 await evaluate(`document.querySelector('.course-simulation').scrollIntoView()`);await screenshot('equations-mobile.png');
 await open(index.find(item=>item.diagram==='inequality'));await value('[data-membership-prediction]','no','change');await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Check prediction').click()`);assert.match(await text('.course-sim-feedback'),/Correct.*does not satisfy/);
 await value('[data-inequality-type]','compound','change');await value('[data-field=x]',4);await value('[data-membership-prediction]','no','change');await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Check prediction').click()`);assert.match(await text('.course-sim-feedback'),/Correct/);await value('[data-field=x]',2.5);await value('[data-membership-prediction]','yes','change');await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Check prediction').click()`);assert.match(await text('.course-sim-feedback'),/Correct/);
 await evaluate(`document.querySelector('.course-simulation').scrollIntoView()`);await screenshot('inequalities-mobile.png');
 await send('Emulation.setScriptExecutionDisabled',{value:true});await navigate(`http://127.0.0.1:8766/qa/${index.find(item=>item.diagram==='rectangle').id}.html`);
 assert(await evaluate(`document.querySelector('.course-figure img').complete && document.querySelector('.course-figure img').naturalWidth>0`));assert(await evaluate(`document.querySelector('[data-open-simulation]').hidden`));assert.match(await text('.course-lesson'),/Area|area/);assert(!requests.some(url=>/course_simulation_model|course_simulations\./.test(url)));
 await evaluate(`document.querySelector('.course-figure').scrollIntoView()`);await screenshot('no-javascript-mobile.png');
 await send('Emulation.setScriptExecutionDisabled',{value:false});
 await send('Emulation.setDeviceMetricsOverride',{width:1500,height:4000,deviceScaleFactor:1,mobile:false});await navigate('http://127.0.0.1:8766/qa/gallery.html');await screenshot('diagram-gallery.png');
 assert.deepEqual(errors,[]);console.log('Browser checks passed: lazy loading, 7 area shapes, 3 solids, equation operations, inequality boundaries, mobile layout, and no-JavaScript diagrams.');
 await send('Browser.close');socket.close();
})().catch(error=>{console.error(error);process.exitCode=1;browser?.close();chrome.kill();});
