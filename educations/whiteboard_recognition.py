import hashlib
import json
import sys
import time

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from .handwriting import RecognitionUnavailable, recognition_status, recognize, validate_strokes


@require_http_methods(["GET", "POST"])
def recognize_handwriting(request):
    if request.method == "GET":
        status=recognition_status()
        if status.get('formulaAvailable') and getattr(settings,'WHITEBOARD_FORMULA_PREWARM',True) and 'test' not in sys.argv:
            try:
                from .formula_engine import configuration,start_warmup
                config=configuration()
                if config:
                    status['formulaWarmupStarted']=start_warmup(config)
            except (OSError,ValueError,RuntimeError,ImportError):
                status['formulaWarmupStarted']=False
        response = JsonResponse(status)
        response["Cache-Control"] = "no-store"
        return response
    if len(request.body) > 1500000:
        return JsonResponse({"error": "Handwriting request is too large."}, status=413)
    try:
        payload = json.loads(request.body)
        strokes = validate_strokes(payload)
        mode = payload.get("mode", "auto")
        if mode not in ("auto", "text", "math"):
            raise ValueError("Invalid recognition mode.")
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Send valid handwriting strokes as JSON."}, status=400)
    identity = hashlib.sha256(request.META.get("REMOTE_ADDR", "local").encode()).hexdigest()[:20]
    key = "ink-limit:%s:%s" % (identity, int(time.time() // 60))
    if cache.add(key, 1, 65):
        count = 1
    else:
        try:
            count = cache.incr(key)
        except ValueError:
            count = 1
    if count > 90:
        return JsonResponse({"error": "Please pause briefly before correcting more handwriting."}, status=429)
    try:
        return JsonResponse(recognize(strokes, mode))
    except RecognitionUnavailable as error:
        return JsonResponse({"error": str(error)}, status=503)
