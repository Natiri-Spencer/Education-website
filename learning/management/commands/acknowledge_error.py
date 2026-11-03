from django.conf import settings
from django.core.management import BaseCommand
from learning.models import AuditEvent


class Command(BaseCommand):
    help = 'Acknowledge an application error only after diagnosis and repair.'

    def add_arguments(self, parser):
        parser.add_argument('--note', required=True)

    def handle(self, *args, **options):
        AuditEvent.objects.create(action='operational_error_acknowledged', note=options['note'][:400])
        (settings.BACKUP_STATUS_FILE.parent/'application-error.json').unlink(missing_ok=True)
        self.stdout.write('Error alert acknowledged. Verify operations health and retain the incident reference.')
