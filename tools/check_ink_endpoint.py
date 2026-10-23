"""Exercise the running local whiteboard API, including its real CSRF flow."""
import http.cookiejar
import argparse
import json
import os
import sys
from pathlib import Path
from urllib.request import Request, build_opener, HTTPCookieProcessor

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "spencer_project.settings")
import django
django.setup()
from educations.test_handwriting import FRACTION_STROKES, paragraph_strokes
from educations.test_calculus_ink import glyph, INTEGRAL, PARTIAL
from tools.check_handwritten_formula import SAMPLE, SECOND_SAMPLE, POWER_SAMPLE, ROOT_SAMPLE, INTEGRAL_SAMPLE


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--equations-only', action='store_true')
    args = parser.parse_args()
    base = "http://127.0.0.1:8000"
    endpoint = base+"/educations/whiteboard/recognize/"
    cookies = http.cookiejar.CookieJar()
    browser = build_opener(HTTPCookieProcessor(cookies))
    with browser.open(endpoint, timeout=30) as response:
        status = json.load(response)
    assert status["available"] and status['reviewRequired'], status
    assert status.get('formulaAvailable') and status.get('formulaModel') == 'PP-FormulaNet_plus-M', status
    with browser.open(base+"/educations/whiteboard/", timeout=30) as response:
        assert response.status == 200
        response.read()
    csrf = next(cookie.value for cookie in cookies if cookie.name == "csrftoken")

    def recognize(strokes, mode):
        request = Request(endpoint, data=json.dumps(dict(strokes=strokes, mode=mode)).encode(),
                          headers={"Content-Type": "application/json", "X-CSRFToken": csrf,
                                   "Referer": base+"/educations/whiteboard/"})
        with browser.open(request, timeout=150) as response:
            return json.load(response)

    equations = []
    for expected, strokes in (("2x+y=7", SAMPLE), ("3x+2y=12", SECOND_SAMPLE)):
        result = recognize(strokes, "math")
        assert [''.join(word["text"].split()) for word in result["words"]] == [''.join(expected.split())], result
        assert not result.get("unread") and any(name in result["engine"] for name in ("PP-FormulaNet_plus-M","windows-ink","geometric-layout")), result
        equations.append({"text": result["words"][0]["text"], "engine": result["engine"], "elapsedMs": result["elapsedMs"]})

    if args.equations_only:
        print(json.dumps(dict(status=status,equations=equations)))
        return

    advanced = {}
    for name, strokes in (("power", POWER_SAMPLE), ("root", ROOT_SAMPLE), ("integral", INTEGRAL_SAMPLE)):
        result = recognize(strokes, "math")
        assert result["words"] and not result.get("unread"), result
        advanced[name] = {"text": result["words"][0]["text"], "engine": result["engine"],
                          "elapsedMs": result["elapsedMs"]}

    math = recognize(FRACTION_STROKES, "math")
    assert math["words"] and all(word['needsReview'] for word in math['words']), math
    ids=[identity for word in math['words']+math.get('unread',[]) for identity in word['strokeIds']]
    assert set(ids)=={s['id'] for s in FRACTION_STROKES} and len(ids)==len(set(ids)),math
    paragraph = recognize(paragraph_strokes(), "text")
    assert paragraph["words"][0]["text"].upper() == "MATH IS FUN.\nWE LEARN MATHS.", paragraph
    assert all(word["needsReview"] for word in paragraph["words"]), paragraph
    calculus = []
    for points, symbol, width in ((INTEGRAL,"\u222b",25),(PARTIAL,"\u2202",60)):
        ink = [glyph("calculus-"+str(ord(symbol))+"-preserve-v12",points,0,0,width,100)]
        result = recognize(ink,"math")
        assert result['words'] and result['words'][0]['text'].strip() == symbol,result
        assert result["words"][0]["needsReview"], result
        calculus.append(result["words"][0]["text"].strip())
    with browser.open(base+"/static/educations/whiteboard_calculus.js", timeout=30) as response:
        assert b"normalizeSide" in response.read()
    print(json.dumps(dict(status=status, equations=equations, advanced=advanced, math=math["words"][0]["text"],
                          latex=math["words"][0].get("latex"), paragraph=paragraph["words"][0]["text"], calculus=calculus)))


if __name__ == "__main__":
    main()
