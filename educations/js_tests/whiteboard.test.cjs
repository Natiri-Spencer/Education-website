const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../static/educations/whiteboard_model.js');
const T = require('../static/educations/whiteboard_typesetting.js');

test('uncertain readings need approval and preserve exact mixed case, punctuation and paragraphs',()=>{
    const ink=M.create('path',40,50,{id:'review-source',points:[[40,50],[80,120]]});
    const request=M.recognitionRequest([ink],new Set([ink.id]));
    const exact='ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n\nIntegers: -12, 0, +8; 1234567890.\n'+('A well spaced paragraph. '.repeat(55));
    const words=[{text:exact,format:'paragraph',needsReview:true,strokeIds:[ink.id]}];
    assert.equal(M.applyRecognition([ink],request,words).corrected,0);
    const approved=M.applyRecognition([ink],request,words,true).items;
    assert.equal(approved[0].text,exact.trim());
    assert.equal(approved[0].manualText,true);
    assert.deepEqual(approved[0].inkSource,[ink]);
    const board=M.newBoard();board.items=approved;
    assert.equal(M.restore(JSON.parse(JSON.stringify(board))).items[0].text,exact.trim());
    const history=M.history();history.commit([ink],approved);
    assert.deepEqual(history.undo(approved),[ink]);
    assert.deepEqual(history.redo([ink]),approved);
});

test('review cannot replace moved, erased, kept or already converted source strokes',()=>{
    const ink=M.create('path',0,0,{id:'review-guard',points:[[0,0],[50,80]]});
    const request=M.recognitionRequest([ink],new Set([ink.id]));
    const words=[{text:'Kiswahili',format:'paragraph',needsReview:true,strokeIds:[ink.id]}];
    for(const items of [[],[M.move(ink,1,0)],[{...ink,keepInk:true}]])assert.equal(M.applyRecognition(items,request,words,true).corrected,0);
    const converted=M.applyRecognition([ink],request,words,true).items;
    assert.equal(M.applyRecognition(converted,request,words,true).corrected,0);
    assert.equal(M.canRetryRecognition(converted[0]),false);
});

test('review preview recovers source ink when recognizer ids are incomplete',()=>{
    const first=M.create('path',10,10,{id:'first',points:[[10,10],[30,50]]});
    const second=M.create('path',100,10,{id:'second',points:[[100,10],[120,50]]});
    const request={strokes:[first,second],contextIds:[]};
    assert.deepEqual(M.recognitionSources(request,{strokeIds:['first']}),[first]);
    assert.deepEqual(M.recognitionSources(request,{strokeIds:['missing'],box:{x:95,y:5,w:30,h:50}}),[second]);
    assert.deepEqual(M.recognitionSources(request,{strokeIds:['missing']}),[first,second]);
});

test('correcting a following line keeps previous text and places the new paragraph below it',()=>{
    const previous=M.create('text',100,100,{id:'previous',text:'Kiswahili',format:'paragraph',fontSize:48,w:350,h:90});
    const ink=M.create('path',110,160,{id:'following-ink',points:[[110,160],[350,210]]});
    const request=M.recognitionRequest([previous,ink],new Set([ink.id]));
    const converted=M.applyRecognition([previous,ink],request,[{text:'Following',format:'paragraph',strokeIds:[ink.id]}],true).items;
    assert.deepEqual(converted.find(i=>i.id===previous.id),previous);
    const next=converted.find(i=>i.id!==previous.id);
    assert(next.y>=previous.y+previous.h+12);
    assert.equal(next.layoutMoved,true);
    assert.equal(M.restore({...M.newBoard(),items:converted}).items[1].layoutMoved,true);
});

