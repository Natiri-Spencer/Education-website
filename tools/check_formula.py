"""Check hashes and real inference before enabling the local formula engine.

This checks runtime operation on a printed equation, not handwriting accuracy.
"""
import hashlib
import argparse
import json
import os
from pathlib import Path
import sys
import time

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','spencer_project.settings')


def main():
    import django
    django.setup()
    from django.conf import settings
    from PIL import Image,ImageDraw,ImageFont
    from educations.formula_engine import configuration,predict,_stop
    parser=argparse.ArgumentParser()
    parser.add_argument('--model-dir',type=Path)
    args=parser.parse_args()
    if args.model_dir:
        settings.WHITEBOARD_FORMULA_MODEL_DIR=str(args.model_dir.resolve())
    config=configuration(require_ready=False)
    if not config: raise RuntimeError('Provision the model and isolated runtime first')
    directory=Path(config['directory'])
    metadata=json.loads((directory/'manifest.json').read_text(encoding='utf-8'))
    for name,expected in metadata['files'].items():
        with (directory/name).open('rb') as source:
            if hashlib.file_digest(source,'sha256').hexdigest()!=expected:
                raise ValueError('Model hash mismatch: '+name)
    image=Image.new('RGB',(540,140),'white')
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',64)
    ImageDraw.Draw(image).text((24,25),'2x + 5 = 7',font=font,fill='black')
    settings.WHITEBOARD_FORMULA_TIMEOUT=120
    timings=[];readings=[]
    try:
        for _ in range(2):
            started=time.perf_counter()
            reading=predict([image],config)[0]
            timings.append(round((time.perf_counter()-started)*1000));readings.append(reading)
        if any(''.join(reading.split())!='2x+5=7' for reading in readings):
            raise RuntimeError('Equation smoke check failed: '+repr(readings))
    finally: _stop()
    report=dict(model=config['model'],revision=config['revision'],runtimeReady=True,
                smokeInput='2x + 5 = 7',readings=readings,coldMs=timings[0],warmMs=timings[1],
                handwritingAccuracyMeasured=False,automaticReplacementEnabled=False)
    (directory/'ready.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))


if __name__=='__main__': main()
