(() => {
    const root = document.getElementById('separation-activity');
    if (!root) return;
    const app = document.getElementById('mixture-lab-app');
    const el = id => document.getElementById(`sep-${id}`);
    const step = (label, observation, appearance, conclusion) => ({label, observation, appearance, conclusion});
    const methods = {
        sublimation: {
            title: 'Sublimation', objective: 'Separate ammonium chloride from sodium chloride (common salt).',
            safety: 'Virtual demonstration in a fume cupboard. Do not inhale ammonium chloride fumes. The supported cooling flask rests over the beaker without sealing it. Real work requires teacher supervision.',
            items: [['hood','Fume cupboard'],['mat','Heatproof mat'],['burner','Bunsen burner'],['tripod','Tripod stand'],['gauze','Wire gauze'],['beaker','Glass beaker with ammonium chloride and common salt'],['support','Retort stand and flask clamp'],['flask','Round-bottom flask with cold water']],
            actions: [step('Light the Bunsen burner and heat gently', 'A blue Bunsen flame heats the beaker. White fumes rise from the heated mixture. A white ammonium chloride deposit begins to form on the cold underside of the flask. Sodium chloride remains in the beaker.', 'White fumes and a white deposit on the cold flask', 'Ammonium chloride separates while common salt remains'), step('Switch off and allow deposition and cooling', 'The flame goes out and the white fumes subside. White solid ammonium chloride collects on the cooled outer surface of the round-bottom flask. White sodium chloride remains in the beaker; no liquid ammonium chloride forms.', 'White solid on the flask; white salt in the beaker', 'Cooling produces a solid deposit without a liquid stage'), step('Lift the cooled flask to inspect the products', 'The cooled flask lifts to reveal white ammonium chloride crystals on its underside and white sodium chloride left in the glass beaker. Both products are white: there is no chemical colour change.', 'White crystals on the lifted flask; common salt below', 'Sublimation and deposition separate the two solids')],
            initial: 'The glass beaker contains white ammonium chloride mixed with white sodium chloride on wire gauze and a tripod. A supported round-bottom flask containing cold water covers the mouth without sealing it. The Bunsen flame is off.',
            initialAnswer: ['Two white solids mixed in a glass beaker','The solids are still mixed'],
            note: 'Heated ammonium chloride dissociates into colourless gases which recombine on cooling. Visible white fumes represent fine solid particles; the white coating forms by deposition on the cold outer flask surface. The water is tinted blue in this model for visibility, and remains separate from the sample.'
        },
        filtration: {
            title: 'Filtration', objective: 'Separate insoluble sand from water using filter paper.',
            safety: 'Do not drink the filtrate. Filtration removes suspended sand, not dissolved substances or all microorganisms.',
            items: [['stand','Retort stand and clamp'],['receiver','Collecting beaker'],['funnel','Filter funnel'],['paper','Filter paper'],['source','Sand-water beaker'],['rod','Glass stirring rod']],
            actions: [step('Fold the filter paper in half', 'The circular filter paper folds into a semicircle. The mixture remains separate from the paper.', 'Filter paper folded into a semicircle', 'Folding prepares the paper for a cone'), step('Fold the paper into quarters', 'The semicircle folds again into a quarter-circle. No mixture has been poured yet.', 'Filter paper folded into a quarter-circle', 'Two folds prepare a cone that fits the funnel'), step('Open the cone and fit it inside the funnel', 'One layer opens away from the other three layers. The paper cone lowers into the funnel, above the collecting beaker.', 'White paper cone seated inside the funnel', 'Filter paper will retain the insoluble sand'), step('Pour the mixture down the glass rod', 'The beaker tilts and cloudy tan mixture flows down the glass rod into the paper cone. Tan sand remains on the paper while clear, colourless water drips into the collecting beaker.', 'Tan residue on paper; clear filtrate collecting below', 'Water passes through the paper; insoluble sand is retained'), step('Return the empty beaker and inspect', 'The empty source beaker returns to the shelf. Tan sand on the filter paper is the residue. Clear, colourless water in the collecting beaker is the filtrate. No crystals or chemical colour change occur.', 'Tan sand residue and colourless water filtrate', 'Filtration separates an insoluble solid from a liquid')],
            initial: 'The funnel is centred over the collecting beaker. The circular paper waits beside the apparatus. Fold and fit it before pouring the cloudy sand-water mixture.', initialAnswer: ['Cloudy tan sand-water mixture','The insoluble solid is still mixed with water'], note: 'The clearer appearance results from removing suspended sand; it is not a chemical colour change.'
        },
        chromatography: {
            title: 'Paper chromatography', objective: 'Separate soluble pigments in prepared groundnut-skin extract.',
            safety: 'Virtual prepared extract. Groundnuts can trigger severe allergies; solvent choice and handling require teacher supervision.',
            items: [['jar','Chromatography chamber'],['solvent','Suitable solvent'],['paper','Chromatography paper'],['pencil','Pencil and ruler'],['capillary','Capillary with prepared extract'],['lid','Lid and paper support']],
            actions: [step('Draw a pencil baseline', 'A pencil line is drawn above the solvent level. Graphite does not dissolve like pen ink might.', 'Pencil baseline above solvent level', 'The starting spot must stay above the solvent'), step('Spot the prepared extract', 'A small reddish-brown spot is added to the baseline using the capillary and allowed to dry.', 'Reddish-brown spot on the baseline', 'The extract contains soluble coloured components'), step('Lower the paper and develop', 'Solvent rises through the paper. Illustrative red, orange and yellow-brown bands move different distances. This is separation, not a chemical colour change.', 'Red, orange and yellow-brown bands separate', 'Soluble components travel at different rates'), step('Remove the paper and mark the solvent front', 'The paper lifts out and the solvent front is marked in pencil. The separated bands remain below the front; no crystals are expected.', 'Separated bands below the marked solvent front', 'The band pattern provides evidence of multiple components')],
            initial: 'A small amount of colourless solvent is in the chamber. The paper is ready above it.', initialAnswer: ['Colourless solvent and unmarked paper','The sample has not yet been separated'], note: 'Pigment colours are illustrative. Real groundnut-skin extract results depend on the extract and solvent. No specific pigment identity is inferred from colour alone.'
        },
        distillation: {
            title: 'Fractional distillation', objective: 'Collect an ethanol-rich fraction from an ethanol-water mixture.',
            safety: 'Use electric heating, never a flame near ethanol. Apparatus is clamped, the receiving end remains open, and the flask is never boiled dry. Virtual demonstration only.',
            items: [['stand','Retort stands and clamps'],['heater','Electric heating mantle'],['flask','Round-bottom flask and boiling chips'],['mixture','Ethanol-water mixture'],['column','Packed fractionating column'],['thermometer','Still head and thermometer'],['condenser','Liebig condenser and hoses'],['receiver','Receiving flask']],
            actions: [step('Start condenser cooling water', 'Cooling water enters the lower condenser port and leaves at the upper port, filling the jacket. It stays separate from the sample.', 'Water fills the condenser jacket', 'Cooling water removes heat from the vapour'), step('Apply controlled electric heating', 'Colourless liquid warms and bubbles. Vapour rises through the packed column, undergoing repeated condensation and vaporisation.', 'Colourless liquid boils; vapour rises', 'The more volatile component enriches the rising vapour'), step('Collect the first fraction', 'Drops of clear, colourless ethanol-rich liquid collect. The model thermometer reads about 78–80 °C for this early fraction; temperature depends on composition and pressure.', 'Colourless drops collect near 78–80 °C', 'The first fraction is richer in ethanol, not necessarily pure'), step('Stop heating and cool the apparatus', 'Electric heating stops. Liquid remains in the boiling flask. The receiver contains a colourless ethanol-rich fraction; no colour change or crystals are expected.', 'Colourless distillate; liquid remains in the flask', 'Different volatilities allow fractional separation')],
            initial: 'The clamped apparatus is connected. Ethanol and water form a clear, colourless mixture. The receiver is empty.', initialAnswer: ['Clear colourless mixture; empty receiver','The liquids have not yet been separated'], note: 'The animation is qualitative: temperatures, volumes and fraction composition are not a quantitative prediction. Cooling water continues during cooling.'
        }
    };
    const states = {};
    let key = null, frame = null, last = null;
    const storageKey = method => `grade7-separation-notebook-v1-${method}`;
    function state(method) {
        if (!states[method]) {
            let notes = [];
            try { notes = JSON.parse(localStorage.getItem(storageKey(method)) || '[]'); if (!Array.isArray(notes)) notes = []; } catch (_) { notes = []; }
            states[method] = {placed: 0, stage: 0, progress: 0, running: false, notes, draft: {note:'',appearance:'',conclusion:''}};
        }
        return states[method];
    }
    const svgGroup = (id, body) => `<g data-part="${id}">${body}</g>`;
    const label = (x,y,text) => `<text x="${x}" y="${y}" class="sep-svg-label">${text}</text>`;
    const glass = 'fill="url(#sep-glass)" stroke="#d9f3ff" stroke-width="3"';
    const beaker = (x,y,w,h) => `<path d="M${x} ${y}v${h-8}q0 8 8 8h${w-16}q8 0 8-8v-${h-8}" ${glass}/><path d="M${x+7} ${y+25}h12m-12 20h12m-12 20h12" stroke="#d9f3ff"/>`;
    function drawing(method) {
        const common = `<defs><linearGradient id="sep-glass"><stop stop-color="#d9f3ff" stop-opacity=".3"/><stop offset=".5" stop-color="#d9f3ff" stop-opacity=".03"/><stop offset="1" stop-color="#d9f3ff" stop-opacity=".25"/></linearGradient><pattern id="sep-mesh" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0h6v6" stroke="#adc4d2" fill="none"/></pattern></defs>`;
        if (method === 'sublimation') return common +
            svgGroup('hood', '<path d="M70 360V40h500v320M80 55h480M95 75h450" fill="#a9c9dd0d" stroke="#7899b2" stroke-width="5"/>'+label(95,100,'FUME CUPBOARD · ventilation on'))+
            svgGroup('mat','<rect x="205" y="390" width="230" height="10" rx="3" fill="#405564" stroke="#b9cedb"/>')+
            svgGroup('burner','<ellipse cx="320" cy="384" rx="30" ry="7" fill="#617e91" stroke="#b9d7e7"/><rect x="310" y="350" width="20" height="33" rx="3" fill="url(#sep-glass)" stroke="#d9f3ff" stroke-width="3"/><path d="M330 377h55q15 0 15-15" fill="none" stroke="#c3825c" stroke-width="6"/><g class="sep-heat sep-burner-flame"><path d="M320 316C316 326 303 337 311 347Q320 355 329 347C337 337 324 326 320 316Z" fill="#2387ff" stroke="#79d9ff" stroke-width="2"/><path d="M320 332Q308 350 320 350Q332 350 320 332Z" fill="#c5f6ff"/></g>')+
            svgGroup('tripod','<path d="M255 389l20-71m110 71-20-71m-45 0v70" stroke="#b9cedb" stroke-width="5"/><ellipse cx="320" cy="317" rx="57" ry="5" fill="none" stroke="#b9cedb" stroke-width="5"/>')+
            svgGroup('gauze','<rect x="252" y="312" width="136" height="5" fill="url(#sep-mesh)" stroke="#d5e3ed"/>')+
            svgGroup('beaker',beaker(260,220,120,90)+'<path d="M267 298q53-9 106 0v6H267z" fill="#f4f4ef"/><g class="sep-original-crystals" fill="#ffffff"><path d="M278 293l7-7 7 7-7 6zm28-3 7-7 7 7-7 6zm31 3 7-7 7 7-7 6z"/></g>'+label(400,301,'Common salt remains'))+
            svgGroup('support','<path d="M440 310V110m0 25h-98" fill="none" stroke="#a7bfce" stroke-width="6"/><rect x="416" y="308" width="60" height="8" rx="3" fill="#6a8293"/><path d="M310 124h20v18h-20" fill="none" stroke="#a7bfce" stroke-width="5"/>')+
            svgGroup('flask','<g class="sep-lift"><path d="M310 105v42a38 38 0 1 0 20 0v-42" '+glass+'/><path d="M287 175a34 34 0 1 0 66 0z" fill="#64caff66"/><path d="M287 175h66" stroke="#a5eaff" stroke-width="2"/><path d="M300 211q20 13 40 0" class="sep-deposit" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><g class="sep-deposit" fill="#fff"><path d="M302 216l4 8 4-6 5 8 5-7 5 7 5-8 5 6 3-9z"/></g></g>'+label(365,160,'Cold water')+label(88,210,'White deposit on cold underside'))+
            '<g class="sep-white-fumes" fill="#fff"><ellipse cx="294" cy="273" rx="11" ry="8"/><ellipse cx="323" cy="261" rx="14" ry="10"/><ellipse cx="344" cy="282" rx="10" ry="7"/><ellipse cx="312" cy="240" rx="16" ry="8"/></g>';
        if (method === 'filtration') return common +
            svgGroup('stand','<path d="M180 350V90m0 80h110" stroke="#a7bfce" stroke-width="7"/><rect x="140" y="350" width="130" height="12" rx="5" fill="#6a8293"/><ellipse cx="320" cy="190" rx="65" ry="9" fill="none" stroke="#93adbf" stroke-width="5"/>')+
            svgGroup('receiver',beaker(275,270,90,88)+'<rect class="sep-filtrate" x="281" y="300" width="78" height="50" fill="#e1f4ff66"/>'+label(275,385,'Filtrate'))+
            svgGroup('funnel','<path d="M255 170h130l-55 65v35h-20v-35z" '+glass+'/>'+label(400,210,'Funnel over beaker'))+
            svgGroup('paper','<g class="sep-paper-circle"><circle cx="470" cy="295" r="43" fill="#f1eee7"/><path d="M470 252v86" stroke="#bac4cf" stroke-dasharray="4 4"/></g><path class="sep-paper-half" d="M470 252a43 43 0 0 1 0 86z" fill="#f1eee7" stroke="#bac4cf"/><path class="sep-paper-quarter" d="M470 295v-43a43 43 0 0 1 43 43z" fill="#f1eee7" stroke="#bac4cf"/><g class="sep-paper-cone"><path d="M262 174h116l-58 62z" fill="#f6f1e7" stroke="#bfcad4"/><path d="M320 174v62" stroke="#c5bfb3" stroke-dasharray="3 3"/></g><path class="sep-residue" d="M283 188h74l-37 38z" fill="#b89562"/>')+
            svgGroup('source','<g class="sep-pouring-source">'+beaker(420,125,75,90)+'<rect class="sep-source-liquid" x="426" y="160" width="63" height="47" fill="#b4a184"/>'+label(418,240,'Sand + water')+'</g>')+
            svgGroup('rod','<path d="M398 145l-70 55" stroke="#daf2ff" stroke-width="5" stroke-linecap="round"/>')+
            '<path class="sep-pour-stream" d="M398 145l-70 55" stroke="#b4a184" stroke-width="6"/><path class="sep-drips" d="M320 242v25" stroke="#d6f0ff" stroke-width="4" stroke-dasharray="4 10"/>'+label(385,255,'Residue stays on paper');
        if (method === 'chromatography') return common +
            svgGroup('jar',beaker(205,120,230,240)+label(225,390,'Chromatography chamber'))+
            svgGroup('solvent','<rect x="211" y="323" width="218" height="29" fill="#dff4ff55"/>'+label(445,340,'Solvent'))+
            svgGroup('paper','<g class="sep-paper-lift"><rect x="280" y="130" width="80" height="210" fill="#f6f1de" stroke="#d2cbb9"/><path class="sep-baseline" d="M285 300h70" stroke="#5d5f61" stroke-width="2"/><circle class="sep-origin" cx="320" cy="300" r="6" fill="#8b4a32"/><path class="sep-solvent-front" d="M284 300h72" stroke="#7da1ba" stroke-width="2" stroke-dasharray="5 3"/><g class="sep-bands"><ellipse class="sep-band-red" cx="320" cy="300" rx="14" ry="5" fill="#b83b45"/><ellipse class="sep-band-orange" cx="320" cy="300" rx="14" ry="5" fill="#e87832"/><ellipse class="sep-band-yellow" cx="320" cy="300" rx="14" ry="5" fill="#c0a243"/></g><path class="sep-front-mark" d="M283 160h74" stroke="#525960" stroke-width="2"/></g>')+
            svgGroup('pencil','<g class="sep-pencil"><path d="M380 300h60" stroke="#e3b85c" stroke-width="7"/><path d="M380 296l-10 4 10 4z" fill="#ded0b2"/></g>'+label(445,295,'Pencil baseline'))+
            svgGroup('capillary','<path class="sep-capillary" d="M400 215l-75 80" stroke="#def5ff" stroke-width="4"/>'+label(415,210,'Prepared extract'))+
            svgGroup('lid','<path d="M193 119h254" stroke="#8cabbc" stroke-width="10"/><path d="M245 124h150" stroke="#bfcdd6" stroke-width="4"/>')+
            label(75,305,'Spot above solvent')+'<text x="385" y="170" class="sep-svg-label sep-front-label">Solvent front</text>';
        return common +
            svgGroup('stand','<path d="M160 365V55m0 80h93m272 230V130m0 70h-60" stroke="#8fa9bb" stroke-width="6"/><path d="M125 365h100m260 0h115" stroke="#7894a6" stroke-width="12"/>')+
            svgGroup('heater','<path d="M200 319q65 50 130 0v39H200z" fill="#596d80" stroke="#aec8da" stroke-width="3"/><path class="sep-heat" d="M215 347h100" stroke="#ff9c71" stroke-width="4"/>'+label(205,388,'Electric mantle'))+
            svgGroup('flask','<path d="M253 237v-18h24v18a49 49 0 1 1-24 0z" '+glass+'/><g fill="#f7f2de"><circle cx="245" cy="321" r="3"/><circle cx="260" cy="325" r="3"/><circle cx="281" cy="322" r="3"/></g>')+
            svgGroup('mixture','<path class="sep-boiling-liquid" d="M222 287h86a44 44 0 0 1-86 0" fill="#dff4ff66"/><g class="sep-bubbles" fill="none" stroke="#e3f7ff"><circle cx="245" cy="300" r="5"/><circle cx="270" cy="308" r="4"/><circle cx="287" cy="299" r="4"/></g>')+
            svgGroup('column','<rect x="253" y="120" width="24" height="100" '+glass+'/><path d="M258 132l14 8-14 8 14 8-14 8 14 8-14 8 14 8-14 8" stroke="#a8c1cf" fill="none"/>'+label(45,190,'Packed fractionating column'))+
            svgGroup('thermometer','<path d="M253 120V92h24v15l40 18" '+glass+'/><path d="M265 66v48" stroke="#e6f7ff" stroke-width="6"/><path d="M265 90v24" stroke="#e77c75" stroke-width="2"/>'+label(295,68,'Thermometer bulb at side arm')+'<text id="sep-temperature" x="290" y="90" class="sep-svg-label">20 °C</text>')+
            svgGroup('condenser','<path d="M312 111l190 85-14 30-190-85z" '+glass+'/><path d="M309 125l190 85 24 12v26" fill="none" stroke="#d9f3ff" stroke-width="6"/><path class="sep-cooling" d="M322 116l173 78-10 23-173-78z" fill="#5cc5ef44"/><path d="M481 217v31h-26m-122-128V94h-25" fill="none" stroke="#6ebbd4" stroke-width="6"/>'+label(440,267,'Water IN · lower port')+label(320,100,'Water OUT · upper port')+label(385,155,'Liebig condenser'))+
            svgGroup('receiver','<path d="M513 267v29l-28 43q-5 12 8 12h60q13 0 8-12l-28-43v-29" '+glass+'/><path class="sep-distillate" d="M501 320h44l12 24h-68z" fill="#e0f5ff88"/>'+label(460,382,'Open receiving flask'))+
            '<path class="sep-flow" d="M265 260V110l242 108" fill="none" stroke="#e2f3ff" stroke-width="3" stroke-dasharray="6 12"/><path class="sep-drips" d="M523 249v55" stroke="#dff5ff" stroke-width="4" stroke-dasharray="4 10"/>';
    }
    function expected() {
        const s = state(key), m = methods[key];
        return s.stage ? [m.actions[s.stage-1].appearance,m.actions[s.stage-1].conclusion] : m.initialAnswer;
    }
    function saveDraft() { if (key) state(key).draft = {note:el('note').value,appearance:el('appearance').value,conclusion:el('conclusion').value,residue:el('residue-answer').value,filtrate:el('filtrate-answer').value,method:el('method-answer').value}; }
    function fillOptions() {
        const m = methods[key], s = state(key);
        ['appearance','conclusion'].forEach((name,index) => {
            const values = [...new Set([m.initialAnswer[index], ...m.actions.map(a => a[name]), index ? 'A new substance forms because the colour changes' : 'The whole mixture turns blue'])];
            el(name).replaceChildren(new Option('Choose…',''), ...values.map(v => new Option(v,v)));
            el(name).value = s.draft[name];
        });
        el('note').value = s.draft.note;
        ['residue','filtrate','method'].forEach(name => { el(name+'-answer').value=s.draft[name] || ''; });
    }
    function notes() {
        const entries = state(key).notes;
        el('log').replaceChildren();
        if (!entries.length) { const row = el('log').insertRow(); const cell = row.insertCell(); cell.colSpan = 3; cell.textContent = 'Your checked observations for this method will appear here.'; }
        entries.forEach(entry => { const row = el('log').insertRow(); [entry.stage,entry.answer,entry.mark].forEach(value => { row.insertCell().textContent = value; }); });
        el('notebook-title').textContent = `${methods[key].title} notebook · ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
    }
    function persist() {
        try { localStorage.setItem(storageKey(key),JSON.stringify(state(key).notes)); el('storage').textContent = 'Saved in this browser separately for each method. Resetting apparatus keeps your notes.'; }
        catch (_) { el('storage').textContent = 'Browser storage is unavailable. Notes are kept while this page stays open.'; }
    }
    function render() {
        if (!key) return;
        const s = state(key), m = methods[key], assembled = s.placed === m.items.length;
        root.dataset.method = key; root.dataset.stage = s.stage; root.dataset.running = String(s.running);
        root.dataset.action = String(s.stage); root.style.setProperty('--sep-progress',s.progress);
        el('drawing').querySelectorAll('[data-part]').forEach(group => { group.style.display = m.items.slice(0,s.placed).some(([id]) => id === group.dataset.part) ? '' : 'none'; });
        root.querySelectorAll('[data-sep-item]').forEach((button,i) => { button.disabled = i < s.placed; });
        const status = !assembled ? `Setup · ${s.placed} of ${m.items.length} items` : s.stage === m.actions.length ? 'Separation complete' : `Action ${s.stage+1} of ${m.actions.length}`;
        el('stage').textContent = status;
        el('action').disabled = !assembled || s.running || s.progress > 0 || s.stage === m.actions.length;
        el('action').textContent = !assembled ? 'Assemble apparatus' : s.stage === m.actions.length ? 'Experiment complete' : m.actions[s.stage].label;
        el('pause').hidden = !s.running && !s.progress;
        el('pause').textContent = s.running ? 'Pause animation' : 'Resume animation';
        el('progress').value = s.progress * 100;
        el('filtration-questions').hidden = key !== 'filtration';
        el('general-questions').hidden = key === 'filtration';
        el('record').disabled = !assembled || s.running || s.progress > 0 || (key === 'filtration' && s.stage < 4);
        const observation = s.running || s.progress ? `In progress: ${m.actions[s.stage].label}. Watch the apparatus; pause to inspect, then finish this action before recording.` : s.stage ? m.actions[s.stage-1].observation : m.initial;
        if (el('observation').textContent !== observation) el('observation').textContent = observation;
        const p = s.progress, completed = s.stage;
        function show(selector,value) { el('drawing').querySelectorAll(selector).forEach(node => {node.style.opacity = String(Number(value));}); }
        if (key === 'sublimation') {
            show('.sep-original-crystals', completed ? 0 : 1-p);
            show('.sep-deposit', completed >= 2 ? 1 : completed === 1 ? .6 + .4*p : .6*p);
            show('.sep-white-fumes', completed === 0 ? p : completed === 1 ? 1-p : 0);
            root.querySelector('.sep-lift').style.transform = `translate(${completed >= 3 ? 80 : completed === 2 ? 80*p : 0}px,${completed >= 3 ? -30 : completed === 2 ? -30*p : 0}px)`;
        } else if (key === 'filtration') {
            show('.sep-paper-circle',completed === 0 ? 1-p : 0);
            show('.sep-paper-half',completed === 0 ? p : completed === 1 ? 1-p : 0);
            show('.sep-paper-quarter',completed === 1 ? p : completed === 2 ? 1-p : 0);
            show('.sep-paper-cone',completed >= 3 ? 1 : completed === 2 ? p : 0);
            const fitting = completed >= 3 ? 1 : completed === 2 ? p : 0;
            root.querySelector('.sep-paper-cone').setAttribute('transform', 'translate('+150*(1-fitting)+' '+110*(1-fitting)+')');
            const poured = completed >= 4 ? 1 : completed === 3 ? Math.max(0,(p-.15)/.85) : 0;
            show('.sep-residue',poured); show('.sep-filtrate',poured > 0);
            const filtrate = root.querySelector('.sep-filtrate'); filtrate.setAttribute('y',350-50*poured); filtrate.setAttribute('height',50*poured);
            show('.sep-source-liquid',1-poured);
            const liquid = root.querySelector('.sep-source-liquid'); liquid.setAttribute('y',207-47*(1-poured)); liquid.setAttribute('height',47*(1-poured));
            show('.sep-pour-stream',completed === 3 && p > .15 && p < .95); show('.sep-drips',completed === 3 && p > .2);
            const source = root.querySelector('.sep-pouring-source'); source.style.opacity = completed >= 5 ? 0 : completed === 4 ? 1-p : 1;
            const tilt = completed === 3 ? Math.min(1,p/.15) : 0;
            source.style.transform = 'translate('+(-22*tilt)+'px,'+(20*tilt)+'px) rotate('+(-25*tilt)+'deg)';
        } else if (key === 'chromatography') {
            show('.sep-baseline',completed >= 1 ? 1 : p); show('.sep-origin',completed >= 2 ? completed >= 3 ? .2 : 1 : completed === 1 ? p : 0);
            const travel = completed >= 3 ? 1 : completed === 2 ? p : 0;
            show('.sep-bands',travel); show('.sep-solvent-front',travel); show('.sep-front-mark',completed >= 4 ? 1 : completed === 3 ? p : 0);
            [['red',65],['orange',100],['yellow',130]].forEach(([name,distance]) => root.querySelector(`.sep-band-${name}`).style.transform = `translateY(${-distance*travel}px)`);
            root.querySelector('.sep-solvent-front').style.transform = `translateY(${-140*travel}px)`;
            const removal = completed >= 4 ? 1 : completed === 3 ? p : 0;
            root.querySelector('.sep-paper-lift').style.transform = `translate(${185*removal}px,${removal ? -40*removal : completed < 2 ? -45 : -45*(1-Math.min(1,p*5))}px)`;
            root.querySelector('.sep-front-label').style.transform = `translate(${185*removal}px,${-40*removal}px)`;
            show('[data-part="lid"]',1-removal);
            show('[data-part="pencil"]',completed >= 1 ? 0 : 1);
            show('[data-part="capillary"]',completed >= 2 ? 0 : 1);
            root.querySelector('.sep-pencil').style.transform = completed === 0 ? `translateX(${-90*p}px)` : '';
        } else {
            show('.sep-cooling',completed >= 1 ? 1 : p); show('.sep-flow',s.running && (completed === 1 || completed === 2));
            show('.sep-bubbles',s.running && (completed === 1 || completed === 2)); show('.sep-drips',s.running && completed === 2);
            show('.sep-distillate',completed >= 3 ? 1 : completed === 2 ? p : 0);
            const temperature = completed >= 4 ? 25 : completed === 3 ? Math.round(79-54*p) : completed >= 2 ? 79 : completed === 1 ? Math.round(20+59*p) : 20;
            el('temperature').textContent = `${temperature} °C · model`;
        }
        // Keep the burner visibly lit after heating until the learner switches it off.
        const burnerLit = key === 'sublimation' && ((completed === 0 && (s.running || p > 0)) || (completed === 1 && !s.running && p === 0));
        root.dataset.burnerLit = String(burnerLit);
        root.dataset.motionPaused = String(!s.running && p > 0);
        show('.sep-heat',burnerLit || (key === 'distillation' && s.running && (completed === 1 || completed === 2)));
        if (burnerLit && completed === 1) el('observation').textContent = m.actions[0].observation + ' The blue flame is still lit. Select “Switch off and allow deposition and cooling” to extinguish it.';
        document.querySelectorAll('#sep-procedure li').forEach((li,i) => { li.classList.toggle('active',i === (assembled ? m.items.length + s.stage : s.placed)); li.classList.toggle('complete',i < (assembled ? m.items.length+s.stage : s.placed)); });
    }
    function animate(now) {
        const s = state(key);
        if (!s.running) return;
        if (last !== null) s.progress = Math.min(1,s.progress+(now-last)/4500);
        last = now; render();
        if (s.progress === 1) { s.running=false; s.progress=0; s.stage++; last=null; render(); el('feedback').textContent = methods[key].actions[s.stage-1].observation; }
        else frame = requestAnimationFrame(animate);
    }
    function pause() { if (!key) return; state(key).running=false; cancelAnimationFrame(frame); last=null; render(); }
    function place(id) {
        const s = state(key), m = methods[key];
        if (m.items[s.placed]?.[0] !== id) { el('feedback').textContent = s.placed === m.items.length ? 'The apparatus is assembled. Use the action button.' : `First bring ${m.items[s.placed][1]} from the shelf.`; return; }
        s.placed++; render();
        const group = root.querySelector(`[data-part="${id}"]`);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) group.animate([{opacity:0,transform:'translate(90px,-35px)'},{opacity:1,transform:'translate(0,0)'}],{duration:700,easing:'ease-out'});
        el('feedback').textContent = s.placed === m.items.length ? 'Apparatus assembled. Choose the first action and watch the animation.' : `${m.items[s.placed-1][1]} placed. Next: ${m.items[s.placed][1]}.`;
    }
    function activate() {
        const next = methods[app.dataset.activeMethod] ? app.dataset.activeMethod : null;
        if (app.hidden || document.getElementById('simulation-view').hidden) { if (key) pause(); return; }
        if (next === key) return;
        saveDraft(); pause(); key=next; root.hidden=!key; app.dataset.handsOn=String(Boolean(key));
        if (!key) return;
        const m=methods[key]; state(key);
        el('drawing').innerHTML=drawing(key); el('drawing').setAttribute('aria-label',`${m.title} apparatus. ${m.objective}`);
        el('objective').textContent=m.objective; el('safety').textContent=m.safety;
        el('model-note').textContent=m.note;
        el('reference-link').href = key === 'chromatography' ? 'https://edu.rsc.org/practical/paper-chromatography-practical-videos-14-16-years/4018537.article' : key === 'distillation' ? 'https://edu.rsc.org/mixtures-and-separation/teaching-distillations-apparatus-and-stages/4022439.article' : key === 'filtration' ? 'https://edu.rsc.org/infographics/how-to-teach-filtration-evaporation-and-crystallisation-at-11-14/4022681.article' : 'https://edu.rsc.org/in-search-of-solutions/recycle-shipwrecked-cargo-demands-group/1196.article';
        el('shelf-items').replaceChildren(...m.items.map(([id,name]) => {
            const button=document.createElement('button'); button.type='button'; button.draggable=true; button.dataset.sepItem=id;
            const art=document.createElementNS('http://www.w3.org/2000/svg','svg'); art.setAttribute('viewBox','0 0 640 450'); art.setAttribute('aria-hidden','true'); art.innerHTML=drawing(key).replaceAll('sep-glass',`sep-glass-${id}`).replaceAll('sep-mesh',`sep-mesh-${id}`); art.querySelectorAll('[data-part]').forEach(part => {if(part.dataset.part!==id)part.remove();}); art.querySelectorAll('text,.sep-flow,.sep-drips,.sep-pour-stream,.sep-white-fumes').forEach(node=>node.remove());
            // Tight view boxes keep the shelf drawings legible at any screen width.
            const boxes={sublimation:{hood:'55 25 530 350',mat:'195 375 250 35',burner:'280 290 130 110',tripod:'240 300 160 105',gauze:'240 300 160 30',beaker:'250 210 140 110',support:'300 95 185 230',flask:'275 95 90 140'},filtration:{stand:'125 75 220 300',receiver:'265 255 110 110',funnel:'245 160 150 120',paper:'420 245 100 100',source:'410 115 95 110',rod:'315 130 100 85'},chromatography:{jar:'195 110 250 260',solvent:'195 300 250 65',paper:'270 120 100 230',pencil:'365 280 90 40',capillary:'310 200 110 110',lid:'180 100 280 40'},distillation:{stand:'115 40 495 340',heater:'190 305 150 65',flask:'205 210 120 130',mixture:'210 275 110 60',column:'240 110 50 120',thermometer:'240 55 90 90',condenser:'285 85 255 180',receiver:'475 255 100 110'}};
            art.setAttribute('viewBox',boxes[key][id]);
            const strong=document.createElement('strong'); strong.textContent=name; button.append(art,strong); button.onclick=()=>place(id);
            button.addEventListener('dragstart',event=>{if(button.disabled){event.preventDefault();return;}event.dataTransfer.setData('text/plain',id);}); return button;
        }));
        const list=document.getElementById('sep-procedure'); list.replaceChildren(...[...m.items.map(([id,name])=>id === 'hood' ? 'Set up the experiment inside the virtual fume cupboard.' : `Place ${name.toLowerCase()} on the bench.`),...m.actions.map(a=>a.label), 'Record and check observations in this method’s notebook.'].map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
        fillOptions(); notes(); persist(); render(); el('mark').textContent='';
        el('feedback').textContent='Follow the procedure. Drag apparatus from the shelf or click an item.';
    }
    el('action').onclick=()=>{const s=state(key);if(s.placed!==methods[key].items.length||s.running||s.stage===methods[key].actions.length)return;s.running=true;last=null;render();el('feedback').textContent=`Animating: ${methods[key].actions[s.stage].label}.`;frame=requestAnimationFrame(animate);};
    el('pause').onclick=()=>{const s=state(key);if(s.running){pause();el('feedback').textContent='Animation paused. Inspect the apparatus, then resume to finish this action.';}else{s.running=true;last=null;frame=requestAnimationFrame(animate);render();el('feedback').textContent=`Animating: ${methods[key].actions[s.stage].label}.`;}};
    el('bench').ondragover=event=>event.preventDefault(); el('bench').ondrop=event=>{event.preventDefault();place(event.dataTransfer.getData('text/plain'));};
    el('reset').onclick=()=>{pause();const s=state(key);s.placed=0;s.stage=0;s.progress=0;render();el('feedback').textContent='Apparatus reset. Your notebook is retained.';};
    el('record').onclick=()=>{
        const s=state(key);if(s.running||s.progress||s.placed!==methods[key].items.length)return;
        if(key==='filtration') {
            if(s.stage<4)return;
            const questions=[['residue','Sand'],['filtrate','Water'],['method','Filtration']];
            if(questions.some(([name])=>!el(name+'-answer').value)){el('mark').textContent='Choose the residue, filtrate and method.';return;}
            let score=0;const answers=[],corrections=[];
            questions.forEach(([name,expected])=>{const value=el(name+'-answer').value;answers.push(name[0].toUpperCase()+name.slice(1)+': '+value);if(value===expected)score++;else corrections.push(name[0].toUpperCase()+name.slice(1)+': '+expected);});
            const mark=score+'/3. '+(corrections.length?corrections.join('; ')+'.':'All correct.');
            s.notes.push({stage:'Filtration',answer:answers.join('; ')+'.',mark});
            persist();notes();el('mark').textContent=mark;
            s.draft={note:'',appearance:'',conclusion:''};fillOptions();return;
        }
        const appearance=el('appearance').value, conclusion=el('conclusion').value;
        if(!appearance||!conclusion){el('mark').textContent='Choose both answers before recording.';return;}
        const answers=expected(); let score=Number(appearance===answers[0])+Number(conclusion===answers[1]);
        let correction=`${score}/2. ${appearance===answers[0]?'✓ Observation correct.':`Observation: ${answers[0]}.`} ${conclusion===answers[1]?'✓ Explanation correct.':`Explanation: ${answers[1]}.`}`;
        s.notes.push({stage:s.stage?methods[key].actions[s.stage-1].label:'Assembled setup',answer:`${el('note').value.trim()} Observation: ${appearance}. Explanation: ${conclusion}.`,mark:correction});
        persist();notes();el('mark').textContent=correction+' Written notes are for reflection and teacher review.';
        s.draft={note:'',appearance:'',conclusion:''};fillOptions();
    };
    el('clear').onclick=()=>{state(key).notes=[];persist();notes();el('mark').textContent='This method’s notebook has been cleared.';};
    new MutationObserver(activate).observe(document.getElementById('simulation-view'),{subtree:true,attributes:true,attributeFilter:['data-active-method','hidden']});
    activate();
})();