test('formula review retains symbols and renders complex equations without evaluating them',()=>{
    const katex=require('../static/educations/vendor/katex/katex.min.js');
    for(const formula of ['-12 + 8 = -4','(x)/(y) + 8 = t','πr^(2) ≥ 0',String.raw`x = \frac{-b\pm\sqrt{b^2-4ac}}{2a}`,String.raw`\begin{pmatrix}1&2\\3&4\end{pmatrix}`,String.raw`\sum_{n=1}^{10} n`]){
        assert(katex.renderToString(T.toLatex(formula),{throwOnError:true,trust:false}).includes('katex'));
    }
    assert.throws(()=>T.toLatex(String.raw`\href{https://example.com}{x}`),/without links/);
    assert.throws(()=>T.toLatex(String.raw`\require{html}`),/without links/);
});

test('freehand marks can be moved and resized without losing their points', () => {
    const path = M.create('path', 20, 30, { points: [[20, 30], [50, 80], [100, 130]] });
    const moved = M.move(path, -15, 25);
    assert.deepEqual(moved.points, [[5, 55], [35, 105], [85, 155]]);
    assert.deepEqual(path.points, [[20, 30], [50, 80], [100, 130]]);
    const resized = M.resize(moved, 160, 50);
    assert.deepEqual(M.bounds(resized), { x: 5, y: 55, w: 160, h: 50 });
});

test('eraser hits thin slanted strokes and fast sweeps, not nearby blank space', () => {
    const line = M.create('line', 100, 100, { w: 160, h: -160, width: 2 });
    assert.equal(M.hit(line, { x: 170, y: 30 }), true);
    assert.equal(M.hit(line, { x: 170, y: 90 }), false);
    assert.equal(M.hitAlong(line, { x: 180, y: -20 }, { x: 180, y: 70 }, 5), true);
    const pencil = M.create('path', 10, 20, { points: [[10, 20], [60, 20]], width: 3 });
    assert.equal(M.hitAlong(pencil, { x: 40, y: 0 }, { x: 40, y: 50 }, 5), true);
    assert.equal(M.hitAlong(pencil, { x: 90, y: 0 }, { x: 90, y: 50 }, 5), false);
    const dot = M.create('path', 30, 30);
    assert.equal(M.hit(dot, { x: 31, y: 31 }), true);
});

test('bounds and fit encompass shapes drawn backwards and moved images', () => {
    const rect = M.create('rectangle', 200, 180, { w: -120, h: -90 });
    assert.deepEqual(M.bounds(rect), { x: 80, y: 90, w: 120, h: 90 });
    const image = M.create('image', -100, -80, { w: 40, h: 50 });
    assert.deepEqual(M.allBounds([rect, image]), { x: -100, y: -80, w: 300, h: 260 });
    const arrow = M.resize(M.create('arrow', 200, 180, { w: -120, h: 90 }), 240, 180);
    assert.equal(arrow.w, -240, 'Resizing retains the direction of a backwards arrow');
    assert.deepEqual(M.bounds(arrow), { x: 80, y: 180, w: 240, h: 180 });
});

test('drawing, movement and erasing are reversible; a new edit clears redo', () => {
    const history = M.history(), original = [M.create('sticky', 10, 10)], moved = [M.move(original[0], 80, 40)];
    assert.equal(history.commit(original, original), false);
    assert.equal(history.canUndo, false);
    history.commit(original, moved);
    history.commit(moved, []);
    assert.deepEqual(history.undo([]), moved);
    assert.deepEqual(history.undo(moved), original);
    assert.deepEqual(history.redo(original), moved);
    history.commit(moved, [M.create('ellipse', 200, 200)]);
    assert.equal(history.canRedo, false);
    original[0].text = 'Changed outside history';
    assert.notEqual(history.undo([])[0].text, original[0].text);
});

test('portable boards restore title, notes, images, drawings, and view', () => {
    const board = M.newBoard();
    board.title = 'Fractions'; board.notes = 'Explore quarters'; board.view = { x: -125, y: 180, zoom: .65 };
    board.items = [M.create('sticky', 25, 35), M.create('path', 10, 10, { points: [[10, 10], [60, 80]] }), M.create('image', 300, 40, { src: 'data:image/png;base64,YWJjZA==' })];
    const restored = M.restore(JSON.parse(JSON.stringify(board)));
    assert.deepEqual(restored, board);
    restored.items[0].text = 'Edited';
    assert.notEqual(board.items[0].text, restored.items[0].text);
});

