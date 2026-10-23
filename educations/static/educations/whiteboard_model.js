(function (root, factory) {
    const model = factory();
    if (typeof module === 'object' && module.exports) module.exports = model;
    else root.WhiteboardModel = model;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const types = new Set(['path', 'rectangle', 'ellipse', 'line', 'arrow', 'text', 'sticky', 'image', 'table', 'graph']);
    const T = typeof module === 'object' && module.exports ? require('./whiteboard_typesetting.js') : globalThis.WhiteboardTypesetting;
    const G = typeof module === 'object' && module.exports ? require('./whiteboard_graph.js') : globalThis.WhiteboardGraph;
    const clone = value => JSON.parse(JSON.stringify(value));
    const number = (value, fallback = 0) => Number.isFinite(value) ? Math.max(-1e7, Math.min(1e7, value)) : fallback;
    const colour = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
    const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    function create(type, x, y, options = {}) {
        const item = { id: uid(), type, x, y, w: 180, h: 120, stroke: '#3b3548', fill: '#e9ddff', width: 3, fontSize: 24, text: '', ...options };
        if (type === 'sticky') Object.assign(item, { w: 210, h: 180, fill: '#ffdf80', text: 'Your idea here', ...options });
        if (type === 'text') Object.assign(item, { w: 280, h: 70, fill: '#3b3548', text: 'Add your text', ...options });
        if (type === 'table') Object.assign(item, { w: 420, h: 180, text: 'Topic\tIdea\tNext step\n\t\t\n\t\t', ...options });
        if (type === 'graph') Object.assign(item, { w: 560, h: 360, fill: '#ffffff', stroke: '#1689f8', expression: 'x^2', xMin: -10, xMax: 10, yMin: -10, yMax: 10, showGrid: true, showAxes: true, samples: [], ...options });
        if (type === 'path') item.points = options.points || [[x, y]];
        return item;
    }
    function newBoard() {
        return { version: 1, id: uid(), title: 'Untitled whiteboard', notes: '', neatInk: true, recognitionMode: 'auto', items: [], view: { x: 0, y: 0, zoom: 1 }, updated: Date.now() };
    }
    function bounds(item) {
        if (item.type === 'path') {
            const points = item.points || [[item.x, item.y]];
            let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
            for (const [x, y] of points) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
            return { x: left, y: top, w: Math.max(1, right - left), h: Math.max(1, bottom - top) };
        }
        return { x: Math.min(item.x, item.x + item.w), y: Math.min(item.y, item.y + item.h), w: Math.max(1, Math.abs(item.w)), h: Math.max(1, Math.abs(item.h)) };
    }
    function allBounds(items) {
        if (!items.length) return { x: 0, y: 0, w: 900, h: 550 };
        const boxes = items.map(bounds);
        const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y));
        return { x, y, w: Math.max(...boxes.map(b => b.x + b.w)) - x, h: Math.max(...boxes.map(b => b.y + b.h)) - y };
    }
    function move(item, dx, dy) {
        const result = { ...item, x: item.x + dx, y: item.y + dy };
        if (item.type === 'path') result.points = item.points.map(([x, y]) => [x + dx, y + dy]);
        if (item.inkSource) result.inkSource = item.inkSource.map(source => move(source, dx, dy));
        return result;
    }
    function resize(item, width, height) {
        const result = clone(item), box = bounds(item);
        width = Math.max(15, width); height = Math.max(15, height);
        if (item.type === 'path') {
            result.points = item.points.map(([x, y]) => [box.x + (x - box.x) * width / box.w, box.y + (y - box.y) * height / box.h]);
        } else if (item.type === 'line' || item.type === 'arrow') {
            result.x = box.x + (item.w < 0 ? width : 0);
            result.y = box.y + (item.h < 0 ? height : 0);
            result.w = width * (item.w < 0 ? -1 : 1);
            result.h = item.h === 0 && height === 15 ? 0 : height * (item.h < 0 ? -1 : 1);
        } else {
            result.x = box.x; result.y = box.y; result.w = width; result.h = height;
        }
        if (item.inkSource) result.inkSource = item.inkSource.map(source => {
            const points = source.points.map(([x, y]) => [box.x + (x - box.x) * width / box.w, box.y + (y - box.y) * height / box.h]);
            return { ...source, x: points[0][0], y: points[0][1], points };
        });
        return result;
    }
    function distanceToSegment(point, a, b) {
        const dx = b.x - a.x, dy = b.y - a.y;
        const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
        return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
    }
    function hit(item, point, tolerance = 8) {
        const box = bounds(item);
        if (item.type === 'path') {
            if (item.points.length === 1) return Math.hypot(item.points[0][0] - point.x, item.points[0][1] - point.y) <= tolerance + item.width / 2;
            return item.points.some((p, index) => index && distanceToSegment(point, { x: item.points[index - 1][0], y: item.points[index - 1][1] }, { x: p[0], y: p[1] }) <= tolerance + item.width / 2);
        }
        if (item.type === 'line' || item.type === 'arrow') return distanceToSegment(point, item, { x: item.x + item.w, y: item.y + item.h }) <= tolerance + item.width / 2;
        if (item.type === 'ellipse') return Math.hypot((point.x - box.x - box.w / 2) / (box.w / 2 + tolerance), (point.y - box.y - box.h / 2) / (box.h / 2 + tolerance)) <= 1;
        return point.x >= box.x - tolerance && point.x <= box.x + box.w + tolerance && point.y >= box.y - tolerance && point.y <= box.y + box.h + tolerance;
    }
    function hitAlong(item, from, to, tolerance = 8) {
        const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / Math.max(2, tolerance)));
        for (let i = 0; i <= steps; i++) if (hit(item, { x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps }, tolerance)) return true;
        return false;
    }
    // Clip a stroke against the capsule swept by an eraser. Intersecting the
    // endpoint circles and the rectangle between them also catches fast swipes
    // across sparsely sampled handwriting, without deleting the whole stroke.
    function erasedIntervals(p, q, from, to, radius) {
        const dx = q[0] - p[0], dy = q[1] - p[1], intervals = [];
        function interval(lo, hi) {
            lo = Math.max(0, lo); hi = Math.min(1, hi);
            if (hi - lo > 1e-9) intervals.push([lo, hi]);
        }
        function disk(c) {
            const a = dx * dx + dy * dy, px = p[0] - c.x, py = p[1] - c.y;
            if (a < 1e-15) { if (px * px + py * py <= radius * radius) interval(0, 1); return; }
            const b = 2 * (px * dx + py * dy), discriminant = b * b - 4 * a * (px * px + py * py - radius * radius);
            if (discriminant > 0) { const d = Math.sqrt(discriminant); interval((-b - d) / (2 * a), (-b + d) / (2 * a)); }
        }
        disk(from); disk(to);
        const length = Math.hypot(to.x - from.x, to.y - from.y);
        if (length > 1e-9) {
            const ux = (to.x - from.x) / length, uy = (to.y - from.y) / length;
            let lo = 0, hi = 1;
            function clip(start, delta, min, max) {
                if (Math.abs(delta) < 1e-12) return start >= min && start <= max;
                const a = (min - start) / delta, b = (max - start) / delta;
                lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b));
                return lo <= hi;
            }
            if (clip((p[0] - from.x) * ux + (p[1] - from.y) * uy, dx * ux + dy * uy, 0, length) &&
                clip(-(p[0] - from.x) * uy + (p[1] - from.y) * ux, -dx * uy + dy * ux, -radius, radius)) interval(lo, hi);
        }
        intervals.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const range of intervals) {
            const previous = merged[merged.length - 1];
            if (previous && range[0] <= previous[1] + 1e-9) previous[1] = Math.max(previous[1], range[1]);
            else merged.push([...range]);
        }
        return merged;
    }
    function erasePath(item, from, to, radius = 12) {
        if (item.type !== 'path') return [item];
        const r = Math.max(.1, radius) + item.width / 2;
        if (item.points.length === 1) return distanceToSegment({ x: item.points[0][0], y: item.points[0][1] }, from, to) <= r ? [] : [item];
        let changed = false, current = [];
        const fragments = [];
        function append(p) { const last = current[current.length - 1]; if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 1e-7) current.push(p); }
        function finish() { if (current.length > 1) fragments.push(current); current = []; }
        for (let i = 1; i < item.points.length; i++) {
            const p = item.points[i - 1], q = item.points[i], intervals = erasedIntervals(p, q, from, to, r);
            const at = t => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
            let cursor = 0;
            for (const [lo, hi] of intervals) {
                changed = true;
                if (lo > cursor + 1e-9) { append(at(cursor)); append(at(lo)); }
                finish(); cursor = hi;
            }
            if (cursor < 1 - 1e-9) { append(at(cursor)); append(q); }
        }
        finish();
        if (!changed) return [item];
        return fragments.map((points, index) => ({ ...item, id: index ? uid() : item.id, x: points[0][0], y: points[0][1], points }));
    }
    function eraseInk(items, from, to, radius = 12) {
        return items.flatMap(item => item.type === 'text' && item.inkSource?.length && hitAlong(item, from, to, radius) ? [] : erasePath(item, from, to, radius));
    }
    const canRecognize = item => item.type === 'path' && item.pen !== 'highlighter' && !item.keepInk && item.points?.length;
    function recognitionRequest(items, pending) {
        const seeds = items.filter(i => canRecognize(i) && pending.has(i.id));
        if (!seeds.length) return { strokes: [], contextIds: [] };
        const near = (item, context = false) => {
            const a = bounds(item);
            return seeds.some(seed => {
                const b = bounds(seed), margin = Math.max(65, b.h * 1.3, a.h * 1.3);
                const structuredMath=item.format==='math' && /[=+−×÷/<>]|sqrt\(/.test(item.text);
                if (context && !structuredMath) {
                    // Use the displayed text line, not its much taller source
                    // ink. Writing underneath a corrected word is a new line.
                    const lineHeight=item.fontSize*1.5, lines=String(item.text).split('\n');
                    const sameLine=lines.some((line,index)=>line.trim() && Math.abs((a.y+item.fontSize*.55+index*lineHeight)-(b.y+b.h/2))<=Math.max(16,Math.max(item.fontSize,b.h)*.46));
                    if (!sameLine) return false;
                }
                return a.x <= b.x + b.w + margin && a.x + a.w >= b.x - margin && a.y <= b.y + b.h + margin * .45 && a.y + a.h >= b.y - margin * .45;
            });
        };
        const strokes = seeds.slice(0, 140), ids = new Set(strokes.map(s => s.id)), contextIds = [];
        for (const item of items) {
            if (strokes.length >= 190) break;
            if (canRecognize(item) && !ids.has(item.id) && near(item)) { strokes.push(item); ids.add(item.id); }
            if (item.type === 'text' && !item.manualText && !item.layoutMoved && item.inkSource?.length && near(item,true) && strokes.length + item.inkSource.length <= 190) {
                contextIds.push(item.id);
                for (const source of item.inkSource) if (!ids.has(source.id)) { strokes.push(source); ids.add(source.id); }
            }
        }
        const order = new Map(items.flatMap(i=>i.type==='path'?[i]:(i.inkSource||[])).map((s,i)=>[s.id,i]));
        strokes.sort((a,b)=>order.get(a.id)-order.get(b.id));
        return { strokes, contextIds };
    }
    function isRecognitionCurrent(items,request) {
        const contexts=new Set(request.contextIds||[]);
        const current=new Map(items.flatMap(i=>i.type==='path'&&!i.keepInk?[[i.id,i]]:contexts.has(i.id)&&!i.manualText?(i.inkSource||[]).map(s=>[s.id,s]):[]));
        return request.strokes.every(s=>current.has(s.id) && JSON.stringify(current.get(s.id).points)===JSON.stringify(s.points));
    }
    function recognitionSources(request,word) {
        const strokes=Array.isArray(request?.strokes)?request.strokes:[];
        const ids=new Set(Array.isArray(word?.strokeIds)?word.strokeIds:[]);
        let sources=strokes.filter(stroke=>ids.has(stroke.id));
        if(sources.length || !word?.box)return sources.length?sources:strokes;
        const target=word.box,margin=Math.max(12,Math.min(80,(target.h||20)*.45));
        sources=strokes.filter(stroke=>{const b=bounds(stroke);return b.x<=target.x+target.w+margin&&b.x+b.w>=target.x-margin&&b.y<=target.y+target.h+margin&&b.y+b.h>=target.y-margin;});
        return sources.length?sources:strokes;
    }
    function placeRecognized(item,items) {
        let result={...item};
        const obstacles=items.filter(i=>i.type==='text').map(bounds).sort((a,b)=>a.y-b.y);
        for (let pass=0;pass<obstacles.length+1;pass++) {
            const b=bounds(result), collision=obstacles.find(a=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>Math.min(a.w,b.w)*.35 && b.y<a.y+a.h && b.y+b.h>a.y);
            if (!collision) break;
            result.y=collision.y+collision.h+Math.max(12,item.fontSize*.4); result.layoutMoved=true;
        }
        return result;
    }
    function reviewSelection(words, edits) {
        return words.flatMap((word,index)=>{
            const edit=edits[index];if(!edit?.selected)return [];
            const text=String(edit.text||'').trim(),format=edit.format;
            return [{...word,text,format,...(text!==word.text||format!==word.format?{latex:undefined,notation:undefined}:{})}];
        });
    }
    function applyRecognition(items, request, words, confirmed=false) {
        const sources = new Map(request.strokes.map(s => [s.id, s])), groups = [];
        if (!isRecognitionCurrent(items,request)) return { items, corrected: 0 };
        const counts=new Map();
        for(const word of words||[])for(const id of word?.strokeIds||[])counts.set(id,(counts.get(id)||0)+1);
        for (const word of words || []) {
            if (!word || typeof word !== 'object') continue;
            if (word.needsReview && !confirmed) continue;
            if(word.strokeIds?.some(id=>counts.get(id)>1))continue;
            const text = typeof word.text === 'string' ? word.text.trim().slice(0, 5000) : '';
            if (!text || !Array.isArray(word.strokeIds) || word.strokeIds.some(id => !sources.has(id))) continue;
            const ids = new Set(word.strokeIds), ink = [...ids].map(id => sources.get(id));
            if (!ink.length) continue;
            const b = allBounds(ink);
            if (b.w > b.h * 5 && b.h < 7 && word.format !== 'math') continue; // Keep underlining as ink.
            const touching = groups.filter(g => [...ids].some(id => g.ids.has(id)));
            if (touching.length) {
                const group = touching[0];
                for (const id of ids) group.ids.add(id);
                if (group.text !== text) group.text += ' ' + text;
                for (const other of touching.slice(1)) {
                    for (const id of other.ids) group.ids.add(id);
                    group.text += ' ' + other.text; groups.splice(groups.indexOf(other), 1);
                }
            } else groups.push({ ids, text, latex: word.latex, format: word.format, fontSize: word.fontSize, alternatives: word.alternatives || [] });
        }
        // Do not replace only part of an already-corrected word when it is
        // supplied as context for newly added letters.
        let valid = groups, changed = true;
        const contexts = items.filter(i => request.contextIds.includes(i.id));
        while (changed) {
            changed = false;
            const covered = new Set(valid.flatMap(g => [...g.ids]));
            for (const context of contexts) {
                if (context.inkSource.some(s => covered.has(s.id)) && !context.inkSource.every(s => covered.has(s.id))) {
                    const ids = new Set(context.inkSource.map(s => s.id)), next = valid.filter(g => ![...g.ids].some(id => ids.has(id)));
                    if (next.length !== valid.length) { valid = next; changed = true; }
                }
            }
        }
        if (!valid.length) return { items, corrected: 0 };
        const covered = new Set(valid.flatMap(g => [...g.ids]));
        const output = items.filter(i => !(i.type === 'path' && covered.has(i.id)) && !(contexts.includes(i) && i.inkSource.every(s => covered.has(s.id))));
        for (const group of valid) {
            const ink = [...group.ids].map(id => sources.get(id)), b = allBounds(ink), fontSize = Math.round(Math.max(18, Math.min(96, number(group.fontSize, b.h * 1.15))));
            const format = ['math','paragraph'].includes(group.format) ? group.format : undefined;
            const layout = format === 'math' ? T.mathLayout(group.text,fontSize) : T.textLayout(group.text,fontSize);
            const item=create('text', b.x, format ? b.y : b.y + b.h - fontSize - 4, {
                text: group.text, ...(typeof group.latex === 'string' ? { latex: group.latex, latexSource: group.text } : {}), stroke: ink[0].stroke, fontSize,
                w: Math.max(b.w + 12, layout.w), h: layout.h, ...(format ? { format } : {}),
                inkSource: clone(ink), alternatives: group.alternatives.filter(a => typeof a === 'string').slice(0, 5),
                ...(confirmed?{manualText:true}:{}),
            });
            output.push(placeRecognized(item,output));
        }
        return { items: output, corrected: valid.length };
    }
    function restoreHandwriting(items, id) {
        return items.flatMap(item => item.id === id && item.inkSource?.length ? item.inkSource.map(source => ({ ...clone(source), keepInk: true })) : [item]);
    }
    const canRetryRecognition = item => canRecognize(item) || item.type==='text' && !item.manualText && item.inkSource?.length;
    function retryHandwriting(items) {
        return items.flatMap(item=>item.type==='text' && !item.manualText && item.inkSource?.length ? item.inkSource.map(s=>{const original=clone(s);delete original.keepInk;return original;}) : [item]);
    }
    function panView(view, dx, dy) {
        return { ...view, x: number(view.x + dx), y: number(view.y + dy) };
    }
    function gestureView(view, start, current) {
        const zoom = Math.max(.25, Math.min(2, view.zoom * current.distance / Math.max(1, start.distance)));
        return { zoom, x: current.x - (start.x - view.x) * zoom / view.zoom, y: current.y - (start.y - view.y) * zoom / view.zoom };
    }
    function neatenStroke(item) {
        if (item.type !== 'path' || item.neat || item.points.length < 3) return item;
        const original = item.points, first = original[0], last = original[original.length - 1];
        const direct = Math.hypot(last[0] - first[0], last[1] - first[1]);
        let travelled = 0, deviation = 0;
        for (let i = 1; i < original.length; i++) {
            travelled += Math.hypot(original[i][0] - original[i - 1][0], original[i][1] - original[i - 1][1]);
            deviation = Math.max(deviation, distanceToSegment({ x: original[i][0], y: original[i][1] }, { x: first[0], y: first[1] }, { x: last[0], y: last[1] }));
        }
        // Straighten only clearly straight gestures. A loop or a letter with a
        // deliberate bend must not be mistaken for a straight line.
        if (direct > 35 && travelled / direct < 1.09 && deviation < Math.max(2, Math.min(5, direct * .018))) {
            return { ...item, neat: true, points: [[...first], [...last]] };
        }
        // Resample by distance so slow writing receives the same gentle
        // smoothing as quick writing. Retain endpoints and sharp corners.
        const spacing = Math.max(1, travelled / 2000), points = [[...first]];
        let remaining = spacing;
        for (let i = 1; i < original.length; i++) {
            let a = [...original[i - 1]], b = original[i], length = Math.hypot(b[0] - a[0], b[1] - a[1]);
            while (length >= remaining && points.length < 20000) {
                const t = remaining / length;
                a = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
                points.push(a); length -= remaining; remaining = spacing;
            }
            remaining -= length;
        }
        if (Math.hypot(points[points.length - 1][0] - last[0], points[points.length - 1][1] - last[1]) > 1e-6) points.push([...last]);
        if (points.length < 5) return item;
        const smooth = points.map((p, i) => {
            if (i < 2 || i > points.length - 3) return [...p];
            const a = points[i - 2], b = points[i + 2], ux = p[0] - a[0], uy = p[1] - a[1], vx = b[0] - p[0], vy = b[1] - p[1];
            const cosine = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1);
            if (cosine < .45) return [...p];
            return [(a[0] + 2 * points[i - 1][0] + 3 * p[0] + 2 * points[i + 1][0] + b[0]) / 9,
                (a[1] + 2 * points[i - 1][1] + 3 * p[1] + 2 * points[i + 1][1] + b[1]) / 9];
        });
        return { ...item, neat: true, points: smooth };
    }
    function validateItem(raw) {
        if (!raw || !types.has(raw.type)) throw new Error('This file contains an unsupported element.');
        const item = create(raw.type, number(raw.x), number(raw.y), {
            id: typeof raw.id === 'string' ? raw.id.slice(0, 100) : uid(),
            w: Math.max(-20000, Math.min(20000, number(raw.w, 180))), h: Math.max(-20000, Math.min(20000, number(raw.h, 120))),
            stroke: colour(raw.stroke, '#3b3548'), fill: colour(raw.fill, '#e9ddff'),
            width: Math.max(1, Math.min(30, number(raw.width, 3))), fontSize: Math.max(10, Math.min(120, number(raw.fontSize, 24))),
            text: typeof raw.text === 'string' ? raw.text.slice(0, 5000) : '',
        });
        if (item.type === 'path') {
            if (!Array.isArray(raw.points) || !raw.points.length || raw.points.length > 20000 || raw.points.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite))) throw new Error('Invalid drawing points.');
            item.points = raw.points.map(p => p.map(v => number(v)));
            if (['pen', 'marker', 'highlighter'].includes(raw.pen)) item.pen = raw.pen;
            if (Number.isFinite(raw.opacity)) item.opacity = Math.max(.1, Math.min(1, raw.opacity));
            if (raw.neat === true) item.neat = true;
            if (raw.keepInk === true) item.keepInk = true;
        }
        if (item.type === 'text' && Array.isArray(raw.inkSource)) {
            if (!raw.inkSource.length || raw.inkSource.length > 200 || raw.inkSource.some(s => s.type !== 'path')) throw new Error('Invalid original handwriting.');
            item.inkSource = raw.inkSource.map(validateItem);
            item.alternatives = Array.isArray(raw.alternatives) ? raw.alternatives.filter(a => typeof a === 'string').slice(0, 5).map(a => a.slice(0, 1000)) : [];
        }
        if (item.type === 'text' && ['math','paragraph'].includes(raw.format)) item.format = raw.format;
        if (item.format === 'math' && typeof raw.latex === 'string' && raw.latexSource === item.text) {
            item.latex = raw.latex.slice(0, 10000); item.latexSource = item.text;
        }
        if (item.format==='math') {
            const layout=T.mathLayout(item.text,item.fontSize);
            item.w=Math.max(item.w,layout.w); item.h=Math.max(item.h,layout.h);
        }
        if (item.type === 'text' && raw.manualText === true) item.manualText = true;
        if (item.type === 'text' && raw.layoutMoved === true) item.layoutMoved = true;
        if (item.type === 'image') {
            if (typeof raw.src !== 'string' || raw.src.length > 4e6 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(raw.src)) throw new Error('Images must be embedded PNG, JPEG, or WebP files.');
            item.src = raw.src;
        }
        if (item.type === 'graph') {
            if (!G) throw new Error('Graph support is unavailable.');
            const plotted = G.plot(typeof raw.expression === 'string' ? raw.expression : '', {
                xMin: raw.xMin, xMax: raw.xMax, yMin: raw.yMin, yMax: raw.yMax,
            });
            Object.assign(item, plotted, { showGrid: raw.showGrid !== false, showAxes: raw.showAxes !== false });
            item.w = Math.max(260, Math.min(2000, Math.abs(item.w)));
            item.h = Math.max(200, Math.min(1400, Math.abs(item.h)));
        }
        return item;
    }
    function restore(raw) {
        if (!raw || raw.version !== 1 || !Array.isArray(raw.items) || raw.items.length > 3000) throw new Error('Choose a valid EduPortal whiteboard file.');
        const items = raw.items.map(validateItem), seen = new Set();
        for (const item of items) { if (seen.has(item.id)) item.id = uid(); seen.add(item.id); }
        return { version: 1, id: typeof raw.id === 'string' ? raw.id.slice(0, 100) : uid(), title: (typeof raw.title === 'string' ? raw.title.slice(0, 80).trim() : '') || 'Untitled whiteboard', notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 20000) : '', neatInk: raw.neatInk !== false, recognitionMode: ['auto','text','math'].includes(raw.recognitionMode) ? raw.recognitionMode : 'auto', items, view: { x: number(raw.view?.x), y: number(raw.view?.y), zoom: Math.max(.25, Math.min(2, number(raw.view?.zoom, 1))) }, updated: Number.isFinite(raw.updated) && raw.updated >= 0 && raw.updated < 8e15 ? raw.updated : Date.now() };
    }
    function history(items = []) {
        let past = [], future = [];
        return {
            commit(before, after) { if (JSON.stringify(before) === JSON.stringify(after)) return false; past.push(clone(before)); if (past.length > 80) past.shift(); future = []; return true; },
            undo(current) { if (!past.length) return null; future.push(clone(current)); return past.pop(); },
            redo(current) { if (!future.length) return null; past.push(clone(current)); return future.pop(); },
            get canUndo() { return !!past.length; }, get canRedo() { return !!future.length; },
        };
    }
    return { clone, uid, create, newBoard, bounds, allBounds, move, resize, hit, hitAlong, erasePath, eraseInk, canRecognize, canRetryRecognition, retryHandwriting, isRecognitionCurrent, recognitionSources, placeRecognized, recognitionRequest, reviewSelection, applyRecognition, restoreHandwriting, panView, gestureView, neatenStroke, restore, history };
}));
