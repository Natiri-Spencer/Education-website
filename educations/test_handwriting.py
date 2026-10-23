import json
from unittest.mock import patch

from django.test import SimpleTestCase, Client, override_settings
from django.urls import reverse

from .handwriting import recognition_status, recognize, validate_strokes, RecognitionUnavailable
from .ink_layout import recognize_layout, _paragraphs


MATH_STROKES = [
    {"id": "m", "points": [[0, 80], [0, 0], [30, 45], [60, 0], [60, 80]]},
    {"id": "a", "points": [[80, 80], [110, 0], [140, 80]]},
    {"id": "a-bar", "points": [[95, 50], [125, 50]]},
    {"id": "t-top", "points": [[160, 0], [220, 0]]},
    {"id": "t", "points": [[190, 0], [190, 80]]},
    {"id": "h-left", "points": [[240, 0], [240, 80]]},
    {"id": "h-right", "points": [[290, 0], [290, 80]]},
    {"id": "h-bar", "points": [[240, 40], [290, 40]]},
]

WIDE_MATH_STROKES=[dict(id=s['id'],points=[[x*1.7,y*1.4] for x,y in s['points']]) for s in MATH_STROKES]
WIDE_MATH_STROKES[3]['points']=[[272,0],[306,-5],[340,-2],[374,7]]
WIDE_MATH_STROKES[4]['points'][0][1]=22


def stroke(identity, *points):
    return dict(id=identity, points=[list(p) for p in points])


FRACTION_STROKES = [
    stroke('x1', (20,20), (70,80)), stroke('x2',(70,20),(20,80)),
    stroke('bar',(10,110),(85,110)),
    stroke('y',(25,135),(40,165),(65,135),(45,205),(25,215)),
    stroke('plus-h',(120,110),(170,110)), stroke('plus-v',(145,85),(145,135)),
    stroke('eight',(235,75),(215,70),(200,85),(210,105),(235,120),(240,140),(220,150),(200,140),(200,120),(220,105),(235,85),(235,75)),
    stroke('equals1',(270,100),(315,100)), stroke('equals2',(270,120),(315,120)),
    stroke('t',(355,70),(353,95),(350,120),(352,142),(360,150),(372,145)), stroke('t-cross',(335,95),(375,95)),
]

def shifted(s,dx,dy,identity=None):
    return stroke(identity or s['id'], *[(x+dx,y+dy) for x,y in s['points']])

def mixed_size_strokes():
    heading=[shifted(s,200,120) for s in WIDE_MATH_STROKES]
    body=[stroke('small-'+s['id'],*[(x*.5+200,y*.5+330) for x,y in s['points']]) for s in MATH_STROKES]
    return heading+body

ONE=stroke('one',(0,20),(15,0),(15,80))
TWO=stroke('two',(0,15),(10,0),(30,0),(40,15),(35,30),(0,80),(40,80))
THREE=stroke('three',(0,5),(25,0),(40,15),(30,35),(15,40),(35,45),(40,65),(25,80),(0,75))
INTEGER_STROKES=[stroke('negative',(0,40),(25,40)),shifted(ONE,40,0),shifted(TWO,70,0),
                 stroke('ph',(140,40),(180,40)),stroke('pv',(160,20),(160,60)),shifted(THREE,210,0),
                 stroke('e1',(280,30),(325,30)),stroke('e2',(280,50),(325,50)),shifted(FRACTION_STROKES[6],150,-70,'eight-result')]