test('import rejects remote images, executable formats and invalid drawings', () => {
    const board = M.newBoard();
    for (const src of ['https://example.com/tracker.png', 'javascript:alert(1)', 'data:image/svg+xml;base64,YWJjZA==']) {
        board.items = [M.create('image', 0, 0, { src })];
        assert.throws(() => M.restore(board), /embedded/);
    }
    board.items = [M.create('path', 0, 0, { points: [[NaN, 0]] })];
    assert.throws(() => M.restore(board), /points/);
    board.items = [{ type: 'script' }];
    assert.throws(() => M.restore(board), /unsupported/);
    assert.throws(() => M.restore({ version: 900, items: [] }), /valid/);
});

test('import normalises unsafe colours, extreme sizes and duplicate identities', () => {
    const board = M.newBoard(), a = M.create('text', 1, 2, { fill: 'url(https://example.com)', fontSize: 10000 });
    board.items = [a, M.clone(a)]; board.view.zoom = 20;
    const restored = M.restore(board);
    assert.equal(restored.items[0].fill, '#e9ddff');
    assert.equal(restored.items[0].fontSize, 120);
    assert.notEqual(restored.items[0].id, restored.items[1].id);
    assert.equal(restored.view.zoom, 2);
});

test('partial erasing cuts a sparse stroke precisely and preserves both sides', () => {
    const path = M.create('path', 0, 0, { width: 4, stroke: '#1689f8', pen: 'pen', opacity: 1, points: [[0, 0], [200, 0]] });
    const fragments = M.erasePath(path, { x: 100, y: 0 }, { x: 100, y: 0 }, 10);
    assert.equal(fragments.length, 2);
    assert.deepEqual(fragments[0].points, [[0, 0], [88, 0]]);
    assert(Math.abs(fragments[1].points[0][0] - 112) < 1e-8);
    assert.equal(fragments[1].points[0][1], 0);
    assert.deepEqual(fragments[1].points[1], [200, 0]);
    assert.notEqual(fragments[0].id, fragments[1].id);
    for (const fragment of fragments) { assert.equal(fragment.stroke, path.stroke); assert.equal(fragment.width, 4); assert.equal(fragment.pen, 'pen'); assert.equal(M.hit(fragment, { x: 100, y: 0 }, 0), false); }
    assert.deepEqual(path.points, [[0, 0], [200, 0]], 'The original remains available to undo');
});

test('fast diagonal eraser sweeps remove crossed ink while leaving other elements intact', () => {
    const horizontal = M.create('path', 0, 0, { points: [[0, 0], [200, 0]] });
    const note = M.create('sticky', 70, -20), text = M.create('text', 70, -20);
    const result = M.eraseInk([horizontal, note, text], { x: 50, y: -50 }, { x: 150, y: 50 }, 8);
    assert.equal(result.length, 4);
    assert.equal(result[2], note); assert.equal(result[3], text);
    assert(result.slice(0, 2).every(fragment => !M.hit(fragment, { x: 100, y: 0 }, 0)));
    assert(M.hit(result[0], { x: 10, y: 0 }, 0)); assert(M.hit(result[1], { x: 190, y: 0 }, 0));
});

test('eraser handles dots and full removal and does nothing to distant handwriting', () => {
    const dot = M.create('path', 20, 20), path = M.create('path', 0, 0, { points: [[0, 0], [20, 0], [40, 0], [60, 0]] });
    assert.deepEqual(M.erasePath(dot, { x: 20, y: 0 }, { x: 20, y: 40 }, 5), []);
    assert.deepEqual(M.erasePath(path, { x: 0, y: 0 }, { x: 60, y: 0 }, 5), []);
    assert.equal(M.erasePath(path, { x: 10, y: 50 }, { x: 50, y: 50 }, 5)[0], path);
});

