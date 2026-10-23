from django.test import SimpleTestCase

from .calculus_ink import calculus_symbol
from .ink_layout import recognize_layout, box
from .math_validation import validate_math

# Independent pen samples, rather than reusing the recognition templates.
INTEGRAL = [(1,.04),(.82,0),(.64,.04),(.51,.13),(.46,.36),(.40,.62),(.31,.85),(.22,.96),(.08,1),(0,.93)]
PARTIAL = [(.2,.07),(.46,0),(.75,.12),(.93,.32),(1,.56),(.83,.84),(.58,.98),(.28,1),(.07,.84),(0,.64),(.16,.47),(.42,.43),(.72,.49),(.94,.6)]


def glyph(identity, points, x, y, w, h):
    return dict(id=identity, points=[[x+a*w,y+b*h] for a,b in points])


class CalculusInkTests(SimpleTestCase):
    def native(self, labels):
        def recognize(groups):
            return dict(groups=[dict(id=g['id'],result=dict(words=[dict(text=''.join(labels[s['id']] for s in g['strokes']),strokeIds=[s['id'] for s in g['strokes']],box=box(g['strokes']))])) for g in groups])
        return recognize

    def test_templates_allow_translation_scale_and_reverse_direction(self):
        for shape, symbol, width in ((INTEGRAL,'\u222b',25),(PARTIAL,'\u2202',60)):
            for points in (shape,list(reversed(shape))):
                self.assertEqual(calculus_symbol(glyph('g',points,20,30,width,90)),symbol)
        self.assertIsNone(calculus_symbol(dict(id='line',points=[[0,0],[0,90]])))

    def test_indefinite_integral_preserves_all_sources_and_requires_review(self):
        strokes = [glyph('integral',INTEGRAL,0,0,25,100),
                   dict(id='x',points=[[55,30],[80,70]]),
                   dict(id='dx',points=[[100,30],[125,70]])]
        result = recognize_layout(strokes,self.native({'x':'x','dx':'dx'}),'math')
        self.assertEqual(len(result['words']),1,result)
        word = validate_math(result['words'][0])
        self.assertEqual(word['validation'],'valid',word)
        self.assertIn(r'\int',word['latex'])
        self.assertTrue(word['needsReview'])
        self.assertEqual(set(word['strokeIds']),{s['id'] for s in strokes})

    def test_definite_integral_keeps_limits_with_the_integral(self):
        strokes = [glyph('integral',INTEGRAL,0,0,25,100),
                   dict(id='upper',points=[[32,-5],[40,8]]),
                   dict(id='lower',points=[[32,92],[40,108]]),
                   dict(id='x',points=[[65,30],[85,70]]),
                   dict(id='dx',points=[[110,30],[135,70]])]
        result = recognize_layout(strokes,self.native({'upper':'1','lower':'0','x':'x','dx':'dx'}),'math')
        self.assertEqual(len(result['words']),1,result)
        word = validate_math(result['words'][0])
        self.assertEqual(word['validation'],'valid',word)
        self.assertIn(r'\int\limits_{0}^{1}',word['latex'])
        self.assertEqual(set(word['strokeIds']),{s['id'] for s in strokes})

    def test_text_mode_does_not_reinterpret_letters_as_calculus(self):
        strokes = [glyph('s',INTEGRAL,0,0,25,100)]
        result = recognize_layout(strokes,self.native({'s':'S'}),'text')
        self.assertEqual(result['words'][0]['text'],'S')

    def test_partial_derivative_fraction_keeps_both_partial_signs(self):
        strokes = [glyph('top-partial',PARTIAL,15,0,30,40),
                   dict(id='y',points=[[60,0],[75,40]]),
                   dict(id='bar',points=[[5,60],[90,60]]),
                   glyph('bottom-partial',PARTIAL,15,80,30,40),
                   dict(id='x',points=[[60,80],[75,120]])]
        result = recognize_layout(strokes,self.native({'y':'y','x':'x'}),'math')
        self.assertEqual(len(result['words']),1,result)
        word = validate_math(result['words'][0])
        self.assertEqual(word['validation'],'valid',word)
        self.assertIn(r'\partial',word['latex'])
        self.assertEqual(set(word['strokeIds']),{s['id'] for s in strokes})

    def test_crossbar_keeps_integral_shaped_f_in_the_letter_recognizer(self):
        strokes = [glyph('stem',INTEGRAL,0,0,25,100),
                   dict(id='crossbar',points=[[0,50],[30,50]])]
        result = recognize_layout(strokes,self.native({'stem':'f','crossbar':''}),'math')
        self.assertEqual(result['words'][0]['text'],'f')
