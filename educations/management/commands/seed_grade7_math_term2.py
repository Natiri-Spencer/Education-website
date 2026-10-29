"""Install the starter pack without overwriting admin edits."""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from educations.course_content.grade7_math_term2 import COURSES
from educations.models import CourseModule, Grade, ShortCourse, Subject


class Command(BaseCommand):
    help = "Create draft Grade 7 Mathematics Term II courses from the supplied 2025 scheme. Existing records are preserved."

    @transaction.atomic
    def handle(self, *args, **options):
        grade, _ = Grade.objects.get_or_create(name="Grade 7")
        subject, _ = Subject.objects.get_or_create(grade=grade, name="Mathematics")
        course_count = module_count = 0
        for entry in COURSES:
            defaults = {key: value for key, value in entry.items() if key not in ("slug", "modules")}
            defaults.update(subject=subject, is_published=False, price=None, currency="KES")
            course, created = ShortCourse.objects.get_or_create(slug=entry["slug"], defaults=defaults)
            if course.subject_id != subject.pk:
                raise CommandError(f"Slug {entry['slug']} already belongs to another subject. No changes committed.")
            if created:
                course.full_clean()
            course_count += created
            for position, content in enumerate(entry["modules"], start=1):
                module, created = CourseModule.objects.get_or_create(
                    course=course, position=position, defaults=content,
                )
                if created:
                    module.full_clean()
                module_count += created
            self.stdout.write(f"{course.title}: /admin/educations/shortcourse/{course.pk}/change/")
        self.stdout.write(self.style.SUCCESS(
            f"Created {course_count} draft courses and {module_count} modules. Existing content, prices and publication settings were preserved."
        ))