test('erasing one gesture is undoable and highlighter transparency survives saving', () => {
    const history = M.history(), board = M.newBoard();
    board.items = [M.create('path', 0, 0, { width: 18, pen: 'highlighter', opacity: .38, stroke: '#ffe500', points: [[0, 0], [200, 0]] })];
    const before = M.clone(board.items), after = M.eraseInk(before, { x: 100, y: -20 }, { x: 100, y: 20 }, 12);
    history.commit(before, after);
    assert.deepEqual(history.undo(after), before);
    assert.deepEqual(history.redo(before), after);
    board.items = after;
    const restored = M.restore(JSON.parse(JSON.stringify(board)));
    assert.equal(restored.items.length, 2);
    assert(restored.items.every(item => item.pen === 'highlighter' && item.opacity === .38 && item.width === 18));
});

test('the writing space moves indefinitely without moving or losing the drawing', () => {
    const board = M.newBoard(); board.items = [M.create('text', 80, 100, { text: 'Lesson one' })];
    const original = M.clone(board.items), start = { ...board.view };
    board.view = M.panView(board.view, 0, -1200);
    assert.equal(board.view.y, -1200);
    assert.deepEqual(board.items, original);
    board.view = M.panView(board.view, 0, 1200);
    assert.deepEqual(board.view, start);
    assert.equal(M.panView(start, 0, -25000).y, -25000);
});

test('two-finger movement and pinch zoom keep the point under the fingers stable', () => {
    const view = { x: 20, y: 30, zoom: 1 }, start = { x: 100, y: 100, distance: 100 }, current = { x: 140, y: 180, distance: 200 };
    const next = M.gestureView(view, start, current);
    assert.deepEqual(next, { x: -20, y: 40, zoom: 2 });
    assert.equal((current.x - next.x) / next.zoom, (start.x - view.x) / view.zoom);
    assert.equal((current.y - next.y) / next.zoom, (start.y - view.y) / view.zoom);
    assert.equal(M.gestureView(view, start, { ...current, distance: 1 }).zoom, .25);
});

test('neat ink removes jitter from clearly straight handwriting without changing style', () => {
    const path = M.create('path', 0, 10, { pen: 'pen', width: 3, stroke: '#1689f8', opacity: .7, points: [[0, 10], [20, 11], [40, 9.5], [60, 10.8], [80, 9.8], [100, 10]] });
    const clean = M.neatenStroke(path);
    assert.deepEqual(clean.points, [[0, 10], [100, 10]]);
    assert.equal(clean.neat, true); assert.equal(clean.width, 3); assert.equal(clean.opacity, .7); assert.equal(clean.stroke, '#1689f8');
    assert.equal(path.points.length, 6, 'The source stroke remains available to undo');
    assert.equal(M.neatenStroke(clean), clean, 'Tidying again does not progressively distort handwriting');
});

test('neat ink retains letter corners, loops and endpoints instead of replacing words', () => {
    const corners = [[0, 50], [0, 0], [25, 40], [50, 0], [50, 50]], path = M.create('path', 0, 50, { points: corners });
    const tidy = M.neatenStroke(path);
    assert.deepEqual(tidy.points[0], corners[0]); assert.deepEqual(tidy.points.at(-1), corners.at(-1));
    for (const corner of corners) assert(Math.min(...tidy.points.map(p => Math.hypot(p[0] - corner[0], p[1] - corner[1]))) < 1.5);
    const points = Array.from({ length: 41 }, (_, i) => [50 * Math.cos(i * Math.PI / 20), 50 * Math.sin(i * Math.PI / 20)]);
    const loop = M.neatenStroke(M.create('path', 50, 0, { points }));
    assert(loop.points.length > 8); assert(M.bounds(loop).w > 95 && M.bounds(loop).h > 95);
    const text = M.create('text', 0, 0, { text: 'Mathematics' });
    assert.equal(M.neatenStroke(text), text);
});

