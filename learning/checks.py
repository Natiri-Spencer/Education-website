import logging
import re


class PrivatePathFilter(logging.Filter):
    def filter(self, record):
        message = record.getMessage()
        message = re.sub(r'(/accounts/(?:approval|finish|reset)/)[^\s"?]+', r'\1[private-link]', message)
        record.msg, record.args = message, ()
        return True


class OperationalErrorHandler(logging.Handler):
    """Record only an error timestamp, never request bodies, tokens or identities."""
    def emit(self, record):
        if getattr(record, 'status_code', 0) != 500:
            return
        try:
            from django.conf import settings
            from django.utils import timezone
            import json, os, threading
            root = settings.BACKUP_STATUS_FILE.parent
            root.mkdir(parents=True, exist_ok=True)
            temporary = root/f'error-{os.getpid()}-{threading.get_ident()}.tmp'
            temporary.write_text(json.dumps({'last_error': timezone.now().isoformat()}))
            temporary.replace(root/'application-error.json')
        except Exception:
            # Logging must never make the original request fail again.
            pass
