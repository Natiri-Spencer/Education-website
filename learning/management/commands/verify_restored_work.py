from pathlib import Path
from django.conf import settings
from django.core.management import BaseCommand, CommandError
from learning.models import Attachment, SavedWork, Submission
from educations.models import PDFResource, VideoResource, ImageResource
from learning.services import attachment_ids
import json


class Command(BaseCommand):
    help = 'Check restored file references and immutable-submission attachments.'

    def handle(self, *args, **options):
        missing = 0
        for model, field in ((Attachment,'file'),(PDFResource,'pdf_file'),(VideoResource,'video_file'),(ImageResource,'image_file')):
            for item in model.objects.all():
                value=getattr(item,field)
                if value and not value.storage.exists(value.name):
                    missing+=1
        for model in (SavedWork,Submission):
            for item in model.objects.all():
                try:
                    raw=item.payload.get('raw','')
                    native=json.loads(raw) if raw.strip().startswith(('{','[')) else raw
                    if attachment_ids(native) - set(item.assets.values_list('key',flat=True)):
                        missing+=1
                except (ValueError,TypeError):
                    missing+=1
        if missing:
            raise CommandError(f'Restored references needing repair: {missing}')
        self.stdout.write('Restored database references, uploads and private attachments verified.')
