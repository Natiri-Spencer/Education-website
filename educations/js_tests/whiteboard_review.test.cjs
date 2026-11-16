const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('../static/educations/whiteboard_model.js');
const T = require('../static/educations/whiteboard_typesetting.js');
const source = fs.readFileSync('educations/static/educations/whiteboard.js', 'utf8');

function editor(words, request) {
    const nodes = new Map(), history = M.history();
    function node(id) {
        if (!nodes.has(id)) nodes.set(id, {value: '', checked: false, hidden: false, listeners: {},
            addEventListener(name, callback) { this.listeners[name] = callback; }, focus() {},
            setRangeText(text, start, end) { this.value = this.value.slice(0, start) + text + this.value.slice(end); }});
        return nodes.get(id);
    }
    const board = {...M.newBoard(), items: request ? M.clone(request.strokes) : []};
    const context = {M, T, Blob, $: node, board, selected: null, previewRevision: 0, recognitionPending: new Set(),
        activeReview: {boardId: board.id, words, ...(request ? {request} : {})}, reviews: [],
        centre: () => ({x: 300, y: 200}), ink: '#1689f8',
        commit: before => history.commit(before, board.items),
        mutate: fn => { const before = M.clone(board.items); fn(); history.commit(before, board.items); },
        D: {close(dialog) { dialog.listeners.close?.(); }}, updateReviewPreview() {}, scheduleRecognition() {},
        setTool() {}, render() {}, toast() {}, download() {},
        window: {WhiteboardMath: {async prepare(text) { T.toLatex(text); return {ready: true, w: 240, h: 60}; }}}};
    words.forEach((word, index) => {
        node('wb-review-text-' + index).value = word.text;
        node('wb-review-format-' + index).value = word.format;
    });
    vm.createContext(context);
    const start = source.indexOf('    function reviewEdits('), end = source.indexOf('    function stopVoice(', start);
    assert(start > 0 && end > start);
    vm.runInContext(source.slice(start, end), context);
    return {context, board, history, node, click: id => node(id).listeners.click()};
}
test('equation Apply creates a saved editable item through the actual button binding', async () => {
    const ui = editor([{text: 'x + 2 = 4', format: 'math', fontSize: 32}]);
    await ui.click('wb-review-apply');
    assert.equal(ui.board.items.length, 1);
    assert.equal(ui.board.items[0].text, 'x + 2 = 4');
    assert.equal(ui.board.items[0].format, 'math');
    assert.equal(ui.board.items[0].manualText, true);
    assert.equal(ui.context.activeReview, null);
    assert.equal(ui.history.undo(ui.board.items).length, 0);
});
test('review Apply preserves paragraph breaks and replaces only checked handwriting', async () => {
    const a = M.create('path', 20, 20, {points: [[20,20],[60,80]]});
    const b = M.create('path', 120, 20, {points: [[120,20],[160,80]]});
    const request = M.recognitionRequest([a,b], new Set([a.id,b.id]));
    const words = [{text: 'First line\n\nSecond paragraph: -12 + 8 = -4', format: 'paragraph', strokeIds: [a.id], needsReview: true},
        {text: 'Keep this ink', format: 'paragraph', strokeIds: [b.id], needsReview: true}];
    const ui = editor(words, request); ui.node('wb-review-select-0').checked = true;
    await ui.click('wb-review-apply');
    assert(ui.board.items.some(item => item.id === b.id));
    assert.equal(ui.board.items.find(item => item.type === 'text').text, words[0].text);
});
test('closing an equation during formatting cancels its pending Apply', async () => {
    const ui = editor([{text: 'x = 2', format: 'math'}]);
    let finish;
    ui.context.window.WhiteboardMath.prepare = () => new Promise(resolve => { finish = resolve; });
    const applying = ui.click('wb-review-apply');
    ui.click('wb-review-close'); finish({ready: true, w: 100, h: 50}); await applying;
    assert.equal(ui.board.items.length, 0);
});
test('Keep handwriting is reversible and the review has live edit and symbol handlers', () => {
    const ink = M.create('path', 0, 0), request = M.recognitionRequest([ink], new Set([ink.id]));
    const ui = editor([{text: 'A', format: 'paragraph', strokeIds: [ink.id]}], request);
    assert.equal(typeof ui.node('wb-review-cards').listeners.input, 'function');
    assert.equal(typeof ui.node('wb-review-cards').listeners.change, 'function');
    assert.equal(typeof ui.node('wb-review-cards').listeners.click, 'function');
    ui.click('wb-review-keep');
    assert.equal(ui.board.items[0].keepInk, true);
    assert.equal(ui.history.undo(ui.board.items)[0].keepInk, undefined);
});
