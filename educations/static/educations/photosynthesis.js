(() => {
    const el = id => document.getElementById('photo-' + id);
    if (!el('lesson')) return;
    const model = window.PhotosynthesisModel, store = window.Grade7Notebooks;
    const key = 'grade9-science-photosynthesis-light', draftKey = key + '-draft';
    const state = model.createState();
    let records = store.load(key), frame = null, lastTime = 0, activeTab = 'introduction';
    const draft = store.load(draftKey)[0] || {};
    el('note').value = typeof draft.note === 'string' ? draft.note : '';
    const colour = value => ({blue:'Blue-black', brown:'Yellow-brown', green:'Remained green'}[value] || 'Not selected');
    const tabs = [['introduction','Introduction'],['outcomes','Learning Outcomes'],['resources','Resources'],['pre','Pre-Assessment'],['procedure','Procedure & Experiment'],['post','Post-Assessment'],['conclusion','Conclusion']];
    function node(tag, text) {const n=document.createElement(tag);n.textContent=text;return n;}
    function paragraph(text) {return node('p',text);}
    function list(values, ordered=false) {const n=document.createElement(ordered?'ol':'ul');values.forEach(v=>n.append(node('li',v)));return n;}
    function button(text, action) {const b=node('button',text);b.type='button';b.className='orange-button';b.addEventListener('click',action);return b;}
    function saveDraft() {
        const saved=store.save(draftKey,[{note:el('note').value}]);
        el('draft-status').textContent=saved?'Reflection saved in this browser.':'Browser storage is unavailable. Your reflection is kept only while this page stays open.';
    }
    el('note').addEventListener('input',saveDraft);
    function notebook() {
        const rows=records.map(record=>[record.observations,record.explanation,record.feedback]);
        for(const id of ['log','hub-log'])store.render(el(id),rows,3,'No observations recorded yet. Complete the Photosynthesis experiment, then use Record & check.');
    }
    function selectTab(id) {
        activeTab=id;
        el('tabs').querySelectorAll('button').forEach(b=>{const active=b.dataset.tab===id;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
        const panel=el('panel');panel.setAttribute('aria-labelledby','photo-tab-'+id);panel.replaceChildren(node('h2',tabs.find(t=>t[0]===id)[1]));
        if(id==='introduction')panel.append(paragraph('Green leaves use light energy to make sugars from carbon dioxide and water. Some sugar is stored as starch. You will investigate the role of light by covering part of a leaf and comparing it with an exposed area of the same leaf.'),paragraph('Your question: after the iodine test, will both areas contain starch? Make a prediction, select the apparatus, carry out each step and explain your evidence.'),button('Next: Learning Outcomes',()=>selectTab('outcomes')));
        if(id==='outcomes')panel.append(list(['Plan a fair comparison by changing access to light on one leaf.','Explain why the plant is destarched before the investigation.','Follow the sequence of the leaf starch test and explain the role of ethanol.','Describe the iodine colour in the exposed and covered areas.','Use your observations to explain why light is needed for starch production.']),button('Next: Resources',()=>selectTab('resources')));
        if(id==='resources') {
            panel.append(list(Object.values(model.items).map(item=>item[1])),paragraph('All materials are virtual. In real lessons, your teacher manages hot liquids and ethanol. Use an electric hot-water bath for ethanol; never use a naked flame. Wear eye protection and handle the leaf with forceps.'));
            const a=node('a','Practical Biology: testing leaves for starch');a.href='https://practicalbiology.org/standard-techniques/testing-leaves-for-starch-the-technique.html';a.target='_blank';a.rel='noopener';panel.append(a,button('Next: Pre-Assessment',()=>selectTab('pre')));
        }
        if(id==='pre') {
            panel.append(paragraph('Think before you begin. You will make your colour predictions on the laboratory screen.'));
            quiz(panel,[{id:'prior',question:'What does a blue-black colour after adding iodine indicate?',options:[['sugar','Any type of sugar is present.'],['starch','Starch is present.'],['chlorophyll','Chlorophyll has been removed.']],correct:'starch',feedback:'Iodine tests for starch, rather than all carbohydrates.'}]);
            panel.append(button('Next: Procedure & Experiment',()=>selectTab('procedure')));
        }
        if(id==='procedure')panel.append(paragraph('Use the exposed area as the comparison for the covered strip on the same leaf. Give the plant adequate water and carbon dioxide. Only access to light changes.'),list(model.steps.map(step=>step.action),true),paragraph('Before exposure, a separate leaf from the destarched plant is tested to confirm that no starch is detected. Dark storage and light exposure are compressed into seconds in this model.'),button(state.stage?'Continue Experiment':'View Experiment',openLab));
        if(id==='post') {
            if(!records.length)panel.append(paragraph('Complete the experiment and save your observations first. Then return here to explain your evidence.'),button('View Experiment',openLab));
            else {panel.append(paragraph('Use your notebook to answer. You can revisit the experiment whenever you need.'));quiz(panel,[
                {id:'destarch',question:'Why was the plant kept in darkness before covering the leaf?',options:[['remove','To use up stored starch before testing the effect of light.'],['green','To remove chlorophyll.'],['make','To make extra starch.']],correct:'remove',feedback:'Destarching reduces stored starch. Otherwise a covered area could contain starch made before the experiment.'},
                {id:'ethanol',question:'Why was the leaf warmed in ethanol in a hot-water bath?',options:[['starch','To add starch.'],['chlorophyll','To remove chlorophyll so the iodine colours are visible.'],['light','To replace sunlight.']],correct:'chlorophyll',feedback:'Chlorophyll dissolves into ethanol. Indirect heating is used because ethanol is flammable.'},
                {id:'evidence',question:'Which comparison supports the conclusion that light was needed?',options:[['both','Both areas were green before testing.'],['contrast','The exposed areas turned blue-black; the covered strip stayed yellow-brown.'],['iodine','Iodine was added to the whole leaf.']],correct:'contrast',feedback:'Only the light-exposed areas gave a positive starch test. The two areas shared the same leaf and other conditions.'}
            ]);}
        }
        if(id==='conclusion') {
            if(!records.length)panel.append(paragraph('Your conclusion should follow from your observations. Complete the iodine test and save your notebook to build an evidence-based conclusion.'),button('View Experiment',openLab));
            else panel.append(paragraph('The exposed areas turned blue-black with iodine, showing starch was present. The covered strip stayed yellow-brown, showing no starch was detected there. With the other conditions kept the same, this supports the conclusion that light is needed for starch production in a green leaf.'),paragraph('Compare this evidence with your own prediction and notebook. Iodine detects starch; it does not produce starch. The test does not directly measure the rate of photosynthesis.'),button('Review my experiment',openLab));
        }
    }
    function quiz(panel,questions) {
        const form=document.createElement('form');const controls=[];
        questions.forEach(q=>{const label=node('label',q.question);label.htmlFor='photo-quiz-'+q.id;const select=document.createElement('select');select.id=label.htmlFor;const initial=node('option','Choose…');initial.value='';select.append(initial);q.options.forEach(([value,text])=>{const option=node('option',text);option.value=value;select.append(option);});const feedback=node('p','');feedback.setAttribute('role','status');form.append(label,select,feedback);controls.push({q,select,feedback});});
        const check=node('button','Check my answers');check.type='submit';check.className='orange-button';form.append(check);form.addEventListener('submit',event=>{event.preventDefault();controls.forEach(({q,select,feedback})=>{feedback.textContent=!select.value?'Choose an answer first.':(select.value===q.correct?'Correct. ':'Think again. ')+q.feedback;});});panel.append(form);
    }
    tabs.forEach(([id,title],index)=>{
        const b=button(title,()=>selectTab(id));b.id='photo-tab-'+id;b.className='';b.dataset.tab=id;b.setAttribute('role','tab');b.setAttribute('aria-controls','photo-panel');b.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();selectTab(tabs[next][0]);el('tabs').children[next].focus();});el('tabs').append(b);
    });
    document.querySelectorAll('[data-photo-open]').forEach(b=>b.addEventListener('click',()=>{
        document.getElementById('g9-overview').hidden=true;document.getElementById('g9-notebooks').hidden=true;el('lesson').hidden=false;selectTab('introduction');el('lesson-title').focus();
    }));
    function stopFrame() {if(frame!==null)cancelAnimationFrame(frame);frame=null;}
    function draw() {el('drawing').innerHTML=window.PhotosynthesisVisuals.scene(state);el('progress').value=state.progress;}
    function shelf() {
        el('shelf').replaceChildren();
        const required=model.steps[model.currentIndex(state)].items;
        Object.entries(model.items).forEach(([id,[icon,title]])=>{
            const selectable=model.canPlace(state,id),current=required.includes(id),placed=state.placed.has(id);
            const status=current?(placed?'Ready for this step':'Select for this step'):(placed?'Already used':'Later step');
            const b=node('button','');b.type='button';b.dataset.item=id;b.draggable=selectable;b.disabled=!selectable;b.className=current?(placed?'photo-placed':'photo-needed'):'';b.setAttribute('aria-label',title+' — '+status);b.title=status;const symbol=node('span',icon);symbol.className='photo-item-icon';symbol.setAttribute('aria-hidden','true');b.append(symbol,node('span',title),node('small',status));b.addEventListener('click',()=>place(id));b.addEventListener('dragstart',event=>event.dataTransfer.setData('text/plain','photo:'+id));el('shelf').append(b);
        });
    }
    function place(id) {
        if(!model.place(state,id)){el('feedback').textContent='Select only the apparatus highlighted for the current step. '+requirements();return;}
        render();el('feedback').textContent=model.items[id][1]+' is ready on the bench. '+requirements();
        const next=el('shelf').querySelector('.photo-needed:not(:disabled)');
        (next||el('return-bench')).focus({preventScroll:true});
    }
    function requirements() {
        if(state.stage===model.steps.length&&!state.running)return 'Experiment complete. Record your observations below.';
        if(!state.preparing)return `Review the observation for step ${state.stage}. When you are ready, continue to step ${state.stage+1}.`;
        if(!state.predictions.exposed||!state.predictions.covered)return 'Choose both colour predictions before starting.';
        const missing=model.missing(state);return missing.length?'Select from the shelf: '+missing.map(id=>model.items[id][1]).join(', ')+'.':'Apparatus ready. Carry out the highlighted procedure step.';
    }
    function render() {
        const complete=model.complete(state),current=model.currentIndex(state),step=model.steps[current];
        const phase=state.preparing?'select apparatus':state.running?(state.paused?'paused':'observing'):'complete — review observation';
        el('stage').textContent=`Step ${current+1} of ${model.steps.length} · ${phase}`;
        el('current-step').textContent=step.action;
        el('predictions').disabled=state.stage>0;
        el('predictions').hidden=state.stage>0;
        el('prediction-summary').hidden=state.stage===0;
        el('prediction-summary').textContent=`My prediction — exposed: ${colour(state.predictions.exposed)}; covered: ${colour(state.predictions.covered)}.`;
        el('procedure').replaceChildren();model.steps.forEach((step,index)=>{const li=document.createElement('li'),b=button(step.action,advance);b.className='';b.disabled=index!==current||!state.preparing||state.running;li.className=index<current?'photo-done':index===current?'photo-current':'';if(index===current)li.setAttribute('aria-current','step');li.append(b);el('procedure').append(li);});
        el('action').textContent=state.preparing?`Run step ${current+1}`:state.running?'Observe this stage…':complete?'Experiment complete':`Continue to step ${state.stage+1}`;el('action').disabled=state.running||complete;
        el('choose-apparatus').disabled=!state.preparing;
        el('pause').hidden=!state.running;el('pause').textContent=state.paused?'Resume animation':'Pause animation';el('replay').hidden=state.preparing||!state.stage||state.running;
        el('answer-fields').disabled=!complete;el('record').disabled=!complete;el('results').hidden=!complete;
        el('observation').textContent=state.preparing?`Prepare step ${current+1}: ${step.action} Select the highlighted apparatus, then run this step.`:state.running?'Observe: '+step.action:step.observation;
        el('think').textContent=!state.preparing&&!state.running?step.think:'The procedure, highlighted apparatus and workbench all refer to this step.';
        el('feedback').textContent=state.running?(state.paused?'Paused. Resume when you are ready.':'Time is compressed. Watch the change before moving on.'):requirements();
        shelf();draw();
    }
    function animate() {
        stopFrame();lastTime=performance.now();
        function tick(now) {
            model.tick(state,Math.min(100,now-lastTime),Number(el('speed').value));lastTime=now;draw();
            if(state.running&&!state.paused)frame=requestAnimationFrame(tick);else{frame=null;render();}
        }
        frame=requestAnimationFrame(tick);
    }
    function advance() {
        if(!state.preparing&&!state.running){if(model.prepareNext(state))render();return;}
        if(!model.start(state)){el('feedback').textContent=requirements();if(!state.predictions.exposed)el('predict-exposed').focus();else if(!state.predictions.covered)el('predict-covered').focus();return;}
        render();animate();
    }
    function openLab() {
        el('lab').hidden=false;document.getElementById('g9-dashboard').inert=true;document.querySelector('#grade9-page > .virtual-labs-brand').inert=true;document.body.classList.add('photo-lab-open');render();el('back').focus();
    }
    function closeLab() {
        if(state.running){state.paused=true;stopFrame();}
        if(document.fullscreenElement===el('lab'))document.exitFullscreen()?.catch(()=>{});
        el('lab').hidden=true;document.getElementById('g9-dashboard').inert=false;document.querySelector('#grade9-page > .virtual-labs-brand').inert=false;document.body.classList.remove('photo-lab-open');selectTab('procedure');el('lesson-title').focus();
    }
    for(const area of ['exposed','covered'])el('predict-'+area).addEventListener('change',()=>{state.predictions[area]=el('predict-'+area).value;render();});
    el('action').addEventListener('click',advance);
    el('choose-apparatus').addEventListener('click',()=>{const first=el('shelf').querySelector('.photo-needed:not(:disabled)')||el('return-bench');first.scrollIntoView({block:'center'});first.focus({preventScroll:true});});
    el('return-bench').addEventListener('click',()=>{el('feedback').scrollIntoView({block:'center'});el('action').focus({preventScroll:true});});
    el('pause').addEventListener('click',()=>{state.paused=!state.paused;render();if(state.paused)stopFrame();else animate();});
    el('replay').addEventListener('click',()=>{if(!state.stage||state.running)return;state.progress=0;state.running=true;state.paused=false;render();animate();});
    el('reset').addEventListener('click',()=>{stopFrame();Object.assign(state,model.createState());for(const name of ['predict-exposed','predict-covered','answer-exposed','answer-covered','answer-reason'])el(name).value='';el('mark').textContent='Apparatus reset. Your saved notebook and reflection are kept.';render();});
    el('back').addEventListener('click',closeLab);
    el('lab').addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.fullscreenElement)closeLab();});
    el('fullscreen').addEventListener('click',()=>{const operation=document.fullscreenElement?document.exitFullscreen():el('lab').requestFullscreen?.();if(operation)operation.catch(()=>{el('feedback').textContent='Full screen is unavailable in this browser.';});});
    el('bench').addEventListener('dragover',event=>event.preventDefault());el('bench').addEventListener('drop',event=>{event.preventDefault();const value=event.dataTransfer.getData('text/plain');if(value.startsWith('photo:'))place(value.slice(6));});
    el('record').addEventListener('click',()=>{
        if(!model.complete(state))return;
        const answers={exposed:el('answer-exposed').value,covered:el('answer-covered').value,reason:el('answer-reason').value};
        const missing=Object.keys(answers).find(id=>!answers[id]);if(missing){el('mark').textContent='Choose both observations and an explanation before recording.';el('answer-'+missing).focus();return;}
        const result=model.grade(answers);const feedback=`${result.score}/${result.total}. `+result.feedback.replace(/^3\/3\. /,'');
        const selectedReason=el('answer-reason').selectedOptions[0].textContent;
        records.push({observations:`Prediction — exposed: ${colour(state.predictions.exposed)}; covered: ${colour(state.predictions.covered)}.\nObserved — exposed: ${colour(answers.exposed)}; covered: ${colour(answers.covered)}.`,explanation:selectedReason+(el('note').value?'\nMy reflection: '+el('note').value:''),feedback});
        const saved=store.save(key,records);notebook();el('mark').textContent=feedback+(saved?' Saved to My lab notebooks.':' Browser storage is unavailable; this record is kept only while this page stays open.');
    });
    el('clear').addEventListener('click',()=>{records=[];const saved=store.save(key,records);notebook();el('mark').textContent=saved?'Photosynthesis notebook cleared.':'Cleared for this session. Browser storage could not be updated.';});
    notebook();selectTab(activeTab);render();
})();