LETTER_PATHS={
    'M': [[(0,40),(0,0),(15,22),(30,0),(30,40)]],
    'A': [[(0,40),(15,0),(30,40)],[(7,25),(23,25)]],
    'T': [[(0,0),(30,0)],[(15,0),(15,40)]],
    'H': [[(0,0),(0,40)],[(30,0),(30,40)],[(0,20),(30,20)]],
    'I': [[(0,0),(24,0)],[(12,0),(12,40)],[(0,40),(24,40)]],
    'S': [[(28,4),(20,0),(8,0),(0,9),(5,17),(24,25),(29,32),(24,40),(8,40),(0,35)]],
    'F': [[(0,40),(0,0),(28,0)],[(0,19),(23,19)]],
    'U': [[(0,0),(0,30),(5,38),(15,40),(25,38),(30,30),(30,0)]],
    'N': [[(0,40),(0,0),(30,40),(30,0)]],
    'W': [[(0,0),(7,40),(15,18),(23,40),(30,0)]],
    'E': [[(30,0),(0,0),(0,40),(30,40)],[(0,20),(24,20)]],
    'L': [[(0,0),(0,40),(30,40)]],
    'R': [[(0,40),(0,0),(23,0),(30,8),(23,20),(0,20)],[(15,20),(30,40)]],
    '.': [[(0,39),(1,40)]],
}

def paragraph_strokes():
    output=[]
    for row,text in enumerate(['MATH IS FUN.','WE LEARN MATHS.']):
        x=0
        for letter in text:
            if letter==' ':
                x+=24; continue
            for points in LETTER_PATHS[letter]:
                output.append(stroke('p'+str(len(output)),*[(px+x,py+row*80) for px,py in points]))
            x+=40 if letter!='.' else 12
    return output


