(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.WhiteboardGraph = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const functions = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, abs: Math.abs, log: Math.log, ln: Math.log, exp: Math.exp };
    const constants = { pi: Math.PI, e: Math.E };

    function sourceExpression(value) {
        let source = String(value || '').trim().toLowerCase().replace(/[−–—]/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi');
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
        tokens.push({ type: 'end' });
        return { source, tokens };
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
                if (!functions[token.value]) throw new Error(`Function or variable “${token.value}” is not allowed.`);
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
        if (peek().type !== 'end') throw new Error(`Unexpected “${peek().value}”. Use * for multiplication.`);
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

    return { compile, plot, sourceExpression };
}));
