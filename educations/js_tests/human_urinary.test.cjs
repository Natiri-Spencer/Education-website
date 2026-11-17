const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../static/educations/human_urinary_model.js');

const correct = extension => Object.fromEntries(model.available(extension).map(part => [part.id, part.slot]));

test('both kidneys must be on the correct sides with both ureters connected to the bladder', () => {
    const placements = correct(false);
    assert.deepEqual(model.inspect(placements), {passed:true, corePassed:true, issues:[]});
    for (const [a, b, feedback] of [
        ['right-kidney','left-kidney',/inner notch/],
        ['right-ureter','left-ureter',/between the right kidney and the bladder/],
        ['bladder','urethra',/bottom of the bladder/],
    ]) {
        const result = model.inspect({...placements, [a]:b, [b]:a});
        assert.equal(result.corePassed, false);
        assert.match(result.issues.join(' '), feedback);
    }
});

test('swapped blood vessels fail the extension without breaking the urine pathway', () => {
    const placements = correct(true);
    assert.equal(model.inspect(placements, true).passed, true);
    const result = model.inspect({...placements, arteries:'veins', veins:'arteries'}, true);
    assert.equal(result.corePassed, true);
    assert.equal(result.passed, false);
    assert.match(result.issues.join(' '), /arteries.*inner side of each kidney/);
});

test('saved placements exclude duplicate and extension-only positions in the first challenge', () => {
    assert.deepEqual(model.restorePlacements({
        'right-kidney':'right-kidney', 'left-kidney':'right-kidney', bladder:'arteries', arteries:'arteries',
    }, false), {'right-kidney':'right-kidney'});
});