class InkLayoutTests(SimpleTestCase):
    def test_wobbly_equals_selects_maths_in_auto_mode(self):
        ink = [
            stroke('two',(0,5),(8,0),(15,8),(0,28),(17,28)),
            stroke('x',(24,0),(42,28),(24,28),(42,0)),
            stroke('plus-h',(50,15),(68,14)), stroke('plus-v',(59,5),(59,25)),
            stroke('y',(76,0),(84,17),(92,0),(84,31)),
            # Deliberately sloped and slightly wobbly: these failed the old
            # strict horizontal-stroke check and sent the line to text mode.
            stroke('eq-top',(102,10),(112,9),(124,12),(134,11)),
            stroke('eq-bottom',(103,20),(114,18),(125,22),(135,20)),
            stroke('seven',(145,2),(164,2),(151,30)),
        ]
        labels = {'two':'2','x':'x','y':'y','seven':'7'}
        def native(groups):
            self.assertTrue(all(group['mode'] == 'symbol' for group in groups))
            return {'groups':[dict(id=group['id'],result={'words':[dict(
                text=''.join(labels[s['id']] for s in group['strokes']),
                strokeIds=[s['id'] for s in group['strokes']])]} ) for group in groups]}
        result = recognize_layout(ink, native, 'auto')
        self.assertEqual(result['words'][0]['format'], 'math')
        self.assertEqual(result['words'][0]['text'], '2x + y = 7')

    def test_dotted_lowercase_letters_remain_text_and_get_review_in_auto(self):
        ink=[stroke('stem',(0,35),(0,100)),stroke('dot',(0,0),(2,10)),stroke('h',(25,0),(25,100),(45,50),(60,100))]
        def native(groups):
            self.assertTrue(all(g['mode']=='text' for g in groups))
            return {'groups':[dict(id=g['id'],result={'words':[dict(text='iH',confidence='Intermediate',strokeIds=[s['id'] for s in g['strokes']],box=dict(x=0,y=0,w=60,h=100))]}) for g in groups]}
        result=recognize_layout(ink,native)
        self.assertTrue(result['words'])
        self.assertTrue(all(w['format']=='paragraph' and w['needsReview'] for w in result['words']))

    def test_unread_ink_is_returned_for_editable_review_with_all_original_ids(self):
        result=recognize_layout(MATH_STROKES,lambda groups:{'groups':[]})
        self.assertEqual(result['words'],[])
        self.assertEqual(set(result['unread'][0]['strokeIds']),{s['id'] for s in MATH_STROKES})
        self.assertTrue(result['unread'][0]['needsReview'])

    def test_even_confident_equations_require_review_and_keep_literal_values(self):
        ink=[stroke('plus-h',(0,30),(40,30)),stroke('plus-v',(20,10),(20,50))]
        result=recognize_layout(ink,lambda groups:self.fail('Operator needs no recognizer'),'math')
        self.assertEqual(result['words'][0]['text'],'+')
        self.assertTrue(result['words'][0]['needsReview'])

    def test_detached_letter_crossbars_are_not_equations_or_exponents(self):
        def native(groups):
            self.assertTrue(all(g['mode']=='text' for g in groups))
            return {'groups':[dict(id=g['id'],result={'words':[dict(text='MATH',strokeIds=[s['id'] for s in g['strokes']],box=dict(x=0,y=0,w=500,h=112))]}) for g in groups]}
        result=recognize_layout(WIDE_MATH_STROKES,native)
        self.assertTrue(result['words'])
        self.assertTrue(all(w['format']=='paragraph' for w in result['words']))
        letter_e=[stroke('spine',(0,0),(0,100)),stroke('top',(8,0),(85,0)),stroke('mid',(8,45),(70,45)),stroke('bottom',(8,100),(85,100))]
        recognize_layout(letter_e,native)

    def test_low_confidence_text_stays_ink_instead_of_inventing_a_word(self):
        result=recognize_layout(WIDE_MATH_STROKES,lambda groups:{'groups':[dict(id=g['id'],result={'words':[dict(text='4-15W1',confidence='Poor',strokeIds=[s['id'] for s in g['strokes']],box=dict(x=0,y=0,w=500,h=112))]}) for g in groups]})
        self.assertTrue(result['words'])
        self.assertTrue(all(word['needsReview'] for word in result['words']))

    def test_small_body_text_does_not_detach_a_tall_headings_crossbar(self):
        groups=[]
        recognize_layout(mixed_size_strokes(),lambda batch:groups.extend(batch) or {'groups':[]})
        heading=next(g for g in groups if any(s['id']=='m' for s in g['strokes']))
        self.assertEqual({s['id'] for s in heading['strokes']},{s['id'] for s in WIDE_MATH_STROKES})
        self.assertTrue(all(g['mode']=='text' for g in groups))
    def test_fraction_operators_and_all_stroke_ids_survive_layout(self):
        labels = {'x1':'x', 'x2':'x', 'y':'y', 'eight':'8', 't':'t', 't-cross':'t'}
        def native(groups):
            return {'groups':[dict(id=g['id'], result={'words':[dict(text=labels[g['strokes'][0]['id']],strokeIds=[s['id'] for s in g['strokes']])]}) for g in groups]}
        result = recognize_layout(FRACTION_STROKES,native)
        self.assertEqual(result['words'][0]['text'],'(x)/(y) + 8 = t')
        self.assertEqual(result['words'][0]['format'],'math')
        self.assertEqual(set(result['words'][0]['strokeIds']),{s['id'] for s in FRACTION_STROKES})

    def test_unread_operand_keeps_whole_expression_as_ink(self):
        result = recognize_layout(FRACTION_STROKES, lambda groups: {'groups':[]})
        self.assertEqual(result['words'],[])

    def test_paragraph_word_line_and_blank_line_spacing(self):
        def word(text,x,y,w=50):
            return dict(text=text,box=dict(x=x,y=y,w=w,h=30),strokeIds=[text+str(y)])
        result = _paragraphs([word('learn.',90,60),word('We',0,0),word('maths',60,0),word('We',0,60),word('New',0,230),word('paragraph.',75,230)])
        self.assertEqual([p['text'] for p in result],['We maths\nWe learn.','New paragraph.'])
        self.assertTrue(all(p['format']=='paragraph' for p in result))
        self.assertEqual(result[0]['fontSize'],33)

    def test_isolated_operators_and_math_profile(self):
        plus = FRACTION_STROKES[4:6]
        result = recognize_layout(plus,lambda groups:self.fail('Geometry needs no dictionary'))
        self.assertEqual(result['words'][0]['text'],'+')
        result = recognize_layout([stroke('minus',(0,30),(25,30)),stroke('n',(40,0),(50,40))],
                                  lambda groups:{'groups':[dict(id=g['id'],result={'words':[dict(text='3',strokeIds=['n'])]}) for g in groups]},'math')
        self.assertEqual(result['words'][0]['text'],'−3')

    def test_powers_keep_their_position_above_the_base(self):
        ink=[stroke('x',(0,0),(30,60),(0,60),(30,0)),stroke('power',(38,-20),(55,-20),(38,5),(55,5)),stroke('eq1',(85,20),(115,20)),stroke('eq2',(85,40),(115,40)),shifted(THREE,140,0)]
        labels={'x':'x','power':'2','three':'3'}
        result=recognize_layout(ink,lambda groups:{'groups':[dict(id=g['id'],result={'words':[dict(text=labels[g['strokes'][0]['id']],strokeIds=[s['id'] for s in g['strokes']])]}) for g in groups]})
        self.assertEqual(result['words'][0]['text'],'x^(2) = 3')

    def test_tall_leading_digit_does_not_raise_normal_equation_glyphs(self):
        nodes = [
            dict(kind='ink', text='3', box=dict(x=0,y=0,w=45,h=90)),
            dict(kind='ink', text='x', box=dict(x=55,y=25,w=32,h=58)),
            dict(kind='operator', text='+', box=dict(x=100,y=35,w=25,h=25)),
            dict(kind='ink', text='2', box=dict(x=140,y=24,w=34,h=60)),
            dict(kind='ink', text='y', box=dict(x=180,y=28,w=34,h=62)),
            dict(kind='operator', text='=', box=dict(x=230,y=42,w=25,h=15)),
            dict(kind='ink', text='1', box=dict(x=270,y=25,w=12,h=58)),
            dict(kind='ink', text='2', box=dict(x=292,y=24,w=34,h=60)),
        ]
        from .ink_layout import _math_string
        self.assertEqual(_math_string(nodes), '3x + 2y = 12')

    def test_clear_math_x_one_and_two_use_geometry_before_model(self):
        two = stroke('two',(0,5),(8,0),(24,1),(32,8),(29,15),(20,22),(2,35),(0,40),(31,40))
        x1 = stroke('x1',(45,0),(75,40)); x2 = stroke('x2',(75,0),(45,40))
        one = stroke('one',(92,0),(93,40))
        eq1 = stroke('eq1',(112,14),(142,15)); eq2 = stroke('eq2',(112,25),(142,26))
        result = recognize_layout([two,x1,x2,one,eq1,eq2], lambda groups: {'groups':[]}, 'math')
        self.assertEqual(result['words'][0]['text'], '2x1 =')

        seven = stroke('seven',(0,0),(18,1),(35,0),(28,9),(20,20),(13,31),(8,42))
        result = recognize_layout([seven], lambda groups: {'groups':[]}, 'math')
        self.assertEqual(result['words'][0]['text'], '7')

    def test_root_roof_and_division_dots_are_not_fraction_operands(self):
        ink=[stroke('root',(0,35),(10,45),(22,0),(85,0)),shifted(THREE,35,10)]
        result=recognize_layout(ink,lambda groups:{'groups':[dict(id=g['id'],result={'words':[dict(text='3',strokeIds=['three'])]}) for g in groups]})
        self.assertEqual(result['words'][0]['text'],'sqrt(3)')
        divide=[stroke('bar',(0,30),(40,30)),stroke('top',(20,10)),stroke('bottom',(20,50))]
        result=recognize_layout(divide,lambda groups:self.fail('Geometry requires no dictionary'))
        self.assertEqual(result['words'][0]['text'],'÷')


