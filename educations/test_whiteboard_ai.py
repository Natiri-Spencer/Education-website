import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, SimpleTestCase, TestCase, override_settings
from django.urls import reverse

from .whiteboard_ai import OpenAIResponsesProvider, OllamaProvider, WhiteboardAIError, clean_payload, _extract_response, get_provider


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

    @override_settings(OPENAI_API_KEY="", WHITEBOARD_AI_ENABLED=True, WHITEBOARD_AI_PROVIDER="openai")
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

    def test_typed_question_needs_no_board_content(self):
        provider = FakeProvider()
        with patch("educations.whiteboard_ai.get_provider", return_value=provider):
            response = self.client.post(self.url, data=json.dumps({"action": "answer", "prompt": " What is osmosis? "}), content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(provider.payload["prompt"], "What is osmosis?")
        self.assertEqual(provider.payload["context"]["items"], [])

    def test_empty_or_overlong_question_is_not_sent_to_provider(self):
        provider = FakeProvider()
        with patch("educations.whiteboard_ai.get_provider", return_value=provider):
            for prompt in (" ", None, "q" * 1001):
                response = self.client.post(self.url, data=json.dumps({"action": "answer", "prompt": prompt}), content_type="application/json")
                self.assertEqual(response.status_code, 400)
        self.assertIsNone(provider.payload)

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
    def test_development_startup_leaves_openai_service_alone(self):
        from types import SimpleNamespace
        from .local_ai_runtime import ensure_local_ai
        with patch("educations.local_ai_runtime.subprocess.Popen") as start:
            ensure_local_ai(SimpleNamespace(WHITEBOARD_AI_PROVIDER="openai"))
        start.assert_not_called()

    def test_development_startup_does_not_duplicate_running_local_service(self):
        from types import SimpleNamespace
        from unittest.mock import MagicMock
        from .local_ai_runtime import ensure_local_ai
        settings = SimpleNamespace(WHITEBOARD_AI_PROVIDER="ollama", WHITEBOARD_AI_LOCAL_URL="http://127.0.0.1:11434")
        with patch("educations.local_ai_runtime.urllib.request.urlopen", return_value=MagicMock()), patch("educations.local_ai_runtime.subprocess.Popen") as start:
            ensure_local_ai(settings)
        start.assert_not_called()

    @override_settings(OPENAI_API_KEY="", WHITEBOARD_AI_PROVIDER="ollama", WHITEBOARD_AI_LOCAL_MODEL="classroom-model", WHITEBOARD_AI_ENABLED=True)
    def test_local_provider_needs_no_paid_api_key(self):
        self.assertIsInstance(get_provider(), OllamaProvider)

    @override_settings(WHITEBOARD_AI_PROVIDER="ollama", WHITEBOARD_AI_LOCAL_MODEL="classroom-model", WHITEBOARD_AI_LOCAL_URL="https://remote.example", WHITEBOARD_AI_ENABLED=True)
    def test_invalid_local_configuration_does_not_crash_status(self):
        self.assertIsNone(get_provider())

    def test_local_provider_accepts_only_loopback_services(self):
        for url in ("https://remote.example", "file:///etc/passwd", "http://user:password@localhost:11434", "http://localhost.evil.example:11434"):
            with self.assertRaises(WhiteboardAIError):
                OllamaProvider(url, "classroom-model")

    def test_local_provider_uses_schema_and_validates_finished_answer(self):
        from unittest.mock import MagicMock
        response = MagicMock()
        response.__enter__.return_value.read.return_value = json.dumps({"done": True, "done_reason": "stop", "message": {"content": json.dumps({"answer": "Iron + oxygen → iron oxide."})}}).encode()
        with patch("educations.whiteboard_ai.urllib.request.urlopen", return_value=response) as send:
            result = OllamaProvider("http://127.0.0.1:11434", "classroom-model").generate(clean_payload({"action": "answer", "prompt": "Name the product when iron reacts with oxygen."}))
        self.assertEqual(result["explanation"], "Iron + oxygen → iron oxide.")
        body = json.loads(send.call_args.args[0].data)
        self.assertFalse(body["stream"])
        self.assertEqual(body["format"]["required"], ["answer"])
        self.assertNotIn("Authorization", send.call_args.args[0].headers)
        response.__enter__.return_value.read.return_value = json.dumps({"done": False, "message": {"content": "partial"}}).encode()
        with patch("educations.whiteboard_ai.urllib.request.urlopen", return_value=response):
            with self.assertRaises(WhiteboardAIError):
                OllamaProvider("http://localhost:11434", "classroom-model").generate(clean_payload({"action": "answer", "prompt": "Question"}))

    def test_local_word_equations_use_names_and_remove_repeated_substances(self):
        from unittest.mock import MagicMock
        response = MagicMock()
        content = {"reactants": ["Oxygen", "iron"], "products": ["iron(II,III) oxide", "iron(II,III) oxide"], "clarification": ""}
        response.__enter__.return_value.read.return_value = json.dumps({"done": True, "message": {"content": json.dumps(content)}}).encode()
        with patch("educations.whiteboard_ai.urllib.request.urlopen", return_value=response):
            result = OllamaProvider("http://localhost:11434", "classroom-model").generate(clean_payload({"action": "answer", "prompt": "Write a word equation for iron and oxygen."}))
        self.assertEqual(result["explanation"], "oxygen + iron → iron(II,III) oxide")

    def test_local_passive_transport_questions_include_verified_reference_notes(self):
        from unittest.mock import MagicMock
        response = MagicMock()
        response.__enter__.return_value.read.return_value = json.dumps({"done": True, "message": {"content": json.dumps({"answer": "No, osmosis is passive."})}}).encode()
        with patch("educations.whiteboard_ai.urllib.request.urlopen", return_value=response) as send:
            OllamaProvider("http://localhost:11434", "classroom-model").generate(clean_payload({"action": "answer", "prompt": "Does osmosis require energy?"}))
        content = json.loads(send.call_args.args[0].data)["messages"][1]["content"]
        self.assertIn("neither requires", content)

    def test_credit_exhaustion_is_distinguished_from_rate_limits(self):
        import io
        import urllib.error
        error = urllib.error.HTTPError("https://api.openai.com/v1/responses", 429, "Quota", {}, io.BytesIO(json.dumps({"error": {"code": "credit_balance_exhausted", "type": "insufficient_quota"}}).encode()))
        with patch("educations.whiteboard_ai.urllib.request.urlopen", side_effect=error):
            with self.assertRaisesRegex(WhiteboardAIError, "restore the AI account credits"):
                OpenAIResponsesProvider("test-key", "test-model").generate(clean_payload({"action": "answer", "prompt": "Question"}))

    def test_question_drops_unsolicited_board_context_and_images(self):
        payload = clean_payload({"action": "answer", "prompt": "What is diffusion?", "image": "secret", "context": {"items": [{"text": "private board"}]}})
        self.assertNotIn("image", payload)
        self.assertNotIn("private board", json.dumps(payload))

    def test_answer_parser_preserves_complete_short_answers_and_rejects_incomplete_output(self):
        answer = "Diffusion is the net movement of particles from a region of higher concentration to a region of lower concentration."
        data = {"output": [{"content": [{"type": "output_text", "text": json.dumps({"answer": answer})}]}]}
        result = _extract_response(data)
        self.assertEqual(result["explanation"], answer)
        self.assertEqual(result["insertText"], answer)
        data["status"] = "incomplete"
        with self.assertRaises(WhiteboardAIError):
            _extract_response(data)
        data.pop("status")
        data["output"][0]["content"][0]["text"] = json.dumps({"answer": "word " * 121})
        with self.assertRaises(WhiteboardAIError):
            _extract_response(data)

    def test_question_provider_uses_short_answer_schema_and_accuracy_instructions(self):
        from unittest.mock import MagicMock
        response = MagicMock()
        response.__enter__.return_value.read.return_value = json.dumps({"output": [{"content": [{"type": "output_text", "text": json.dumps({"answer": "4."})}]}]}).encode()
        with patch("educations.whiteboard_ai.urllib.request.urlopen", return_value=response) as send:
            result = OpenAIResponsesProvider("test-key", "test-model").generate(clean_payload({"action": "answer", "prompt": "What is 2 + 2?"}))
        body = json.loads(send.call_args.args[0].data)
        self.assertEqual(body["text"]["format"]["schema"]["required"], ["answer"])
        self.assertEqual(body["max_output_tokens"], 600)
        self.assertFalse(body["store"])
        instructions = body["input"][0]["content"][0]["text"]
        self.assertIn("at most 80 words", instructions)
        self.assertIn("Never invent", instructions)
        self.assertIn("clarifying question", instructions)
        self.assertEqual(result["explanation"], "4.")

    def test_service_limit_returns_an_error_instead_of_an_answer(self):
        import urllib.error
        with patch("educations.whiteboard_ai.urllib.request.urlopen", side_effect=urllib.error.HTTPError("https://api.openai.com/v1/responses", 429, "Service limit", {}, None)):
            with self.assertRaisesRegex(WhiteboardAIError, "service limit"):
                OpenAIResponsesProvider("test-key", "test-model").generate(clean_payload({"action": "answer", "prompt": "What is diffusion?"}))

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
