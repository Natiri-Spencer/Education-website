(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.WhiteboardGraph = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const functions = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, abs: Math.abs, log: Math.log, ln: Math.log, exp: Math.exp };
    const constants = { pi: Math.PI, e: Math.E };

    function sourceExpression(value) {
        const superscripts = { '⁰':'0', '¹':'1', '²':'2', '³':'3', '⁴':'4', '⁵':'5', '⁶':'6', '⁷':'7', '⁸':'8', '⁹':'9', '⁺':'+', '⁻':'-' };
        let source = String(value || '').trim().toLowerCase().replace(/[−–—]/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/\*\*/g, '^').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, power => '^' + [...power].map(c => superscripts[c]).join(''));
        const assignment = source.match(/^(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+)$/);
        if (assignment) source = assignment[1].trim();
        if (!source) throw new Error('Enter a function such as y = x^2.');
        if (source.length > 200) throw new Error('The graph expression is too long.');
        return source;
    }

    function tokenize(value) {
        const source = sourceExpression(value), tokens = [];
        let index = 0;
        while (index < source.length) {
            const rest = source.slice(index), space = rest.match(/^\s+/);
            if (space) { index += space[0].length; continue; }
            const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
            if (number) { tokens.push({ type: 'number', value: Number(number[0]) }); index += number[0].length; continue; }
            const name = rest.match(/^[a-z]+/i);
            if (name) { tokens.push({ type: 'name', value: name[0].toLowerCase() }); index += name[0].length; continue; }
            if ('+-*/^(),'.includes(source[index])) { tokens.push({ type: source[index], value: source[index] }); index++; continue; }
            throw new Error(`Unsupported graph symbol “${source[index]}”.`);
        }
        // Recognize ordinary mathematical products (2x, 3(x+1), x(x-1))
        // while keeping identifiers and function calls strictly whitelisted.
        const expanded = [];
        for (const token of tokens) {
            const previous = expanded.at(-1);
            const endsValue = previous && (previous.type === 'number' || previous.type === ')' || previous.type === 'name' && (previous.value === 'x' || Object.prototype.hasOwnProperty.call(constants, previous.value)));
            const startsValue = ['number', 'name', '('].includes(token.type);
            if (endsValue && startsValue && !(previous.type === 'number' && token.type === 'number')) expanded.push({ type: '*', value: '*' });
            expanded.push(token);
        }
        expanded.push({ type: 'end' });
        return { source, tokens: expanded };
    }

    function compile(value) {
        const tokenized = tokenize(value), tokens = tokenized.tokens;
        let at = 0, nodes = 0;
        const peek = () => tokens[at];
        const take = type => { if (peek().type !== type) throw new Error(`Expected “${type}”.`); return tokens[at++]; };
        const node = value => { if (++nodes > 128) throw new Error('The graph expression is too complex.'); return value; };
        function primary() {
            const token = peek();
            if (token.type === 'number') { at++; return node({ type: 'number', value: token.value }); }
            if (token.type === 'name') {
                at++;
                if (token.value === 'x') return node({ type: 'x' });
                if (Object.prototype.hasOwnProperty.call(constants, token.value)) return node({ type: 'number', value: constants[token.value] });
                if (!Object.prototype.hasOwnProperty.call(functions, token.value)) throw new Error(`Function or variable “${token.value}” is not allowed.`);
                take('('); const argument = expression(); take(')');
                return node({ type: 'call', name: token.value, argument });
            }
            if (token.type === '(') { at++; const value = expression(); take(')'); return value; }
            throw new Error('Expected a number, x, or a supported function.');
        }
        function power() { const left = primary(); return peek().type === '^' ? (at++, node({ type: 'binary', operator: '^', left, right: unary() })) : left; }
        function unary() { if (peek().type === '+' || peek().type === '-') { const operator = tokens[at++].type; return node({ type: 'unary', operator, value: unary() }); } return power(); }
        function term() { let left = unary(); while (peek().type === '*' || peek().type === '/') { const operator = tokens[at++].type; left = node({ type: 'binary', operator, left, right: unary() }); } return left; }
        function expression() { let left = term(); while (peek().type === '+' || peek().type === '-') { const operator = tokens[at++].type; left = node({ type: 'binary', operator, left, right: term() }); } return left; }
        const ast = expression();
        if (peek().type !== 'end') throw new Error(`Unexpected “${peek().value}”. Check the function notation.`);
        function evaluateNode(current, x) {
            if (current.type === 'number') return current.value;
            if (current.type === 'x') return x;
            if (current.type === 'unary') return current.operator === '-' ? -evaluateNode(current.value, x) : evaluateNode(current.value, x);
            if (current.type === 'call') return functions[current.name](evaluateNode(current.argument, x));
            const left = evaluateNode(current.left, x), right = evaluateNode(current.right, x);
            if (current.operator === '+') return left + right;
            if (current.operator === '-') return left - right;
            if (current.operator === '*') return left * right;
            if (current.operator === '/') return left / right;
            return Math.pow(left, right);
        }
        return { expression: tokenized.source, evaluate(x) { return evaluateNode(ast, x); } };
    }

    function finiteRange(value, fallback, label) {
        const number = Number(value == null ? fallback : value);
        if (!Number.isFinite(number) || Math.abs(number) > 1e6) throw new Error(`${label} must be a finite number between -1,000,000 and 1,000,000.`);
        return number;
    }

    function plot(expression, options = {}) {
        const compiled = compile(expression);
        return sample(compiled, options);
    }

    function sample(compiled, options) {
        const xMin = finiteRange(options.xMin, -10, 'Minimum x'), xMax = finiteRange(options.xMax, 10, 'Maximum x');
        const yMin = finiteRange(options.yMin, -10, 'Minimum y'), yMax = finiteRange(options.yMax, 10, 'Maximum y');
        if (xMax <= xMin || yMax <= yMin) throw new Error('Each maximum value must be greater than its minimum value.');
        const count = Math.max(80, Math.min(1000, Math.round(Number(options.sampleCount) || 401)));
        const segments = []; let segment = [], previous = null;
        for (let i = 0; i < count; i++) {
            const x = xMin + (xMax - xMin) * i / (count - 1), y = compiled.evaluate(x);
            const visible = Number.isFinite(y) && y >= yMin - (yMax - yMin) * .2 && y <= yMax + (yMax - yMin) * .2;
            const jump = previous && Math.abs(y - previous[1]) > (yMax - yMin) * .75;
            if (!visible || jump) { if (segment.length > 1) segments.push(segment); segment = []; }
            if (visible) segment.push([x, y]);
            previous = visible ? [x, y] : null;
        }
        if (segment.length > 1) segments.push(segment);
        if (!segments.length) throw new Error('This function has no visible values in the selected range.');
        return { expression: compiled.expression, xMin, xMax, yMin, yMax, samples: segments };
    }

    // Interpolate in normalized coordinates to avoid unstable raw x powers.
    // Extra rows must agree with the polynomial: never silently change a student's values.
    function plotTable(rows, options = {}) {
        if (!Array.isArray(rows) || rows.length > 30) throw new Error('Use a table with at most 30 rows.');
        const points = [];
        for (const [index, row] of rows.entries()) {
            if (!Array.isArray(row) || row.length !== 2) throw new Error('Each table row needs an x and a y value.');
            const blank = v => v == null || String(v).trim() === '';
            if (blank(row[0]) && blank(row[1])) continue;
            if (blank(row[0]) || blank(row[1])) throw new Error(`Complete both x and y in row ${index + 1}, or clear the row.`);
            const parse = (v, label) => {
                if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(String(v).trim())) throw new Error(`${label} must be a number.`);
                return finiteRange(v, 0, label);
            };
            points.push([parse(row[0], `Row ${index + 1} x`), parse(row[1], `Row ${index + 1} y`)]);
        }
        points.sort((a, b) => a[0] - b[0]);
        if (points.length < 2) throw new Error('Enter at least two complete points for a linear graph, three for quadratic, or four for cubic.');
        if (points.some((p, i) => i && p[0] === points[i - 1][0])) throw new Error('Use a different x value in each row.');
        const requested = String(options.degree ?? 'auto');
        if (!['auto', '1', '2', '3'].includes(requested)) throw new Error('Choose automatic, linear, quadratic, or cubic.');
        if (requested !== 'auto' && points.length < Number(requested) + 1) throw new Error(`Enter at least ${Number(requested) + 1} complete points for this graph type.`);
        const centre = (points[0][0] + points.at(-1)[0]) / 2, scale = (points.at(-1)[0] - points[0][0]) / 2;
        const norm = x => (x - centre) / scale;
        const tolerance = 1e-7 * Math.max(1, ...points.map(p => Math.abs(p[1])));
        let fit;
        for (const degree of (requested === 'auto' ? [1, 2, 3] : [Number(requested)])) {
            if (points.length < degree + 1) continue;
            const nodes = Array.from({ length: degree + 1 }, (_, i) => points[Math.round(i * (points.length - 1) / degree)]);
            const xs = nodes.map(p => norm(p[0])), coeff = nodes.map(p => p[1]);
            let stable = true;
            for (let order = 1; order <= degree; order++) for (let i = degree; i >= order; i--) {
                const divisor = xs[i] - xs[i - order];
                if (Math.abs(divisor) < 1e-12) stable = false;
                coeff[i] = (coeff[i] - coeff[i - 1]) / divisor;
            }
            const evaluate = x => {
                let y = coeff[degree], z = norm(x);
                for (let i = degree - 1; i >= 0; i--) y = coeff[i] + (z - xs[i]) * y;
                return y;
            };
            if (stable && points.every(([x, y]) => Number.isFinite(evaluate(x)) && Math.abs(evaluate(x) - y) <= tolerance)) {
                fit = { degree, evaluate }; break;
            }
        }
        if (!fit) throw new Error('These points do not match the selected graph type. Check the table values or choose another type.');
        const ranges = tableRanges(points, fit.evaluate, options);
        const label = ['', 'Linear', 'Quadratic', 'Cubic'][fit.degree] + ' graph from table';
        return { ...sample({ expression: label, evaluate: fit.evaluate }, ranges), graphSource: 'table', tablePoints: points, tableDegree: requested, fittedDegree: fit.degree, tableFunction: '' };
    }

    function tableRanges(points, evaluate, options) {
        if (options.autoRange) {
            const scale = (points.at(-1)[0] - points[0][0]) / 2;
            const xPad = scale * .2, xMin = Math.max(-1e6, points[0][0] - xPad), xMax = Math.min(1e6, points.at(-1)[0] + xPad);
            const ys = Array.from({ length: 401 }, (_, i) => evaluate(xMin + (xMax - xMin) * i / 400)).filter(Number.isFinite);
            const low = Math.min(...ys, ...points.map(p => p[1])), high = Math.max(...ys, ...points.map(p => p[1]));
            const pad = Math.max((high - low) * .1, high === low ? Math.max(1, Math.abs(high) * .1) : 1e-6);
            const tidy = value => Number(value.toPrecision(10));
            return { ...options, xMin: tidy(xMin), xMax: tidy(xMax), yMin: tidy(Math.max(-1e6, low - pad)), yMax: tidy(Math.min(1e6, high + pad)) };
        }
        return options;
    }

    function fillTable(expression, rows) {
        const compiled = compile(expression), seen = new Set();
        if (!Array.isArray(rows) || rows.length > 30) throw new Error('Use a table with at most 30 rows.');
        const result = rows.map((row, i) => {
            if (!Array.isArray(row) || row.length !== 2) throw new Error('Each table row needs an x and a y value.');
            const value = String(row[0] ?? '').trim();
            if (!value) {
                if (String(row[1] ?? '').trim()) throw new Error(`Enter an x value in row ${i + 1}, or clear the row.`);
                return ['', ''];
            }
            if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) throw new Error(`Row ${i + 1} x must be a number.`);
            const x = finiteRange(value, 0, `Row ${i + 1} x`);
            if (seen.has(x)) throw new Error('Use a different x value in each row.');
            seen.add(x);
            const y = compiled.evaluate(x);
            if (!Number.isFinite(y)) throw new Error(`The function is undefined at x = ${x} (row ${i + 1}). Choose another x value.`);
            finiteRange(y, 0, `Row ${i + 1} y`);
            return [x, y];
        });
        if (seen.size < 2) throw new Error('Enter at least two different x values to fill the table and draw the graph.');
        return result;
    }

    function plotFunctionTable(expression, rows, options = {}) {
        const computed = fillTable(expression, rows);
        for (let i = 0; i < rows.length; i++) {
            if (computed[i][0] === '') continue;
            if (rows[i][1] == null || String(rows[i][1]).trim() === '' || !Number.isFinite(Number(rows[i][1])) || Math.abs(Number(rows[i][1]) - computed[i][1]) > 1e-9 * Math.max(1, Math.abs(computed[i][1]))) {
                throw new Error('The table needs updating. Click Fill table from function again.');
            }
        }
        const points = computed.filter(row => row[0] !== '').sort((a,b) => a[0]-b[0]);
        const compiled = compile(expression);
        return { ...sample({ expression: 'y = ' + compiled.expression, evaluate: compiled.evaluate }, tableRanges(points, compiled.evaluate, options)), graphSource: 'table', tableFunction: compiled.expression, tablePoints: points, tableDegree: 'auto' };
    }

    return { compile, plot, plotTable, fillTable, plotFunctionTable, sourceExpression };
}));
