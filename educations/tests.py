from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

from .models import Grade, Subject


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
