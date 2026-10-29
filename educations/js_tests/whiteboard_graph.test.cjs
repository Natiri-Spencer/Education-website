const { test } = require('node:test');
const assert = require('node:assert/strict');
const G = require('../static/educations/whiteboard_graph.js');
const M = require('../static/educations/whiteboard_model.js');

test('graph parser evaluates whitelisted explicit functions', () => {
    const quadratic = G.compile('y = x^2');
    assert.equal(quadratic.expression, 'x^2');
    assert.equal(quadratic.evaluate(-3), 9);
    assert(Math.abs(G.compile('sin(x) + pi').evaluate(0) - Math.PI) < 1e-12);
    assert.equal(G.compile('-x^2').evaluate(3), -9);
    assert.equal(G.compile('2^-2').evaluate(0), .25);
});

test('graph parser rejects assignments, unknown names and executable input', () => {
    for (const expression of ['z = x', 'alert(1)', 'x.constructor', 'x; window.location=1', 'constructor(1)', '2 3', 'xx']) {
        assert.throws(() => G.compile(expression));
    }
});

test('standard linear, quadratic and cubic notation previews and fills tables', () => {
    for (const [expression, f] of [
        ['y = 2x+5', x=>2*x+5],
        ['y = 3x² − 2x + 1', x=>3*x*x-2*x+1],
        ['y = 2x³ + 3x² − x − 5', x=>2*x**3+3*x*x-x-5],
        ['y = 2(x+1)(x-1)', x=>2*(x+1)*(x-1)],
        ['f(x) = -x³ + x(x-1)', x=>-(x**3)+x*(x-1)],
        ['y = x**3', x=>x**3],
    ]) {
        for (const x of [-3,-1,0,2]) assert.equal(G.compile(expression).evaluate(x),f(x));
        const filled=G.fillTable(expression,[-2,-1,0,1,2].map(x=>[x,'']));
        assert.deepEqual(filled,[-2,-1,0,1,2].map(x=>[x,f(x)]));
        const plotted=G.plot(expression,{xMin:-2,xMax:2,yMin:-100,yMax:100});
        assert(plotted.samples.flat().every(([x,y])=>Math.abs(y-f(x))<1e-8));
        assert(G.plotFunctionTable(expression,filled,{autoRange:true}).samples.length);
    }
    assert.equal(G.compile('2x^2').evaluate(3),18);
    assert.equal(G.compile('-2x²').evaluate(3),-18);
    assert.equal(G.compile('2sin(x)').evaluate(0),0);
});

test('graph sampling includes the parabola origin and separates discontinuities', () => {
    const parabola = G.plot('y = x^2', { xMin: -10, xMax: 10, yMin: -2, yMax: 100, sampleCount: 401 });
    assert.deepEqual(parabola.samples[0].find(([x]) => x === 0), [0, 0]);
    const reciprocal = G.plot('1/x', { xMin: -4, xMax: 4, yMin: -10, yMax: 10, sampleCount: 401 });
    assert(reciprocal.samples.length >= 2);
    assert(reciprocal.samples.every(segment => segment.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))));
});

test('graph range limits and empty plots return useful errors', () => {
    assert.throws(() => G.plot('x', { xMin: 5, xMax: -5 }), /maximum/);
    assert.throws(() => G.plot('sqrt(x)', { xMin: -10, xMax: -1 }), /no visible values/);
    assert.throws(() => G.plot('x', { xMin: -1e9, xMax: 1 }), /between/);
});

test('graphs survive board restoration and remain movable and resizable', () => {
    const plotted = G.plot('y = x^2');
    const graph = M.create('graph', 30, 40, { ...plotted, stroke: '#1689f8', showGrid: true, showAxes: true });
    const board = M.newBoard(); board.items = [graph];
    const restored = M.restore(JSON.parse(JSON.stringify(board))).items[0];
    assert.equal(restored.type, 'graph');
    assert.equal(restored.expression, 'x^2');
    assert.deepEqual(M.bounds(M.move(restored, 20, 30)), { x: 50, y: 70, w: 560, h: 360 });
    assert.deepEqual(M.bounds(M.resize(restored, 700, 420)), { x: 30, y: 40, w: 700, h: 420 });
});

test('editable board import recompiles graphs and rejects injected expressions', () => {
    const board = M.newBoard();
    board.items = [M.create('graph', 0, 0, { ...G.plot('cos(x)'), samples: [[[999, 999]]], showGrid: false })];
    const restored = M.restore(JSON.parse(JSON.stringify(board))).items[0];
    assert.notDeepEqual(restored.samples, [[[999, 999]]]);
    const unsafe = M.newBoard(); unsafe.items = [{ ...board.items[0], expression: 'alert(1)' }];
    assert.throws(() => M.restore(unsafe), /not allowed/);
});

