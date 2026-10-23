"""Bounded, persistent formula worker in an isolated Python environment."""
import base64
import atexit
import contextlib
import io
import json
import subprocess
from pathlib import Path
from queue import Queue, Empty
from threading import Lock, Thread
from django.conf import settings
from .ink_regions import equation_lines, formula_crop
from .ink_layout import box

_lock = Lock()
_process = None
_queue = None
_identity = None
_warm_guard = Lock()
_warm_thread = None
_warm_identity = None


def configuration(require_ready=True):
    directory = Path(settings.WHITEBOARD_FORMULA_MODEL_DIR)
    manifest = directory / 'manifest.json'
    python = Path(settings.WHITEBOARD_FORMULA_PYTHON)
    if not manifest.is_file() or not python.is_file():
        return None
    if require_ready and not (directory/'ready.json').is_file():
        return None
    metadata = json.loads(manifest.read_text(encoding='utf-8'))
    if metadata.get('name') not in ('PP-FormulaNet_plus-S', 'PP-FormulaNet_plus-M', 'UniMERNet') or not metadata.get('revision'):
        raise ValueError('Invalid formula model manifest')
    if require_ready:
        ready=json.loads((directory/'ready.json').read_text(encoding='utf-8'))
        if not ready.get('runtimeReady') or ready.get('revision')!=metadata['revision']:
            return None
    if any(not (directory / name).is_file() for name in ('inference.json','inference.pdiparams','inference.yml')):
        raise ValueError('Incomplete formula model')
    return dict(engine='paddle-formula', model=metadata['name'], revision=metadata['revision'],
                directory=str(directory), python=str(python))


def _stop():
    global _process, _queue, _identity
    if _process is not None:
        if _process.poll() is None:
            _process.kill()
        _process.wait(timeout=5)
        for pipe in (_process.stdin,_process.stdout):
            if pipe:
                with contextlib.suppress(OSError,ValueError): pipe.close()
    _process = _queue = _identity = None


atexit.register(_stop)


def start_warmup(config):
    """Load the configured worker in the background before the first formula."""
    global _warm_thread, _warm_identity
    identity=json.dumps(config,sort_keys=True)
    with _warm_guard:
        if _process is not None and _process.poll() is None and _identity==identity:
            return False
        if _warm_thread is not None and _warm_thread.is_alive() and _warm_identity==identity:
            return False
        def run():
            try:
                from PIL import Image,ImageDraw
                image=Image.new('RGB',(180,72),'white')
                draw=ImageDraw.Draw(image)
                draw.line([(18,42),(45,18),(72,42)],fill='black',width=3)
                draw.line([(92,28),(150,28)],fill='black',width=3)
                draw.line([(92,42),(150,42)],fill='black',width=3)
                predict([image],config)
            except (OSError,ValueError,RuntimeError,ImportError):
                pass
        _warm_identity=identity
        _warm_thread=Thread(target=run,name='formula-warmup',daemon=True)
        _warm_thread.start()
        return True


def predict(images, config):
    global _process, _queue, _identity
    # Requests are already bounded by handwriting._recognition_slots. Give a
    # warm worker time to finish the preceding line instead of needlessly
    # failing into a less accurate engine after one second.
    if not _lock.acquire(timeout=max(settings.WHITEBOARD_FORMULA_TIMEOUT,settings.WHITEBOARD_FORMULA_STARTUP_TIMEOUT)):
        raise RuntimeError('Formula recognition is busy')
    try:
        identity = json.dumps(config,sort_keys=True)
        starting = _process is None or _process.poll() is not None or _identity != identity
        if starting:
            _stop()
            _process = subprocess.Popen([config['python'], str(Path(__file__).resolve().parents[1]/'tools/formula_worker.py'),
                                        '--model-dir',config['directory'],'--model',config['model']],
                                       stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,
                                       text=True,encoding='utf-8',creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
            queue = Queue()
            def read_output(process, output):
                for line in process.stdout:
                    output.put(line)
                output.put(None)
            Thread(target=read_output,args=(_process,queue),daemon=True).start()
            _queue, _identity = queue, identity
        encoded=[]
        for image in images:
            stream=io.BytesIO(); image.save(stream,format='PNG')
            encoded.append(base64.b64encode(stream.getvalue()).decode('ascii'))
        _process.stdin.write(json.dumps({'images':encoded})+'\n'); _process.stdin.flush()
        line = _queue.get(timeout=settings.WHITEBOARD_FORMULA_STARTUP_TIMEOUT if starting else settings.WHITEBOARD_FORMULA_TIMEOUT)
        if line is None: raise RuntimeError('Formula worker stopped')
        result=json.loads(line)
        if result.get('error'): raise RuntimeError(result['error'])
        formulas=result.get('formulas')
        if not isinstance(formulas,list) or len(formulas)!=len(images) or any(not isinstance(s,str) or len(s)>5000 for s in formulas):
            raise ValueError('Invalid formula worker response')
        return formulas
    except (Empty,OSError,ValueError,RuntimeError) as error:
        _stop()
        raise RuntimeError('Formula recognition failed; original handwriting is kept') from error
    finally:
        _lock.release()


def recognize_formula(strokes, config):
    regions=equation_lines(strokes)
    if len(regions)>16: raise ValueError('Review at most 16 equation lines at once')
    formulas=predict([formula_crop(region) for region in regions],config)
    words,unread=[],[]
    for index,(region,text) in enumerate(zip(regions,formulas)):
        b=box(region)
        word=dict(text=text.strip(),format='math',strokeIds=[s['id'] for s in region],box=b,
                  fontSize=max(20,min(64,b['h']*.9)),alternatives=[],needsReview=True,
                  reviewReasons=['Check every symbol against your handwriting.'],
                  lineIndex=index,engine=config['engine'],model=config['model'],modelRevision=config['revision'],
                  rawText=text,notation='latex')
        if word['text']:
            word['latex']=word['text']; words.append(word)
        else: unread.append(word)
    return dict(words=words,unread=unread,diagnostics=[dict(lineIndex=i,box=box(region),
        strokeIds=[s['id'] for s in region],rawText=text,model=config['model'],modelRevision=config['revision'])
        for i,(region,text) in enumerate(zip(regions,formulas))])
