from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

from .models import Grade, Subject, ShortCourse, CourseModule, CourseEnrollment


class CourseModuleTests(TestCase):
    def setUp(self):
        grade, _ = Grade.objects.get_or_create(name="Grade 7")
        subject, _ = Subject.objects.get_or_create(name="Mathematics", grade=grade)
        self.course = ShortCourse.objects.create(subject=subject, title="Test course", slug="test-modules", is_published=True)
        self.module = CourseModule.objects.create(course=self.course, title="Fractions", lesson_content="Example: 1/2 = 0.5", assessment="Compare 1/2 and 1/4", teacher_notes="Private marking guide 12345")
        self.user = get_user_model().objects.create_user(username="module-reader")

    def test_reader_can_open_lesson_without_payment(self):
        self.client.force_login(self.user)
        response = self.client.get(self.module.get_absolute_url())
        self.assertContains(response, "Example: 1/2 = 0.5")
        self.assertNotContains(response, "Private marking guide 12345")

    def test_published_lesson_is_public_but_teacher_notes_are_private(self):
        response = self.client.get(self.module.get_absolute_url())
        self.assertContains(response, "Example: 1/2 = 0.5")
        self.assertNotContains(response, "Private marking guide 12345")
        self.assertNotContains(response, "Edit module")

    def test_unpublished_lesson_remains_private(self):
        self.course.is_published = False
        self.course.save()
        self.assertEqual(self.client.get(self.module.get_absolute_url()).status_code, 404)
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(self.module.get_absolute_url()).status_code, 404)

    def test_class_pages_show_lessons_without_price_or_checkout(self):
        self.course.price = 750
        self.course.save()
        catalog = self.client.get(reverse("educations:course_catalog"))
        detail = self.client.get(self.course.get_absolute_url())
        self.assertContains(catalog, "Classes for Grades")
        self.assertContains(detail, self.module.get_absolute_url())
        self.assertContains(detail, "Start class")
        for response in (catalog, detail):
            for text in ("M-Pesa", "Price coming soon", "750", "Short courses", "Sign in to enroll"):
                self.assertNotContains(response, text)

    def test_legacy_checkout_cannot_create_payment(self):
        from unittest.mock import patch
        self.course.price = 750
        self.course.save()
        url = reverse("educations:course_checkout", args=[self.course.slug])
        before = CourseEnrollment.objects.count()
        with patch("educations.mpesa.initiate_stk_push") as start_payment:
            self.assertRedirects(self.client.post(url, {"phone_number": "0712345678"}), self.course.get_absolute_url())
            self.client.force_login(self.user)
            self.assertRedirects(self.client.post(url, {"phone_number": "0712345678"}), self.course.get_absolute_url())
            start_payment.assert_not_called()
        self.assertEqual(CourseEnrollment.objects.count(), before)

    def test_paid_reader_can_open_lesson(self):
        CourseEnrollment.objects.create(user=self.user, course=self.course, amount=500, currency="KES", status=CourseEnrollment.Status.PAID)
        self.client.force_login(self.user)
        response = self.client.get(self.module.get_absolute_url())
        self.assertContains(response, "Example: 1/2 = 0.5")
        self.assertNotContains(response, "Edit module")
        self.assertNotContains(response, "Private marking guide 12345")

    def test_editor_can_preview_unpublished_module_without_payment(self):
        from django.contrib.auth.models import Permission
        self.user.is_staff = True
        self.user.save()
        self.user.user_permissions.add(Permission.objects.get(codename="change_coursemodule"))
        self.course.is_published = False
        self.course.save()
        self.client.force_login(self.user)
        response = self.client.get(self.module.get_absolute_url())
        self.assertContains(response, "Editor preview")
        self.assertContains(response, "Compare 1/2 and 1/4")
        self.assertContains(response, "Private marking guide 12345")
        self.assertEqual(self.client.get(reverse("admin:educations_coursemodule_change", args=[self.module.pk])).status_code, 200)
        self.assertContains(self.client.get(self.course.get_absolute_url()), "Draft class preview")

    def test_unpublished_outline_is_not_public(self):
        self.course.is_published = False
        self.course.save()
        self.assertEqual(self.client.get(self.course.get_absolute_url()).status_code, 404)