test('tables produce linear, quadratic and cubic curves through every entered point', () => {
    for (const [degree, f] of [[1,x=>2*x+1],[2,x=>x*x-2*x-3],[3,x=>x*x*x-4*x]]) {
        const points = [-3,-2,-1,0,1,2,3].map(x=>[x,f(x)]);
        const graph = G.plotTable(points, {autoRange:true});
        assert.equal(graph.fittedDegree, degree);
        assert.deepEqual(graph.tablePoints, points);
        for (const [x,y] of graph.samples.flat()) assert(Math.abs(y-f(x))<1e-8);
        assert(graph.xMin < -3 && graph.xMax > 3);
        assert(graph.yMin < Math.min(...points.map(p=>p[1])));
        assert(graph.yMax > Math.max(...points.map(p=>p[1])));
    }
});

test('tables validate incomplete, duplicate, nonnumeric, insufficient and inconsistent data', () => {
    assert.throws(()=>G.plotTable([[0,''],[1,2]]), /Complete both/);
    assert.throws(()=>G.plotTable([[0,0],[0,1]]), /different x/);
    assert.throws(()=>G.plotTable([['abc',1],[2,2]]), /must be a number/);
    assert.throws(()=>G.plotTable([[0,0],[1,1]],{degree:'3'}), /at least 4/);
    assert.throws(()=>G.plotTable([[0,0],[1,1],[2,4]],{degree:'1'}), /do not match/);
    assert.throws(()=>G.plotTable([0,1,2,3,4].map(x=>[x,x**4])), /do not match/);
    assert.throws(()=>G.plotTable([[0,0],[1,1]],{degree:'alert(1)'}), /Choose/);
    assert.equal(G.plotTable([['',''],['-1','1'],['0','0'],['1','1']],{autoRange:true}).fittedDegree,2);
});

test('table graphs restore original points and recompute curves rather than trusting imported samples', () => {
    const graph=G.plotTable([[2,8],[-2,-8],[0,0],[1,1]],{degree:'3',autoRange:true});
    const board=M.newBoard();board.items=[M.create('graph',0,0,{...graph,samples:[[[999,999]]]})];
    const restored=M.restore(JSON.parse(JSON.stringify(board))).items[0];
    assert.deepEqual(restored.tablePoints,graph.tablePoints);
    assert.equal(restored.tableDegree,'3');
    assert.equal(restored.graphSource,'table');
    assert.notDeepEqual(restored.samples,[[[999,999]]]);
    assert(restored.samples.flat().every(([x,y])=>Math.abs(y-x**3)<1e-8));
    board.items[0].tablePoints=[[0,0],[0,1]];
    assert.throws(()=>M.restore(board), /different x/);
});

test('functions fill y values for linear, quadratic and cubic tables without changing x', () => {
    for (const [expression, fn] of [['2*x+1',x=>2*x+1],['x^2',x=>x*x],['x^3-2*x',x=>x**3-2*x]]) {
        const rows=[[-2,''],[-1,''],[0,''],[1,''],[2,''],['','']];
        const original=JSON.stringify(rows);
        const filled=G.fillTable('y = '+expression,rows);
        assert.equal(JSON.stringify(rows),original);
        assert.deepEqual(filled,rows.map(([x])=>x===''?['','']:[x,fn(x)]));
        const graph=G.plotFunctionTable(expression,filled,{autoRange:true});
        assert.equal(graph.tableFunction,expression);
        assert(graph.samples.flat().every(([x,y])=>Math.abs(y-fn(x))<1e-8));
    }
});

test('function tables preserve the actual curve with only two points and survive import', () => {
    const rows=G.fillTable('x^3',[[-2,''],[2,'']]);
    const graph=G.plotFunctionTable('x^3',rows,{autoRange:true});
    assert(graph.samples.flat().some(([x,y])=>Math.abs(x-1)<.02&&Math.abs(y-x**3)<1e-9));
    const board=M.newBoard();board.items=[M.create('graph',0,0,graph)];
    const restored=M.restore(JSON.parse(JSON.stringify(board))).items[0];
    assert.equal(restored.tableFunction,'x^3');
    assert.equal(restored.expression,'y = x^3');
    assert.deepEqual(restored.tablePoints,rows);
});

test('function tables reject undefined results, invalid x and stale y without changing rows', () => {
    const rows=[[-1,'keep'],[0,'keep'],[1,'keep']];
    assert.throws(()=>G.fillTable('1/x',rows), /undefined at x = 0/);
    assert.equal(rows[0][1],'keep');
    assert.throws(()=>G.fillTable('x',[[1,''],['bad','']]), /must be a number/);
    assert.throws(()=>G.fillTable('x',[[1,''],[1,'']]), /different x/);
    assert.throws(()=>G.fillTable('alert(1)',rows), /not allowed/);
    assert.throws(()=>G.plotFunctionTable('x^2',[[0,0],[2,2]],{autoRange:true}), /table needs updating/);
    assert.throws(()=>G.plotFunctionTable('x^2',[[0,''],[2,4]],{autoRange:true}), /table needs updating/);
    assert.throws(()=>G.fillTable('sqrt(x)',[[-1,''],[1,'']]), /undefined/);
});
