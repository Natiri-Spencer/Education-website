(() => {
    const app = document.getElementById('magnetism-lab-app');
    if (!app) return;
    const el = name => document.getElementById('mag-' + name);
    const movement = ['Moves towards the magnet', 'Moves away from the magnet', 'No noticeable movement'];
    const alignment = ['Settles north–south', 'Settles east–west', 'Keeps rotating'];
    const materials = {iron:'Iron nail',steel:'Steel paper clip',aluminium:'Aluminium strip',copper:'Copper strip',wood:'Wood',plastic:'Plastic'};
    const config = {
        attraction:{title:'Attraction',objective:'Test which materials a magnet attracts.',items:[['magnet','Bar magnet'],['sample','Test material']],steps:['Place the bar magnet and a test material on the bench.','Choose a material and predict its movement.','Bring the magnet near it. Observe and record. Repeat with other materials.'],model:'Iron and ordinary steel are strongly attracted. Copper, aluminium, wood and plastic show no noticeable attraction in this simple test. Not every metal is attracted. Motion is illustrative.'},
        repulsion:{title:'Repulsion',objective:'Investigate the effect of facing magnetic poles.',items:[['magnet','Hand-held bar magnet'],['second','Magnet on low-friction trolley']],steps:['Place the hand-held magnet and trolley magnet on the bench.','Choose the facing poles and predict the movement.','Bring the hand-held magnet near the trolley. Compare N–N, S–S and unlike poles.'],model:'Like poles repel; unlike poles attract. The trolley can move freely. The hand-held magnet is brought closer and held in position. Motion is illustrative.'},
        direction:{title:'Direction',objective:'Observe the direction of a freely suspended magnet.',items:[['support','Non-magnetic stand and thread'],['magnet','Bar magnet for suspension']],steps:['Place the stand and suspend the bar magnet from its centre.','Choose a starting direction and predict where it will settle.','Release the magnet. Observe, record, and repeat from a different direction.'],model:'Top view of a horizontal bar magnet suspended by a thread through its centre. Away from other magnets, it settles approximately north–south in Earth’s magnetic field. N means magnetic north here; local magnetic north may differ from geographic north. Motion and damping are illustrative.'}
    };
    const states = {};
    let method='attraction', frame=null, last=null;
    function state() {
        if (!states[method]) {
            let notes=[];try {notes=JSON.parse(localStorage.getItem('grade7-magnetism-'+method)||'[]');if(!Array.isArray(notes))notes=[];}catch(_){}
            states[method]={placed:[],material:'iron',poles:'NN',angle:'90',prediction:'',answer:'',classification:'',progress:0,running:false,complete:false,notes};
        }
        return states[method];
    }
    const label=(x,y,text)=>`<text x="${x}" y="${y}" class="mag-svg-label">${text}</text>`;
    const bar=(x,y,left='S',right='N')=>`<rect x="${x}" y="${y}" width="65" height="34" fill="${left==='N'?'#dd4963':'#3275cf'}"/><rect x="${x+65}" y="${y}" width="65" height="34" fill="${right==='N'?'#dd4963':'#3275cf'}"/><rect x="${x}" y="${y}" width="130" height="34" rx="4" fill="none" stroke="#e2f1ff" stroke-width="2"/><text x="${x+32}" y="${y+24}" class="mag-pole">${left}</text><text x="${x+98}" y="${y+24}" class="mag-pole">${right}</text>`;
    function sample(material) {
        if(material==='iron')return '<path d="M430 210h62m-60-9v18m60-9 10 0" stroke="#c8d7e2" stroke-width="6"/>';
        if(material==='steel')return '<path d="M434 211h51q16 0 16 12t-16 12h-39q-11 0-11-9t11-9h35q7 0 7 6t-7 6h-29" stroke="#dbe6ef" stroke-width="4" fill="none"/>';
        return `<rect x="430" y="203" width="70" height="30" rx="3" fill="${{aluminium:'#d5dce2',copper:'#c88152',wood:'#b88e59',plastic:'#b58de5'}[material]}" stroke="#e1edf6" stroke-width="2"/>`;
    }
    function result() {
        const s=state();return method==='direction'?alignment[0]:method==='repulsion'?(s.poles[0]===s.poles[1]?movement[1]:movement[0]):(['iron','steel'].includes(s.material)?movement[0]:movement[2]);
    }
    function testName() {const s=state();return method==='attraction'?materials[s.material]:method==='repulsion'?s.poles[0]+' facing '+s.poles[1]:'Release from '+el('angle').selectedOptions[0].textContent;}
    function artwork() {
        const s=state(),p=s.progress,ready=id=>s.placed.includes(id),part=(id,body)=>ready(id)?`<g data-mag-part="${id}">${body}</g>`:'';
        if(method==='direction') {
            const start=Number(s.angle),angle=start*Math.exp(-5*p)*Math.cos(4*Math.PI*p),rotation=s.complete?-90:angle-90;
            return '<circle cx="320" cy="190" r="133" fill="#18374d66" stroke="#769ab5" stroke-dasharray="5 5"/>'+label(305,40,'N')+label(305,355,'S')+label(467,195,'E')+label(153,195,'W')+part('support','<path d="M95 140v110m0-55h220" stroke="#9ab4c6" stroke-width="5"/><path d="M280 188h40" stroke="#f3ead6" stroke-dasharray="3 4"/>'+label(65,110,'Stand and thread · top view'))+part('magnet',`<g transform="rotate(${rotation} 320 190)">${bar(255,173)}</g><circle cx="320" cy="190" r="5" fill="#f8f3dd"/>`)+label(180,375,'Magnetic north–south reference');
        }
        const approach=Math.min(1,p/.3)*100;
        const response=Math.max(0,(p-.3)/.7);
        const displacement=s.complete?(result()===movement[0]?-100:result()===movement[1]?60:0):(result()===movement[0]?-100*response:result()===movement[1]?60*response:0);
        const left=method==='repulsion'?(s.poles[0]==='N'?'S':'N'):'S',right=method==='repulsion'?s.poles[0]:'N';
        let svg=part('magnet',`<g transform="translate(${approach} 0)">${bar(100,200,left,right)}</g>`)+label(95,285,'Hand-held magnet');
        if(method==='attraction')svg+=part('sample',`<g transform="translate(${displacement} 0)">${sample(s.material)}</g>`)+label(405,285,materials[s.material]);
        else svg+=part('second',`<g transform="translate(${displacement} 0)">${bar(430,200,s.poles[1],s.poles[1]==='N'?'S':'N')}<rect x="425" y="236" width="140" height="8" rx="3" fill="#94afc0"/><circle cx="445" cy="253" r="9" fill="#263c50" stroke="#c8dae6"/><circle cx="545" cy="253" r="9" fill="#263c50" stroke="#c8dae6"/></g>`)+label(415,290,'Free-moving trolley');
        return svg;
    }
    function render() {
        const s=state(),m=config[method],assembled=m.items.every(([id])=>s.placed.includes(id)),choices=method==='direction'?alignment:movement;
        el('drawing').innerHTML=artwork();el('drawing').setAttribute('aria-label',m.title+' test. '+(s.complete?result():'Apparatus ready for investigation.'));
        el('run').disabled=!assembled||!s.prediction||s.running||s.complete;el('run').textContent=method==='direction'?'Release magnet':'Bring magnet closer';
        el('pause').hidden=!(s.running||(!s.complete&&s.progress>0));el('pause').textContent=s.running?'Pause':'Resume';
        el('record').disabled=!s.complete;el('answer').disabled=!s.complete;
        el('classification-control').hidden=method!=='attraction';el('classification').disabled=!s.complete;el('classification-heading').hidden=method!=='attraction';
        ['material','poles','angle'].forEach(id=>el(id).disabled=s.running||(!s.complete&&s.progress>0));
        el('prediction').disabled=s.running||s.progress>0;
        app.querySelectorAll('[data-mag-item]').forEach(button=>button.disabled=s.placed.includes(button.dataset.magItem)||s.running);
        el('observation').textContent=s.complete?(method==='direction'?'The magnet oscillates and settles approximately north–south. Its N end points towards magnetic north.':method==='attraction'?materials[s.material]+': '+result().toLowerCase()+'.':s.poles[0]+' facing '+s.poles[1]+': the trolley '+(result()===movement[0]?'moves towards':'moves away from')+' the hand-held magnet.') : s.running?'Watch the movement. Pause to inspect.':s.progress>0?'Paused. Resume to complete the test.':assembled?'Make a prediction, then start the test.':'Add the apparatus from the shelf.';
        el('feedback').textContent=s.complete?'Record your observation. Choose another setup or reset to repeat.':!assembled?'Choose '+m.items.find(([id])=>!s.placed.includes(id))[1]+' from the shelf.':s.running?'Test in progress.':s.progress>0?'Animation paused.':'Ready for your prediction.';
        el('notebook-title').textContent=m.title+' notebook · '+s.notes.length+' entries';
    }
    function save() {try {localStorage.setItem('grade7-magnetism-'+method,JSON.stringify(state().notes));}catch(_){el('mark').textContent='Browser storage unavailable; entries will remain for this session.';}}
    function notebook() {
        el('log').replaceChildren();const notes=state().notes;
        if(!notes.length){const cell=el('log').insertRow().insertCell();cell.colSpan=method==='attraction'?4:3;cell.textContent='Your checked tests will appear here.';}
        notes.forEach(note=>{const row=el('log').insertRow();const cells=[note.test,note.answers];if(method==='attraction')cells.push(note.classification || 'Not recorded');cells.push(note.mark);cells.forEach(text=>row.insertCell().textContent=text);});
    }
    function stop() {if(!states[method])return;state().running=false;cancelAnimationFrame(frame);last=null;render();}
    function animate(now) {
        const s=state();if(!s.running)return;if(last!==null)s.progress=Math.min(1,s.progress+(now-last)/5000);last=now;
        if(s.progress===1){s.running=false;s.complete=true;last=null;}render();if(s.running)frame=requestAnimationFrame(animate);
    }
    function options(id,choices,value) {el(id).replaceChildren(new Option('Choose...',''),...choices.map(text=>new Option(text,text)));el(id).value=value;}
    function activate(next) {
        stop();method=next;const s=state(),m=config[method];
        el('title').textContent=m.title;el('objective').textContent=m.objective;el('model').textContent=m.model;
        el('steps').replaceChildren(...m.steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
        el('material-control').hidden=method!=='attraction';el('poles-control').hidden=method!=='repulsion';el('angle-control').hidden=method!=='direction';
        el('material').value=s.material;el('poles').value=s.poles;el('angle').value=s.angle;
        const choices=method==='direction'?alignment:movement;options('prediction',choices,s.prediction);options('answer',choices,s.answer);el('classification').value=s.classification || '';
        app.querySelectorAll('[data-mag-method]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.magMethod===method)));
        el('shelf-items').replaceChildren(...m.items.map(([id,name])=>{const button=document.createElement('button');button.type='button';button.draggable=true;button.dataset.magItem=id;const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 160 80');icon.setAttribute('aria-hidden','true');icon.innerHTML=id==='sample'?'<rect x="25" y="30" width="110" height="20" rx="4" fill="#bdcedb"/>':id==='support'?'<path d="M30 70V10h100m-30 0v40" fill="none" stroke="#afc8d9" stroke-width="5"/>':bar(15,23);const strong=document.createElement('strong');strong.textContent=name;button.append(icon,strong);button.onclick=()=>place(id);button.ondragstart=event=>{if(button.disabled){event.preventDefault();return;}event.dataTransfer.setData('text/plain','mag:'+id);};return button;}));
        el('mark').textContent='';notebook();render();
    }
    function place(id) {const s=state();if(s.running||!config[method].items.some(([item])=>item===id)||s.placed.includes(id))return;s.placed.push(id);render();}
    function reset() {stop();const s=state();Object.assign(s,{progress:0,running:false,complete:false,prediction:'',answer:'',classification:''});el('prediction').value='';el('answer').value='';el('classification').value='';el('mark').textContent='';render();}
    app.querySelectorAll('[data-mag-method]').forEach(button=>button.onclick=()=>activate(button.dataset.magMethod));
    ['material','poles','angle'].forEach(id=>el(id).onchange=()=>{reset();state()[id]=el(id).value;render();});
    el('prediction').onchange=()=>{state().prediction=el('prediction').value;render();};el('answer').onchange=()=>state().answer=el('answer').value;
    el('classification').onchange=()=>state().classification=el('classification').value;
    el('run').onclick=()=>{const s=state();if(el('run').disabled)return;s.running=true;last=null;frame=requestAnimationFrame(animate);render();};
    el('pause').onclick=()=>{if(state().running)stop();else{state().running=true;last=null;frame=requestAnimationFrame(animate);render();}};
    el('reset').onclick=()=>{reset();state().placed=[];render();};
    el('bench').ondragover=event=>event.preventDefault();el('bench').ondrop=event=>{event.preventDefault();const id=event.dataTransfer.getData('text/plain');if(id.startsWith('mag:'))place(id.slice(4));};
    el('record').onclick=()=>{
        const s=state();if(!s.complete)return;
        if(!s.answer){el('mark').textContent='Choose your observation.';return;}
        if(method==='attraction'&&!s.classification){el('mark').textContent='Choose magnetic or non-magnetic.';return;}
        const expected=result();let score=Number(s.prediction===expected)+Number(s.answer===expected),total=2;
        const corrections=[];if(s.prediction!==expected||s.answer!==expected)corrections.push('Expected movement: '+expected+'.');
        if(method==='attraction'){const expectedType=['iron','steel'].includes(s.material)?'Magnetic':'Non-magnetic';score+=Number(s.classification===expectedType);total=3;if(s.classification!==expectedType)corrections.push('Material type: '+expectedType+'.');}
        const mark=score+'/'+total+'. '+(corrections.length?corrections.join(' '):'Correct.');
        s.notes.push({test:testName(),answers:'Prediction: '+s.prediction+'. Observation: '+s.answer+'.',classification:method==='attraction'?s.classification:undefined,mark});
        el('mark').textContent=mark;save();notebook();s.answer='';s.classification='';el('answer').value='';el('classification').value='';render();
    };
    el('clear').onclick=()=>{state().notes=[];save();notebook();render();el('mark').textContent='Notebook cleared.';};
    document.getElementById('open-magnetism-lesson').onclick=()=>{document.querySelectorAll('#grade-dashboard,#lesson-view,#grade-picker').forEach(node=>node.hidden=true);document.getElementById('simulation-view').hidden=false;document.querySelectorAll('#simulation-view > .lab-app').forEach(node=>node.hidden=node!==app);activate(method);window.scrollTo({top:0});};
    el('back').onclick=()=>{stop();if(document.fullscreenElement)document.exitFullscreen();app.hidden=true;document.getElementById('simulation-view').hidden=true;document.getElementById('grade-dashboard').hidden=false;window.scrollTo({top:0});};
    el('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await app.requestFullscreen();}catch(_){el('feedback').textContent='Full screen unavailable. Continue here.';}};
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    const observer=new MutationObserver(()=>{if(app.hidden||document.getElementById('simulation-view').hidden)stop();});
    [app,document.getElementById('simulation-view')].forEach(node=>observer.observe(node,{attributes:true,attributeFilter:['hidden']}));
    document.getElementById('brand-back').addEventListener('click',event=>{if(!app.hidden&&!document.getElementById('simulation-view').hidden){event.preventDefault();event.stopImmediatePropagation();el('back').click();}},true);
    activate(method);
})();