class Grade7Term2CourseTests(TestCase):
    def test_course_pack_covers_teaching_sequence_and_preserves_edits(self):
        from django.core.management import call_command
        from io import StringIO
        import re

        output = StringIO()
        call_command("seed_grade7_math_term2", stdout=output)
        courses = ShortCourse.objects.filter(slug__startswith="grade-7-term-2-")
        modules = CourseModule.objects.filter(course__in=courses)
        self.assertEqual(courses.count(), 9)
        self.assertEqual(modules.count(), 61)
        self.assertFalse(courses.filter(is_published=True).exists())
        self.assertFalse(courses.filter(price__isnull=False).exists())
        slots = []
        for module in modules:
            module.full_clean()
            self.assertTrue(all(getattr(module, field) for field in (
                "learning_outcomes", "lesson_content", "activities", "assessment", "teacher_notes",
            )))
            match = re.search(r"Week (\d+), lesson (\d+)", module.curriculum_reference)
            self.assertIsNotNone(match)
            slots.append(tuple(map(int, match.groups())))
        expected = {(week, number) for week in (*range(1, 8), *range(9, 14)) for number in range(1, 6)}
        expected.add((14, 1))
        self.assertEqual(set(slots), expected)
        self.assertEqual(len(slots), len(expected))

        edited = modules.first()
        edited.lesson_content = "Teacher's revised curriculum content"
        edited.save()
        edited.course.price = 750
        edited.course.is_published = True
        edited.course.save()
        call_command("seed_grade7_math_term2", stdout=output)
        edited.refresh_from_db()
        edited.course.refresh_from_db()
        self.assertEqual(edited.lesson_content, "Teacher's revised curriculum content")
        self.assertEqual(edited.course.price, 750)
        self.assertTrue(edited.course.is_published)
        self.assertEqual(CourseModule.objects.filter(course__in=courses).count(), 61)


class HomePageTests(TestCase):
    def test_homepage_loads_at_root(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Learn something")

    def test_educations_homepage_loads(self):
        response = self.client.get(reverse("educations:home"))

        self.assertEqual(response.status_code, 200)

    def test_design_samples_page_loads(self):
        response = self.client.get(reverse("design_samples"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "A · Resource library")
        self.assertContains(response, "B · Curriculum pathway")
        self.assertContains(response, "C · Digital classroom")

    def test_grades_are_sorted_numerically(self):
        Grade.objects.create(name="Grade 10")
        Grade.objects.create(name="Grade 2")

        response = self.client.get("/")
        grade_names = [grade.name for grade in response.context["grades"]]

        self.assertEqual(grade_names, sorted(grade_names, key=lambda name: int(name.split()[-1])))

    def test_grades_four_to_six_have_the_requested_subjects_in_order(self):
        expected = [
            "C.R.E",
            "Social",
            "Science and Technology",
            "Mathematics",
            "Kiswahili",
            "English",
        ]

        for grade_number in (4, 5, 6):
            grade = Grade.objects.get(name=f"Grade {grade_number}")
            self.assertEqual(list(grade.subjects.values_list("name", flat=True)), expected)

    def test_grade_menu_subject_link_opens_resources(self):
        grade = Grade.objects.create(name="Grade 7")
        subject = Subject.objects.create(name="Mathematics", grade=grade)

        home_response = self.client.get("/")
        subject_url = reverse("educations:subject_resources", args=[subject.id])
        self.assertContains(home_response, f'href="{subject_url}">Mathematics</a>')

        subject_response = self.client.get(subject_url)
        self.assertEqual(subject_response.status_code, 200)

    def test_staff_can_open_pdf_upload_page_from_site(self):
        user = get_user_model().objects.create_user(
            username="staff-uploader",
            password="A-secure-test-password-938!",
            is_staff=True,
        )
        self.client.force_login(user)

        response = self.client.get(reverse("educations:upload_pdf"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Add a PDF resource")
        self.assertContains(response, "Add PDF")

    def test_pdf_upload_requires_staff_login(self):
        response = self.client.get(reverse("educations:upload_pdf"))

        self.assertRedirects(
            response,
            f'{reverse("accounts:login")}?next={reverse("educations:upload_pdf")}',
        )
