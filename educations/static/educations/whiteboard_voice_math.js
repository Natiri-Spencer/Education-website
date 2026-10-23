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
        divided: '/', over: '/', equals: '=', equal: '=', is: '=', less_than: '<', greater_than: '>', less_equal: '≤', greater_equal: '≥', not_equal: '≠', plus_minus: '±',
        pi: 'π', infinity: '∞', theta: 'θ', comma: ',', point: '.', half: '(1)/(2)', one_half: '(1)/(2)', one_third: '(1)/(3)', one_quarter: '(1)/(4)', two_thirds: '(2)/(3)', three_quarters: '(3)/(4)',
    };
    const allowedNames = new Set('abcdefghijklmnopqrstuvwxyz'.split(''));
    const functions = new Set(['sqrt', 'sin', 'cos', 'tan', 'log', 'exp', 'abs']);
    const fillers = new Set(['of', 'by', 'the', 'equation', 'expression', 'polynomial', 'linear', 'quadratic', 'cubic']);

    function normalisePhrases(value) {
        return String(value || '').toLowerCase()
            .replace(/[–—−]/g, ' minus ').replace(/[×·]/g, ' times ').replace(/÷/g, ' divided ')
            .replace(/\bex\b/g, ' x ').replace(/\bwhy\b/g, ' y ').replace(/\b(?:zed|zee)\b/g, ' z ')
            .replace(/\bless than or equal to\b/g, ' less_equal ').replace(/\bgreater than or equal to\b/g, ' greater_equal ').replace(/\bnot equal to\b/g, ' not_equal ')
            .replace(/\bless than\b/g, ' less_than ').replace(/\bgreater than\b/g, ' greater_than ')
            .replace(/\b(?:is\s+)?equal(?:s)?\s+to\b|\bis\s+equals\b|\bis\s+equal\b/g, ' equals ')
            .replace(/\braised to (?:the )?(?:power(?: of)? )?([a-z]+|\d+)(?: power)?\b/g, ' power $1 ')
            .replace(/\bto (?:the )?(?:power(?: of)? )?([a-z]+|\d+)(?: power)?\b/g, ' power $1 ')
            .replace(/\bexponent\b/g, ' power ')
            .replace(/\bone half\b/g, ' one_half ').replace(/\bone third\b/g, ' one_third ').replace(/\bone quarter\b/g, ' one_quarter ').replace(/\btwo thirds\b/g, ' two_thirds ').replace(/\bthree quarters\b/g, ' three_quarters ')
            .replace(/\bfirst\b/g, ' one ').replace(/\bsecond\b/g, ' two ').replace(/\bthird\b/g, ' three ').replace(/\bfourth\b/g, ' four ').replace(/\bfifth\b/g, ' five ')
            .replace(/\bsixth\b/g, ' six ').replace(/\bseventh\b/g, ' seven ').replace(/\beighth\b/g, ' eight ').replace(/\bninth\b/g, ' nine ').replace(/\btenth\b/g, ' ten ')
            .replace(/\bplus or minus\b|\bplus minus\b/g, ' plus_minus ')
            .replace(/\bopen (?:parenthesis|parentheses|bracket)\b/g, ' ( ').replace(/\bclose (?:parenthesis|parentheses|bracket)\b/g, ' ) ')
            .replace(/\bdivided by\b/g, ' divided ').replace(/\bmultiplied (?:by|with)\b/g, ' multiplied ')
            .replace(/\bsquare root of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' sqrt ( $1 ) ')
            .replace(/\b(?:sine|sin) of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' sin ( $1 ) ').replace(/\b(?:cosine|cos) of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' cos ( $1 ) ')
            .replace(/\b(?:tangent|tan) of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' tan ( $1 ) ').replace(/\b(?:logarithm|log) of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' log ( $1 ) ')
            .replace(/\babsolute value of\s+([a-z]+|\d+(?:\.\d+)?)/g, ' abs ( $1 ) ').replace(/\bdecimal\b/g, ' point ')
            .replace(/[^a-z0-9_πθ∞+*/=<>\u2264\u2265\u2260±().,^\-]+/g, ' ').replace(/\s+/g, ' ').trim();
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
        const tokens = normalised.match(/less_equal|greater_equal|not_equal|plus_minus|one_half|one_third|one_quarter|two_thirds|three_quarters|\d+(?:\.\d+)?|[a-z]+|[πθ∞]|[()+*/=<>\u2264\u2265\u2260±,^.-]/g) || [];
        const out = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i], number = readNumber(tokens, i);
            if (number) { out.push(number.value); i += number.used - 1; continue; }
            if (/^\d+(?:\.\d+)?$/.test(token) || /^[()+*/=<>\u2264\u2265\u2260±,^.-]$/.test(token) || token === 'π' || token === 'θ' || token === '∞') { out.push(token); continue; }
            if (aliases[token]) { out.push(aliases[token]); continue; }
            if (token === 'squared' || token === 'square') { if (!out.length) throw new Error('Say what should be squared.'); out.push('^(2)'); continue; }
            if (token === 'cubed' || token === 'cube') { if (!out.length) throw new Error('Say what should be cubed.'); out.push('^(3)'); continue; }
            if (token === 'power') {
                const exponent = readNumber(tokens, i + 1);
                if (!out.length || !exponent) throw new Error('Say a number after “power”.');
                out.push(`^(${exponent.value})`); i += exponent.used; continue;
            }
            if (functions.has(token)) { out.push(token); continue; }
            if (allowedNames.has(token)) { out.push(token); continue; }
            if (fillers.has(token)) continue;
            throw new Error(`“${token}” is not supported in voice equations yet.`);
        }
        const expression = out.join(' ')
            .replace(/\s+([),])/g, '$1').replace(/([(,^])\s+/g, '$1').replace(/\b(sqrt|sin|cos|tan|log|exp|abs)\s+\(/g, '$1(')
            .replace(/\b(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s+([a-zπθ])\b/g, '($1)/($2)$3').replace(/\)\s+([a-zπθ])\b/g, ')$1')
            .replace(/\b(\d+(?:\.\d+)?)\s+([a-zπθ])\b/g, '$1$2').replace(/([a-zπθ])\s+(?=[a-zπθ]\b)/g, '$1').replace(/\)\s+\(/g, ')(')
            .replace(/\s*([+*/=<>\u2264\u2265\u2260±-])\s*/g, ' $1 ').replace(/\s+/g, ' ').trim();
        if (!/[a-z0-9πθ∞]/i.test(expression)) throw new Error('The transcript does not contain an equation.');
        if (expression.length > 500) throw new Error('The spoken equation is too long.');
        return { transcript: String(transcript || '').trim(), expression };
    }

    return { parseSpokenMath, normalisePhrases };
}));
