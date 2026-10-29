((root) => {
    const items = {
        plant: ['🪴', 'Green potted plant'], dark: ['▣', 'Dark cupboard'],
        paper: ['▰', 'Opaque black paper'], clips: ['📎', 'Paper clips'], light: ['☀', 'Sunlight'],
        forceps: ['⋁', 'Forceps'], water: ['♨', 'Hot water'], beaker: ['⚗', 'Glass beaker'],
        ethanol: ['🧪', 'Ethanol in a tube'], bath: ['▤', 'Electric hot-water bath'],
        rinse: ['💧', 'Warm rinse water'], tile: ['▱', 'White tile'], iodine: ['🧴', 'Iodine and dropper']
    };
    const steps = [
        {action:'Destarch the plant in darkness.',items:['plant','dark'],duration:3200,observation:'The plant has spent 48 simulated hours in darkness. It still looks green. A spare leaf tested beforehand stays yellow-brown with iodine: no starch is detected.',think:'Why test a spare leaf before starting? The test checks that stored starch will not confuse your result.'},
        {action:'Cover the middle of one leaf on both sides and clip the paper.',items:['paper','clips'],duration:1800,observation:'Opaque black paper covers the middle strip on BOTH surfaces. The top and bottom areas remain exposed.',think:'Predict which areas will receive light. The two areas belong to the same green leaf.'},
        {action:'Place the plant in sunlight for several hours.',items:['light'],duration:6500,observation:'Four simulated hours in good light have passed. The exposed areas received light; the covered strip did not. Starch cannot be identified by looking at the green leaf.',think:'How will you find out whether starch formed? Keep water, carbon dioxide and other conditions the same.'},
        {action:'Use forceps to detach the leaf, remove the paper and place it on the white tile.',items:['forceps','tile'],duration:1800,observation:'The paper is removed and the leaf lies on the white tile. It is still green throughout. Dashed lines mark the area that was covered.',think:'Keep track of the covered strip so you can compare the same areas after the starch test.'},
        {action:'Immerse the leaf in hot water.',items:['water','beaker'],duration:2600,observation:'The leaf is immersed in hot water. It becomes limp; heating kills the tissue and stops its chemical reactions.',think:'This prepares the leaf for the starch test. It does not make starch.'},
        {action:'Warm the leaf in ethanol using an electric hot-water bath.',items:['ethanol','bath'],duration:4000,observation:'The leaf becomes pale as green chlorophyll dissolves into the ethanol. The ethanol turns green. The tube is heated indirectly in a hot-water bath.',think:'Why remove chlorophyll? It could hide the iodine colour change. Ethanol is flammable: never heat it over a naked flame.'},
        {action:'Rinse the leaf in warm water and spread it on the white tile.',items:['rinse','tile'],duration:2200,observation:'The pale leaf is rinsed and softened, then spread flat on the white tile. The position of the covered strip is still marked.',think:'Why use a white tile? It makes the final colour differences easier to see.'},
        {action:'Add iodine to the whole leaf and compare the areas.',items:['iodine'],duration:4200,observation:'The exposed areas turn blue-black. The previously covered middle strip stays yellow-brown. Blue-black indicates starch; yellow-brown means no starch is detected.',think:'Compare this result with your prediction. Which area had access to light, and which area contains starch?'}
    ];
    function createState() {return {stage:0,preparing:true,progress:0,placed:new Set(),running:false,paused:false,predictions:{exposed:'',covered:''}};}
    function currentIndex(state) {return state.preparing ? state.stage : Math.max(0,state.stage-1);}
    function missing(state) {return (steps[currentIndex(state)]?.items || []).filter(id => !state.placed.has(id));}
    function canPlace(state,id) {return state.preparing && !state.running && steps[currentIndex(state)]?.items.includes(id) && !state.placed.has(id);}
    function place(state,id) {if(!canPlace(state,id))return false;state.placed.add(id);return true;}
    function prepareNext(state) {
        if(state.preparing || state.running || state.progress!==1 || state.stage>=steps.length)return false;
        state.preparing=true;state.progress=0;state.paused=false;return true;
    }
    function start(state) {
        if (!state.preparing || state.running || state.stage >= steps.length || missing(state).length || !state.predictions.exposed || !state.predictions.covered) return false;
        state.stage++; state.preparing=false; state.progress=0; state.running=true; state.paused=false; return true;
    }
    function tick(state,elapsed,speed=1) {
        if (!state.running || state.paused) return;
        state.progress=Math.min(1,state.progress+Math.max(0,elapsed)*speed/steps[state.stage-1].duration);
        if(state.progress===1)state.running=false;
    }
    function complete(state) {return !state.preparing && state.stage===steps.length && state.progress===1 && !state.running;}
    function grade(answers) {
        const correct={exposed:'blue',covered:'brown',reason:'light'};
        const score=Object.keys(correct).filter(key=>answers[key]===correct[key]).length;
        return {score,total:3,feedback:score===3?'3/3. Your observations support the conclusion: light was needed for starch production.':'Correct observations: exposed areas turn blue-black (starch); the covered strip stays yellow-brown (no starch detected). This supports the conclusion that light is needed for starch production.'};
    }
    const api={items,steps,createState,currentIndex,missing,canPlace,place,prepareNext,start,tick,complete,grade};
    if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PhotosynthesisModel=api;
})(typeof window!=='undefined'?window:globalThis);
