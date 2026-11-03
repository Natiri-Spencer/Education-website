"""Generate synthetic capacity-test users only on an explicitly local test host."""
import json
import os
from pathlib import Path
import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import BaseCommand, CommandError
from django.utils import timezone
from learning.models import POLICY_VERSION, Profile


class Command(BaseCommand):
    help = 'Create 20 synthetic test accounts on a localhost-only test deployment.'

    def add_arguments(self, parser):
        parser.add_argument('--output', required=True)

    def handle(self, *args, **options):
        if os.environ.get('ACADEMY_TEST_PROVISIONING') != '1' or not set(settings.ALLOWED_HOSTS) <= {'localhost','127.0.0.1','testserver'}:
            raise CommandError('Synthetic provisioning requires explicit test mode and localhost-only allowed hosts.')
        records=[]
        for index in range(20):
            name=f'capacity-test-{index:02d}'
            if get_user_model().objects.filter(username=name).exists():
                raise CommandError('Synthetic accounts already exist. Use a fresh isolated test database.')
            password=secrets.token_urlsafe(24)
            user=get_user_model().objects.create_user(name, password=password, email=f'{name}@example.invalid')
            Profile.objects.create(user=user,age_band='adult',email_verified_at=timezone.now(),policy_version=POLICY_VERSION)
            records.append({'username':name,'password':password})
        path=Path(options['output'])
        with path.open('x') as output:
            path.chmod(0o600)
            json.dump(records,output)
        from django.core.files.base import ContentFile
        from learning.models import Attachment, SavedWork
        owner=get_user_model().objects.get(username=records[0]['username'])
        content=b'%PDF-1.7\nSynthetic restoration fixture only.\n'
        asset=Attachment(owner=owner,key='capacity-fixture',name='synthetic.pdf',size=len(content),mime='application/pdf')
        asset.file.save('synthetic.pdf',ContentFile(content))
        payload={'format':1,'raw':json.dumps({'items':[{'type':'file','attachmentId':asset.key}]})}
        work=SavedWork.objects.create(owner=owner,key='grade7-capacity-fixture',title='Synthetic fixture',kind='notebook',payload=payload,size=len(json.dumps(payload).encode()))
        work.assets.add(asset)
        self.stdout.write('20 synthetic users created; private credentials written to the requested test file.')
