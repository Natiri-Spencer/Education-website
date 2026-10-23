const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const T=require('../static/educations/whiteboard_typesetting.js');
const katex=require('../static/educations/vendor/katex/katex.min.js');

test('a cached model representation cannot override another equation or manual correction',async()=>{
    const window={WhiteboardTypesetting:T,katex};
    const context=vm.createContext({window,URL,setTimeout,clearTimeout,document:{currentScript:{src:'http://localhost/static/whiteboard_math.js'}}});
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/educations/whiteboard_math.js'),'utf8'),context);
    const seen=[];
    window.MathJax.startup={promise:Promise.resolve()};
    window.MathJax.texReset=()=>{};
    window.MathJax.tex2svgPromise=async tex=>{
        seen.push(tex);
        return {querySelector:selector=>selector==='svg'?{getAttribute:()=> '0 -800 5000 1000',innerHTML:`<g data-source="${tex}"></g>`}:null};
    };
    const math=window.WhiteboardMath;
    const old=await math.prepare('2x+5=7',28,'2x+5=');
    const corrected=await math.prepare('2x+5=7',28);
    assert(old.ready&&corrected.ready);
    assert.notEqual(old,corrected);
    assert.deepEqual(seen,['2x+5=','2x+5=7']);
    assert.match(corrected.html,/>7</);
    assert.equal(math.get('2x+5=7',28),corrected);
    assert.equal(math.get('2x+5=7',28,'2x+5='),old);
    assert.equal(await math.prepare('2x+5=7',28),corrected);
});
