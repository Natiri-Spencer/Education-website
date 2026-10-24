import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, SimpleTestCase, TestCase, override_settings
from django.urls import reverse

from .whiteboard_ai import OpenAIResponsesProvider, WhiteboardAIError, clean_payload, _extract_response


class FakeProvider:
    def __init__(self):
        self.payload = None

    def generate(self, payload):
        self.payload = payload
        return {"title": "A hint", "explanation": "Try factoring first.", "insertText": "Find two factors of 6.", "insertFormat": "paragraph", "warnings": []}


@override_settings(WHITEBOARD_AI_RATE_LIMIT=20)
class WhiteboardAIEndpointTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user(username="whiteboard-ai-user", password="test-password")
        self.client.force_login(self.user)
        self.url = reverse("educations:whiteboard_ai")
        self.payload = {"action": "check", "prompt": "Be concise", "context": {"scope": "selection", "title": "Algebra", "notes": "", "sourceIds": ["q1"], "items": [{"id": "q1", "type": "text", "format": "math", "text": "2 + 3 = 5", "x": 1, "y": 2, "w": 100, "h": 40}]}}

    @override_settings(OPENAI_API_KEY="", WHITEBOARD_AI_ENABLED=True)
    def test_status_reports_unavailable_without_exposing_configuration(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["available"], False)
        self.assertNotContains(response, "OPENAI")

    def test_post_is_csrf_protected(self):
        response = Client(enforce_csrf_checks=True).post(self.url, data=json.dumps(self.payload), content_type="application/json")
        self.assertEqual(response.status_code, 403)

    def test_post_requires_sign_in(self):
        response = Client().post(self.url, data=json.dumps(self.payload), content_type="application/json")
        self.assertEqual(response.status_code, 401)

    def test_valid_request_sanitizes_context_and_attaches_math_check(self):
        provider = FakeProvider()
        with patch("educations.whiteboard_ai.get_provider", return_value=provider):
            response = self.client.post(self.url, data=json.dumps(self.payload), content_type="application/json")
        self.assertEqual(response.status_code, 200)
        checked = provider.payload["context"]["items"][0]["mathValidation"]
        self.assertEqual(checked["validation"], "valid")
        self.assertEqual(checked["mathCheck"], {"kind": "equality", "verified": True, "isTrue": True})
        self.assertEqual(response.json()["result"]["title"], "A hint")

    def test_selection_action_requires_selection_scope(self):
        self.payload["context"]["scope"] = "board"
        with patch("educations.whiteboard_ai.get_provider", return_value=FakeProvider()):
            response = self.client.post(self.url, data=json.dumps(self.payload), content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Select one", response.json()["error"])

    @override_settings(WHITEBOARD_AI_RATE_LIMIT=1)
    def test_rate_limit(self):
        with patch("educations.whiteboard_ai.get_provider", return_value=FakeProvider()):
            first = self.client.post(self.url, data=json.dumps(self.payload), content_type="application/json")
            second = self.client.post(self.url, data=json.dumps(self.payload), content_type="application/json")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)


class WhiteboardAIValidationTests(SimpleTestCase):
    def test_image_data_is_validated_and_original_image_source_is_dropped(self):
        payload = clean_payload({"action": "summarize", "context": {"scope": "board", "sourceIds": ["image"], "items": [{"id": "image", "type": "image", "src": "data:image/png;base64,secret"}]}, "image": "data:image/png;base64,AAAA"})
        self.assertNotIn("src", payload["context"]["items"][0])
        self.assertEqual(payload["image"], "data:image/png;base64,AAAA")

    def test_structured_response_parser_handles_refusal_and_output(self):
        data = {"output": [{"content": [{"type": "output_text", "text": json.dumps({"title": "Why", "explanation": "Because", "insertText": "Because", "insertFormat": "paragraph", "warnings": []})}]}]}
        self.assertEqual(_extract_response(data)["title"], "Why")
        with self.assertRaises(WhiteboardAIError):
            _extract_response({"output": [{"content": [{"type": "refusal"}]}]})

    def test_large_exponents_are_parsed_but_not_computed_for_ai(self):
        payload = clean_payload({"action": "check", "context": {"scope": "selection", "sourceIds": ["m"], "items": [{"id": "m", "type": "text", "format": "math", "text": "9^999999999 = 1"}]}})
        self.assertEqual(payload["context"]["items"][0]["mathValidation"]["mathCheck"], {"kind": "equation", "verified": False})

    @override_settings(OPENAI_API_KEY="top-secret")
    def test_provider_keeps_key_in_authorization_header_only(self):
        provider = OpenAIResponsesProvider("top-secret", "test-model")
        self.assertEqual(provider.api_key, "top-secret")
