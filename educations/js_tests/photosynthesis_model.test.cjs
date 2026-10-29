const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../static/educations/photosynthesis_model.js');

test('a prediction and the required apparatus are needed before each stage',()=>{
    const s=model.createState();
    assert.equal(model.start(s),false);
    s.placed.add('plant');s.placed.add('dark');
    assert.equal(model.start(s),false);
    s.predictions={exposed:'blue',covered:'brown'};
    assert.equal(model.start(s),true);
    assert.equal(model.start(s),false);
    model.tick(s,100000);
    assert.equal(s.stage,1);
    assert.equal(model.start(s),false);
    assert.equal(model.currentIndex(s),0);
    assert.deepEqual(model.missing(s),[]);
    assert.equal(model.prepareNext(s),true);
    assert.equal(model.currentIndex(s),1);
    assert.deepEqual(model.missing(s),['paper','clips']);
});

test('the learner must complete the starch-test sequence before recording results',()=>{
    const s=model.createState();s.predictions={exposed:'brown',covered:'blue'};
    for(let i=0;i<model.steps.length;i++){
        if(i)assert.equal(model.prepareNext(s),true);
        for(const id of model.steps[i].items)s.placed.add(id);
        assert.equal(model.complete(s),false);
        assert.equal(model.start(s),true);
        assert.equal(model.complete(s),false);
        model.tick(s,100000);
    }
    assert.equal(model.complete(s),true);
    assert.equal(model.start(s),false);
    assert.match(model.steps[5].observation,/ethanol turns green/);
    assert.match(model.steps[7].observation,/previously covered middle strip stays yellow-brown/);
});

test('pause and replay do not skip stages or unlock an unfinished iodine test',()=>{
    const s=model.createState();s.predictions={exposed:'blue',covered:'brown'};
    Object.keys(model.items).forEach(id=>s.placed.add(id));
    model.start(s);s.paused=true;model.tick(s,100000);assert.equal(s.progress,0);
    s.paused=false;model.tick(s,100000);assert.equal(s.progress,1);
    s.stage=8;s.preparing=false;s.running=true;s.progress=.5;s.paused=true;
    assert.equal(model.complete(s),false);model.tick(s,100000);assert.equal(s.progress,.5);
    s.paused=false;model.tick(s,100000);assert.equal(model.complete(s),true);
});

test('apparatus selection is restricted to the displayed procedure step, including reused items',()=>{
    const s=model.createState();s.predictions={exposed:'blue',covered:'brown'};
    assert.equal(model.place(s,'ethanol'),false);
    assert.equal(model.place(s,'tile'),false);
    assert.equal(model.place(s,'plant'),true);
    assert.equal(model.place(s,'plant'),false);
    assert.equal(model.place(s,'dark'),true);
    assert.equal(model.start(s),true);
    assert.equal(model.prepareNext(s),false);
    assert.equal(model.place(s,'paper'),false);
    model.tick(s,100000);
    assert.equal(model.place(s,'paper'),false);
    for(let i=1;i<7;i++){
        assert.equal(model.prepareNext(s),true);
        assert.equal(model.currentIndex(s),i);
        for(const id of model.missing(s))assert.equal(model.place(s,id),true);
        if(i===6){assert.equal(s.placed.has('tile'),true);assert.equal(model.canPlace(s,'tile'),false);assert.deepEqual(model.missing(s),[]);}
        assert.equal(model.start(s),true);model.tick(s,100000);
        assert.equal(model.currentIndex(s),i);
    }
});

test('observations and evidence are marked independently of the learner prediction',()=>{
    assert.equal(model.grade({exposed:'blue',covered:'brown',reason:'light'}).score,3);
    assert.equal(model.grade({exposed:'brown',covered:'blue',reason:'heat'}).score,0);
    const result=model.grade({exposed:'blue',covered:'brown',reason:'iodine'});
    assert.equal(result.score,2);assert.match(result.feedback,/light is needed/);
});
