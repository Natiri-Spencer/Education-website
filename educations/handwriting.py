"""Bounded local PyTorch handwriting recognition and spatial math layout."""
import hashlib
import json
import math
import re
import time
from threading import BoundedSemaphore

from django.conf import settings
from django.core.cache import cache
from .ink_layout import recognize_layout


class RecognitionUnavailable(Exception):
    pass


_recognition_slots = BoundedSemaphore(2)


def _overlay_geometric_tokens(formula_text, diagnostic):
    """Keep formula structure while restoring independently proven glyphs.

    Only flat, one-to-one alphanumeric token layouts are eligible. Symbols
    sent to Windows/PyTorch remain untouched because their identity is not
    deterministic enough to override the formula reader.
    """
    if not diagnostic:
        return None
    nodes=[]
    def visit(items):
        for item in items:
            if item.get('kind')=='ink':
                nodes.append(item)
            visit(item.get('children',[]))
    for row in diagnostic.get('structure',[]):
        visit(row)
    # LaTeX command names describe structure and have no source glyph of their
    # own. Exclude them while retaining symbols inside their arguments.
    matches=[match for match in re.finditer(r'\\[A-Za-z]+|[A-Za-z]+|\d+(?:\.\d+)?',formula_text)
             if not match.group().startswith('\\')]
    if len(nodes)!=len(matches):
        return None
    uncertain={identity for group in diagnostic.get('groups',[]) for identity in group.get('strokeIds',[])}
    replacements=[]
    for node,match in zip(nodes,matches):
        text=node.get('text','')
        ids=set(node.get('strokeIds',[]))
        if ids and ids.isdisjoint(uncertain) and re.fullmatch(r'[A-Za-z]+|\d+(?:\.\d+)?',text) and text!=match.group():
            replacements.append((match.start(),match.end(),text))
    if not replacements:
        return None
    output=formula_text
    for start,end,text in reversed(replacements):
        output=output[:start]+text+output[end:]
    return output


def _layout_is_reliable(result, strokes):
    """Conservative fast path for fully covered, mostly geometric maths."""
    if result.get('unread') or not result.get('words') or not result.get('diagnostics'):
        return False
    if any('^(' in word.get('text','') or '_(' in word.get('text','') for word in result['words']):
        return False
    source_ids={stroke['id'] for stroke in strokes}
    assigned=[identity for word in result['words'] for identity in word.get('strokeIds',[])]
    if set(assigned)!=source_ids or len(assigned)!=len(set(assigned)):
        return False
    for diagnostic in result['diagnostics']:
        groups=diagnostic.get('groups',[])
        native_ids={identity for group in groups for identity in group.get('strokeIds',[])}
        region_ids=set(diagnostic.get('strokeIds',[]))
        if native_ids and len(native_ids)/max(1,len(region_ids))>.40:
            return False
        for group in groups:
            words=group.get('result',{}).get('words',[])
            covered={identity for word in words for identity in word.get('strokeIds',[])}
            if covered!=set(group.get('strokeIds',[])) or any(word.get('confidence')!='Strong' for word in words):
                return False
        kinds={node.get('kind') for row in diagnostic.get('structure',[]) for node in row}
        if not kinds or not kinds.issubset({'ink','operator'}):
            return False
    return all(word.get('format')=='math' for word in result['words'])


def recognition_status():
    from .formula_engine import configuration
    try:
        formula = configuration()
    except (OSError, ValueError):
        formula = None
    status = _text_status()
    status['reviewRequired'] = True
    status['formulaAvailable'] = bool(formula)
    if formula:
        status.update(available=True, engine=formula['model']+' + '+status.get('engine','text unavailable'),
                      formulaModel=formula['model'], formulaRevision=formula['revision'])
    return status


def _text_status():
    try:
        from .windows_ink import recognition_status as windows_status
        status = windows_status()
        return {"available": True, "engine": status["engine"] + " (Windows Ink)", "reviewRequired": True}
    except (ImportError, OSError, ValueError, RuntimeError, KeyError):
        pass
    try:
        from .neural_ink import load_model
        _, _, metadata = load_model(settings.WHITEBOARD_MODEL_PATH, settings.WHITEBOARD_VOCAB_PATH)
        return {"available": True, "engine": metadata["engine"], "reviewRequired": metadata.get("review_required", True)}
    except (ImportError, OSError, ValueError, RuntimeError, KeyError):
        return {"available": False, "message": "Check the PyTorch installation, model checkpoint and vocabulary configuration."}


