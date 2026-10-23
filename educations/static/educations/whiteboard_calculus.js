(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.WhiteboardCalculus = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    function normalizeSide(value) {
        let text = String(value).trim().replace(/\u2033/g,"''").replace(/\u2032/g,"'");
        text = text.replace(/\b([A-Za-z])('{1,3})\(\s*([A-Za-z])\s*\)/g, (_, f, primes, x) => `diff(${f}(${x}),${x},${primes.length})`);
        const bound = '(?:\\([^()]+\\)|\\{[^{}]+\\}|[+-]?(?:\\d+(?:\\.\\d+)?|[A-Za-z]+))';
        const integral = text.match(new RegExp('^\u222b\\s*(?:_\\s*('+bound+')\\s*\\^\\s*('+bound+'))?\\s*(.+?)\\s*d\\s*([A-Za-z])$'));
        const strip = value => /^[({]/.test(value) ? value.slice(1,-1) : value;
        if (integral) return integral[1] ? `integral(${integral[3]},${integral[4]},${strip(integral[1])},${strip(integral[2])})` : `integral(${integral[3]},${integral[4]})`;
        const fractionOperator = text.match(/^\(\s*(d|\u2202)\s*(?:\^\(?([1-9][0-9]?)\)?)?\s*\)\s*\/\s*\(\s*\1\s*([A-Za-z])\s*(?:\^\(?([1-9][0-9]?)\)?)?\s*\)\s*(.+)$/);
        if (fractionOperator) {
            if ((fractionOperator[2]||'1') !== (fractionOperator[4]||'1')) throw new Error('Derivative orders must match.');
            return `${fractionOperator[1]==='d'?'diff':'partial'}(${fractionOperator[5]},${fractionOperator[3]},${fractionOperator[2]||1})`;
        }
        const derivative = text.match(/^\(?\s*(d|\u2202)\s*(?:\^\(?([1-9][0-9]?)\)?)?\s*([A-Za-z](?:\([^()]*\))?)\s*\)?\s*\/\s*\(?\s*\1\s*([A-Za-z])\s*(?:\^\(?([1-9][0-9]?)\)?)?\s*\)?$/);
        if (derivative) {
            if ((derivative[2]||'1') !== (derivative[5]||'1')) throw new Error('Derivative orders must match.');
            return `${derivative[1]==='d'?'diff':'partial'}(${derivative[3]},${derivative[4]},${derivative[2]||1})`;
        }
        const operator = text.match(/^(d|\u2202)\s*\/\s*\1\s*([A-Za-z])\s*\((.+)\)$/);
        if (operator) return `${operator[1]==='d'?'diff':'partial'}(${operator[3]},${operator[2]})`;
        return text;
    }
    return { normalize(value) { return String(value).split('=').map(normalizeSide).join(' = '); } };
}));
