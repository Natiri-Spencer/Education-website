"""Inventory published learning material and machine-check local media references."""
import re
from pathlib import Path
from django.conf import settings
from django.core.management import BaseCommand
from educations.models import CourseModule


class Command(BaseCommand):
    help = 'Write a reproducible content inventory; teacher scientific approval remains separate.'

    def add_arguments(self, parser):
        parser.add_argument('--output', default='CONTENT_REVIEW.md')

    def handle(self, *args, **options):
        root = Path(settings.BASE_DIR)
        rows = ['# Learning content review', '',
                'This inventory is a technical review, not a claim of teacher or regulatory approval. All listed content requires a named teacher to approve scientific accuracy, procedures, assessments and age suitability before public launch.', '',
                '## Versioned video lessons', '', '| Lesson | Runtime assets | Captions | Teacher review |', '|---|---|---|---|']
        from educations.curriculum_lessons import REPRODUCTIVE_LESSONS
        lessons = [(v['folder'], v['video'], v['audio'][0], v['folder']+'.vtt') for v in REPRODUCTIVE_LESSONS.values()]
        lessons += [(a,b,'narration.mp3',a+'.vtt') for a,b in [('fertilization','fertilization-grade7-5min.mp4'),('pregnancy','pregnancy-grade7-5min.mp4'),('adolescence','adolescence-grade7-5min.mp4')]]
        issues = []
        for folder, video, audio, captions in lessons:
            base = root/'exports'/folder
            missing=[name for name in [video,audio,captions,'poster.png','transcript.txt','sources.md'] if not (base/name).is_file()]
            text=(base/captions).read_text(encoding='utf-8') if (base/captions).exists() else ''
            valid=text.startswith('WEBVTT') and bool(re.search(r'\d\d:\d\d:\d\d\.\d{3} -->',text))
            if missing or not valid:issues.append(folder)
            rows.append(f'| {folder} | '+('Missing: '+', '.join(missing) if missing else 'Present')+f' | {"VTT cues present" if valid else "Needs repair"} | Pending |')
        rows += ['', '## Published classes and modules', '']
        for module in CourseModule.objects.filter(course__is_published=True,course__subject__grade__name__in=['Grade 7','Grade 8','Grade 9']).select_related('course__subject__grade'):
            rows.append(f'- {module.course.subject.grade.name} · {module.course.title} · {module.title}: teacher review pending; source model CourseModule #{module.pk}.')
        rows += ['', '## Native practicals and lessons', '', 'Inventory of source templates/controllers used by the grade dashboards. Review the rendered activity, not merely the source file.', '']
        for path in sorted((root/'educations/templates/educations').glob('*.xhtml')):
            if any(x in path.stem for x in ('lab','grade','electrical','magnet','photosynthesis','geometry','capacity','mathematics','indicator','mixture','separation')):
                rows.append(f'- {path.name}: keyboard/touch and scientific review pending; preserve explicit model limits and practice-mark labels.')
        rows += ['', '## Saving adapters', '', 'Every first-party controller using browser persistence now uses the explicit AcademyStorage adapter. Grade7Notebooks consumers wait for account hydration. Notebook marks remain practice checks.', '']
        for path in sorted((root/'educations/static/educations').glob('*.js')):
            text=path.read_text(encoding='utf-8')
            if any(s in text for s in ('AcademyStorage','Grade7Notebooks')):
                rows.append('- '+path.name)
        rows += ['', '## Required classroom review', '', '- A named teacher checks scientific statements, units, apparatus, safety, procedures, assessment answers, captions/transcripts and attribution for each published activity.', '- Two teachers and ten learners perform the supervised trial; record device/browser, accessibility issues and corrections.', '- No scientific approval is inferred from passing software tests. Record actual approvals in the private launch gate.', '', f'Technical media issues found: {len(issues)}.']
        Path(options['output']).write_text('\n'.join(rows)+'\n',encoding='utf-8')
        self.stdout.write(f'Content inventory written. Technical media issues: {len(issues)}; teacher approvals remain pending.')
