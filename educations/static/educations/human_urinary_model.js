((global) => {
    'use strict';

    const slots = [
        ['right-kidney', 197, 127, "upper abdomen, person's right"],
        ['left-kidney', 523, 108, "upper abdomen, person's left"],
        ['right-ureter', 255, 252, "mid-abdomen, person's right"],
        ['left-ureter', 465, 234, "mid-abdomen, person's left"],
        ['bladder', 360, 359, 'centre of the pelvis'],
        ['urethra', 360, 430, 'below the pelvis centre'],
        ['arteries', 337, 105, 'upper centre of the abdomen'],
        ['veins', 385, 162, 'middle centre of the abdomen'],
    ].map(([id, x, y, label]) => ({id, x, y, label}));

    const parts = [
        ['right-kidney', 'Right kidney', 'Filters blood and makes urine. It usually sits a little lower than the left kidney.', 'Put the right kidney on the person’s right, slightly lower than the left kidney. Its inner notch faces the middle.'],
        ['left-kidney', 'Left kidney', 'Filters blood and makes urine. The inner notch is where vessels attach and urine drains toward the ureter.', 'Put the left kidney on the person’s left, with its inner notch facing the middle.'],
        ['right-ureter', 'Right ureter', 'A narrow muscular tube that carries urine from the right kidney to the bladder.', 'Connect the right ureter between the right kidney and the bladder. Its lower end should enter the side of the bladder.'],
        ['left-ureter', 'Left ureter', 'A narrow muscular tube that carries urine from the left kidney to the bladder.', 'Connect the left ureter between the left kidney and the bladder. Its lower end should enter the side of the bladder.'],
        ['bladder', 'Urinary bladder', 'A muscular sac that stores urine until it is released.', 'Put the bladder in the pelvis, where it can receive urine from both ureters.'],
        ['urethra', 'Urethra', 'A tube that carries urine from the bladder to the outside of the body. Its length varies with anatomy.', 'Put the urethra at the bottom of the bladder so it can carry urine out of the body.'],
        ['arteries', 'Renal arteries', 'These branches carry blood to the kidneys from the aorta, the main artery.', 'Place the arteries so a branch reaches the inner side of each kidney.'],
        ['veins', 'Renal veins', 'These branches carry blood away from the kidneys and into a large vein.', 'Place the veins so they lead away from the inner side of both kidneys.'],
    ].map(([id, name, description, correction]) => ({id, name, slot:id, description, correction}));
    const core = parts.slice(0, 6);
    const item = Object.fromEntries(parts.map(part => [part.id, part]));
    const point = Object.fromEntries(slots.map(slot => [slot.id, slot]));
    const available = extension => extension ? parts : core;
    const compatible = (id, slot) => Object.hasOwn(item, id) && Object.hasOwn(point, slot);

    function inspect(placements, extension = false) {
        const active = available(extension);
        const fits = part => placements[part.id] === part.slot;
        const missing = active.filter(part => !placements[part.id]);
        const issues = missing.length ? ['Still in the tray: ' + missing.map(part => part.name).join(', ') + '.'] : [];
        for (const part of active) {
            if (placements[part.id] && !fits(part)) issues.push(part.correction);
        }
        return {passed: issues.length === 0, corePassed: core.every(fits), issues};
    }

    function restorePlacements(raw, extension) {
        const result = {};
        const visible = available(extension).map(part => part.slot);
        for (const part of available(extension)) {
            const slot = raw?.[part.id];
            if (visible.includes(slot) && !Object.values(result).includes(slot)) result[part.id] = slot;
        }
        return result;
    }

    function hint(placements, extension, depth) {
        const part = available(extension).find(candidate => placements[candidate.id] !== candidate.slot);
        if (!part) return 'Use Check my model to see if all parts fit.';
        if (depth === 0) return 'Look at ' + part.name.toLowerCase() + '. What does it do?';
        if (depth === 1) return part.correction;
        const slot = point[part.slot];
        return part.name + ' belongs at point ' + (slots.indexOf(slot) + 1) + ' (' + slot.label + ').';
    }

    const model = {parts, slots, item, point, available, compatible, inspect, restorePlacements, hint};
    if (typeof module !== 'undefined' && module.exports) module.exports = model;
    else global.HumanUrinaryModel = model;
})(typeof window === 'undefined' ? globalThis : window);