test('tidying handwriting is reversible, saves its preference, and remains partially erasable', () => {
    const board = M.newBoard(), history = M.history();
    board.neatInk = false;
    board.items = [M.create('path', 0, 0, { points: [[0, 0], [50, 1], [100, 0], [200, 0]] })];
    const before = M.clone(board.items), after = board.items.map(M.neatenStroke);
    history.commit(before, after);
    assert.deepEqual(history.undo(after), before); assert.deepEqual(history.redo(before), after);
    board.items = after;
    const saved = M.restore(JSON.parse(JSON.stringify(board)));
    assert.equal(saved.neatInk, false); assert.equal(saved.items[0].neat, true);
    const fragments = M.eraseInk(saved.items, { x: 100, y: -20 }, { x: 100, y: 20 }, 10);
    assert.equal(fragments.length, 2);
    for (const piece of fragments) { assert.equal(M.neatenStroke(piece), piece); assert.equal(M.hit(piece, { x: 100, y: 0 }, 0), false); }
});

function recognitionFixture() {
    const strokes = [M.create('path', 20, 100, { id: 'letter-m', stroke: '#1689f8', points: [[20, 100], [20, 20], [50, 65], [80, 20], [80, 100]] }), M.create('path', 100, 100, { id: 'letter-a', stroke: '#1689f8', points: [[100, 100], [130, 20], [160, 100]] })];
    return { strokes, words: [{ text: 'MATH', strokeIds: strokes.map(s => s.id), alternatives: ['MATH', 'Math'] }] };
}

test('real recognition results replace ink with editable words and retain original strokes', () => {
    const { strokes, words } = recognitionFixture(), request = M.recognitionRequest(strokes, new Set(strokes.map(s => s.id)));
    const output = M.applyRecognition(strokes, request, words);
    assert.equal(output.corrected, 1); assert.equal(output.items.length, 1);
    const word = output.items[0];
    assert.equal(word.type, 'text'); assert.equal(word.text, 'MATH'); assert.equal(word.stroke, '#1689f8');
    assert.deepEqual(word.inkSource, strokes); assert.deepEqual(word.alternatives, ['MATH', 'Math']);
    const history = M.history(); history.commit(strokes, output.items);
    assert.deepEqual(history.undo(output.items), strokes); assert.deepEqual(history.redo(strokes), output.items);
    const board = M.newBoard(); board.items = output.items;
    assert.deepEqual(M.restore(JSON.parse(JSON.stringify(board))).items, output.items);
});

test('recognition preserves highlights, drawings, unread words, and stale edits', () => {
    const { strokes, words } = recognitionFixture(), highlighter = M.create('path', 0, 0, { pen: 'highlighter' }), note = M.create('sticky', 300, 0);
    const items = [...strokes, highlighter, note], request = M.recognitionRequest(items, new Set(items.map(i => i.id)));
    assert(!request.strokes.includes(highlighter)); assert(!request.strokes.includes(note));
    assert.equal(M.applyRecognition(items, request, []).items, items);
    assert.equal(M.applyRecognition(items, request, [{ text: 'Guess', strokeIds: ['unknown-id'] }]).items, items);
    const modified = [M.move(strokes[0], 50, 0), strokes[1]];
    assert.equal(M.applyRecognition(modified, request, words).corrected, 0);
    const recognized = M.applyRecognition(items, request, words).items;
    assert(recognized.includes(highlighter)); assert(recognized.includes(note));
});

test('later letters can use the original ink of a nearby corrected word as context', () => {
    const { strokes, words } = recognitionFixture(), firstRequest = M.recognitionRequest(strokes, new Set(strokes.map(i => i.id)));
    const first = M.applyRecognition(strokes, firstRequest, words).items[0];
    const added = M.create('path', 170, 20, { id: 'extra-letter', points: [[170, 20], [170, 100]] });
    const items = [first, added], request = M.recognitionRequest(items, new Set([added.id]));
    assert(request.contextIds.includes(first.id)); assert.equal(request.strokes.length, 3);
    const next = M.applyRecognition(items, request, [{ text: 'MATHS', strokeIds: request.strokes.map(s => s.id) }]);
    assert.equal(next.items.length, 1); assert.equal(next.items[0].text, 'MATHS'); assert.equal(next.items[0].inkSource.length, 3);
    const partial = M.applyRecognition(items, request, [{ text: 'M', strokeIds: [strokes[0].id] }]);
    assert.equal(partial.corrected, 0, 'An incomplete context result must not duplicate or erase an existing word');
});

