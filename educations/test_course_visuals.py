from io import StringIO
from pathlib import Path
from xml.etree import ElementTree

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.templatetags.static import static

from .course_visuals import DIAGRAMS, module_visual
from .models import CourseModule, ShortCourse


class CourseVisualTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_grade7_math_term2", stdout=StringIO())
        call_command("seed_course_visuals", stdout=StringIO())
        cls.editor = get_user_model().objects.create_superuser("visual-editor", password="test-only-password")

    def test_every_existing_course_has_local_diagrams_and_original_text(self):
        self.client.force_login(self.editor)
        root = Path(__file__).resolve().parent / "static" / "educations" / "course_diagrams"
        for course in ShortCourse.objects.all():
            self.assertTrue(course.modules.exists())
            for module in course.modules.all():
                self.assertIn(module.diagram_kind, DIAGRAMS)
                visual = module_visual(module)
                svg = ElementTree.parse(root / f"{module.diagram_kind}.svg").getroot()
                self.assertEqual(svg.attrib["viewBox"], "0 0 760 360")
                self.assertIsNotNone(svg.find("{http://www.w3.org/2000/svg}title"))
                response = self.client.get(module.get_absolute_url())
                self.assertContains(response, static(visual["path"]))
                self.assertContains(response, "Read the diagram in words")
                self.assertContains(response, "Download diagram")
                # The large simulation files must only be requested after the learner opens an activity.
                self.assertNotContains(response, '<script src="/static/educations/course_simulations.js')
                if module.simulation_kind:
                    self.assertContains(response, "Open interactive activity")
                    self.assertContains(response, "<noscript>")

    def test_visual_import_preserves_teacher_changes(self):
        module = CourseModule.objects.filter(course__slug="grade-7-term-2-perimeter-area", position=4).get()
        module.diagram_kind = "review"
        module.diagram_caption = "Teacher's custom diagram explanation"
        module.lesson_content = "Teacher's revised lesson"
        module.simulation_kind = ""
        module.save()
        call_command("seed_course_visuals", stdout=StringIO())
        module.refresh_from_db()
        self.assertEqual(module.diagram_kind, "review")
        self.assertEqual(module.diagram_caption, "Teacher's custom diagram explanation")
        self.assertEqual(module.lesson_content, "Teacher's revised lesson")
        self.assertEqual(module.simulation_kind, "")

    def test_simulation_can_be_selected_without_a_diagram(self):
        module = CourseModule.objects.first()
        module.diagram_kind = ""
        module.simulation_kind = "volume"
        self.assertEqual(module_visual(module)["shape"], "cuboid")
        self.assertEqual(module_visual(module)["simulation"], "volume")
