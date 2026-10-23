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
    for (const expression of ['z = x', 'alert(1)', 'x.constructor', 'x; window.location=1', '2x']) {
        assert.throws(() => G.compile(expression));
    }
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