test('corrected words remain erasable, movable and recoverable as original ink', () => {
    const { strokes, words } = recognitionFixture(), request = M.recognitionRequest(strokes, new Set(strokes.map(s => s.id)));
    const word = M.applyRecognition(strokes, request, words).items[0], box = M.bounds(word);
    assert.equal(M.eraseInk([word], { x: box.x, y: box.y }, { x: box.x + box.w, y: box.y + box.h }).length, 0);
    const moved = M.move(word, 120, 40);
    assert.deepEqual(moved.inkSource[0].points[0], [140, 140]);
    const restored = M.restoreHandwriting([moved], moved.id);
    assert.equal(restored.length, 2); assert(restored.every(i => i.keepInk && !M.canRecognize(i)));
    const board = M.newBoard(); board.items = restored;
    assert(M.restore(board).items.every(i => i.keepInk));
});

test('fractions, powers, subscripts, roots and signed integers have safe exportable layouts', () => {
    for (const expression of ['(x)/(y) + 8 = t','−12 + 3 = −9','A = πr^(2)','a_(1) + sqrt(x) = 2','(a+b)/(c−d)','x^2 + y^2 = z^2']) {
        const layout = T.mathLayout(expression,40);
        assert(layout.w>0 && layout.h>40);
        assert(layout.runs.every(r=>Number.isFinite(r.x)&&Number.isFinite(r.y)));
        assert(layout.runs.every(r=>r.kind!=='text'||typeof r.text==='string'));
    }
    const fraction=T.mathLayout('(x)/(y) + 8 = t',40);
    assert.equal(fraction.runs.filter(r=>r.kind==='bar').length,1);
    const x=fraction.runs.find(r=>r.text==='x'), y=fraction.runs.find(r=>r.text==='y');
    assert(x.y<y.y); assert(Math.abs(x.x-y.x)<1,'The fraction operands are centred');
    const power=T.mathLayout('x^(2)',40), base=power.runs.find(r=>r.text==='x'), exponent=power.runs.find(r=>r.text==='2');
    assert(exponent.y<base.y && exponent.fontSize<base.fontSize && exponent.x>base.x);
    assert.doesNotThrow(()=>T.mathLayout('('.repeat(5000),32),'Malformed or deep input stays bounded');
});

test('paragraphs retain word spaces, line breaks and blank paragraph lines', () => {
    const text='We learn mathematics.\nNumbers can be negative.\n\nA new paragraph.';
    const layout=T.textLayout(text,28,600);
    assert.deepEqual(layout.lines,text.split('\n'));
    assert.equal(layout.h,4*28*1.5+8);
    const wrapped=T.textLayout('Write long sentences with a clear space between every word.',24,210);
    assert.equal(wrapped.lines.join(' '),'Write long sentences with a clear space between every word.');
    assert(wrapped.lines.every(l=>T.textWidth(l,24)<=210));
});

test('maths recognition keeps operator-only marks, source ink, profile and notation after saving', () => {
    const plus=[M.create('path',0,20,{id:'h',points:[[0,20],[40,20]]}),M.create('path',20,0,{id:'v',points:[[20,0],[20,40]]})];
    const request=M.recognitionRequest(plus,new Set(['h','v']));
    const result=M.applyRecognition(plus,request,[{text:'+',format:'math',fontSize:32,strokeIds:['h','v']}]);
    assert.equal(result.corrected,1); assert.equal(result.items[0].format,'math');
    const board=M.newBoard(); board.recognitionMode='math'; board.items=result.items;
    assert.deepEqual(M.restore(JSON.parse(JSON.stringify(board))),board);
    assert.deepEqual(M.restoreHandwriting(result.items,result.items[0].id).map(i=>i.id),['h','v']);
});

