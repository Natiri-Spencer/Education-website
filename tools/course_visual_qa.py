"""Render authenticated lesson snapshots and serve only QA output and public assets locally."""
import os
import sys
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "spencer_project.settings")
import django
django.setup()
from django.contrib.auth import get_user_model
from django.test import RequestFactory
from educations.models import CourseModule
from educations.views import course_module

OUTPUT = ROOT / "tmp" / "course-visual-qa"
OUTPUT.mkdir(parents=True, exist_ok=True)
editor = get_user_model().objects.filter(is_superuser=True, is_active=True).first()
if not editor:
    raise SystemExit("An existing editor account is required for previews.")
index = []
for module in CourseModule.objects.select_related("course").exclude(diagram_kind=""):
    request = RequestFactory().get(module.get_absolute_url())
    request.user = editor
    request.session = {}
    response = course_module(request, module.course.slug, module.pk)
    (OUTPUT / f"{module.pk}.html").write_bytes(response.content)
    index.append({"id": module.pk, "title": module.title, "diagram": module.diagram_kind, "kind": module.simulation_kind})
import json
(OUTPUT / "index.json").write_text(json.dumps(index), encoding="utf-8")
gallery = "<!doctype html><html><head><meta charset='utf-8'><style>body{margin:10px;font:16px Arial;background:#e7eef4}main{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}figure{margin:0;background:white;border:1px solid #ccc;padding:8px}img{width:100%}</style></head><body><main>"
for svg in sorted((ROOT / "educations/static/educations/course_diagrams").glob("*.svg")):
    gallery += f"<figure><figcaption>{svg.stem}</figcaption><img src='/static/educations/course_diagrams/{svg.name}'></figure>"
(OUTPUT / "gallery.html").write_text(gallery + "</main></body></html>", encoding="utf-8")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        request_path = self.path.split("?")[0]
        if request_path.startswith("/static/educations/"):
            base = ROOT / "educations" / "static" / "educations"
            relative = request_path.removeprefix("/static/educations/")
        elif request_path.startswith("/qa/"):
            base = OUTPUT
            relative = request_path.removeprefix("/qa/")
        else:
            self.send_error(404)
            return
        target = (base / relative).resolve()
        if not target.is_relative_to(base.resolve()):
            self.send_error(404)
            return
        if not target.is_file() and request_path.startswith("/static/educations/"):
            base = ROOT / "staticfiles" / "educations"
            target = (base / relative).resolve()
        if not target.is_relative_to(base.resolve()) or not target.is_file():
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(target)[0] or "application/octet-stream")
        self.end_headers()
        self.wfile.write(target.read_bytes())

    def log_message(self, *args):
        pass


print(f"Rendered {len(index)} lesson snapshots. QA server: http://127.0.0.1:8766/qa/gallery.html", flush=True)
if "--render-only" not in sys.argv:
    ThreadingHTTPServer(("127.0.0.1", 8766), Handler).serve_forever()
