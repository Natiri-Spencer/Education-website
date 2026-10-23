"""Parse a small math grammar without evaluating user supplied Python."""
import ast
import re
from .calculus import normalize_calculus


def validate_math(word):
    if word.get("format") != "math":
        return word
    result = dict(word)
    # Formula models already supply a literal LaTeX transcription. Parsing
    # success is not a statement about its visual or mathematical correctness.
    if word.get('notation') == 'latex':
        result.update(validation='unverified', needsReview=True)
        return result
    text = word["text"].translate(str.maketrans({"−": "-", "×": "*", "÷": "/", "π": "pi"}))
    try:
        text = " = ".join(normalize_calculus(side) for side in text.split("="))
        text = text.replace("^", "**")
        text = re.sub(r"(?<=\d)(?=[A-Za-z(])", "*", text)
        import sympy as s
        functions = {"sqrt": s.sqrt, "sin": s.sin, "cos": s.cos, "tan": s.tan, "log": s.log, "exp": s.exp}

        class Partial(s.Derivative):
            def _latex(self, printer):
                degree = sum(count for _, count in self.variable_count)
                numerator = r"\partial" + ("^{"+str(degree)+"}" if degree > 1 else "")
                denominator = " ".join(r"\partial " + printer._print(var) + ("^{"+str(count)+"}" if count > 1 else "") for var, count in self.variable_count)
                return r"\frac{"+numerator+"}{"+denominator+r"}\left("+printer._print(self.expr)+r"\right)"

        def convert(node, depth=0):
            if depth > 24:
                raise ValueError("Expression is too deeply nested")
            sub = lambda n: convert(n, depth + 1)
            if isinstance(node, ast.Name) and re.fullmatch(r"[A-Za-z][A-Za-z0-9]{0,19}", node.id):
                return {"pi": s.pi, "E": s.E}.get(node.id, s.Symbol(node.id))
            if isinstance(node, ast.Constant) and type(node.value) in (int, float) and len(str(node.value)) < 40:
                return s.Number(node.value)
            if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
                return sub(node.operand) if isinstance(node.op, ast.UAdd) else s.Mul(-1, sub(node.operand), evaluate=False)
            if isinstance(node, ast.BinOp):
                a, b = sub(node.left), sub(node.right)
                if isinstance(node.op, ast.Add): return s.Add(a, b, evaluate=False)
                if isinstance(node.op, ast.Sub): return s.Add(a, s.Mul(-1, b, evaluate=False), evaluate=False)
                if isinstance(node.op, ast.Mult): return s.Mul(a, b, evaluate=False)
                if isinstance(node.op, ast.Div): return s.Mul(a, s.Pow(b, -1, evaluate=False), evaluate=False)
                if isinstance(node.op, ast.Pow): return s.Pow(a, b, evaluate=False)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in functions and len(node.args) == 1 and not node.keywords:
                return functions[node.func.id](sub(node.args[0]), evaluate=False)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and not node.keywords:
                name, args = node.func.id, node.args
                if name in ("integral", "int", "diff", "partial"):
                    expected = (2, 4) if name in ("integral", "int") else (2, 3)
                    if len(args) not in expected or not isinstance(args[1], ast.Name):
                        raise ValueError("Use integral(expression, variable[, lower, upper]) or diff/partial(expression, variable[, order])")
                    expr, var = sub(args[0]), sub(args[1])
                    if not isinstance(var, s.Symbol):
                        raise ValueError("Calculus requires a variable")
                    if name in ("integral", "int"):
                        return s.Integral(expr, (var, sub(args[2]), sub(args[3]))) if len(args) == 4 else s.Integral(expr, var)
                    order = 1
                    if len(args) == 3:
                        if not isinstance(args[2], ast.Constant) or type(args[2].value) is not int or not 1 <= args[2].value <= 10:
                            raise ValueError("Derivative order must be an integer from 1 to 10")
                        order = args[2].value
                    return (Partial if name == "partial" else s.Derivative)(expr, (var, order), evaluate=False)
                if re.fullmatch(r"[A-Za-z]", name) and 1 <= len(args) <= 4:
                    return s.Function(name)(*[sub(arg) for arg in args])
            raise ValueError("Unsupported math notation")

        if len(text) > 1000:
            raise ValueError("Expression is too long")
        sides = text.split("=")
        if len(sides) > 2 or any(not side.strip() for side in sides):
            raise ValueError("Check the equation sides")
        expressions = [convert(ast.parse(side.strip(), mode="eval").body) for side in sides]
        result.update(validation="valid", corrected=False)
        # Preserve the author's order and notation for ordinary arithmetic.
        # Calculus aliases need a renderer representation, kept separately.
        if re.search(r'\b(?:integral|diff|partial)\s*\(', text) or normalize_calculus(word['text']) != word['text']:
            result['latex'] = " = ".join(s.latex(e) for e in expressions)
        else:
            result['validatedLatex'] = " = ".join(s.latex(e) for e in expressions)
    except (ImportError, ValueError, SyntaxError, TypeError, RecursionError) as error:
        result.update(validation="unverified", needsReview=True, validationMessage=str(error))
    return result
