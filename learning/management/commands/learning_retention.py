from datetime import timedelta
from django.core.management import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from learning.models import AuditEvent, Profile, SignupRequest


class Command(BaseCommand):
    help = 'Remove abandoned signup requests; explicitly approve a verified account-deletion request.'

    def add_arguments(self, parser):
        parser.add_argument('--approve-deletion', type=int)
        parser.add_argument('--authority-note')

    def handle(self, *args, **options):
        count, _ = SignupRequest.objects.filter(created_at__lt=timezone.now()-timedelta(days=7)).delete()
        self.stdout.write(f'Expired signup records removed: {count}')
        pk = options['approve_deletion']
        if pk:
            if not options['authority_note']:
                raise CommandError('Record the verified authority and retention review, without identity numbers.')
            with transaction.atomic():
                profile = Profile.objects.select_for_update().filter(user_id=pk, deletion_requested_at__isnull=False).first()
                if not profile or profile.user.is_staff or profile.user.is_superuser:
                    raise CommandError('No eligible non-staff deletion request.')
                if profile.user.course_enrollments.exists():
                    raise CommandError('Historical enrollment records require an administrator retention review before deletion.')
                AuditEvent.objects.create(subject=profile.user, action='deletion_approved', note=options['authority_note'][:400])
                profile.user.delete()
            self.stdout.write('Approved account and private learning records deleted. Backup expiry remains separate.')
        overdue = Profile.objects.filter(deletion_requested_at__lt=timezone.now()-timedelta(days=25)).count()
        self.stdout.write(f'Deletion requests approaching or beyond 30 days: {overdue}')