class HandwritingValidationTests(SimpleTestCase):
    def test_accepts_strokes_without_executing_or_rewriting_content(self):
        self.assertEqual(validate_strokes({"strokes": MATH_STROKES}), MATH_STROKES)

    def test_rejects_duplicate_ids_invalid_coordinates_and_large_batches(self):
        for payload in (
            {}, {"strokes": []}, {"strokes": [MATH_STROKES[0]] * 201},
            {"strokes": [MATH_STROKES[0], MATH_STROKES[0]]},
            {"strokes": [{"id": "x", "points": [[float("inf"), 0]]}]},
            {"strokes": [{"id": "x", "points": [[True, 0]]}]},
            {"strokes": [{"id": "x", "points": [[0, "command"]]}]},
        ):
            with self.subTest(payload=type(payload).__name__), self.assertRaises(ValueError):
                validate_strokes(payload)


class HandwritingEndpointTests(SimpleTestCase):
    def test_returns_readiness_and_corrected_words(self):
        url = reverse("educations:whiteboard_recognize")
        with patch("educations.whiteboard_recognition.recognition_status", return_value={"available": True, "engine": "test"}):
            self.assertTrue(self.client.get(url).json()["available"])
        with patch("educations.whiteboard_recognition.recognize", return_value={"words": [{"text": "MATH", "strokeIds": ["m"]}]}):
            response = self.client.post(url, json.dumps({"strokes": MATH_STROKES}), content_type="application/json")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["words"][0]["text"], "MATH")

    def test_fails_safely_instead_of_claiming_an_unrecognized_word(self):
        url = reverse("educations:whiteboard_recognize")
        self.assertEqual(self.client.post(url, "not-json", content_type="application/json").status_code, 400)
        with patch("educations.whiteboard_recognition.recognize", side_effect=RecognitionUnavailable("Ink kept")):
            response = self.client.post(url, json.dumps({"strokes": MATH_STROKES}), content_type="application/json")
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.json()["error"], "Ink kept")

    def test_post_requires_csrf_and_only_expected_http_methods(self):
        url = reverse("educations:whiteboard_recognize")
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.post(url, json.dumps({"strokes": MATH_STROKES}), content_type="application/json").status_code, 403)
        self.assertEqual(self.client.delete(url).status_code, 405)

    def test_modes_are_validated_and_forwarded_without_interpreting_content(self):
        url=reverse('educations:whiteboard_recognize')
        with patch('educations.whiteboard_recognition.recognize',return_value={'words':[]}) as recognize_mock:
            response=self.client.post(url,json.dumps({'strokes':MATH_STROKES,'mode':'math'}),content_type='application/json')
            self.assertEqual(response.status_code,200)
            recognize_mock.assert_called_once_with(MATH_STROKES,'math')
        self.assertEqual(self.client.post(url,json.dumps({'strokes':MATH_STROKES,'mode':'execute'}),content_type='application/json').status_code,400)


