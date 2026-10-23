"""Download official inference weights, record hashes, and enable local serving."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import tarfile
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
MODELS=('PP-FormulaNet_plus-S','PP-FormulaNet_plus-M','UniMERNet')


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--model',choices=MODELS,default=MODELS[0])
    args=parser.parse_args()
    target=ROOT/'models/formula'/args.model
    target.mkdir(parents=True,exist_ok=True)
    manifest=target/'manifest.json'
    if manifest.exists():
        print('Already provisioned:',target); return
    url=f'https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/{args.model}_infer.tar'
    archive=ROOT/'tmp'/f'{args.model}_infer.tar'
    archive.parent.mkdir(parents=True,exist_ok=True)
    if not archive.exists():
        partial=archive.with_suffix('.partial')
        print('Downloading official weights:',url,flush=True)
        with urllib.request.urlopen(url,timeout=120) as response,partial.open('wb') as output:
            shutil.copyfileobj(response,output)
        partial.replace(archive)
    print('Checking archive and recording model hashes',flush=True)
    files={}
    with tarfile.open(archive) as source:
        for name in ('inference.json','inference.pdiparams','inference.yml'):
            candidates=[item for item in source.getmembers() if Path(item.name).name==name and item.isfile()]
            if len(candidates)!=1: raise ValueError('Unexpected model archive layout: '+name)
            with source.extractfile(candidates[0]) as stream,(target/name).open('wb') as output:
                shutil.copyfileobj(stream,output)
            with (target/name).open('rb') as source_file:
                files[name]=hashlib.file_digest(source_file,'sha256').hexdigest()
    revision=hashlib.sha256(json.dumps(files,sort_keys=True).encode()).hexdigest()
    manifest.write_text(json.dumps(dict(name=args.model,revision=revision,files=files,source=url),indent=2)+'\n',encoding='utf-8')
    print('Model ready:',target,flush=True)


if __name__=='__main__': main()
