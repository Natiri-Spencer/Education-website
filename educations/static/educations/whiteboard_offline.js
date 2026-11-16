(() => {
    'use strict';
    const label = document.getElementById('wb-offline-state');
    const app = document.getElementById('whiteboard-app');
    let appReady = false, documentsReady = app.dataset.documentsReady !== 'false', documentsPending = app.dataset.documentsPending === 'true';
    function show() {
        label.textContent = appReady ? documentsReady ? 'Available offline on this device' : documentsPending ? 'Editor ready offline · original files still downloading' : 'Editor ready offline · reconnect or restore missing original files' : 'Preparing offline access…';
    }
    window.addEventListener('whiteboard-documents-ready', event => { documentsReady = event.detail.ready; documentsPending = event.detail.pending; show(); });
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
        label.textContent = 'Offline reopening requires a secure connection and an updated browser.';
        return;
    }
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'WHITEBOARD_OFFLINE_READY') { appReady = true; show(); }
    });
    navigator.serviceWorker.register('service-worker.js', {scope: './', updateViaCache: 'none'}).then(async registration => {
        const ready = await navigator.serviceWorker.ready;
        ready.active?.postMessage({type: 'WHITEBOARD_OFFLINE_STATUS'});
        registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            worker?.addEventListener('statechange', () => { if (worker.state === 'redundant' && !appReady) label.textContent = 'Offline download interrupted. Reopen this page while connected to retry.'; });
        });
    }).catch(() => { label.textContent = 'Offline access could not be prepared. Reopen while connected to retry.'; });
    document.addEventListener('pointerdown', () => { navigator.storage?.persist?.().catch(() => {}); }, {once: true});
})();