@override_settings(WHITEBOARD_FORMULA_MODEL_DIR='missing-formula')
class TrainedHandwritingTests(SimpleTestCase):
    def test_real_engine_reads_math_strokes(self):
        self.assertTrue(recognition_status()["available"])
        self.assertTrue(any(name in recognition_status()["engine"] for name in ("Windows Ink", "PyTorch")))
        self.assertTrue(recognition_status()["reviewRequired"])
        result = recognize(MATH_STROKES)
        self.assertEqual(" ".join(word["text"] for word in result["words"]).upper(), "MATH")
        recognized_ids = {identity for word in result["words"] for identity in word["strokeIds"]}
        self.assertEqual(recognized_ids, {stroke["id"] for stroke in MATH_STROKES})

    def test_real_engine_keeps_a_stacked_fraction_and_operators(self):
        result = recognize(FRACTION_STROKES)
        self.assertEqual([w['text'] for w in result['words']],['(x)/(y) + 8 = t'])

    def test_real_engine_reads_signed_integers_and_numbers(self):
        result=recognize(INTEGER_STROKES)
        self.assertEqual([w['text'] for w in result['words']],['−12 + 3 = 8'])

    def test_real_engine_reads_and_spaces_a_paragraph(self):
        result=recognize(paragraph_strokes(),'text')
        self.assertEqual([w['text'].upper() for w in result['words']],['MATH IS FUN.\nWE LEARN MATHS.'])

    def test_real_engine_keeps_widely_spaced_math_as_a_word(self):
        result=recognize(WIDE_MATH_STROKES)
        self.assertEqual(' '.join(w['text'] for w in result['words']).upper(),'MATH')
        self.assertTrue(all(w['format']=='paragraph' for w in result['words']))

    def test_real_engine_keeps_a_large_heading_above_smaller_text(self):
        result=recognize(mixed_size_strokes())
        self.assertEqual([w['text'].upper() for w in result['words']],['MATH','MATH'])
        self.assertTrue(all(w['format']=='paragraph' for w in result['words']))
