import io
import json
import os
import runpy
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
import zipfile

from django.contrib.auth import get_user_model
from django.core.management import CommandError, call_command
from django.db import OperationalError
from django.test import SimpleTestCase, TestCase, override_settings

from educations.models import Grade, PDFResource, Subject


class ProductionConfigurationTests(SimpleTestCase):
    def settings(self, **changes):
        environment = {
            "DJANGO_LOAD_DOTENV": "false", "DJANGO_DEBUG": "false",
            "DJANGO_SECRET_KEY": "test-only-configuration-key-" * 4,
            "DJANGO_ALLOWED_HOSTS": "academy.example.com",
            "DATABASE_URL": "postgresql://academy:testing@db:5432/academy",
        }
        environment.update(changes)
        with patch.dict(os.environ, environment, clear=True):
            return runpy.run_path(str(Path(__file__).with_name("settings.py")))

    def test_secure_defaults_and_explicit_proxy_trust(self):
        settings = self.settings()
        self.assertTrue(settings["SECURE_SSL_REDIRECT"])
        self.assertTrue(settings["SESSION_COOKIE_SECURE"])
        self.assertTrue(settings["CSRF_COOKIE_SECURE"])
        self.assertIsNone(settings["SECURE_PROXY_SSL_HEADER"])
        self.assertEqual(self.settings(DJANGO_TRUST_PROXY="true")["SECURE_PROXY_SSL_HEADER"], ("HTTP_X_FORWARDED_PROTO", "https"))

    def test_production_rejects_sqlite_and_wildcard_hosts(self):
        with self.assertRaisesMessage(RuntimeError, "PostgreSQL"):
            self.settings(DATABASE_URL="sqlite:///temporary.sqlite3")
        with self.assertRaisesMessage(RuntimeError, "hostnames"):
            self.settings(DJANGO_ALLOWED_HOSTS="*")

    def test_production_requires_secret_key(self):
        with self.assertRaisesMessage(RuntimeError, "DJANGO_SECRET_KEY"):
            self.settings(DJANGO_SECRET_KEY="")


class ReadinessTests(TestCase):
    def test_database_and_cache_are_ready(self):
        response = self.client.get("/health/")
        self.assertEqual(response.json(), {"status": "ok"})
        self.assertIn("no-store", response.headers["Cache-Control"])

    def test_database_failure_does_not_reveal_credentials(self):
        with patch("spencer_project.health.connection.cursor", side_effect=OperationalError("private connection")):
            response = self.client.get("/health/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})

    def test_cache_failure_marks_service_unavailable(self):
        with patch("spencer_project.health.cache.set", side_effect=ConnectionError("private cache")):
            self.assertEqual(self.client.get("/health/").status_code, 503)

    @override_settings(SECURE_SSL_REDIRECT=True, SECURE_REDIRECT_EXEMPT=[r"^health/$"])
    def test_only_healthcheck_can_use_plain_http(self):
        self.assertEqual(self.client.get("/health/").status_code, 200)
        self.assertEqual(self.client.get("/virtual-labs/").status_code, 301)


class DeploymentExportTests(TestCase):
    def test_fixture_preserves_accounts_resources_and_exact_upload_bytes(self):
        with TemporaryDirectory() as temporary, override_settings(MEDIA_ROOT=Path(temporary) / "media", PRIVATE_WORK_ROOT=Path(temporary) / "private"):
            media = Path(temporary) / "media" / "pdfs"
            media.mkdir(parents=True)
            (media / "lesson.pdf").write_bytes(b"original lesson")
            user = get_user_model().objects.create_user("deployment-learner", password="test-password")
            grade = Grade.objects.create(name="Grade 9")
            subject = Subject.objects.create(name="Science", grade=grade)
            PDFResource.objects.create(subject=subject, title="Lesson", pdf_file="pdfs/lesson.pdf")
            output = Path(temporary) / "bundle.zip"
            call_command("export_deployment", output, stdout=io.StringIO())
            with zipfile.ZipFile(output) as bundle:
                self.assertEqual(bundle.read("media/pdfs/lesson.pdf"), b"original lesson")
                records = json.loads(bundle.read("data.json"))
                account = next(r for r in records if r["model"] == "auth.user" and r["fields"]["username"] == user.username)
                self.assertEqual(account["fields"]["password"], user.password)
                self.assertNotIn("test-password", bundle.read("data.json").decode())
                self.assertFalse(any(r["model"] in {"auth.permission", "contenttypes.contenttype", "sessions.session"} for r in records))
                self.assertEqual(json.loads(bundle.read("manifest.json"))["format"], 2)
            with self.assertRaises(CommandError):
                call_command("export_deployment", output, stdout=io.StringIO())

    def test_missing_referenced_upload_stops_export(self):
        with TemporaryDirectory() as temporary, override_settings(MEDIA_ROOT=Path(temporary), PRIVATE_WORK_ROOT=Path(temporary) / "private"):
            grade = Grade.objects.create(name="Grade 9")
            subject = Subject.objects.create(name="Science", grade=grade)
            PDFResource.objects.create(subject=subject, title="Missing", pdf_file="missing.pdf")
            with self.assertRaisesMessage(CommandError, "missing"):
                call_command("export_deployment", Path(temporary) / "bundle.zip")

    def test_export_cannot_publish_credentials_in_media(self):
        with TemporaryDirectory() as temporary, override_settings(MEDIA_ROOT=Path(temporary), PRIVATE_WORK_ROOT=Path(temporary) / "private"):
            with self.assertRaisesMessage(CommandError, "outside public"):
                call_command("export_deployment", Path(temporary) / "backup.zip")