test('paragraph recognition uses a consistent font, no overlapping word elements and original ink order', () => {
    const {strokes}=recognitionFixture(), request=M.recognitionRequest(strokes,new Set(strokes.map(s=>s.id)));
    const result=M.applyRecognition(strokes,request,[{text:'We learn maths.\nWe keep practising.',format:'paragraph',fontSize:30,strokeIds:strokes.map(s=>s.id)}]);
    assert.equal(result.items.length,1); assert.equal(result.items[0].fontSize,30);
    assert.equal(result.items[0].format,'paragraph'); assert(result.items[0].h>=90);
    result.items[0].manualText=true;
    const added=M.create('path',165,20,{id:'new',points:[[165,20],[165,80]]});
    const next=M.recognitionRequest([...result.items,added],new Set(['new']));
    assert.equal(next.contextIds.length,0,'Manual edits must never be overwritten by later ink');
});

test('writing on a new line does not re-recognize the taller ink behind previous text', () => {
    const original=M.create('path',40,120,{id:'old-ink',points:[[40,120],[80,280]]});
    const english=M.create('text',40,120,{text:'ENGLISH',format:'paragraph',fontSize:32,w:220,h:56,inkSource:[original]});
    const next=M.create('path',40,185,{id:'next-line',points:[[40,185],[80,280]]});
    const request=M.recognitionRequest([english,next],new Set([next.id]));
    assert.deepEqual(request.contextIds,[]);
    assert.deepEqual(request.strokes.map(s=>s.id),['next-line']);
    const result=M.applyRecognition([english,next],request,[{text:'Kiswahili',format:'paragraph',strokeIds:[next.id]}]);
    assert(result.items.includes(english));
    assert.equal(result.items[0].text,'ENGLISH');
});

test('explicit retry can repair older autocorrections and still protects manual text edits', () => {
    const {strokes,words}=recognitionFixture(), request=M.recognitionRequest(strokes,new Set(strokes.map(s=>s.id)));
    const old=M.applyRecognition(strokes,request,words).items[0], manual={...M.clone(old),id:'manual',manualText:true};
    assert(M.canRetryRecognition(old)); assert(!M.canRetryRecognition(manual));
    const retry=M.retryHandwriting([old,manual]);
    assert.equal(retry.length,3); assert.equal(retry[2],manual);
    assert(retry.slice(0,2).every(M.canRecognize));
    const history=M.history(); history.commit([old,manual],retry);
    assert.deepEqual(history.undo(retry),[old,manual]);
});

test('only explicitly selected review lines replace ink and preserve the final digit',()=>{
    const a=M.create('path',0,0,{id:'line-a',points:[[0,0],[60,30]]});
    const b=M.create('path',0,80,{id:'line-b',points:[[0,80],[60,110]]});
    const words=[{text:'2x+5=',latex:'2x+5=',format:'math',strokeIds:[a.id],needsReview:true},
        {text:'x=1',format:'math',strokeIds:[b.id],needsReview:true}];
    const edits=[{text:'2x+5=7',format:'math',selected:true},{text:'x=1',format:'math',selected:false}];
    const selected=M.reviewSelection(words,edits);
    assert.equal(selected.length,1);assert.equal(selected[0].latex,undefined);
    const request=M.recognitionRequest([a,b],new Set([a.id,b.id]));
    assert.equal(M.applyRecognition([a,b],request,selected).corrected,0);
    const result=M.applyRecognition([a,b],request,selected,true);
    assert.equal(result.corrected,1);assert(result.items.includes(b));
    const text=result.items.find(i=>i.type==='text');assert.equal(text.text,'2x+5=7');
    assert.deepEqual(text.inkSource,[a]);
    const board=M.newBoard();board.items=result.items;
    assert.equal(M.restore(JSON.parse(JSON.stringify(board))).items.find(i=>i.type==='text').text,'2x+5=7');
    assert.deepEqual(M.restoreHandwriting(result.items,text.id).find(i=>i.id===a.id).points,a.points);
});

