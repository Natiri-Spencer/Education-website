import hashlib
import json
import tempfile
from pathlib import Path

import torch
from django.test import SimpleTestCase

from .ink_preprocessing import rasterize
from .neural_ink import load_model, recognize_groups, _text_body


class FixedCTC(torch.nn.Module):
    def __init__(self, ids):
        super().__init__()
        logits = torch.full((len(ids), 4), -20.)
        for row, identity in enumerate(ids):
            logits[row, identity] = 20.
        self.register_buffer("logits", logits)

    def forward(self, images: torch.Tensor):
        return self.logits.unsqueeze(0)


class NeuralInkTests(SimpleTestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.addCleanup(load_model.cache_clear)
        self.checkpoint = Path(self.directory.name)/"ink.pt"
        self.vocabulary = Path(self.directory.name)/"vocabulary.json"
        self.tokens = ["", "A", "B", "?"]
        self.vocabulary.write_text(json.dumps(self.tokens), encoding="utf-8")
        self.strokes = [dict(id="source", points=[[0, 0], [10, 20], [20, 0]])]

    def save(self, ids):
        metadata = dict(format="raster_ctc_v1", engine="test", review_required=True,
                        vocabulary_sha256=hashlib.sha256(json.dumps(self.tokens).encode()).hexdigest())
        torch.jit.save(torch.jit.script(FixedCTC(ids)), str(self.checkpoint),
                       _extra_files={"metadata.json": json.dumps(metadata)})

    def test_ctc_repeats_blanks_and_original_ids_and_box(self):
        self.save([0, 1, 1, 0, 1, 2, 0])
        result = recognize_groups([dict(id="g", strokes=self.strokes)], self.checkpoint, self.vocabulary)
        word = result["groups"][0]["result"]["words"][0]
        self.assertEqual(word["text"], "AAB")
        self.assertEqual(word["strokeIds"], ["source"])
        self.assertEqual(word["box"], dict(x=0, y=0, w=20, h=20))
        self.assertEqual(word["confidence"], "Intermediate")

    def test_rejects_mismatched_vocabulary(self):
        self.save([1])
        self.vocabulary.write_text(json.dumps(["", "B", "A", "?"]), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "does not match"):
            load_model(self.checkpoint, self.vocabulary)

    def test_blank_output_keeps_unread_ink(self):
        self.save([0, 0])
        result = recognize_groups([dict(id="g", strokes=self.strokes)], self.checkpoint, self.vocabulary)
        self.assertEqual(result["groups"][0]["result"]["words"], [])

    def test_raster_is_invariant_to_translation_and_uniform_scale(self):
        ink = [s["points"] for s in self.strokes]
        shifted = [[(x*3+90, y*3-20) for x, y in stroke] for stroke in ink]
        self.assertEqual(rasterize(ink).tobytes(), rasterize(shifted).tobytes())

    def test_text_period_survives_with_its_original_stroke_id(self):
        self.save([1])
        dot = dict(id="dot", points=[[25, 20]])
        result = recognize_groups([dict(id="g", mode="text", strokes=self.strokes+[dot])], self.checkpoint, self.vocabulary)
        word = result["groups"][0]["result"]["words"][0]
        self.assertEqual(word["text"], "A.")
        self.assertEqual(word["strokeIds"], ["source", "dot"])

    def test_dots_above_letters_and_colons_are_not_invented_periods(self):
        for dots in ([dict(id="high", points=[[25, 0]])],
                     [dict(id="upper", points=[[25, 10]]), dict(id="lower", points=[[25, 20]])]):
            ink = self.strokes+dots
            self.assertEqual(_text_body(ink), (ink, ""))

    def test_math_decimal_point_is_left_to_the_model(self):
        self.save([1])
        dot = dict(id="dot", points=[[25, 20]])
        result = recognize_groups([dict(id="g", mode="symbol", strokes=self.strokes+[dot])], self.checkpoint, self.vocabulary)
        self.assertEqual(result["groups"][0]["result"]["words"][0]["text"], "A")
