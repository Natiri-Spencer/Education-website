const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('offline cache contains public assets and shell while private requests bypass it', async () => {
    const listeners = {}, records = new Map(), requests = [];
    const scope = 'https://school.test/educations/whiteboard/';
    const version = 'whiteboard-workspace-v2-20261115';
    const cache = {put: async (key, response) => records.set(String(key), response), match: async key => records.get(String(key))};
    const self = {registration: {scope}, addEventListener: (name, handler) => { listeners[name] = handler; }, skipWaiting: async () => {}};
    const context = {self, URL, Response, caches: {open: async () => cache, keys: async () => [version]},
        fetch: async (url, options) => {
            requests.push({url: String(url), options});
            if (String(url).endsWith('offline-assets/')) return Response.json({version, urls: ['/static/educations/editor.012345abcdef.js', '/static/educations/vendor/pdfjs/pdf.worker.mjs'], revisions: {}, shell: '/educations/whiteboard/offline/'});
            return new Response(String(url).endsWith('offline/') ? 'Public editor shell' : 'Public asset');
        }};
    vm.runInNewContext(fs.readFileSync('educations/static/educations/whiteboard_service_worker.js', 'utf8'), context);
    let installation; listeners.install({waitUntil: promise => { installation = promise; }}); await installation;
    assert(records.has('https://school.test/static/educations/editor.js'));
    assert(records.has(scope + 'offline-ready'));
    for (const request of requests.filter(r => !r.url.endsWith('offline-assets/'))) assert.equal(request.options.credentials, 'omit');
    let intercepted = false;
    listeners.fetch({request: {method: 'GET', url: 'https://school.test/learning/api/work/private/', mode: 'cors'}, respondWith() { intercepted = true; }});
    assert.equal(intercepted, false);
    context.fetch = async () => { throw Error('offline'); };
    let worker; listeners.fetch({request: {method: 'GET', url: scope + 'pdf.worker.mjs', mode: 'same-origin'}, respondWith(promise) { worker = promise; }});
    assert.equal(await (await worker).text(), 'Public asset');
    let reopened; listeners.fetch({request: {method: 'GET', url: scope, mode: 'navigate'}, respondWith(promise) { reopened = promise; }});
    assert.equal(await (await reopened).text(), 'Public editor shell');
});
test('an offline shell uses device scope with online access disabled', () => {
    const node = {textContent: JSON.stringify({scope: 'guest', offline: true, eligible: false})};
    const context = {document: {getElementById: () => node}, window: {},
        localStorage: {getItem: () => JSON.stringify({scope: 'u17', authenticated: true, eligible: true})}, sessionStorage: {getItem: () => null}};
    vm.runInNewContext(fs.readFileSync('educations/static/educations/whiteboard_offline_boot.js', 'utf8'), context);
    const config = JSON.parse(node.textContent);
    assert.equal(config.scope, 'u17'); assert.equal(config.eligible, false); assert.equal(config.offline, true);
});
