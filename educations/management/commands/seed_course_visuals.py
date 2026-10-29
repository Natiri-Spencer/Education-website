from django.core.management.base import BaseCommand
from django.db import transaction
from educations.course_content.grade7_math_term2 import COURSES
from educations.course_visuals import defaults_for_diagram
from educations.models import CourseModule


class Command(BaseCommand):
    help = "Fill missing diagrams and activities for the supplied Grade 7 courses without replacing lesson content."

    @transaction.atomic
    def handle(self, *args, **options):
        assignments = {(course["slug"], position): {key: module[key] for key in ("diagram_kind", "simulation_kind")}
                       for course in COURSES for position, module in enumerate(course["modules"], 1)}
        for position, key in enumerate(("fractions", "decimals", "fractions", "review"), 1):
            assignments[("grade-7-fractions-decimals-percentages", position)] = defaults_for_diagram(key)
        updated = 0
        for module in CourseModule.objects.select_related("course"):
            values = assignments.get((module.course.slug, module.position))
            if values and not module.diagram_kind:
                module.diagram_kind = values["diagram_kind"]
                fields = ["diagram_kind"]
                if not module.simulation_kind:
                    module.simulation_kind = values["simulation_kind"]
                    fields.append("simulation_kind")
                module.save(update_fields=fields)
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Added visuals to {updated} modules. Existing diagram selections and lesson content were preserved."))
