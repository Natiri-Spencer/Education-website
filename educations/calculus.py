"""Normalize bounded classroom calculus notation into the safe math grammar."""
import re

BOUND = r"(?:\([^()]+\)|\{[^{}]+\}|[+-]?(?:\d+(?:\.\d+)?|[A-Za-z]+))"


def normalize_calculus(text):
    text = text.strip().replace("\u2033", "''").replace("\u2032", "'")
    # Prime notation for a named function of one variable.
    text = re.sub(r"\b([A-Za-z])('{1,3})\(\s*([A-Za-z])\s*\)",
                  lambda m: f"diff({m[1]}({m[3]}),{m[3]},{len(m[2])})", text)
    integral = re.fullmatch(r"\u222b\s*(?:_\s*("+BOUND+r")\s*\^\s*("+BOUND+r"))?\s*(.+?)\s*d\s*([A-Za-z])", text)
    if integral:
        low, high, body, variable = integral.groups()
        strip = lambda value: value[1:-1] if value[0] in "({" else value
        return f"integral({body},{variable},{strip(low)},{strip(high)})" if low else f"integral({body},{variable})"
    # The same mark and order must occur above and below a derivative fraction.
    fraction_operator = re.fullmatch(r"\(\s*(d|\u2202)\s*(?:\^\(?([1-9][0-9]?)\)?)?\s*\)\s*/\s*\(\s*\1\s*([A-Za-z])\s*(?:\^\(?([1-9][0-9]?)\)?)?\s*\)\s*(.+)", text)
    if fraction_operator:
        mark, top_order, variable, bottom_order, body = fraction_operator.groups()
        if (top_order or "1") != (bottom_order or "1"):
            raise ValueError("Derivative orders must match")
        return f"{'partial' if mark == chr(0x2202) else 'diff'}({body},{variable},{top_order or 1})"
    derivative = re.fullmatch(r"\(?\s*(d|\u2202)\s*(?:\^\(?([1-9][0-9]?)\)?)?\s*([A-Za-z](?:\([^()]*\))?)\s*\)?\s*/\s*\(?\s*\1\s*([A-Za-z])\s*(?:\^\(?([1-9][0-9]?)\)?)?\s*\)?", text)
    if derivative:
        mark, top_order, body, variable, bottom_order = derivative.groups()
        if (top_order or "1") != (bottom_order or "1"):
            raise ValueError("Derivative orders must match")
        return f"{'partial' if mark == chr(0x2202) else 'diff'}({body},{variable},{top_order or 1})"
    operator = re.fullmatch(r"(d|\u2202)\s*/\s*\1\s*([A-Za-z])\s*\((.+)\)", text)
    if operator:
        mark, variable, body = operator.groups()
        return f"{'partial' if mark == chr(0x2202) else 'diff'}({body},{variable})"
    return text
