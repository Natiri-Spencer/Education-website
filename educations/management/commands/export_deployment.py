"""Portable, private database fixture and uploaded-file snapshot."""
import hashlib
import io
import json
from pathlib import Path
import zipfile

from django.conf import settings
from django.core.management import BaseCommand, CommandError, call_command
from django.db import transaction

from educations.models import ImageResource, PDFResource, VideoResource


class Command(BaseCommand):
    help = "Export accounts, learning content and uploads to a private deployment ZIP."

    def add_arguments(self, parser):
        parser.add_argument("output", type=Path)

    def handle(self, *args, **options):
        output = options["output"].resolve()
        if output.exists():
            raise CommandError("Output already exists; choose a new filename.")
        root = Path(settings.MEDIA_ROOT).resolve()
        private = Path(settings.PRIVATE_WORK_ROOT).resolve()
        files = sorted(p for p in root.rglob("*") if p.is_file()) if root.exists() else []
        for path in files:
            if not path.resolve().is_relative_to(root):
                raise CommandError("An upload symlink points outside MEDIA_ROOT.")
        missing = []
        for model, field in ((PDFResource, "pdf_file"), (VideoResource, "video_file"), (ImageResource, "image_file")):
            for name in model.objects.values_list(field, flat=True):
                path = (root / name).resolve()
                if name and (not path.is_relative_to(root) or not path.is_file()):
                    missing.append(str(name))
        if missing:
            raise CommandError(f"{len(missing)} referenced upload(s) are missing. Restore them before exporting.")
        if output.is_relative_to(root) or output.is_relative_to(private) or output.is_relative_to(Path(settings.STATIC_ROOT).resolve()):
            raise CommandError("Backups must be outside public media and static directories.")
        private_files = sorted(p for p in private.rglob('*') if p.is_file()) if private.exists() else []
        for path in private_files:
            if not path.resolve().is_relative_to(private):
                raise CommandError('A private-file symlink points outside PRIVATE_WORK_ROOT.')
        from learning.models import Attachment
        if any(not asset.file.storage.exists(asset.file.name) for asset in Attachment.objects.all()):
            raise CommandError('A referenced private attachment is missing.')
        with transaction.atomic():
            fixture = io.StringIO()
            call_command("dumpdata", natural_foreign=True, exclude=[
                "contenttypes", "auth.permission", "sessions", "admin.logentry",
            ], stdout=fixture)
        records = json.loads(fixture.getvalue())
        output.parent.mkdir(parents=True, exist_ok=True)
        manifest = {"format": 2, "records": len(records), "files": {}}
        try:
            with zipfile.ZipFile(output, "x") as bundle:
                output.chmod(0o600)
                data = fixture.getvalue().encode("utf-8")
                bundle.writestr("data.json", data, compress_type=zipfile.ZIP_DEFLATED)
                manifest["files"]["data.json"] = hashlib.sha256(data).hexdigest()
                entries = [(p, 'media/'+p.relative_to(root).as_posix()) for p in files]
                entries += [(p, 'private-work/'+p.relative_to(private).as_posix()) for p in private_files]
                for path, name in entries:
                    digest = hashlib.sha256()
                    with path.open("rb") as source, bundle.open(name, "w", force_zip64=True) as target:
                        while chunk := source.read(1024 * 1024):
                            digest.update(chunk)
                            target.write(chunk)
                    manifest["files"][name] = digest.hexdigest()
                bundle.writestr("manifest.json", json.dumps(manifest, indent=2))
        except Exception:
            output.unlink(missing_ok=True)
            raise
        self.stdout.write(self.style.SUCCESS(
            f"Private bundle created: {output}\n{len(records)} database records; {len(files)} public uploads; {len(private_files)} private files. "
            "Includes account password hashes: store privately. Device-only work is not included; online saved work is included."
        ))
