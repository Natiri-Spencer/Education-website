"""JSON-lines worker; model imports/output never contaminate the protocol."""
import argparse
import base64
import contextlib
import io
import json
import os
import sys


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--model-dir',required=True)
    parser.add_argument('--model',choices=['PP-FormulaNet_plus-S','PP-FormulaNet_plus-M','UniMERNet'],required=True)
    args=parser.parse_args()
    os.environ['PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK']='True'
    protocol=sys.stdout
    with contextlib.redirect_stdout(sys.stderr):
        import numpy as np
        from PIL import Image
        from paddleocr import FormulaRecognition
        model=FormulaRecognition(model_name=args.model,model_dir=args.model_dir,device='cpu',cpu_threads=2,enable_mkldnn=False)
    for line in sys.stdin:
        try:
            request=json.loads(line)
            if not isinstance(request.get('images'),list) or not 1<=len(request['images'])<=16:
                raise ValueError('Invalid batch')
            with contextlib.redirect_stdout(sys.stderr):
                images=[np.asarray(Image.open(io.BytesIO(base64.b64decode(data,validate=True))).convert('RGB'))[:,:,::-1].copy() for data in request['images']]
                result=list(model.predict(input=images,batch_size=min(4,len(images))))
                formulas=[item['rec_formula'] for item in result]
            response={'formulas':formulas}
        except Exception as error:
            print(str(error),file=sys.stderr,flush=True)
            response={'error':'Formula model could not read this region'}
        print(json.dumps(response),file=protocol,flush=True)


if __name__=='__main__': main()
