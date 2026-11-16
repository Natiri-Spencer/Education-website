"""Public offline editor assets. Private work stays in account-scoped device storage."""
from pathlib import Path
from hashlib import sha256

from django.contrib.staticfiles import finders
from django.http import FileResponse, HttpResponse, JsonResponse
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.views.decorators.cache import never_cache


VERSION = 'whiteboard-workspace-v2-20261115'


def asset_files():
    root = Path(finders.find('educations/whiteboard.js')).parent
    files = list(root.glob('whiteboard*.js')) + list(root.glob('whiteboard*.css'))
    files += [p for p in (root / 'vendor').rglob('*') if p.is_file() and p.suffix in {
        '.js', '.mjs', '.css', '.woff', '.woff2', '.ttf', '.otf', '.pfb', '.bcmap', '.wasm', '.bin',
    }]
    return root, files


def version():
    root, files = asset_files()
    files += [Path(finders.find('learning/workspace.js'))]
    files += list((root.parents[1] / 'templates' / 'educations').glob('whiteboard*.xhtml'))
    stamp = '|'.join(f'{p.name}:{p.stat().st_size}:{p.stat().st_mtime_ns}' for p in sorted(files))
    return VERSION + '-' + sha256(stamp.encode()).hexdigest()[:12]


@never_cache
def service_worker(request):
    source = finders.find('educations/whiteboard_service_worker.js')
    script = Path(source).read_text(encoding='utf-8').replace(VERSION, version())
    return HttpResponse(script, content_type='application/javascript')


def pdf_worker(request):
    source = finders.find('educations/vendor/pdfjs/pdf.worker.mjs')
    return FileResponse(open(source, 'rb'), content_type='application/javascript')


@never_cache
def assets(request):
    root, files = asset_files()
    urls = [static('educations/' + p.relative_to(root).as_posix()) for p in files]
    urls += [static('learning/workspace.js'), static('educations/branding/favicon.png')]
    revisions = {url: f'{p.stat().st_mtime_ns}:{p.stat().st_size}' for url, p in zip(urls, files + [
        Path(finders.find('learning/workspace.js')), Path(finders.find('educations/branding/favicon.png')),
    ])}
    return JsonResponse({'version': version(), 'urls': sorted(set(urls)), 'revisions': revisions, 'shell': reverse('educations:whiteboard_offline_shell')})


def shell(request):
    return render(request, 'educations/whiteboard.xhtml', {
        'offline_shell': True,
        'academy_config': {'scope': 'guest', 'authenticated': False, 'eligible': False,
                           'offline': True, 'api': '/learning/api/work/', 'assets': '/learning/api/attachments/'},
        'whiteboard_colours': [{'name': name, 'hex': value} for name, value in [
            ('Black', '#252525'), ('Red', '#ff485c'), ('Blue', '#1689f8'),
            ('Green', '#24a87c'), ('Purple', '#8b3dff'), ('Yellow', '#ffe500'),
        ]],
    })
