const { test } = require('node:test');
const assert = require('node:assert/strict');
const V = require('../static/educations/whiteboard_voice_math.js');

test('spoken quadratic becomes editable mathematical notation', () => {
    const result = V.parseSpokenMath('x squared plus five x plus six equals zero');
    assert.equal(result.expression, 'x ^(2) + 5x + 6 = 0');
    assert.equal(result.transcript, 'x squared plus five x plus six equals zero');
});

test('voice maths handles arbitrary linear, quadratic and cubic equations', () => {
    const examples = new Map([
        ['two x plus three equals seven', '2x + 3 = 7'],
        ['negative x minus y equals negative five', '- x - y = - 5'],
        ['y is equal to two x plus one', 'y = 2x + 1'],
        ['three x squared minus four x plus one equals zero', '3x ^(2) - 4x + 1 = 0'],
        ['x squared plus y squared equals twenty five', 'x ^(2) + y ^(2) = 25'],
        ['a x squared plus b x plus c equals zero', 'ax ^(2) + bx + c = 0'],
        ['two x cubed minus three x squared plus x minus five equals zero', '2x ^(3) - 3x ^(2) + x - 5 = 0'],
    ]);
    for (const [spoken, expected] of examples) assert.equal(V.parseSpokenMath(spoken).expression, expected, spoken);
});

test('voice maths accepts speech-recognition variants, powers and coefficients', () => {
    assert.equal(V.parseSpokenMath('ex to the third power plus why equals zed').expression, 'x ^(3) + y = z');
    assert.equal(V.parseSpokenMath('x raised to the third power plus one equals zero').expression, 'x ^(3) + 1 = 0');
    assert.equal(V.parseSpokenMath('x to the power of three plus one equals zero').expression, 'x ^(3) + 1 = 0');
    assert.equal(V.parseSpokenMath('two point five x squared plus one point two x equals zero').expression, '2.5x ^(2) + 1.2x = 0');
    assert.equal(V.parseSpokenMath('one half x plus three equals zero').expression, '(1) / (2)x + 3 = 0');
    assert.equal(V.parseSpokenMath('x is negative five').expression, 'x = - 5');
    assert.equal(V.parseSpokenMath('two x y z plus one equals zero').expression, '2xyz + 1 = 0');
    assert.equal(V.parseSpokenMath('quadratic equation x squared minus nine equals zero').expression, 'x ^(2) - 9 = 0');
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
