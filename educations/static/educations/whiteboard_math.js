/* MathJax and all font/TeX resources are served by this website, never a CDN. */
(() => {
    'use strict';
    const source = document.currentScript.src, base = new URL('vendor/mathjax/', source).href;
    window.MathJax = {
        loader: { paths: { mathjax: base, fonts: base+'fonts', 'mathjax-newcm': base+'fonts' } },
        startup: { typeset: false },
        options: { enableMenu: false, enableExplorer: false, enableEnrichment: false, enableSpeech: false, enableBraille: false,
            menuOptions: { settings: { enrich: false, speech: false, braille: false, assistiveMml: false } } },
        tex: { packages: ['base', 'ams', 'newcommand', 'noundefined'], maxMacros: 500, maxBuffer: 10000 },
        svg: { fontCache: 'none', dynamicPrefix: base+'fonts/svg/dynamic', useXlink: false },
    };
    const cache = new Map(); let serial = Promise.resolve();
    const cacheKey=(text,font,latex)=>JSON.stringify([text,font,latex||null]);
    window.WhiteboardMath = {
        get(text, font, latex=null) { return cache.get(cacheKey(text,font,latex)); },
        prepare(text, font = 32, latex=null) {
            const key = cacheKey(text,font,latex);
            if (cache.has(key)) return cache.get(key).promise;
            const entry = { font };
            entry.promise = serial = serial.catch(() => {}).then(async () => {
                try {
                    // Keep the source with this particular equation. A previous
                    // model reading must never override manually edited text.
                    window.WhiteboardTypesetting.toLatex(latex||text);
                    const tex = latex || window.WhiteboardTypesetting.toLatex(text);
                    entry.html = window.katex.renderToString(tex, { displayMode: true, throwOnError: true, trust: false, maxExpand: 500, maxSize: 20 });
                    if (!window.MathJax.startup?.promise) throw new Error('Equation renderer is loading. Try again in a moment.');
                    let timeout;
                    try { await Promise.race([window.MathJax.startup.promise,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Equation renderer could not start. Reload the whiteboard to retry.')),8000);})]); }
                    finally { clearTimeout(timeout); }
                    window.MathJax.texReset();
                    const result = await window.MathJax.tex2svgPromise(tex, { display: true });
                    if (result.querySelector('[data-mml-node="merror"]')) throw new Error('Check the equation syntax, brackets and command names.');
                    const svg = result.querySelector('svg');
                    if (!svg) throw new Error('Could not format this equation.');
                    const [x,y,w,h] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
                    if (![x,y,w,h].every(Number.isFinite) || w <= 0 || h <= 0) throw new Error('Empty equation.');
                    // MathJax SVG coordinates are 1000 units per em. Every glyph
                    // is an inline path so the same output works in PNG exports.
                    entry.w = w*font/1000+12; entry.h = h*font/1000+12;
                    entry.viewBox = [x,y,w,h].join(' '); entry.markup = svg.innerHTML;
                    entry.ready = true;
                } catch (error) { entry.error = error.message; }
                return entry;
            });
            cache.set(key,entry);
            // Bound cached SVG, including imported boards with many equations.
            if (cache.size > 250) cache.delete(cache.keys().next().value);
            return entry.promise;
        },
    };
})();
