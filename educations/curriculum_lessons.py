"""Versioned video lessons grouped by grade, subject and curriculum strand."""
from pathlib import Path
import re

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_safe


FERTILIZATION_ASSETS = {
    'video': ('fertilization-grade7-5min.mp4', 'video/mp4'),
    'audio': ('narration.mp3', 'audio/mpeg'),
    'captions': ('fertilization.vtt', 'text/vtt; charset=utf-8'),
    'poster': ('poster.png', 'image/png'),
}


def _lesson_root():
    return Path(settings.BASE_DIR) / 'exports' / 'fertilization'


@require_safe
def fertilization_lesson(request):
    transcript = _lesson_root() / 'transcript.txt'
    return render(request, 'educations/fertilization_lesson.xhtml', {
        'transcript': transcript.read_text(encoding='utf-8') if transcript.is_file() else '',
    })


def _file_chunks(path, start, length):
    with path.open('rb') as source:
        source.seek(start)
        while length:
            chunk = source.read(min(65536, length))
            if not chunk:
                break
            length -= len(chunk)
            yield chunk


@require_safe
def fertilization_asset(request, kind):
    return _asset_response(request, kind, _lesson_root(), FERTILIZATION_ASSETS)


@require_safe
def pregnancy_lesson(request):
    transcript = Path(settings.BASE_DIR) / 'exports' / 'pregnancy' / 'transcript.txt'
    return render(request, 'educations/pregnancy_lesson.xhtml', {
        'transcript': transcript.read_text(encoding='utf-8') if transcript.is_file() else '',
    })


@require_safe
def pregnancy_asset(request, kind):
    assets = {
        'video': ('pregnancy-grade7-5min.mp4', 'video/mp4'),
        'audio': ('narration.mp3', 'audio/mpeg'),
        'captions': ('pregnancy.vtt', 'text/vtt; charset=utf-8'),
        'poster': ('poster.png', 'image/png'),
    }
    return _asset_response(request, kind, Path(settings.BASE_DIR) / 'exports' / 'pregnancy', assets)


@require_safe
def adolescence_lesson(request):
    transcript = Path(settings.BASE_DIR) / 'exports' / 'adolescence' / 'transcript.txt'
    return render(request, 'educations/adolescence_lesson.xhtml', {
        'transcript': transcript.read_text(encoding='utf-8') if transcript.is_file() else '',
    })


@require_safe
def adolescence_asset(request, kind):
    assets = {
        'video': ('adolescence-grade7-5min.mp4', 'video/mp4'),
        'audio': ('narration.mp3', 'audio/mpeg'),
        'captions': ('adolescence.vtt', 'text/vtt; charset=utf-8'),
        'poster': ('poster.png', 'image/png'),
    }
    return _asset_response(request, kind, Path(settings.BASE_DIR) / 'exports' / 'adolescence', assets)


REPRODUCTIVE_LESSONS = {
    'female': {
        'title': 'Female Reproductive System',
        'folder': 'female-reproductive-system',
        'video': 'female-reproductive-system-grade7-5min.mp4',
        'audio': ('narration.wav', 'audio/wav'),
        'summary': 'Explore the ovaries, fallopian tubes, uterus, cervix and vagina, and follow the release and movement of an egg.',
        'aims': ['Name the main organs and explain their jobs.', 'Describe ovulation and the route of an egg.', 'Use correct scientific terms respectfully.'],
    },
    'male': {
        'title': 'Male Reproductive System',
        'folder': 'male-reproductive-system',
        'video': 'male-reproductive-system-grade7-human-anatomy-5min.mp4',
        'audio': ('narration.mp3', 'audio/mpeg'),
        'summary': 'Explore the male reproductive organs, learn their jobs, and follow the route taken by sperm.',
        'aims': ['Name the main organs and explain their jobs.', 'Follow sperm through the reproductive system.', 'Explain the difference between sperm and semen.'],
    },
}


@require_safe
def reproductive_system_lesson(request, system):
    if system not in REPRODUCTIVE_LESSONS:
        raise Http404
    lesson = REPRODUCTIVE_LESSONS[system]
    transcript = Path(settings.BASE_DIR) / 'exports' / lesson['folder'] / 'transcript.txt'
    return render(request, 'educations/reproductive_system_lesson.xhtml', {
        'lesson': lesson,
        'system': system,
        'asset_route': f'educations:{system}_system_asset',
        'transcript': transcript.read_text(encoding='utf-8') if transcript.is_file() else '',
    })


@require_safe
def reproductive_system_asset(request, system, kind):
    if system not in REPRODUCTIVE_LESSONS:
        raise Http404
    lesson = REPRODUCTIVE_LESSONS[system]
    assets = {
        'video': (lesson['video'], 'video/mp4'),
        'audio': lesson['audio'],
        'captions': (lesson['folder'] + '.vtt', 'text/vtt; charset=utf-8'),
        'poster': ('poster.png', 'image/png'),
    }
    return _asset_response(request, kind, Path(settings.BASE_DIR) / 'exports' / lesson['folder'], assets)


def _asset_response(request, kind, root, assets):
    # Only these four lesson files are public; URL input never becomes a file path.
    if kind not in assets:
        raise Http404
    filename, content_type = assets[kind]
    path = root / filename
    if not path.is_file():
        raise Http404
    size = path.stat().st_size
    requested = request.headers.get('Range')
    if requested:
        match = re.fullmatch(r'bytes=(\d{0,20})-(\d{0,20})', requested)
        start = end = None
        if match and any(match.groups()):
            first, last = match.groups()
            if first:
                start, end = int(first), min(int(last), size - 1) if last else size - 1
            elif int(last) > 0:
                start, end = max(0, size - int(last)), size - 1
        if start is None or end is None or not 0 <= start <= end < size:
            response = HttpResponse(status=416)
            response['Content-Range'] = f'bytes */{size}'
            return response
        response = StreamingHttpResponse(_file_chunks(path, start, end - start + 1),
                                         status=206, content_type=content_type)
        response['Content-Length'] = str(end - start + 1)
        response['Content-Range'] = f'bytes {start}-{end}/{size}'
    else:
        response = FileResponse(path.open('rb'), content_type=content_type,
                                as_attachment=request.GET.get('download') == '1', filename=filename)
    response['Accept-Ranges'] = 'bytes'
    response['X-Content-Type-Options'] = 'nosniff'
    return response
