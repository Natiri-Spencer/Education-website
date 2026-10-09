from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model


class AccountPageTests(TestCase):
    def test_login_page_loads(self):
        response = self.client.get(reverse("accounts:login"))

        self.assertEqual(response.status_code, 200)

    def test_registration_requires_staff_login(self):
        response = self.client.get(reverse("accounts:register"))

        self.assertRedirects(
            response,
            f'{reverse("accounts:login")}?next={reverse("accounts:register")}',
        )

    def test_regular_user_cannot_register_users(self):
        user = get_user_model().objects.create_user(
            username="student",
            password="A-secure-test-password-938!",
        )
        self.client.force_login(user)

        response = self.client.get(reverse("accounts:register"))

        self.assertEqual(response.status_code, 403)

    def test_staff_can_register_users(self):
        staff = get_user_model().objects.create_user(
            username="staff",
            password="A-secure-test-password-938!",
            is_staff=True,
        )
        self.client.force_login(staff)
        response = self.client.post(
            reverse("accounts:register"),
            {
                "username": "teststudent",
                "password1": "A-secure-test-password-938!",
                "password2": "A-secure-test-password-938!",
            },
        )

        self.assertRedirects(response, reverse("accounts:login"))
        self.assertTrue(get_user_model().objects.filter(username="teststudent").exists())
