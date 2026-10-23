(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.WhiteboardTypesetting = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const C = typeof module === 'object' && module.exports ? require('./whiteboard_calculus.js') : globalThis.WhiteboardCalculus;
    // A small, non-executable school-maths notation parser. Rendering uses SVG
    // glyphs and bars so fractions also survive PNG/SVG exports without a CDN.
    function parse(value) {
        const input = String(value).slice(0, 5000).replace(/\s*([\^_/])\s*/g,'$1'); let at = 0, count = 0;
        function sequence(end, depth) {
            const children = [];
            while (at < input.length && !(end && end.includes(input[at])) && count++ < 5000) {
                if (/\s/.test(input[at])) { at++; continue; }
                let base = primary(depth);
                while (at < input.length && /[\^_/]/.test(input[at])) {
                    const op = input[at++], operand = primary(depth + 1);
                    base = op === '/' ? { type: 'fraction', top: ungroup(base), bottom: ungroup(operand) } : { type: 'script', base, value: ungroup(operand), sub: op === '_' };
                }
                children.push(base);
            }
            return { type: 'row', children };
        }
        function ungroup(n) { return n.type === 'group' ? n.value : n; }
        function primary(depth) {
            while (/\s/.test(input[at] || '') && at < input.length) at++;
            const call = depth < 12 && input.slice(at).match(/^(integral|int|diff|partial)\(/);
            if (call) {
                at += call[0].length;
                const args = [];
                while (at < input.length && input[at] !== ')') {
                    args.push(sequence(',)', depth + 1));
                    if (input[at] !== ',') break;
                    at++;
                }
                if (input[at] !== ')') throw new Error('Close the calculus expression with a bracket.');
                at++;
                return {type:'calculus', name:call[1], args};
            }
            if (depth < 12 && input[at] === '(') {
                at++; const value = sequence(')', depth + 1); if (input[at] === ')') at++;
                return { type: 'group', value };
            }
            if (depth < 12 && (input.slice(at, at + 5) === 'sqrt(' || input.slice(at, at + 2) === '√(')) {
                at += input[at] === '√' ? 2 : 5; const value = sequence(')', depth + 1); if (input[at] === ')') at++;
                return { type: 'root', value };
            }
            const char = input[at++] || '';
            // Number runs stay together, including decimals. Variables are
            // separate atoms so x^2 attaches to x, not an entire equation.
            let text = char;
            if (/[0-9]/.test(char)) while (at < input.length && /[0-9.]/.test(input[at])) text += input[at++];
            return { type: 'text', text, operator: /^[+−\-=×÷<>≤≥≠±]$/.test(char) };
        }
        return sequence(null, 0);
    }
    const textWidth = (text, font) => Array.from(text).reduce((w, c) => w + (/\s/.test(c) ? .32 : /[ilI1.,:;!'|]/.test(c) ? .3 : /[MW@%]/.test(c) ? .9 : .6) * font, 0);
    function mathLayout(value, fontSize = 32) {
        function layout(node, font) {
            if (node.type === 'calculus') {
                const args = node.args, variable = plain(args[1]), order = args[2] ? plain(args[2]) : '1';
                if (!args[0] || !variable) return layout({type:'text',text:node.name+'(?)'},font);
                if (node.name === 'integral' || node.name === 'int') {
                    const symbol = {type:'text', text:'\u222b'};
                    const bounded = args.length === 4 ? {type:'script',base:{type:'script',base:symbol,value:args[2],sub:true},value:args[3],sub:false} : symbol;
                    return layout({type:'row',children:[bounded,args[0],{type:'text',text:' d'+variable}]},font);
                }
                const mark = node.name === 'partial' ? '\u2202' : 'd';
                const power = text => order === '1' ? {type:'text',text} : {type:'script',base:{type:'text',text},value:{type:'text',text:order},sub:false};
                return layout({type:'row',children:[{type:'fraction',top:power(mark),bottom:{type:'row',children:[{type:'text',text:mark},power(variable)]}},{type:'group',value:args[0]}]},font);
            }
            if (node.type === 'text') {
                const pad = node.operator ? font * .24 : 0;
                return { w: (node.operator ? font*.86 : textWidth(node.text, font)) + pad*2, up: font*.85, down: font*.22, runs: [{ kind: 'text', text: node.text, x: pad, y: 0, fontSize: font }] };
            }
            if (node.type === 'row') {
                const parts = node.children.map(n => layout(n, font)); let x = 0, runs = [];
                for (const part of parts) { runs.push(...shift(part.runs, x, 0)); x += part.w; }
                return { w: x, up: Math.max(font*.85, ...parts.map(p => p.up)), down: Math.max(font*.22, ...parts.map(p => p.down)), runs };
            }
            if (node.type === 'group') {
                const inner = layout(node.value, font), pad = font*.35;
                return { ...inner, w: inner.w + pad*2, runs: [{ kind:'text', text:'(', x:0, y:0, fontSize:font }, ...shift(inner.runs,pad,0), { kind:'text', text:')', x:inner.w+pad, y:0, fontSize:font }] };
            }
            if (node.type === 'fraction') {
                const top = layout(node.top, font*.82), bottom = layout(node.bottom, font*.82), w = Math.max(top.w,bottom.w)+font*.35;
                const axis = -font*.25, gap = font*.16, ty = axis-gap-top.down, by = axis+gap+bottom.up;
                return { w, up: -ty+top.up, down: by+bottom.down, runs: [...shift(top.runs,(w-top.w)/2,ty), ...shift(bottom.runs,(w-bottom.w)/2,by), { kind:'bar',x:0,y:axis,w }] };
            }
            if (node.type === 'script') {
                const base = layout(node.base,font), script = layout(node.value,font*.66), y = node.sub ? font*.35 : -Math.max(font*.55,base.up*.65);
                return { w:base.w+script.w, up:Math.max(base.up,script.up-y), down:Math.max(base.down,script.down+y), runs:[...base.runs,...shift(script.runs,base.w,y)] };
            }
            const inner = layout(node.value,font), pad = font*.7;
            return { w:inner.w+pad, up:inner.up+font*.14, down:inner.down, runs:[{kind:'text',text:'√',x:0,y:0,fontSize:font},...shift(inner.runs,pad,0),{kind:'bar',x:pad,y:-inner.up-font*.08,w:inner.w}] };
        }
        function shift(runs,x,y) { return runs.map(r => ({...r,x:r.x+x,y:r.y+y})); }
        let tree;
        try { tree = parse(C.normalize(value)); }
        catch (_) { tree = {type:'text',text:String(value).slice(0,5000)}; }
        const result = layout(tree,Math.max(10,Math.min(120,fontSize)));
        return { w:result.w+8, h:result.up+result.down+8, runs:shift(result.runs,4,result.up+4) };
    }
    function textLayout(text, fontSize, width = Infinity) {
        const lines = [];
        for (const line of String(text).split('\n')) {
            let current = '';
            for (const word of line.trim().split(/\s+/)) {
                const candidate = current ? current+' '+word : word;
                if (current && textWidth(candidate,fontSize) > width) { lines.push(current); current=word; }
                else current=candidate;
            }
            lines.push(current);
        }
        return { lines, w:Math.max(0,...lines.map(l=>textWidth(l,fontSize)))+12, h:lines.length*fontSize*1.5+8 };
    }
    // Only notation is accepted: TeX cannot load extensions, links or macros.
    function toLatex(value) {
        const input = String(value).trim();
        if (!input || input.length > 5000) throw new Error('Enter an equation (up to 5000 characters).');
        if (/\\(?:require|href|url|html\w*|class|cssId|style|includegraphics|def|gdef|edef|xdef|let|newcommand|renewcommand|providecommand|csname|catcode|input|write|unicode)\b/i.test(input)) throw new Error('Use mathematical notation without links, imports or macro definitions.');
        if (input.includes('\\')) return input;
        const symbols = { 'π':'\\pi ', 'θ':'\\theta ', 'α':'\\alpha ', 'β':'\\beta ', 'γ':'\\gamma ', 'δ':'\\delta ', 'λ':'\\lambda ', 'μ':'\\mu ', 'σ':'\\sigma ', 'ω':'\\omega ', '∞':'\\infty ', '∫':'\\int ', '∑':'\\sum ', '∏':'\\prod ', '±':'\\pm ', '×':'\\times ', '÷':'\\div ', '≤':'\\le ', '≥':'\\ge ', '≠':'\\ne ', '≈':'\\approx ', '∈':'\\in ', '∉':'\\notin ', '∪':'\\cup ', '∩':'\\cap ', '∂':'\\partial ', '∇':'\\nabla ', '−':'-', '²':'^{2}', '³':'^{3}', '°':'^{\\circ}' };
        function convert(n) {
            if (n.type === 'calculus') {
                const args = n.args, integral = ['integral','int'].includes(n.name), variable = plain(args[1]);
                if (!(integral ? [2,4] : [2,3]).includes(args.length) || !/^[A-Za-z][A-Za-z0-9]*$/.test(variable)) throw new Error('Use integral(expression, variable[, lower, upper]) or diff/partial(expression, variable[, order]).');
                const body = convert(args[0]), v = convert(args[1]);
                if (integral) return '\\int'+(args.length===4?'_{'+convert(args[2])+'}^{'+convert(args[3])+'}':'')+' '+body+'\\,\\mathrm{d}'+v;
                const order = args.length===3 ? plain(args[2]) : '1';
                if (!/^(?:[1-9]|10)$/.test(order)) throw new Error('Derivative order must be an integer from 1 to 10.');
                const mark = n.name==='partial'?'\\partial ':'\\mathrm{d}', power = order==='1'?'':'^{'+order+'}';
                return '\\frac{'+mark+power+'}{'+mark+v+power+'}\\left('+body+'\\right)';
            }
            if (n.type === 'row') return n.children.map(convert).join('');
            if (n.type === 'group') return '\\left('+convert(n.value)+'\\right)';
            if (n.type === 'fraction') return '\\frac{'+convert(n.top)+'}{'+convert(n.bottom)+'}';
            if (n.type === 'script') return '{'+convert(n.base)+'}'+(n.sub?'_':'^')+'{'+convert(n.value)+'}';
            if (n.type === 'root') return '\\sqrt{'+convert(n.value)+'}';
            const calculusSymbols = {'\u222c':'\\iint ','\u222d':'\\iiint ','\u222e':'\\oint ','\u2032':'^{\\prime}','\u2033':'^{\\prime\\prime}'};
            return Array.from(n.text).map(c => calculusSymbols[c] || symbols[c] || (/[{}%&#$]/.test(c)?'\\'+c:c)).join('');
        }
        return convert(parse(C.normalize(input)));
    }
    function plain(node) {
        if (!node) return '';
        return node.type==='text' ? node.text : node.type==='row' ? node.children.map(plain).join('') : '';
    }
    return { mathLayout, textLayout, textWidth, toLatex };
}));
