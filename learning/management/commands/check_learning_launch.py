from django.conf import settings
from django.core.management import BaseCommand, CommandError
from pathlib import Path


class Command(BaseCommand):
    help = 'Fail the public-launch gate if external configuration or recorded reviews are missing.'

    def handle(self, *args, **options):
        missing = []
        for name in ('PUBLIC_CONTACT_EMAIL', 'SUPPORT_EMAIL', 'EMAIL_HOST_PASSWORD'):
            if not getattr(settings, name, ''):
                missing.append(name)
        if settings.DEFAULT_FROM_EMAIL.endswith('@localhost'):
            missing.append('verified DEFAULT_FROM_EMAIL')
        if settings.EMAIL_BACKEND != 'django.core.mail.backends.smtp.EmailBackend':
            missing.append('production SMTP email backend')
        if settings.DEBUG:
            missing.append('production DEBUG=False')
        gate = Path(settings.BACKUP_STATUS_FILE).parent/'launch-approval.json'
        try:
            import json
            approval = json.loads(gate.read_text())
            for key in ('kenyan_privacy_review', 'teacher_content_approval', 'restore_test', 'supervised_trial', 'load_test_20_sessions', 'smtp_delivery_test'):
                if not approval.get(key):
                    missing.append(key)
        except (OSError, ValueError):
            missing.append('runtime/launch-approval.json with documented reviews')
        if missing:
            raise CommandError('Public launch is not signed off: '+', '.join(missing))
        self.stdout.write('Configured launch gates recorded. This is not regulatory certification.')
