'use strict';
const VERSION = 'whiteboard-workspace-v2-20261115';
const scopeURL = new URL(self.registration.scope);
const shellURL = new URL('offline/', scopeURL).href;
const normalized = request => {
    const url = new URL(typeof request === 'string' ? request : request.url);
    url.search = '';
    // Django's fingerprinted URLs and local module imports share one cached copy.
    if (url.pathname.startsWith('/static/')) url.pathname = url.pathname.replace(/\.[a-f0-9]{12}(\.[a-z0-9]+)$/i, '$1');
    return url.href;
};

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const response = await fetch(new URL('offline-assets/', scopeURL), {cache: 'no-store'});
        if (!response.ok) throw Error('Offline asset list unavailable');
        const manifest = await response.json(), cache = await caches.open(VERSION);
        if (manifest.version !== VERSION) throw Error('A newer editor is being deployed. Retry offline preparation.');
        let previousCache, previousRevisions = {};
        for (const name of (await caches.keys()).reverse()) {
            if (!name.startsWith('whiteboard-workspace-') || name === VERSION) continue;
            const candidate = await caches.open(name), saved = await candidate.match(new URL('offline-revisions', scopeURL));
            if (saved) { previousCache = candidate; previousRevisions = await saved.json(); break; }
        }
        const urls = [...manifest.urls, manifest.shell];
        // Keep network and memory use bounded on basic phones.
        let index = 0;
        async function downloadNext() {
            while (index < urls.length) {
                const asset = urls[index++], url = new URL(asset, scopeURL);
                if (url.origin !== scopeURL.origin) throw Error('Offline assets must be first-party');
                const reusable = manifest.revisions[asset] && manifest.revisions[asset] === previousRevisions[asset];
                const old = reusable && await previousCache?.match(normalized(url.href));
                const result = old || await fetch(url.href, {cache: 'reload', credentials: 'omit'});
                if (!result.ok) throw Error('Offline asset unavailable');
                await cache.put(normalized(url.href), result);
            }
        }
        await Promise.all(Array.from({length: 4}, downloadNext));
        await cache.put(new URL('offline-revisions', scopeURL), new Response(JSON.stringify(manifest.revisions)));
        await cache.put(new URL('offline-ready', scopeURL), new Response(VERSION));
        await self.skipWaiting();
    })());
});
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        for (const name of await caches.keys()) if (name.startsWith('whiteboard-workspace-') && name !== VERSION) await caches.delete(name);
        await self.clients.claim();
        for (const client of await self.clients.matchAll()) client.postMessage({type: 'WHITEBOARD_OFFLINE_READY'});
    })());
});
self.addEventListener('message', event => {
    if (event.data?.type !== 'WHITEBOARD_OFFLINE_STATUS') return;
    event.waitUntil((async () => {
        const cache = await caches.open(VERSION);
        if (await cache.match(new URL('offline-ready', scopeURL))) event.source?.postMessage({type: 'WHITEBOARD_OFFLINE_READY'});
    })());
});
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== scopeURL.origin) return;
    if (event.request.mode === 'navigate' && url.pathname === scopeURL.pathname) {
        event.respondWith((async () => {
            try {
                const response = await fetch(event.request);
                if (response.ok) return response;
            } catch (_) { /* Open the public shell with this tab's scoped drafts. */ }
            return (await caches.open(VERSION)).match(shellURL) || Response.error();
        })());
    } else if (url.pathname === new URL('pdf.worker.mjs', scopeURL).pathname) {
        event.respondWith((async () => {
            const cache = await caches.open(VERSION);
            return (await cache.match(new URL('/static/educations/vendor/pdfjs/pdf.worker.mjs', scopeURL).href)) || fetch(event.request);
        })());
    } else if (url.pathname.startsWith('/static/')) {
        event.respondWith((async () => {
            const cache = await caches.open(VERSION), cached = await cache.match(normalized(event.request));
            if (url.search) {
                try { const response = await fetch(event.request); if (response.ok) return response; } catch (_) {}
            }
            return cached || fetch(event.request);
        })());
    }
});
