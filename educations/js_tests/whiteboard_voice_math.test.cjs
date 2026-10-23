const { test } = require('node:test');
const assert = require('node:assert/strict');
const V = require('../static/educations/whiteboard_voice_math.js');

test('spoken quadratic becomes editable mathematical notation', () => {
    const result = V.parseSpokenMath('x squared plus five x plus six equals zero');
    assert.equal(result.expression, 'x ^(2) + 5x + 6 = 0');
    assert.equal(result.transcript, 'x squared plus five x plus six equals zero');
});

test('voice maths supports roots, functions, comparisons and constants', () => {
    assert.equal(V.parseSpokenMath('square root of x plus pi').expression, 'sqrt(x) + π');
    assert.equal(V.parseSpokenMath('sine of x greater than or equal to negative one').expression, 'sin(x) ≥ - 1');
    assert.equal(V.parseSpokenMath('two x cubed divided by four').expression, '2x ^(3) / 4');
});

test('voice maths rejects empty and unsupported prose instead of guessing', () => {
    assert.throws(() => V.parseSpokenMath(''), /equation first/);
    assert.throws(() => V.parseSpokenMath('please solve my homework'), /not supported/);
});
