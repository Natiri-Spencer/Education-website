"""Replay locally exported ink, optionally score author-verified transcriptions.

Examples:
  Scripts/python.exe tools/evaluate_handwriting.py examples --engine legacy --report tmp/baseline.json
  Scripts/python.exe tools/evaluate_handwriting.py examples --engine formula --report tmp/formula.json
"""
import argparse
import json
import os
from pathlib import Path
import sys
import time

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','spencer_project.settings')


def distance(a,b):
    row=list(range(len(b)+1))
    for i,x in enumerate(a,1):
        next_row=[i]
        for j,y in enumerate(b,1):
            next_row.append(min(next_row[-1]+1,row[j]+1,row[j-1]+(x!=y)))
        row=next_row
    return row[-1]


def main():
    import django
    django.setup()
    from django.conf import settings
    from django.core.cache import cache
    from educations.handwriting import recognize,validate_strokes
    from educations.formula_engine import configuration,recognize_formula
    from educations.ink_regions import equation_lines,formula_crop
    parser=argparse.ArgumentParser()
    parser.add_argument('input',type=Path)
    parser.add_argument('--engine',choices=['configured','legacy','formula'],default='configured')
    parser.add_argument('--model-dir',type=Path)
    parser.add_argument('--report',type=Path,required=True)
    parser.add_argument('--crops',type=Path)
    args=parser.parse_args()
    paths=sorted(args.input.glob('*.json')) if args.input.is_dir() else [args.input]
    reports=[];matches=lines=errors=characters=verified=symbol_matches=symbol_errors=symbol_characters=0
    kinds=set()
    for path in paths:
        sample=json.loads(path.read_text(encoding='utf-8-sig'))
        kinds.add(sample.get('datasetKind','user-ink'))
        strokes=validate_strokes(sample)
        if args.model_dir: settings.WHITEBOARD_FORMULA_MODEL_DIR=str(args.model_dir.resolve())
        if args.engine=='legacy': settings.WHITEBOARD_FORMULA_MODEL_DIR=str(ROOT/'tmp/not-configured-formula')
        cache.clear()
        if args.crops:
            directory=args.crops/path.stem;directory.mkdir(parents=True,exist_ok=True)
            for i,region in enumerate(equation_lines(strokes)):
                formula_crop(region).save(directory/f'line-{i+1}.png')
        started=time.perf_counter()
        try:
            if args.engine=='formula':
                config=configuration()
                if config is None: raise ValueError('Provision formula model first')
                result=recognize_formula(strokes,config)
            else: result=recognize(strokes,sample.get('mode','math'))
            actual=result['words']
            report=dict(file=str(path),elapsedMs=round((time.perf_counter()-started)*1000),result=result,verified=sample.get('verified') is True)
            if sample.get('verified') is True:
                if not sample.get('writer') or not sample.get('session') or not sample.get('expected'):
                    raise ValueError('Verified examples require writer, session and expected lines')
                expected=sample['expected']
                source_ids={s['id'] for s in strokes}
                expected_ids=[identity for word in expected for identity in word['strokeIds']]
                if set(expected_ids)!=source_ids or len(expected_ids)!=len(source_ids):
                    raise ValueError('Expected lines must cover each source stroke exactly once')
                verified+=1
                # Score per author-labeled source region, never algebraic equivalence.
                per_line=[]
                for word in expected:
                    candidates=[w for w in actual if set(w['strokeIds'])==set(word['strokeIds'])]
                    predicted=candidates[0]['text'] if len(candidates)==1 else ''
                    truth=word['text']; exact=predicted==truth
                    matches+=int(exact);lines+=1;errors+=distance(truth,predicted);characters+=len(truth)
                    # Ignore only whitespace in math; preserve case, signs,
                    # numbers and structure. Never compare by solved value.
                    a=''.join(truth.split()) if word.get('format')=='math' else truth
                    b=''.join(predicted.split()) if word.get('format')=='math' else predicted
                    symbol_matches+=int(a==b);symbol_errors+=distance(a,b);symbol_characters+=len(a)
                    per_line.append(dict(expected=truth,actual=predicted,exact=exact,sameSymbols=a==b,regionMatched=len(candidates)==1))
                report['lines']=per_line
            reports.append(report)
        except Exception as error:
            reports.append(dict(file=str(path),error=str(error),elapsedMs=round((time.perf_counter()-started)*1000)))
    output=dict(engine=args.engine,examples=len(paths),verifiedExamples=verified,scoredLines=lines,
                exactLineAccuracy=matches/lines if lines else None,characterErrorRate=errors/characters if characters else None,
                symbolLineAccuracy=symbol_matches/lines if lines else None,symbolErrorRate=symbol_errors/symbol_characters if symbol_characters else None,
                automaticAcceptanceEnabled=False,datasetKinds=sorted(kinds),results=reports)
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(output,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in output.items() if k!='results'},indent=2))
    if any('error' in item for item in reports): sys.exit(1)


if __name__=='__main__': main()
