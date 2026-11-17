(async () => {
    'use strict';
    const get = name => document.getElementById('skin-' + name);
    const root = get('lab');
    if (!root) return;

    const {model, art, orderedParts, copy, duration = 2250} = window.AnatomyLab;
    const books = window.Grade7Notebooks;
    const book = books.catalogue.find(entry => entry.id === root.dataset.activity);
    const draftKey = 'grade7-' + book.id + '-build-v1';
    const fields = ['prediction', 'observation', 'explanation'];
    const canvas = get('canvas');
    let storage;
    let draft = {};
    try {
        storage = window.AcademyStorage || window.localStorage;
        await storage.ready;
        draft = JSON.parse(storage.getItem(draftKey) || '{}') || {};
    } catch (_) {
        // The lab remains usable in memory if device storage is unavailable.
    }

    let extension = draft.extension === true;
    let placements = model.restorePlacements(draft.placements, extension);
    let started = draft.started === true;
    let report = started && draft.checked === true ? model.inspect(placements, extension) : null;
    let traced = Boolean(report?.corePassed && draft.traced);
    let selected = null;
    let hintDepth = 0;
    let frame = null;
    let drag = null;
    const history = [];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    get('still').checked = reduceMotion.matches;

    for (const name of fields) {
        const field = get(name);
        field.value = typeof draft[name] === 'string' ? draft[name].slice(0, field.maxLength) : '';
        field.addEventListener('input', () => {
            get('save-status').textContent = '';
            updateExtension();
            persist();
        });
    }

    function persist() {
        const data = {started, placements, extension, checked: report !== null, traced};
        for (const name of fields) data[name] = get(name).value;
        try {
            storage.setItem(draftKey, JSON.stringify(data));
        } catch (_) {
            get('storage-status').textContent = 'This device could not save your draft. Keep this tab open to continue.';
        }
    }

    const partButtons = new Map();
    const slotButtons = new Map();
    function select(id) {
        selected = selected === id ? null : id;
        render();
    }

    for (const id of orderedParts) {
        const part = model.item[id];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'skin-part';
        button.dataset.part = id;
        const icon = document.createElement('canvas');
        icon.width = 240;
        icon.height = 128;
        icon.setAttribute('aria-hidden', 'true');
        art.preview(icon, id);
        const title = document.createElement('span');
        title.textContent = part.name;
        button.append(icon, title);
        button.addEventListener('click', () => select(id));
        startDragOn(button, () => id);
        get('parts').append(button);
        partButtons.set(id, button);
    }

    function slotVisible(slot) {
        return model.available(extension).some(part => part.slot === slot.id);
    }

    function occupant(slot) {
        return Object.keys(placements).find(id => placements[id] === slot);
    }

    for (const [index, slot] of model.slots.entries()) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'skin-target';
        button.dataset.slot = slot.id;
        button.textContent = index + 1;
        button.style.left = (slot.x / 720 * 100) + '%';
        button.style.top = (slot.y / 480 * 100) + '%';
        button.addEventListener('click', () => {
            if (selected && placements[selected] !== slot.id) place(selected, slot.id);
            else if (occupant(slot.id)) select(occupant(slot.id));
            else message('Choose a model from the tray, then choose a workbench point.');
        });
        startDragOn(button, () => occupant(slot.id));
        get('targets').append(button);
        slotButtons.set(slot.id, button);
    }

    for (const part of model.parts) {
        const name = document.createElement('dt');
        name.textContent = part.name;
        const detail = document.createElement('dd');
        detail.textContent = part.description;
        get('reference').append(name, detail);
    }

    function message(text, issues = []) {
        const feedback = get('feedback');
        feedback.textContent = text;
        if (!issues.length) return;
        const list = document.createElement('ul');
        for (const issue of issues) {
            const entry = document.createElement('li');
            entry.textContent = issue;
            list.append(entry);
        }
        feedback.append(list);
    }

    function stopTrace() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
    }

    function updateExtension() {
        const explained = fields.every(name => get(name).value.trim());
        get('extension').hidden = !traced || !explained || extension;
    }

    function render() {
        get('workspace').hidden = !started;
        get('record').hidden = !traced;
        updateExtension();
        if (!started) return;
        const parts = model.available(extension);
        get('start').hidden = true;
        get('count').textContent = Object.keys(placements).length + ' of ' + parts.length + ' placed';
        get('challenge').textContent = extension ? copy.extensionTitle : copy.coreTitle;
        get('selected').textContent = selected
            ? model.item[selected].name + ' selected. Choose a point or return it to the tray.'
            : 'Choose a model to place or move.';
        for (const part of model.parts) {
            const button = partButtons.get(part.id);
            button.hidden = !parts.includes(part) || Boolean(placements[part.id]);
            button.setAttribute('aria-pressed', String(selected === part.id));
        }
        for (const [index, slot] of model.slots.entries()) {
            const button = slotButtons.get(slot.id);
            const id = occupant(slot.id);
            button.hidden = !slotVisible(slot);
            button.dataset.occupied = String(Boolean(id));
            button.dataset.destination = String(Boolean(selected && model.compatible(selected, slot.id) && !id));
            button.setAttribute('aria-pressed', String(Boolean(id && selected === id)));
            button.setAttribute('aria-label', 'Point ' + (index + 1) + ', ' + slot.label + (id ? ', ' + model.item[id].name : ', empty'));
        }
        root.dataset.checked = String(Boolean(report?.corePassed && !selected));
        get('return').disabled = !selected || !placements[selected];
        get('undo').disabled = !history.length;
        get('trace').disabled = !report?.corePassed;
        get('check').textContent = 'Check my model';
        art.board(canvas, placements);
    }

    function revised(text) {
        stopTrace();
        report = null;
        traced = false;
        hintDepth = 0;
        selected = null;
        get('save-status').textContent = '';
        render();
        message(text + ' Check your model when ready.');
        persist();
    }

    function place(id, slot) {
        if (!model.compatible(id, slot)) {
            message(copy.invalidTarget);
            return;
        }
        if (occupant(slot) && occupant(slot) !== id) {
            message('That point is occupied. Move or return its current piece first.');
            return;
        }
        if (placements[id] === slot) return;
        history.push({...placements});
        placements[id] = slot;
        revised(model.item[id].name + ' placed.');
        slotButtons.get(slot).focus({preventScroll:true});
    }

    function startDragOn(button, getPart) {
        let suppressClickUntil = 0;
        button.addEventListener('click', event => {
            if (event.detail && performance.now() < suppressClickUntil) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }, true);
        button.addEventListener('pointerdown', event => {
            const id = getPart();
            if (event.button !== 0 || !id || drag) return;
            drag = {id, button, pointer: event.pointerId, clientX: event.clientX, clientY: event.clientY, moved:false};
            button.setPointerCapture(event.pointerId);
        });
        button.addEventListener('pointermove', event => {
            if (drag?.pointer !== event.pointerId || drag.button !== button) return;
            if (!drag.moved && Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) < 7) return;
            drag.moved = true;
            const point = boardPoint(event);
            art.board(canvas, placements, null, {...point, id:drag.id});
        });
        button.addEventListener('pointerup', event => {
            if (drag?.pointer !== event.pointerId || drag.button !== button) return;
            const {id,moved} = drag;
            drag = null;
            if (!moved) return;
            suppressClickUntil = performance.now() + 350;
            const point = boardPoint(event);
            const bounds = canvas.getBoundingClientRect();
            const visible = model.slots.filter(slot => slotVisible(slot) && model.compatible(id, slot.id));
            const distance = slot => Math.hypot(slot.x - point.x, slot.y - point.y);
            const nearest = visible.reduce((best, slot) => !best || distance(slot) < distance(best) ? slot : best, null);
            art.board(canvas, placements);
            if (nearest && point.x >= 0 && point.x <= 720 && point.y >= 0 && point.y <= 480 &&
                distance(nearest) * bounds.width / 720 <= 36) {
                place(id, nearest.id);
            } else {
                message('Drop the piece near a numbered point, or select it and tap a point.');
            }
        });
        button.addEventListener('pointercancel', () => {
            if (drag?.button !== button) return;
            drag = null;
            art.board(canvas, placements);
        });
    }

    function boardPoint(event) {
        const bounds = canvas.getBoundingClientRect();
        return {x:(event.clientX - bounds.left) * 720 / bounds.width, y:(event.clientY - bounds.top) * 480 / bounds.height};
    }

    get('start').onclick = () => {
        if (!get('prediction').value.trim()) {
            get('prediction').setCustomValidity('Write your prediction before building.');
            get('prediction').reportValidity();
            get('prediction').setCustomValidity('');
            return;
        }
        started = true;
        render();
        persist();
        get('workspace').scrollIntoView({block:'start'});
        partButtons.get(orderedParts[0]).focus({preventScroll:true});
    };

    get('return').onclick = () => {
        const id = selected;
        history.push({...placements});
        delete placements[id];
        revised(model.item[id].name + ' returned to the tray.');
        partButtons.get(id).focus();
    };

    get('undo').onclick = () => {
        placements = history.pop();
        revised('Last placement change undone.');
        if (get('undo').disabled) get('check').focus();
    };

    get('restart').onclick = () => {
        if (!window.confirm('Clear your workbench and start the model again? Your prediction and saved notebook entries will be kept.')) return;
        placements = {};
        extension = false;
        history.length = 0;
        revised('Workbench cleared.');
    };

    get('check').onclick = () => {
        stopTrace();
        report = model.inspect(placements, extension);
        selected = null;
        render();
        message(report.passed ? 'Practice check passed. Your model fits together.' :
            report.corePassed ? copy.corePassed :
            'Review these parts, then check your model again.', report.issues);
        persist();
    };

    get('hint').onclick = () => {
        message(model.hint(placements, extension, hintDepth));
        hintDepth = Math.min(2, hintDepth + 1);
    };

    get('trace').onclick = () => {
        if (!report?.corePassed) return;
        stopTrace();
        traced = true;
        render();
        persist();
        message(copy.trace);
        if (get('still').checked || reduceMotion.matches) {
            art.board(canvas, placements, 1);
            return;
        }
        const start = performance.now();
        function animate(now) {
            const progress = Math.min(1, (now - start) / duration);
            art.board(canvas, placements, progress);
            frame = progress < 1 ? requestAnimationFrame(animate) : null;
        }
        frame = requestAnimationFrame(animate);
    };
    function stopForReducedMotion() {
        if (frame !== null && (get('still').checked || reduceMotion.matches)) {
            stopTrace();
            art.board(canvas, placements, 1);
        }
    }
    get('still').addEventListener('change', stopForReducedMotion);
    reduceMotion.addEventListener('change', stopForReducedMotion);

    get('extension').onclick = () => {
        if (get('extension').hidden) return;
        extension = true;
        revised(copy.extensionStarted);
        partButtons.get(orderedParts.find(id => !placements[id])).focus();
    };

    get('save').onclick = () => {
        const notes = fields.map(name => get(name).value.trim());
        if (!report?.corePassed || !traced || notes.some(text => !text)) {
            get('save-status').textContent = 'Add your prediction, observation, and explanation before saving.';
            return;
        }
        const result = report.passed ? 'Practice check passed: ' + (extension ? 'complete model' : copy.coreResult)
            : 'Practice check: ' + copy.coreResult + ' passed. ' + report.issues.join(' ');
        const entries = books.load(book.key);
        const entry = [...notes, result];
        const sameEntry = JSON.stringify(entries[entries.length - 1]) === JSON.stringify(entry);
        const saved = books.save(book.key, sameEntry ? entries : [...entries, entry]);
        get('save-status').textContent = saved ? 'Recorded in your Grade 7 practical notebook.' : 'Could not save on this device. Keep this tab open and try again.';
    };

    render();
    get('prediction').disabled = false;
    get('start').disabled = false;
    if (started) message(report?.corePassed ? copy.traceReady : 'Your workbench is ready. Arrange the parts and check your model.');
})();
