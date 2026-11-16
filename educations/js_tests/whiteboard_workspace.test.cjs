const {test} = require('node:test');
const assert = require('node:assert/strict');
const M = require('../static/educations/whiteboard_model.js');
const P = require('../static/educations/whiteboard_persistence.js');
const Gesture = require('../static/educations/whiteboard_gestures.js');

function storage(initial = []) {
    const values = new Map(initial), writes = [];
    return {values, writes, getItem: key => values.get(key) || null,
        keys: () => [...values.keys()],
        async setItemsAsync(entries) { for (const [key, raw] of entries) { writes.push(key); values.set(key, raw); } }};
}
test('all multi-touch contacts pan or zoom and never clear work', () => {
    for (const count of [2, 3, 4, 5, 10]) assert.equal(Gesture.touchIntent(count), 'pan-zoom');
    assert.equal(Gesture.touchIntent(1), 'draw');
});
test('legacy migration retains originals, coordinates, attachments and active board', async () => {
    const board = M.newBoard(); board.title = 'Existing lesson'; board.items.push(M.create('path', 42, 53));
    const raw = JSON.stringify({version: 1, activeId: board.id, boards: [board]});
    const s = storage([['eduportal.whiteboards.v1', raw]]);
    const result = await P.load(s, 'eduportal.whiteboards.v1', M.restore);
    assert.deepEqual(result.board.items, board.items);
    assert.equal(result.board.id, board.id);
    assert.equal(s.getItem('eduportal.whiteboards.v1'), raw);
    assert.equal(result.library[0].count, 1);
    assert.equal(result.library[0].items, undefined);
    const before = s.writes.length;
    await P.load(s, 'eduportal.whiteboards.v1', M.restore);
    assert.equal(s.writes.length, before, 'migration is idempotent');
});
test('a save writes one board and acknowledges completion or reports failure', async () => {
    const a = M.newBoard(), b = M.newBoard(), library = [], s = storage();
    await P.save(s, '', library, a, M.clone); await P.save(s, '', library, b, M.clone);
    s.writes.length = 0;
    a.items.push(M.create('text', 0, 0, {text: 'Answer'}));
    await P.save(s, '', library, a, M.clone);
    assert(!s.writes.includes('eduportal.whiteboards.v2:' + b.id));
    assert(!s.writes.includes('eduportal.whiteboards.v1'));
    const failing = {...s, setItemsAsync: async () => { throw Error('quota'); }};
    await assert.rejects(P.save(failing, '', library, a, M.clone), /quota/);
    await P.save(s, '', library, a, M.clone);
    assert.equal((await P.open(s, a.id, M.restore)).items[0].text, 'Answer');
});
test('corrupt legacy data remains available with an explicit recovery message', async () => {
    const s = storage([['eduportal.whiteboards.v1', '{broken']]);
    const result = await P.load(s, 'eduportal.whiteboards.v1', M.restore);
    assert(result.warnings.length);
    assert.equal(s.getItem('eduportal.whiteboards.v1'), '{broken');
    assert.equal(s.getItem('@whiteboard-migrated.v2'), null);
});
test('a damaged current draft opens a recovery copy and retains the damaged original', async () => {
    const s = storage(), board = M.newBoard(), library = [];
    board.items.push(M.create('text', 1, 2, {text: 'Retained answer'}));
    await P.save(s, '', library, board, M.clone);
    board.items.push(M.create('path', 4, 5));
    await P.save(s, '', library, board, M.clone);
    s.values.set('eduportal.whiteboards.v2:' + board.id, '{damaged');
    const recovered = await P.open(s, board.id, M.restore);
    assert.notEqual(recovered.id, board.id);
    assert.equal(recovered.items[0].text, 'Retained answer');
    assert.equal(s.getItem('eduportal.whiteboards.v2:' + board.id), '{damaged');
});
test('blocked migration storage keeps the existing board available for export', async () => {
    const board = M.newBoard(); board.items.push(M.create('text', 0, 0, {text: 'Existing work'}));
    const s = storage([['eduportal.whiteboards.v1', JSON.stringify({activeId: board.id, boards: [board]})]]);
    s.setItemsAsync = async () => { throw Error('blocked'); };
    const loaded = await P.load(s, 'eduportal.whiteboards.v1', M.restore);
    assert.equal(loaded.board.items[0].text, 'Existing work');
    assert(loaded.warnings.length);
});
test('undoing writing preserves document pages opened later and redo restores order', () => {
    const question = M.create('document-page', 0, 0, {attachmentId: 'original', fileName: 'q.pdf', fileSize: 100, pageNumber: 1, pageCount: 2, w: 900, h: 1160});
    const answer = M.create('path', 100, 100), next = {...question, id: M.uid(), pageNumber: 2, y: 1300};
    const history = M.history(); history.commit([question], [question, answer]);
    const undone = history.undo([question, answer, next]);
    assert.deepEqual(undone.map(i => i.id), [question.id, next.id]);
    assert.deepEqual(history.redo(undone).map(i => i.id), [question.id, answer.id, next.id]);
});
test('history restores eraser splits, item order and later edits using action changes', () => {
    const a = M.create('path', 0, 0), b = M.create('path', 30, 40), c = M.create('text', 50, 50);
    const history = M.history(); history.commit([a, b, c], [c, a, b]);
    assert.deepEqual(history.undo([c, a, b]), [a, b, c]);
    const front = history.redo([a, b, c]);
    const erased = M.eraseInk(front, {x: -10, y: 0}, {x: 10, y: 0}, 5);
    history.commit(front, erased);
    assert.deepEqual(history.undo(erased), front);
});
test('the same board cannot be claimed by two editors in one account', async () => {
    const held = new Set();
    const locks = {async request(name, options, callback) {
        if (held.has(name)) return callback(null);
        held.add(name); try { return await callback({name}); } finally { held.delete(name); }
    }};
    const release = await P.claim(locks, 'u1', 'lesson');
    assert.equal(await P.claim(locks, 'u1', 'lesson'), null);
    const releaseOther = await P.claim(locks, 'u2', 'lesson');
    assert.equal(typeof releaseOther, 'function');
    release(); releaseOther(); await new Promise(resolve => setImmediate(resolve));
    const acquiredAgain = await P.claim(locks, 'u1', 'lesson');
    assert.equal(typeof acquiredAgain, 'function'); acquiredAgain();
});
test('a tab resumes its own board when another tab changes the shared last-opened board', async () => {
    const s = storage(), a = M.newBoard(), b = M.newBoard(), library = [];
    await P.save(s, '', library, a, M.clone); await P.save(s, '', library, b, M.clone);
    await s.setItemsAsync([['@whiteboard-migrated.v2', '1']]);
    const loaded = await P.load(s, 'eduportal.whiteboards.v1', M.restore, a.id);
    assert.equal(loaded.board.id, a.id);
});