test('conflicting recognizer regions cannot silently merge two readings',()=>{
    const ink=M.create('path',0,0,{id:'duplicate-region',points:[[0,0],[20,30]]});
    const request=M.recognitionRequest([ink],new Set([ink.id]));
    const result=M.applyRecognition([ink],request,[{text:'1',strokeIds:[ink.id]},{text:'7',strokeIds:[ink.id]}],true);
    assert.equal(result.corrected,0);assert.deepEqual(result.items,[ink]);
});

test('changing review format invalidates the previous equation representation',()=>{
    const selected=M.reviewSelection([{text:'x',format:'math',latex:'x'}],[{text:'x',format:'paragraph',selected:true}]);
    assert.equal(selected[0].latex,undefined);
    assert.deepEqual(M.reviewSelection([{text:'x'}],[{selected:false}]),[]);
});

test('server LaTeX survives save and restore but is ignored after manual text edits', () => {
    const ink=M.create('path',0,0,{id:'latex-ink',points:[[0,0],[25,40]]});
    const request=M.recognitionRequest([ink],new Set([ink.id]));
    const item=M.applyRecognition([ink],request,[{text:'x^2',latex:'x^{2}',format:'math',strokeIds:[ink.id]}]).items[0];
    assert.equal(item.latex,'x^{2}');
    const board=M.newBoard(); board.items=[item];
    assert.equal(M.restore(board).items[0].latex,'x^{2}');
    board.items[0].text='y^2';
    assert.equal(M.restore(board).items[0].latex,undefined);
});

test('calculus notation renders valid KaTeX and keeps derivatives unevaluated', () => {
    const katex=require('../static/educations/vendor/katex/katex.min.js');
    const T=require('../static/educations/whiteboard_typesetting.js');
    const examples=[
        ['integral(x^2,x)',String.raw`\int`],
        ['integral(x^2,x,0,1)',String.raw`_{0}^{1}`],
        ['\u222b_(0)^(1) x^2 dx',String.raw`\int`],
        ['diff(x^3,x,2)',String.raw`\mathrm{d}^{2}`],
        ['dy/dx',String.raw`\frac`],
        ['d^2y/dx^2',String.raw`\mathrm{d}^{2}`],
        ['d/dx(x^2)',String.raw`\frac`],
        ['(d)/(dx)x^(2)',String.raw`\frac`],
        ["f'(x)",String.raw`\frac`],
        ['f\u2033(x)',String.raw`\mathrm{d}^{2}`],
        ['partial(f(x,y),x)',String.raw`\partial`],
        ['(\u2202y)/(\u2202x)',String.raw`\partial`],
        ['\u2202^2f(x,y)/\u2202x^2',String.raw`\partial ^{2}`],
        ['integral(integral(x*y,x),y)',String.raw`\int`],
        ['\u222c f(x,y) dx dy',String.raw`\iint`],
        ['\u222e f(x) dx',String.raw`\oint`],
    ];
    for(const [input,expected] of examples) {
        const tex=T.toLatex(input);
        assert(tex.includes(expected),`${input}: ${tex}`);
        assert(katex.renderToString(tex,{throwOnError:true,trust:false}).includes('katex'));
        const layout=T.mathLayout(input,32);
        assert(Number.isFinite(layout.w)&&layout.w>0);
        assert(Number.isFinite(layout.h)&&layout.h>0);
    }
    assert.throws(()=>T.toLatex('diff(x,x,10000)'),/order/);
    assert.throws(()=>T.toLatex('integral(x,x,0)'),/Use integral/);
    assert.throws(()=>T.toLatex('d^2y/dx^3'),/orders/);
    assert.doesNotThrow(()=>T.mathLayout('integral(',32));
});
