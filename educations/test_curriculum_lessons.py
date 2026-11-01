from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import TestCase, override_settings
from django.urls import reverse


class FertilizationLessonTests(TestCase):
    def test_subject_resources_groups_lesson_under_strand(self):
        from .models import Grade, Subject
        grade = Grade.objects.create(name='Grade 7')
        subject = Subject.objects.create(name='Integrated Science', grade=grade)
        response = self.client.get(reverse('educations:subject_resources', args=[subject.pk]))
        self.assertContains(response, 'id="living-things-environment-heading"')
        self.assertContains(response, reverse('educations:fertilization_lesson'))
        subject.name = 'Mathematics'
        subject.save()
        response = self.client.get(reverse('educations:subject_resources', args=[subject.pk]))
        self.assertNotContains(response, reverse('educations:fertilization_lesson'))

    def test_grade_seven_links_to_lesson_in_strand(self):
        response = self.client.get(reverse('virtual_labs_grade', kwargs={'grade': 7}))
        self.assertContains(response, 'id="living-things-environment-heading"')
        self.assertContains(response, reverse('educations:fertilization_lesson'))
        for grade in (8, 9):
            response = self.client.get(reverse('virtual_labs_grade', kwargs={'grade': grade}))
            self.assertNotContains(response, reverse('educations:fertilization_lesson'))

    def test_lesson_includes_playback_and_transcript(self):
        response = self.client.get(reverse('educations:fertilization_lesson'))
        for kind in ('video', 'audio', 'captions', 'poster'):
            self.assertContains(response, reverse('educations:fertilization_asset', kwargs={'kind': kind}))
        self.assertContains(response, 'Read the lesson transcript')

    def test_media_playback_seeking_and_download(self):
        with TemporaryDirectory() as temporary, override_settings(BASE_DIR=Path(temporary)):
            folder = Path(temporary) / 'exports' / 'fertilization'
            folder.mkdir(parents=True)
            (folder / 'narration.mp3').write_bytes(b'0123456789')
            url = reverse('educations:fertilization_asset', kwargs={'kind': 'audio'})
            response = self.client.get(url + '?download=1')
            self.assertEqual(b''.join(response.streaming_content), b'0123456789')
            self.assertIn('attachment', response['Content-Disposition'])
            for requested, expected, content_range in (
                ('bytes=2-5', b'2345', 'bytes 2-5/10'),
                ('bytes=-3', b'789', 'bytes 7-9/10'),
                ('bytes=8-', b'89', 'bytes 8-9/10'),
            ):
                response = self.client.get(url, HTTP_RANGE=requested)
                self.assertEqual(response.status_code, 206)
                self.assertEqual(response['Content-Range'], content_range)
                self.assertEqual(b''.join(response.streaming_content), expected)
            for requested in ('bytes=12-', 'bytes=5-2', 'bytes=-', 'bytes=0-1,3-4', 'bytes=' + '9' * 5000 + '-'):
                self.assertEqual(self.client.get(url, HTTP_RANGE=requested).status_code, 416)
            response = self.client.head(url)
            self.assertEqual(response.status_code, 200)
            response.close()
            self.assertEqual(self.client.post(url).status_code, 405)
            self.assertEqual(self.client.get(reverse('educations:fertilization_asset', kwargs={'kind': 'video'})).status_code, 404)
            self.assertEqual(self.client.get(reverse('educations:fertilization_asset', kwargs={'kind': 'unknown'})).status_code, 404)
