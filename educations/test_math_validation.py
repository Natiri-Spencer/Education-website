from django.test import SimpleTestCase, override_settings
from django.core.cache import cache
from unittest.mock import patch
from .math_validation import validate_math


@override_settings(WHITEBOARD_FORMULA_MODEL_DIR='missing-formula')
class MathValidationTests(SimpleTestCase):
    def check_math(self, text):
        return validate_math(dict(text=text, format="math", strokeIds=["a"]))

    def test_normalizes_implicit_multiplication_and_preserves_equation(self):
        result = self.check_math("2x^2 = 8")
        self.assertEqual(result["validation"], "valid")
        self.assertIn("x^{2}", result["validatedLatex"])
        self.assertIn(" = ", result["validatedLatex"])
        self.assertNotIn('latex',result)
        self.assertEqual(result["text"], "2x^2 = 8")

    def test_accepts_fraction_and_root(self):
        self.assertEqual(self.check_math("sqrt(x)/(y+1)")["validation"], "valid")

    def test_calculus_notation_is_validated_without_evaluation(self):
        examples = {
            "integral(x^2,x)": r"\int",
            "integral(x^2,x,0,1)": r"\int\limits_{0}^{1}",
            "\u222b_(0)^(1) x^2 dx": r"\int\limits_{0}^{1}",
            "\u222b sin(x) dx": r"\int",
            "diff(x^3,x,2)": r"\frac{d^{2}}{d x^{2}}",
            "dy/dx": r"\frac{d}{d x}",
            "d^2y/dx^2": r"\frac{d^{2}}{d x^{2}}",
            "d/dx(x^2)": r"\frac{d}{d x}",
            "(d)/(dx)x^(2)": r"\frac{d}{d x}",
            "f'(x)": r"\frac{d}{d x}",
            "f\u2033(x)": r"\frac{d^{2}}{d x^{2}}",
            "partial(f(x,y),x)": r"\partial",
            "(\u2202y)/(\u2202x)": r"\partial",
            "\u2202^2f(x,y)/\u2202x^2": r"\partial^{2}",
            "integral(integral(x*y,x),y)": r"\iint",
        }
        for text, expected in examples.items():
            with self.subTest(text=text):
                result = self.check_math(text)
                self.assertEqual(result["validation"], "valid", result)
                self.assertIn(expected, result["latex"])
                self.assertEqual(result["text"], text)

    def test_invalid_calculus_requires_review(self):
        for text in ("diff(x,x,0)", "diff(x,x,1000000)", "integral(x,1)", "integral(x,x,0)", "partial(x,x,-1)", "d^2y/dx^3", "diff(x,x,True)", "integral(__import__('os'),x)"):
            with self.subTest(text=text):
                result = self.check_math(text)
                self.assertEqual(result["validation"], "unverified")
                self.assertTrue(result["needsReview"])

    def test_rejects_code_and_incomplete_math_for_review(self):
        for text in ("__import__('os').system('whoami')", "x+", "x=", "x[0]", "x=1=2"):
            result = self.check_math(text)
            self.assertTrue(result["needsReview"])
            self.assertNotIn("latex", result)

    def test_leaves_sentences_alone(self):
        word = dict(text="A sentence.", format="paragraph")
        self.assertEqual(validate_math(word), word)

    def test_pipeline_returns_tokens_and_latex(self):
        from .handwriting import recognize
        cache.clear()
        strokes = [dict(id="a", points=[[0, 0], [10, 10]])]
        words = [dict(text="2x=8", format="math", strokeIds=["a"])]
        with patch("educations.handwriting.recognition_status", return_value=dict(available=True, engine="test")), patch("educations.handwriting.recognize_layout", return_value=dict(words=words, unread=[])):
            result = recognize(strokes, "math")
        self.assertEqual(result["words"][0]["validation"], "valid")
        self.assertIn("validatedLatex", result["words"][0])
        self.assertNotIn("latex", result["words"][0])
        self.assertEqual(result["words"][0]["tokens"], ["2x", "=", "8"])
