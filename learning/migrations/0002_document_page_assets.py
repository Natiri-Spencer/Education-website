import json

from django.db import migrations


def repair_document_assets(apps, schema_editor):
    Attachment = apps.get_model('learning', 'Attachment')

    def find_ids(value):
        if isinstance(value, dict):
            if value.get('type') in {'file', 'document-page'}:
                key = value.get('attachmentId')
                if isinstance(key, str):
                    yield key
            for child in value.values():
                yield from find_ids(child)
        elif isinstance(value, list):
            for child in value:
                yield from find_ids(child)

    for name in ('SavedWork', 'Submission'):
        model = apps.get_model('learning', name)
        for work in model.objects.iterator(chunk_size=100):
            try:
                raw = work.payload.get('raw', '')
                native = json.loads(raw) if isinstance(raw, str) else raw
                keys = set(find_ids(native))
            except (ValueError, TypeError, AttributeError, RecursionError):
                continue
            work.assets.add(*Attachment.objects.filter(owner_id=work.owner_id, key__in=keys))


class Migration(migrations.Migration):
    dependencies = [('learning', '0001_initial')]
    operations = [migrations.RunPython(repair_document_assets, migrations.RunPython.noop)]
