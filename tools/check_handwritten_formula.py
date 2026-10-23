"""Run a real stroke crop through the configured handwritten-formula model."""
import json
import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "spencer_project.settings")
import django
django.setup()

from educations.handwriting import recognize
from educations.test_handwriting import FRACTION_STROKES, THREE, shifted
from educations.test_calculus_ink import INTEGRAL, glyph


def stroke(identity, *points):
    return {"id": identity, "points": [list(point) for point in points]}


SAMPLE = [
    stroke("two", (0, 5), (8, 0), (15, 8), (0, 28), (17, 28)),
    stroke("x1", (24, 0), (42, 28)), stroke("x2", (24, 28), (42, 0)),
    stroke("plus-h", (50, 15), (68, 14)), stroke("plus-v", (59, 5), (59, 25)),
    stroke("y", (76, 0), (84, 17), (92, 0), (84, 31)),
    stroke("eq-top", (102, 10), (112, 9), (124, 12), (134, 11)),
    stroke("eq-bottom", (103, 20), (114, 18), (125, 22), (135, 20)),
    stroke("seven", (145, 2), (164, 2), (151, 30)),
]

SECOND_SAMPLE = [
    stroke("three", (0, 2), (12, 0), (18, 7), (11, 14), (5, 15), (13, 16), (19, 23), (12, 30), (0, 28)),
    stroke("x1", (25, 0), (43, 30)), stroke("x2", (25, 30), (43, 0)),
    stroke("plus-h", (50, 15), (68, 15)), stroke("plus-v", (59, 5), (59, 25)),
    stroke("two", (75, 5), (83, 0), (91, 8), (75, 28), (93, 28)),
    stroke("y", (100, 0), (108, 17), (116, 0), (108, 31)),
    stroke("eq-top", (125, 10), (157, 10)), stroke("eq-bottom", (125, 20), (157, 20)),
    stroke("one", (168, 6), (176, 0), (176, 30)),
    stroke("result-two", (186, 5), (194, 0), (202, 8), (186, 28), (204, 28)),
]

POWER_SAMPLE = [
    stroke('x-a',(0,0),(30,60)), stroke('x-b',(30,0),(0,60)),
    stroke('power',(38,-20),(55,-20),(38,5),(55,5)),
    stroke('eq-1',(85,20),(115,20)), stroke('eq-2',(85,40),(115,40)),
    shifted(THREE,140,0,'power-result'),
]

ROOT_SAMPLE = [stroke('root',(0,35),(10,45),(22,0),(85,0)), shifted(THREE,35,10,'root-value')]

INTEGRAL_SAMPLE = [
    glyph('integral',INTEGRAL,0,0,25,100),
    stroke('integrand-x-a',(50,28),(78,72)), stroke('integrand-x-b',(78,28),(50,72)),
    stroke('d-loop',(100,45),(104,36),(114,33),(122,38),(124,49),(120,60),(110,65),(101,58),(100,45)),
    stroke('d-stem',(123,16),(123,65)),
    stroke('dx-a',(140,30),(165,70)), stroke('dx-b',(165,30),(140,70)),
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', type=Path)
    args = parser.parse_args()
    if args.model_dir:
        from django.conf import settings
        settings.WHITEBOARD_FORMULA_MODEL_DIR = str(args.model_dir.resolve())
    report = []
    cases = (("2x+y=7", SAMPLE), ("3x+2y=12", SECOND_SAMPLE),
             (r"\frac{x}{y}+8=t", FRACTION_STROKES), (r"x^{2}=3", POWER_SAMPLE),
             ("sqrt(3)", ROOT_SAMPLE), (r"\int x\,dx", INTEGRAL_SAMPLE))
    for expected, sample in cases:
        result = recognize(sample, "math")
        covered = {identity for word in result["words"] + result["unread"] for identity in word["strokeIds"]}
        assert covered == {item["id"] for item in sample}, result
        readings = [word["text"] for word in result["words"]]
        report.append({"expected": expected, "readings": readings, "unreadRegions": len(result["unread"]),
                       "engine": result["engine"], "elapsedMs": result["elapsedMs"], "allInkCovered": True})
    print(json.dumps(report, ensure_ascii=False, indent=2))
