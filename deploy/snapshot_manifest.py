"""Counts and hashes for a coordinated, private restoration drill."""
import hashlib
import json
import os
from pathlib import Path
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spencer_project.settings')
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import django
django.setup()
from django.apps import apps
from django.conf import settings

root = Path(sys.argv[1]).resolve()
verify = '--verify' in sys.argv[2:]
models = [m for m in apps.get_models() if m._meta.app_label in {'auth','educations','learning'}]
counts = {m._meta.label_lower: m.objects.count() for m in models}
path = root/'manifest.json'
if verify:
    expected = json.loads(path.read_text())
    if counts != expected['counts']:
        raise SystemExit('Restored record counts do not match the coordinated snapshot.')
    actual = {p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() and p != path}
    if actual != set(expected['files']):
        raise SystemExit('Snapshot file inventory does not match.')
else:
    expected = {'counts': counts, 'files': {}}
for file in root.rglob('*'):
    if not file.is_file() or file == path:
        continue
    if not file.resolve().is_relative_to(root):
        raise SystemExit('Snapshot symlink leaves the snapshot directory.')
    name = file.relative_to(root).as_posix()
    actual_file = file
    if verify and name.startswith('media/'):
        actual_file = Path(settings.MEDIA_ROOT)/name[len('media/'):]
    elif verify and name.startswith('private-work/'):
        actual_file = Path(settings.PRIVATE_WORK_ROOT)/name[len('private-work/'):]
    with actual_file.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
    if verify and expected['files'].get(name) != digest:
        raise SystemExit('Snapshot integrity verification failed.')
    expected['files'][name] = digest
if not verify:
    path.write_text(json.dumps(expected, indent=2))
else:
    print('Snapshot counts and file integrity verified.')
