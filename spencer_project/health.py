"""Minimal readiness response; never expose connection details to visitors."""
from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_safe


@never_cache
@require_safe
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        cache.set("readiness", "ok", 30)
        if cache.get("readiness") != "ok":
            raise RuntimeError("Cache unavailable")
    except Exception:
        return JsonResponse({"status": "unavailable"}, status=503)
    return JsonResponse({"status": "ok"})


@never_cache
@require_safe
def backup_health(request):
    import json
    from datetime import datetime, timezone
    from django.conf import settings
    try:
        status = json.loads(settings.BACKUP_STATUS_FILE.read_text())
        last = datetime.fromisoformat(status['last_success'])
        good = not status.get('failed') and 0 <= (datetime.now(timezone.utc)-last).total_seconds() < 26*3600
    except (OSError, ValueError, KeyError, TypeError):
        good = False
    return JsonResponse({'status': 'ok' if good else 'attention'}, status=200 if good else 503)


@never_cache
@require_safe
def operations_health(request):
    from datetime import timedelta
    import shutil
    from django.conf import settings
    from django.utils import timezone
    from learning.models import Profile
    try:
        disk = shutil.disk_usage(settings.BASE_DIR)
        overdue = Profile.objects.filter(deletion_requested_at__lt=timezone.now()-timedelta(days=25)).exists()
        from datetime import datetime, timezone as tz
        root = settings.BACKUP_STATUS_FILE.parent
        last = datetime.fromisoformat((root/'restore-success.txt').read_text().strip())
        good = disk.used/disk.total < .8 and not overdue and not (root/'restore-failed').exists() and not (root/'application-error.json').exists() and (datetime.now(tz.utc)-last).total_seconds() < 35*86400
    except (OSError, ValueError, TypeError):
        good = False
    return JsonResponse({'status': 'ok' if good else 'attention'}, status=200 if good else 503)
