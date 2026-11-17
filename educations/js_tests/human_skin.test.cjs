const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../static/educations/human_skin_model.js');
const books = require('../static/educations/lab_notebook_store.js');

function correct(extension = false) {
    return Object.fromEntries(model.available(extension).map(part => [part.id, part.slot]));
}

test('both challenges accept their anatomically correct arrangements', () => {
    assert.deepEqual(model.inspect(correct()), {passed:true, corePassed:true, issues:[]});
    assert.deepEqual(model.inspect(correct(true), true), {passed:true, corePassed:true, issues:[]});
    assert.equal(model.inspect({}, false).passed, false);
});

test('wrong layer order, displaced hair, disconnected sweat duct and deep pore block the trace', () => {
    const cases = [
        [{epidermis:'middle-layer', dermis:'surface-layer'}, /thin protective layer/],
        [{hair:'gland', gland:'hair'}, /root inside the follicle/],
        [{duct:'follicle', follicle:'duct'}, /duct needs to connect/],
        [{pore:'gland', gland:'pore'}, /opening on the surface/],
    ];
    for (const [changes, feedback] of cases) {
        const placements = {...correct(), ...changes};
        const result = model.inspect(placements);
        assert.equal(result.corePassed, false);
        assert.match(result.issues.join(' '), feedback);
    }
});

test('a misplaced oil gland needs correction even with a complete sweat pathway', () => {
    const placements = {...correct(true), oil:'nerves', nerves:'oil'};
    const result = model.inspect(placements, true);
    assert.equal(result.passed, false);
    assert.equal(result.corePassed, true);
    assert.match(result.issues.join(' '), /beside the hair follicle/);
});

test('draft recovery ignores unknown, duplicate and incompatible placements', () => {
    assert.deepEqual(model.restorePlacements({
        dermis:'surface-layer', fat:'surface-layer', duct:'middle-layer', pore:'pore', unknown:'hair', oil:'oil'
    }, false), {dermis:'surface-layer', pore:'pore'});
});

test('the Grade 7 notebook includes the build and its four learner fields', () => {
    const book = books.catalogue.find(entry => entry.id === 'human-skin');
    assert.deepEqual(book.columns, ['My prediction','My observation','My explanation','Practice check']);
});
