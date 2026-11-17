((global) => {
    'use strict';

    // Anchors are numbered on the workbench. Layers share a stack and the other
    // pieces share a pool of points, allowing learners to try wrong connections.
    const slots = [
        ['surface-layer', 360, 150, 'upper layer'],
        ['middle-layer', 360, 181, 'middle layer'],
        ['bottom-layer', 360, 359, 'bottom layer'],
        ['hair', 247, 279, 'left middle'],
        ['follicle', 253, 320, 'left lower'],
        ['gland', 469, 308, 'right lower'],
        ['duct', 459, 228, 'right middle'],
        ['pore', 449, 150, 'right surface'],
        ['oil', 274, 222, 'left upper'],
        ['vessels', 380, 345, 'deep centre'],
        ['nerves', 350, 252, 'middle centre'],
    ].map(([id, x, y, label]) => ({id, x, y, label}));

    const parts = [
        ['epidermis', 'Epidermis', 'surface-layer', 'The thin outer skin layer forms a protective barrier.'],
        ['dermis', 'Dermis', 'middle-layer', 'The thicker layer under the epidermis contains follicles, glands, vessels and nerves.'],
        ['fat', 'Subcutaneous fat', 'bottom-layer', 'Fat below the skin cushions the body and helps keep it warm.'],
        ['hair', 'Hair', 'hair', 'The root lies inside the follicle. The shaft is the part that rises above the skin.'],
        ['follicle', 'Hair follicle', 'follicle', 'A sheath around the hair root that extends into the dermis.'],
        ['gland', 'Sweat gland', 'gland', 'This coiled eccrine sweat gland makes sweat deep in the dermis.'],
        ['duct', 'Sweat duct', 'duct', 'A narrow tube that carries sweat from the gland through the skin.'],
        ['pore', 'Sweat pore', 'pore', 'The opening where the sweat duct meets the skin surface.'],
        ['oil', 'Oil gland', 'oil', 'Also called a sebaceous gland. It releases oil into the hair follicle.'],
        ['vessels', 'Blood vessels', 'vessels', 'Small branching vessels supply the dermis and help manage heat loss.'],
        ['nerves', 'Sensory nerve endings', 'nerves', 'Sensory endings help you detect things such as touch and temperature.'],
    ].map(([id, name, slot, description]) => ({id, name, slot, description}));

    const core = parts.slice(0, 8);
    const item = Object.fromEntries(parts.map(part => [part.id, part]));
    const point = Object.fromEntries(slots.map(slot => [slot.id, slot]));
    const isLayer = slot => slots.slice(0, 3).some(entry => entry.id === slot);
    const available = extension => extension ? parts : core;
    const compatible = (part, slot) => Boolean(item[part] && point[slot] && isLayer(item[part].slot) === isLayer(slot));

    const corrections = {
        epidermis: 'Put the thin protective layer above the thicker dermis.',
        dermis: 'The dermis belongs below the epidermis and above the fat.',
        fat: 'Put the cushioning fat beneath the two skin layers.',
        hair: 'Fit the root inside the follicle and keep the shaft above the surface.',
        follicle: 'Position the sheath in the dermis so it surrounds the hair root.',
        gland: 'Position the coiled gland deep in the dermis, next to the lower end of the duct.',
        duct: 'The sweat duct needs to connect the deep coiled gland to the opening on the surface.',
        pore: 'The pore is an opening on the surface at the upper end of the duct.',
        oil: 'Move the oil gland beside the hair follicle so it can empty into it.',
        vessels: 'Place the branching blood vessels inside the dermis, near its base.',
        nerves: 'Place the sensory nerve endings inside the dermis, where their tips approach the surface.',
    };

    function inspect(placements, extension = false) {
        const chosen = available(extension);
        const issues = [];
        const correct = id => placements[id] === item[id].slot;
        const missing = chosen.filter(part => !placements[part.id]);
        if (missing.length) issues.push('Still in the tray: ' + missing.map(part => part.name).join(', ') + '.');
        for (const part of chosen) {
            if (placements[part.id] && !correct(part.id)) issues.push(corrections[part.id]);
        }
        const corePassed = core.every(part => correct(part.id));
        return {passed: issues.length === 0, corePassed, issues};
    }

    function restorePlacements(value, extension) {
        const result = {};
        for (const part of available(extension)) {
            const slot = value?.[part.id];
            if (compatible(part.id, slot) && !Object.values(result).includes(slot)) result[part.id] = slot;
        }
        return result;
    }

    function hint(placements, extension, depth) {
        const part = available(extension).find(candidate => placements[candidate.id] !== candidate.slot);
        if (!part) return 'Check your assembled model to see if all parts fit.';
        return depth === 0 ? 'Look again at ' + part.name.toLowerCase() + '. What does this structure do?'
            : depth === 1 ? corrections[part.id]
            : part.name + ' belongs at point ' + (slots.indexOf(point[part.slot]) + 1) + ' (' + point[part.slot].label + ').';
    }

    const api = {parts, slots, item, point, available, compatible, inspect, restorePlacements, hint};
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else global.HumanSkinModel = api;
})(typeof window === 'undefined' ? globalThis : window);
