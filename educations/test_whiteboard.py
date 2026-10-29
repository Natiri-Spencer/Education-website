from django.test import TestCase, override_settings
from django.urls import reverse


@override_settings(STORAGES={
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
})
class WhiteboardTests(TestCase):
    def test_whiteboard_is_public_and_loads_editor_assets(self):
        response = self.client.get(reverse("educations:whiteboard"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "educations/whiteboard.xhtml")
        for marker in ("wb-review-dialog", "wb-review-apply", "wb-review-keep", "wb-add-equation", "whiteboard_math.js", "vendor/mathjax/tex-svg.js", "wb-neat-ink", "wb-tidy-existing", "wb-recognition-mode", "whiteboard_typesetting.js", "wb-more-space", "wb-move-up", "wb-move-down", "wb-view-top"):
            self.assertContains(response, marker)
        for marker in ("wb-canvas", "whiteboard_model.js", "whiteboard.js", "whiteboard.css", "wb-upload", "wb-undo", "wb-pen-tray", 'data-wb-pen="pen"', 'data-wb-pen="marker"', 'data-wb-pen="highlighter"', 'data-wb-pen="eraser"', 'aria-label="Blue ink"'):
            self.assertContains(response, marker)
        self.assertContains(response, 'id="wb-upload-files"')
        self.assertContains(response, 'whiteboard_uploads.js')
        self.assertContains(response, '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv')

    def test_navigation_places_whiteboard_between_courses_and_labs(self):
        response = self.client.get(reverse("home"))
        html = response.content.decode()
        self.assertLess(html.index('>Classes</a>'), html.index('>Whiteboard</a>'))
        self.assertLess(html.index('>Whiteboard</a>'), html.index('>Virtual labs</a>'))