def validate_strokes(payload):
    strokes = payload.get("strokes") if isinstance(payload, dict) else None
    if not isinstance(strokes, list) or not 1 <= len(strokes) <= 200:
        raise ValueError("Send between 1 and 200 handwriting strokes.")
    identities, cleaned, total = set(), [], 0
    for stroke in strokes:
        if not isinstance(stroke, dict):
            raise ValueError("Invalid handwriting stroke.")
        identity, points = stroke.get("id"), stroke.get("points")
        if not isinstance(identity, str) or not 1 <= len(identity) <= 100 or identity in identities:
            raise ValueError("Stroke identities must be unique.")
        if not isinstance(points, list) or not 1 <= len(points) <= 2500:
            raise ValueError("A stroke must have between 1 and 2500 points.")
        total += len(points)
        if total > 60000:
            raise ValueError("Too many handwriting points in one request.")
        for pair in points:
            if not isinstance(pair, list) or len(pair) != 2 or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or abs(v) > 1e6 for v in pair):
                raise ValueError("Invalid handwriting coordinates.")
        identities.add(identity)
        cleaned.append({"id": identity, "points": points})
    return cleaned


def recognize(strokes, mode="auto"):
    status = recognition_status()
    if not status["available"]:
        raise RecognitionUnavailable(status.get("message", "Handwriting recognition is unavailable."))
    from .formula_engine import configuration, recognize_formula
    from .ink_regions import VERSION
    formula_problem = None
    try:
        formula = configuration()
    except (OSError, ValueError):
        # A broken optional formula model must not disable the native text/math
        # recognizer. Keep the reason on every fallback suggestion for review.
        formula = None
        formula_problem = 'The formula model was unavailable, so this was read with the fallback recognizer.'
    model_path = settings.WHITEBOARD_MODEL_PATH
    from pathlib import Path
    signature = [(str(path), Path(path).stat().st_mtime_ns if Path(path).is_file() else None)
                 for path in (model_path, settings.WHITEBOARD_VOCAB_PATH)]
    encoded = json.dumps({"strokes": strokes, "mode": mode, "layoutVersion": 'preserve-v15-'+VERSION,
                          "engine": status["engine"], "model": signature, "formula": formula}, separators=(",", ":"))
    key = "whiteboard-ink:" + hashlib.sha256(encoded.encode()).hexdigest()
    previous = cache.get(key)
    if previous is not None:
        return previous
    if not _recognition_slots.acquire(blocking=False):
        raise RecognitionUnavailable("The handwriting engine is busy. Your ink is safe; try again shortly.")
    try:
        started=time.perf_counter()
        engines=[]
        def native(groups):
            try:
                from .windows_ink import recognize_groups as recognize_windows
                result=recognize_windows(groups)
                engines.append('windows-ink')
                return result
            except (ImportError, OSError, ValueError, RuntimeError, KeyError):
                from .neural_ink import recognize_groups
                result=recognize_groups(groups, settings.WHITEBOARD_MODEL_PATH, settings.WHITEBOARD_VOCAB_PATH)
                engines.append('raster-ctc-v1')
                return result
        from .ink_layout import equation_bar, equals_pair
        bars=[s for s in strokes if equation_bar(s)]
        has_equation=any(equals_pair(a,b,strokes) for i,a in enumerate(bars) for b in bars[i+1:])
        # Whole-formula decoders are accurate on expressions but can invent a
        # large structure for one isolated glyph. Keep one/two-stroke symbols
        # (including ∫ and ∂) in the deterministic layout/native path.
        use_formula=bool(formula and mode!='text' and (has_equation or mode=='math' and len(strokes)>=3))
        formula_failed = False
        comparison = None
        if use_formula:
            try:
                comparison=recognize_layout(strokes,native,mode)
            except (OSError,ValueError,RuntimeError,ImportError,KeyError):
                comparison=None
            if _layout_is_reliable(comparison or {},strokes):
                response=comparison
                use_formula=False
            else:
                try:
                    response = recognize_formula(strokes, formula)
                except (OSError, ValueError, RuntimeError, ImportError):
                    # Recognition is advisory: a model timeout/crash must never
                    # turn valid ink into a blank correction or a failed request.
                    formula_failed = True
                    response = comparison if comparison is not None else recognize_layout(strokes, native, mode)
        else:
            response = recognize_layout(strokes, native, mode)
        if use_formula and not formula_failed:
            if comparison is None:
                try:
                    comparison=recognize_layout(strokes,native,mode)
                except (OSError,ValueError,RuntimeError,ImportError,KeyError):
                    comparison=None
            for word in response['words']:
                matches=[w for w in comparison['words'] if set(w['strokeIds'])==set(word['strokeIds'])] if comparison else []
                candidates=[dict(text=word['text'],engine=formula['model'],notation='latex')]
                if len(matches)==1:
                    other=matches[0]
                    candidates.append(dict(text=other['text'],engine='+'.join(sorted(set(engines))) or 'geometric-layout',notation='plain'))
                    diagnostic=next((item for item in comparison.get('diagnostics',[]) if item.get('lineIndex')==word.get('lineIndex')),None)
                    overlaid=_overlay_geometric_tokens(word['text'],diagnostic)
                    if overlaid:
                        word.update(text=overlaid,latex=overlaid,rawText=overlaid)
                    if overlaid:
                        word['reviewReasons']=['Geometrically confirmed glyphs were retained inside the formula reading. Check the complete expression against the original ink.']
                    elif ''.join(word['text'].split())!=''.join(other['text'].split()):
                        word['alternatives']=[other['text']]
                        word['reviewReasons']=['The two readers disagree. Check the original ink and choose or edit the exact reading.']
                    else:
                        word['reviewReasons']=['Both readers give the same symbols. Check them against your handwriting before replacing this line.']
                else:
                    word['reviewReasons']=['An independent reading could not confirm this region. Check every symbol or keep the ink.']
                word['candidates']=candidates
            response['comparisonDiagnostics']=comparison.get('diagnostics',[]) if comparison else []
        from .math_validation import validate_math
        response["words"] = [validate_math(word) for word in response["words"]]
        for word in response["words"]:
            word["tokens"] = re.findall(r"\w+|[^\w\s]", word["text"])
        actual_engine=(formula['model']+'; comparison='+('+'.join(sorted(set(engines))) or 'geometric-layout')) if use_formula and not formula_failed else '+'.join(sorted(set(engines))) or 'geometric-layout'
        # Review is mandatory until real handwriting acceptance is calibrated.
        # Reject overlapping/unknown source assignments instead of combining
        # conflicting expressions and silently losing their ink.
        source_ids={s['id'] for s in strokes}
        counts={identity:0 for identity in source_ids}
        for word in response['words']+response.get('unread',[]):
            for identity in word.get('strokeIds',[]):
                counts[identity]=counts.get(identity,0)+1
        kept=[]
        for word in response['words']:
            ids=word.get('strokeIds',[])
            if not ids or any(counts.get(identity)!=1 or identity not in source_ids for identity in ids):
                continue
            word.update(needsReview=True,engine=word.get('engine',actual_engine),
                        rawText=word.get('rawText',word['text']))
            word.setdefault('reviewReasons',['Check this reading against the original ink.'])
            if formula_failed or formula_problem:
                word['reviewReasons'].append(formula_problem or 'The formula recognizer did not respond, so this was read with the fallback recognizer.')
            kept.append(word)
        response['words']=kept
        covered={identity for word in kept for identity in word['strokeIds']}
        from .ink_layout import box
        from .ink_regions import equation_lines
        response['unread']=[]
        for index,region in enumerate(equation_lines([s for s in strokes if s['id'] not in covered]) if len(covered)<len(strokes) else []):
            response['unread'].append(dict(text='',format='math' if mode=='math' else 'paragraph',
                strokeIds=[s['id'] for s in region],box=box(region),needsReview=True,lineIndex=index,
                reviewReasons=['This region could not be read reliably. Keep the ink or enter its exact text.']))
        response['words'].sort(key=lambda w:(w.get('box',{}).get('y',0),w.get('box',{}).get('x',0)))
        response.update(engine=actual_engine,reviewRequired=True,pipelineVersion='preserve-v15-'+VERSION,
                        elapsedMs=round((time.perf_counter()-started)*1000),
                        formulaAvailable=bool(formula))
        # Reopening review and retrying unchanged ink should be instant. The
        # key includes every stroke, mode, engine and model revision.
        cache.set(key, response, 300)
        return response
    except (OSError, ValueError, RuntimeError, ImportError) as error:
        raise RecognitionUnavailable("The handwriting engine did not respond. Your original ink has been kept.") from error
    finally:
        _recognition_slots.release()
