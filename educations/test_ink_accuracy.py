from unittest.mock import patch
from django.test import SimpleTestCase, override_settings
from django.core.cache import cache
from .ink_regions import equation_lines, formula_crop
from .ink_layout import recognize_layout
from .handwriting import recognize, _overlay_geometric_tokens, _layout_is_reliable
from .math_validation import validate_math


def s(identity,*points):
    return dict(id=identity,points=[list(p) for p in points])


def working():
    return [s('a',(0,0),(10,25),(20,0)),s('e1',(30,10),(50,10)),s('e2',(30,18),(50,18)),s('b',(65,0),(75,25)),
            s('c',(0,70),(10,95),(20,70)),s('e3',(30,80),(50,80)),s('e4',(30,88),(50,88)),s('d',(65,70),(75,95))]


class InkAccuracyTests(SimpleTestCase):
    def setUp(self): cache.clear()

    def test_geometric_glyphs_overlay_formula_without_using_uncertain_groups(self):
        diagnostic={'groups':[{'strokeIds':['power']}], 'structure': [[
            {'kind':'ink','text':'x','strokeIds':['x'],'children':[]},
            {'kind':'ink','text':'Z','strokeIds':['power'],'children':[]},
            {'kind':'operator','text':'=','strokeIds':['equals'],'children':[]},
            {'kind':'ink','text':'3','strokeIds':['result'],'children':[]}]]}
        self.assertEqual(_overlay_geometric_tokens('Y^{2}=3',diagnostic),'x^{2}=3')
        self.assertIsNone(_overlay_geometric_tokens(r'\\frac{X}{Y}',diagnostic))
        integral={'groups':[{'strokeIds':['d']}], 'structure': [[
            {'kind':'integral','text':'∫','strokeIds':['integral'],'children':[]},
            {'kind':'ink','text':'x','strokeIds':['x1','x2'],'children':[]},
            {'kind':'ink','text':'D','strokeIds':['d'],'children':[]},
            {'kind':'ink','text':'x','strokeIds':['dx1','dx2'],'children':[]}]]}
        self.assertEqual(_overlay_geometric_tokens(r'\\int X d X',integral),r'\\int x d x')

    def test_mostly_geometric_strong_layout_can_use_fast_path(self):
        ink=working()[:4]
        ids=[stroke['id'] for stroke in ink]
        result={'words':[{'text':'2x=5','format':'math','strokeIds':ids}], 'unread':[],
                'diagnostics':[{'strokeIds':ids,'groups':[{'strokeIds':[ids[-1]],
                    'result':{'words':[{'strokeIds':[ids[-1]],'confidence':'Strong'}]}}],
                    'structure':[[{'kind':'ink'},{'kind':'operator'},{'kind':'ink'}]]}]}
        self.assertTrue(_layout_is_reliable(result,ink))
        result['diagnostics'][0]['groups'][0]['result']['words'][0]['confidence']='Intermediate'
        self.assertFalse(_layout_is_reliable(result,ink))
        result['diagnostics'][0]['groups'][0]['result']['words'][0]['confidence']='Strong'
        result['words'][0]['text']='x^(Z) = 3'
        self.assertFalse(_layout_is_reliable(result,ink))

    def test_equation_working_has_separate_sources_before_structure(self):
        ink=working()
        regions=equation_lines(ink)
        self.assertEqual([[s['id'] for s in region] for region in regions],[['a','e1','e2','b'],['c','e3','e4','d']])
        def native(groups):
            return dict(groups=[dict(id=g['id'],result=dict(words=[dict(text='5',strokeIds=[s['id'] for s in g['strokes']],confidence='Strong')])) for g in groups])
        result=recognize_layout(ink,native,'math')
        self.assertEqual(len(result['words']),2)
        self.assertTrue(all('integral' not in w['text'] and '/' not in w['text'] for w in result['words']))
        self.assertEqual([set(w['strokeIds']) for w in result['words']],[set(s['id'] for s in r) for r in regions])

    def test_crossing_stroke_does_not_get_cut_between_lines(self):
        ink=working()+[s('connected',(90,0),(90,95))]
        self.assertEqual(equation_lines(ink),[ink])

    def test_standalone_fraction_keeps_numerator_and_denominator(self):
        ink=[s('num',(10,0),(20,20)),s('bar',(0,35),(40,35)),s('den',(10,50),(20,70))]
        self.assertEqual(equation_lines(ink),[ink])
        image=formula_crop(ink)
        self.assertEqual(image.mode,'RGB')
        self.assertEqual(image.getpixel((0,0)),(255,255,255))
        self.assertLess(min(image.convert('L').getdata()),20)

    def test_validator_does_not_reorder_or_solve_literal_arithmetic(self):
        for text in ['5+2x=7','2x+5=7','2+2=5','x=','x=1=2']:
            result=validate_math(dict(text=text,format='math'))
            self.assertEqual(result['text'],text)
            self.assertNotIn('latex',result)
        result=validate_math(dict(text=r'2x+5=7',format='math',notation='latex',latex='2x+5=7'))
        self.assertEqual(result['latex'],'2x+5=7')
        self.assertTrue(result['needsReview'])

    @override_settings(WHITEBOARD_FORMULA_MODEL_DIR='missing-formula')
    def test_every_suggestion_requires_review_even_if_native_is_strong(self):
        ink=working()[:4]
        word=dict(text='2x+5=7',format='math',strokeIds=[s['id'] for s in ink],needsReview=False)
        with patch('educations.handwriting.recognition_status',return_value=dict(available=True,engine='test')),patch('educations.handwriting.recognize_layout',return_value=dict(words=[word],unread=[])):
            result=recognize(ink,'math')
        self.assertTrue(result['reviewRequired'])
        self.assertTrue(result['words'][0]['needsReview'])
        self.assertEqual(result['words'][0]['rawText'],'2x+5=7')

    @override_settings(WHITEBOARD_FORMULA_MODEL_DIR='missing-formula')
    def test_duplicate_or_missing_source_regions_keep_ink(self):
        ink=working()[:4]
        word=dict(text='7',format='math',strokeIds=[ink[0]['id']])
        with patch('educations.handwriting.recognition_status',return_value=dict(available=True,engine='test')),patch('educations.handwriting.recognize_layout',return_value=dict(words=[word,word],unread=[])):
            result=recognize(ink,'math')
        self.assertEqual(result['words'],[])
        self.assertEqual({i for w in result['unread'] for i in w['strokeIds']},{s['id'] for s in ink})

    def test_formula_adapter_preserves_literal_latex_and_line_sources(self):
        from .formula_engine import recognize_formula
        config=dict(engine='paddle-formula',model='test-formula',revision='hash')
        with patch('educations.formula_engine.predict',return_value=['2x+5=7','x=1']):
            result=recognize_formula(working(),config)
        self.assertEqual([w['latex'] for w in result['words']],['2x+5=7','x=1'])
        self.assertTrue(all(w['needsReview'] for w in result['words']))

    def test_formula_failure_falls_back_without_losing_source_ink(self):
        ink=working()[:4]
        fallback=dict(words=[dict(text='2x=5',format='math',strokeIds=[s['id'] for s in ink])],unread=[])
        config=dict(engine='paddle-formula',model='test-formula',revision='hash')
        with patch('educations.handwriting.recognition_status',return_value=dict(available=True,engine='test')), \
             patch('educations.formula_engine.configuration',return_value=config), \
             patch('educations.formula_engine.recognize_formula',side_effect=RuntimeError('worker stopped')), \
             patch('educations.handwriting.recognize_layout',return_value=fallback):
            result=recognize(ink,'math')
        self.assertEqual(result['words'][0]['text'],'2x=5')
        self.assertEqual(result['words'][0]['strokeIds'],[s['id'] for s in ink])
        self.assertIn('fallback recognizer',' '.join(result['words'][0]['reviewReasons']))
        self.assertTrue(result['reviewRequired'])

    def test_isolated_math_glyph_does_not_use_whole_formula_model(self):
        ink=[s('integral',(10,0),(0,20),(3,50),(0,80),(10,100))]
        fallback=dict(words=[dict(text='∫',format='math',strokeIds=['integral'])],unread=[])
        config=dict(engine='paddle-formula',model='test-formula',revision='hash')
        with patch('educations.handwriting.recognition_status',return_value=dict(available=True,engine='test')), \
             patch('educations.formula_engine.configuration',return_value=config), \
             patch('educations.formula_engine.recognize_formula') as formula_reader, \
             patch('educations.handwriting.recognize_layout',return_value=fallback):
            result=recognize(ink,'math')
        formula_reader.assert_not_called()
        self.assertEqual(result['words'][0]['text'],'∫')

    def test_readers_disagree_on_case_without_silently_rewriting_either_reading(self):
        ink=working()[:4]
        ids=[stroke['id'] for stroke in ink]
        primary=dict(words=[dict(text='X=1',latex='X=1',notation='latex',format='math',strokeIds=ids)],unread=[])
        secondary=dict(words=[dict(text='x = 1',format='math',strokeIds=ids)],unread=[])
        config=dict(engine='paddle-formula',model='test-formula',revision='hash')
        with patch('educations.handwriting.recognition_status',return_value=dict(available=True,engine='test')), \
             patch('educations.formula_engine.configuration',return_value=config), \
             patch('educations.formula_engine.recognize_formula',return_value=primary), \
             patch('educations.handwriting.recognize_layout',return_value=secondary):
            result=recognize(ink,'math')
        word=result['words'][0]
        self.assertEqual(word['text'],'X=1')
        self.assertEqual(word['alternatives'],['x = 1'])
        self.assertIn('disagree',' '.join(word['reviewReasons']))
        self.assertTrue(word['needsReview'])
        self.assertEqual([candidate['text'] for candidate in word['candidates']],['X=1','x = 1'])

    def test_explicit_text_mode_never_routes_equals_signs_to_formula_model(self):
        ink=working()[:4]
        fallback=dict(words=[dict(text='x = 1',format='paragraph',strokeIds=[stroke['id'] for stroke in ink])],unread=[])
        config=dict(engine='paddle-formula',model='test-formula',revision='hash')
        with patch('educations.handwriting.recognition_status',return_value=dict(available=True,engine='test')), \
             patch('educations.formula_engine.configuration',return_value=config), \
             patch('educations.formula_engine.recognize_formula') as formula_reader, \
             patch('educations.handwriting.recognize_layout',return_value=fallback):
            result=recognize(ink,'text')
        formula_reader.assert_not_called()
        self.assertEqual(result['words'][0]['format'],'paragraph')
