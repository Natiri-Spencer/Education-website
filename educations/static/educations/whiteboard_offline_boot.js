/* Cacheable HTML contains a public shell. Offline scope never grants server access. */
(() => {
    'use strict';
    const node = document.getElementById('academy-config');
    const config = JSON.parse(node.textContent);
    try {
        if (config.offline) {
            let remembered;
            try { remembered = localStorage.getItem('academy-whiteboard-device-scope'); } catch (_) {}
            const previous = JSON.parse(remembered || sessionStorage.getItem('whiteboard-session-scope'));
            if (previous?.scope) Object.assign(config, previous, {eligible: false, offline: true});
            node.textContent = JSON.stringify(config);
        } else {
            sessionStorage.setItem('whiteboard-session-scope', JSON.stringify(config));
        }
    } catch (_) { /* Guest device storage is available when session storage is blocked. */ }
    window.WhiteboardOfflineShell = !!config.offline;
})();
