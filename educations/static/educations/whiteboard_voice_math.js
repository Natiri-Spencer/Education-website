(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.WhiteboardVoiceMath = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const units = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
    const tens = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
    const aliases = {
        plus: '+', add: '+', added: '+', minus: '-', negative: '-', subtract: '-', times: '*', multiplied: '*', multiply: '*',
        divided: '/', over: '/', equals: '=', equal: '=', 'less_than': '<', 'greater_than': '>',
        'less_equal': '≤', 'greater_equal': '≥', 'not_equal': '≠', 'plus_minus': '±',
        pi: 'π', infinity: '∞', theta: 'θ', comma: ',', point: '.',
    };
    const allowedNames = new Set(['x', 'y', 'z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w']);

    function normalisePhrases(value) {
        return String(value || '').toLowerCase()
            .replace(/[–—−]/g, ' minus ').replace(/[×·]/g, ' times ').replace(/÷/g, ' divided ')
            .replace(/\bto the power of\b|\braised to the power of\b|\braised to\b/g, ' power ')
            .replace(/\bless than or equal to\b/g, ' less_equal ')
            .replace(/\bgreater than or equal to\b/g, ' greater_equal ')
            .replace(/\bnot equal to\b/g, ' not_equal ')
            .replace(/\bless than\b/g, ' less_than ')
            .replace(/\bgreater than\b/g, ' greater_than ')
            .replace(/\bplus or minus\b|\bplus minus\b/g, ' plus_minus ')
            .replace(/\bopen (?:parenthesis|parentheses|bracket)\b/g, ' ( ')
            .replace(/\bclose (?:parenthesis|parentheses|bracket)\b/g, ' ) ')
            .replace(/\bdivided by\b/g, ' divided ')
            .replace(/\bmultiplied by\b/g, ' multiplied ')
            .replace(/\bsquare root of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' sqrt ( $1 ) ')
            .replace(/\b(?:sine|sin) of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' sin ( $1 ) ')
            .replace(/\b(?:cosine|cos) of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' cos ( $1 ) ')
            .replace(/\b(?:tangent|tan) of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' tan ( $1 ) ')
            .replace(/\b(?:logarithm|log) of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' log ( $1 ) ')
            .replace(/\b(?:absolute value) of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' abs ( $1 ) ')
            .replace(/[^a-z0-9_πθ∞+*/=<>≤≥≠±().,^\-]+/g, ' ')
            .replace(/\s+/g, ' ').trim();
    }

    function readNumber(tokens, start) {
        let total = 0, group = 0, used = 0, decimal = '';
        for (let i = start; i < tokens.length; i++) {
            const word = tokens[i];
            if (Object.prototype.hasOwnProperty.call(units, word)) { group += units[word]; used++; continue; }
            if (Object.prototype.hasOwnProperty.call(tens, word)) { group += tens[word]; used++; continue; }
            if (word === 'hundred' && used) { group *= 100; used++; continue; }
            if (word === 'thousand' && used) { total += group * 1000; group = 0; used++; continue; }
            if (word === 'and' && used) { used++; continue; }
            if (word === 'point' && used) {
                let j = i + 1;
                while (j < tokens.length && Object.prototype.hasOwnProperty.call(units, tokens[j])) { decimal += units[tokens[j]]; j++; }
                if (decimal) return { value: `${total + group}.${decimal}`, used: j - start };
            }
            break;
        }
        return used ? { value: String(total + group), used } : null;
    }

    function parseSpokenMath(transcript) {
        const normalised = normalisePhrases(transcript);
        if (!normalised) throw new Error('Say or type an equation first.');
        const tokens = normalised.match(/less_equal|greater_equal|not_equal|plus_minus|\d+(?:\.\d+)?|[a-z]+|[πθ∞]|[()+*/=<>≤≥≠±,^.-]/g) || [];
        const out = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const number = readNumber(tokens, i);
            if (number) { out.push(number.value); i += number.used - 1; continue; }
            if (/^\d+(?:\.\d+)?$/.test(token) || /^[()+*/=<>≤≥≠±,^.-]$/.test(token) || token === 'π' || token === 'θ' || token === '∞') { out.push(token); continue; }
            if (aliases[token]) { out.push(aliases[token]); continue; }
            if (token === 'squared' || token === 'square') { if (!out.length) throw new Error('Say what should be squared.'); out.push('^(2)'); continue; }
            if (token === 'cubed' || token === 'cube') { if (!out.length) throw new Error('Say what should be cubed.'); out.push('^(3)'); continue; }
            if (token === 'power') { out.push('^'); continue; }
            if (['sqrt', 'sin', 'cos', 'tan', 'log', 'exp', 'abs'].includes(token)) { out.push(token); continue; }
            if (allowedNames.has(token)) { out.push(token); continue; }
            if (token === 'of' || token === 'by' || token === 'the') continue;
            throw new Error(`“${token}” is not supported in voice equations yet.`);
        }
        let expression = out.join(' ')
            .replace(/\s+([),])/g, '$1').replace(/([(,^])\s+/g, '$1')
            .replace(/\b(sqrt|sin|cos|tan|log|exp|abs)\s+\(/g, '$1(')
            .replace(/\^\s*([a-zπθ]|\d+(?:\.\d+)?)/g, '^($1)')
            .replace(/\b(\d+(?:\.\d+)?)\s+([a-zπθ])\b/g, '$1$2')
            .replace(/\b([a-zπθ])\s+([a-zπθ])\b/g, '$1$2')
            .replace(/\s*([+*/=<>≤≥≠±-])\s*/g, ' $1 ')
            .replace(/\s+/g, ' ').trim();
        if (!/[a-z0-9πθ∞]/i.test(expression)) throw new Error('The transcript does not contain an equation.');
        if (expression.length > 500) throw new Error('The spoken equation is too long.');
        return { transcript: String(transcript || '').trim(), expression };
    }

    return { parseSpokenMath, normalisePhrases };
}));
