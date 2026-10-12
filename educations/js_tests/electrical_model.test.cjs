const {test}=require('node:test');
const assert=require('node:assert/strict');
const {layout,analyze,grade}=require('../static/educations/electrical_model.js');

function circuit(overrides={}) {
    const s={method:'simple',bulbs:'series',cells:'series',current:'main',voltage:'source',closed:true,...overrides};
    const b=layout(s);s.placed=Object.keys(b.parts).concat('wires');s.wires=b.pairs.concat([['v+',b.voltageTarget[0]],['v-',b.voltageTarget[1]]]);return s;
}
const near=(value,expected)=>assert(Math.abs(value-expected)<1e-10,`${value} != ${expected}`);
test('simple circuit closes, lights a bulb, and measures 0.30 A and 3 V',()=>{
    const m=analyze(circuit());assert(m.ready&&m.on&&m.voltageConnected);near(m.current,.3);near(m.volts,3);assert.equal(m.brightness,'bright');
});
test('opening the switch stops current but preserves source voltage',()=>{
    const m=analyze(circuit({closed:false}));assert(m.ready&&!m.on);near(m.current,0);near(m.volts,3);assert.equal(m.brightness,'off');
    near(analyze(circuit({closed:false,voltage:'b1'})).volts,0);
});
test('two series bulbs carry equal current and share the source voltage',()=>{
    for(const voltage of ['b1','b2']){const m=analyze(circuit({method:'bulbs',bulbs:'series',voltage}));near(m.current,.15);near(m.volts,1.5);near(m.bulbCurrent,.15);assert.equal(m.brightness,'dim');near(m.relativePower,.25);}
});
test('parallel bulbs have full source voltage; total current is the branch sum',()=>{
    const total=analyze(circuit({method:'bulbs',bulbs:'parallel',voltage:'b1'}));near(total.current,.6);near(total.volts,3);assert.equal(total.brightness,'bright');
    for(const current of ['b1','b2']){const branch=analyze(circuit({method:'bulbs',bulbs:'parallel',current,voltage:current}));assert(branch.ready);near(branch.current,.3);near(branch.volts,3);near(total.current,2*branch.current);}
});
test('matched parallel cells retain one-cell voltage and load current',()=>{
    const single=analyze(circuit({method:'cells',cells:'single'})),parallel=analyze(circuit({method:'cells',cells:'parallel'})),series=analyze(circuit({method:'cells',cells:'series'}));
    near(single.volts,1.5);near(parallel.volts,1.5);near(series.volts,3);near(single.current,.15);near(parallel.current,.15);near(series.current,.3);assert.equal(parallel.brightness,'dim');assert.equal(series.brightness,'bright');
});
test('an incomplete return wire cannot light a bulb or register current',()=>{
    const s=circuit();s.wires=s.wires.filter(pair=>!pair.includes('b1-'));const m=analyze(s);assert(!m.ready&&!m.on);assert.equal(m.current,null);assert.equal(m.brightness,'off');
});
test('an ammeter connected across the cells is rejected',()=>{
    const s=circuit();s.wires.push(['a+','c1+'],['a-','c2-']);const m=analyze(s);assert(m.fault);assert(!m.on);assert.equal(m.current,null);
});
test('reversed voltmeter probes give a signed voltage without disturbing current',()=>{
    const s=circuit();s.wires=s.wires.filter(pair=>!pair.some(id=>id.startsWith('v')));s.wires.push(['v+','c2-'],['v-','c1+']);const m=analyze(s);assert(m.on&&m.voltageConnected);near(m.volts,-3);near(m.current,.3);
});
test('voltmeter leads must span the selected measurement target',()=>{
    const s=circuit({method:'bulbs',bulbs:'series',voltage:'b1'});s.wires=s.wires.filter(pair=>!pair.some(id=>id.startsWith('v')));s.wires.push(['v+','c1+'],['v-','c2-']);const m=analyze(s);assert(m.on);assert(!m.voltageConnected);near(m.volts,3);
});
test('voltmeter is optional for lighting, and does not change load current',()=>{
    const s=circuit();s.placed=s.placed.filter(id=>id!=='voltmeter');s.wires=s.wires.filter(pair=>!pair.some(id=>id.startsWith('v')));const m=analyze(s);assert(m.on);near(m.current,.3);assert.equal(m.volts,null);
});
test('electrically equivalent junction wiring is accepted',()=>{
    const s=circuit({method:'bulbs',bulbs:'parallel'});s.wires=s.wires.filter(pair=>!(pair.includes('a-')&&pair.includes('b2+')));s.wires.push(['b1+','b2+']);const m=analyze(s);assert(m.on);near(m.current,.6);
});
test('incorrect or missing inter-cell wiring cannot energize the circuit',()=>{
    const s=circuit({method:'cells',cells:'parallel'});s.wires=s.wires.filter(pair=>!(pair.includes('c1+')&&pair.includes('c2+')));assert(!analyze(s).on);s.wires.push(['c1+','c2-']);assert(analyze(s).fault);
});
test('notebook grading allows two-decimal readings and gives corrections',()=>{
    const m=analyze(circuit());assert.equal(grade(m,{current:'.30',voltage:'3.00',brightness:'bright'}),'3/3. Correct.');const wrong=grade(m,{current:'.6',voltage:'1.5',brightness:'dim'});assert(wrong.startsWith('0/3.'));assert(wrong.includes('Current: 0.30 A.'));assert(wrong.includes('Voltage: 3.00 V.'));assert(wrong.includes('Brightness: bright.'));
});
