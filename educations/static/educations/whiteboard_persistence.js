(function(root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.WhiteboardPersistence = factory();
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';
    const prefix = 'eduportal.whiteboards.v2:', indexKey = '@whiteboard-index.v2';
    let queue = Promise.resolve();
    const parse = (value, fallback) => { try { return JSON.parse(value) || fallback; } catch (_) { return fallback; } };
    const summary = board => ({id: board.id, title: board.title, updated: board.updated, count: board.items.length});
    async function write(storage, entries) {
        if (storage.setItemsAsync) return storage.setItemsAsync(entries);
        for (const [key, value] of entries) storage.setItem(key, value);
    }
    async function open(storage, id, restore) {
        const key = prefix + id;
        try {
            const raw = storage.ensure ? await storage.ensure(key) : storage.getItem(key);
            if (!raw) throw Error('This board is unavailable on this device. Connect to open its online copy or restore a backup.');
            return restore(JSON.parse(raw));
        } catch (error) {
            for (const checkpoint of recovery(storage, id)) {
                try {
                    const board = restore(JSON.parse(checkpoint.raw));
                    board.id = 'recovered-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
                    board.title = (board.title.slice(0, 65) + ' · recovered').slice(0, 80);
                    return board;
                } catch (_) { /* Try the next retained checkpoint. */ }
            }
            throw error;
        }
    }
    async function load(storage, legacyKey, restore, tabActiveId = null) {
        const index = parse(storage.getItem(indexKey), {boards: []});
        const warnings = [];
        const legacyBoards = new Map();
        if (!Array.isArray(index.boards)) warnings.push('The board list needs recovery. Rebuilding it from saved drafts.');
        const library = (Array.isArray(index.boards) ? index.boards : []).filter(b => b && typeof b.id === 'string' && !storage.isDeleted?.(prefix + b.id));
        if (!storage.getItem('@whiteboard-migrated.v2')) {
            let raw;
            try { raw = storage.ensure ? await storage.ensure(legacyKey) : storage.getItem(legacyKey); }
            catch (_) { warnings.push('Connect again to recover the older online library.'); }
            const legacy = parse(raw, null), entries = [];
            if (raw && !legacy) warnings.push('An older library needs recovery. Its original copy has been retained.');
            for (const value of (legacy?.boards || []).slice(0, 100)) {
                try {
                    const board = restore(value);
                    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(board.id)) board.id = 'recovered-' + library.length + '-' + Date.now();
                    legacyBoards.set(board.id, board);
                    if (!library.some(b => b.id === board.id)) {
                        entries.push([prefix + board.id, JSON.stringify(board)]);
                        library.push(summary(board));
                    }
                } catch (_) { warnings.push('An older board needs recovery. Download the original library from Saved boards.'); }
            }
            index.activeId = index.activeId || legacy?.activeId;
            entries.push([indexKey, JSON.stringify({boards: library, activeId: index.activeId})]);
            if (!warnings.length) entries.push(['@whiteboard-migrated.v2', '1']);
            try { await write(storage, entries); }
            catch (_) { warnings.push('Device saving is unavailable. Download a backup of your work.'); }
        }
        for (const key of storage.keys?.() || []) {
            if (!key.startsWith(prefix)) continue;
            const id = key.slice(prefix.length);
            if (library.some(b => b.id === id)) continue;
            const remote = storage.remoteWork?.get(key);
            const local = parse(storage.getItem(key), null);
            try { library.push(local ? summary(restore(local)) : {id, title: remote?.title || 'Saved whiteboard', updated: Date.parse(remote?.updated) || 0, count: null}); }
            catch (_) { warnings.push('A saved board needs recovery. Its stored copy has been retained.'); }
        }
        let board = null;
        const preferred = library.find(b => b.id === tabActiveId) || library.find(b => b.id === index.activeId) || library[0];
        if (preferred) {
            try { board = await open(storage, preferred.id, restore); if (board.id !== preferred.id) warnings.push('An earlier recovery copy has opened. The damaged draft is retained.'); }
            catch (error) { board = legacyBoards.get(preferred.id) || null; warnings.push(error.message); }
        }
        return {library, board, warnings};
    }
    function save(storage, key, library, board, clone) {
        board.updated = Date.now();
        const snapshot = clone(board), raw = JSON.stringify(snapshot), recordKey = prefix + board.id;
        const i = library.findIndex(value => value.id === board.id);
        if (i < 0) library.push(summary(snapshot)); else library[i] = summary(snapshot);
        const metadata = JSON.stringify({activeId: snapshot.id, boards: library.map(b => b.items ? summary(b) : b)});
        const operation = async () => {
            const entries = [[recordKey, raw], [indexKey, metadata]];
            const previous = storage.getItem(recordKey);
            const checkpoints = parse(storage.getItem('@recovery:' + snapshot.id), []);
            if (previous && previous !== raw && (!checkpoints.length || snapshot.updated - checkpoints[0].time > 60000)) {
                checkpoints.unshift({time: snapshot.updated, raw: previous});
                entries.push(['@recovery:' + snapshot.id, JSON.stringify(checkpoints.slice(0, 3))]);
            }
            await write(storage, entries);
            return snapshot.id;
        };
        const result = queue.catch(() => {}).then(operation);
        queue = result;
        return result;
    }
    function recovery(storage, id) { return parse(storage.getItem('@recovery:' + id), []); }
    function claim(lockManager, scope, id) {
        if (!lockManager?.request) return Promise.resolve(() => {});
        return new Promise((resolve, reject) => {
            lockManager.request('academy-whiteboard:' + scope + ':' + id, {ifAvailable: true}, async lock => {
                if (!lock) { resolve(null); return; }
                await new Promise(release => resolve(release));
            }).catch(reject);
        });
    }
    return {load, save, open, recovery, claim};
}));
