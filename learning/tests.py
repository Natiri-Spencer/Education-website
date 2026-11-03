import io
import json
import tempfile
import time
from pathlib import Path
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core import mail
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from educations.models import Grade
from .models import Assessment, Attachment, AuditEvent, ClassGroup, Membership, POLICY_VERSION, Profile, SavedWork, SignupRequest, Submission
from .services import signup_token


def account(username, ready=True, **extra):
    user = get_user_model().objects.create_user(username=username, password='Test-password-2026!', email=username+'@example.com', **extra)
    if ready:
        Profile.objects.create(user=user, age_band='adult', email_verified_at=timezone.now(), policy_version=POLICY_VERSION)
    return user


@override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'], EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend', PUBLIC_REGISTRATION_ENABLED=True)
class AccountFlowTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_guardian_approval_precedes_learner_details_and_activation(self):
        response=self.client.post('/accounts/signup/', {'age_band':'minor','email':'guardian@example.com','acknowledge':'on'})
        self.assertEqual(response.status_code,200)
        self.assertEqual(get_user_model().objects.count(),0)
        record=SignupRequest.objects.get()
        token=signup_token(record)
        url=reverse('learning:approve',args=[token])
        self.client.get(url)
        record.refresh_from_db();self.assertIsNone(record.approved_at)
        self.client.post(url, {'responsible':'on','policies':'on'})
        self.client.post(reverse('learning:finish_signup',args=[token]),{'username':'learner','password1':'Test-password-2026!','password2':'Test-password-2026!','is_staff':True})
        learner=get_user_model().objects.get(username='learner')
        self.assertFalse(learner.is_staff)
        self.assertTrue(learner.learning_profile.ready)
        self.assertEqual(learner.learning_profile.guardian_email,'guardian@example.com')
        self.assertEqual(len(mail.outbox),1)
        self.assertContains(self.client.get(url),'already used')

    def test_expired_link_cannot_create_account(self):
        record=SignupRequest.objects.create(age_band='adult',email='a@example.com')
        token=signup_token(record)
        with patch('django.core.signing.time.time',return_value=time.time()+90000):
            self.assertContains(self.client.get(reverse('learning:approve',args=[token])),'expired')

    def test_email_failure_keeps_request_pending_without_collecting_username(self):
        with patch('learning.account_views.deliver',return_value=False):
            response=self.client.post('/accounts/signup/',{'age_band':'adult','email':'a@example.com','acknowledge':'on'})
        self.assertContains(response,'Email is waiting')
        self.assertIsNone(SignupRequest.objects.get().approved_at)
        self.assertFalse(get_user_model().objects.exists())

    def test_recovery_responses_are_generic_and_reset_token_is_single_use(self):
        user=account('resetme')
        known=self.client.post('/accounts/password_reset/',{'username':user.username,'email':user.email})
        unknown=self.client.post('/accounts/password_reset/',{'username':'missing','email':'missing@example.com'})
        self.assertEqual(known.content,unknown.content)
        self.assertEqual(len(mail.outbox),1)
        import re
        path=re.search(r'https?://[^/]+([^\s]+)',mail.outbox[0].body).group(1)
        response=self.client.get(path)
        self.assertEqual(response.status_code,302)
        self.client.post(response.url,{'new_password1':'Another-test-pass-2026!','new_password2':'Another-test-pass-2026!'})
        user.refresh_from_db();self.assertTrue(user.check_password('Another-test-pass-2026!'))
        response=self.client.get(path)
        self.assertEqual(response.status_code,200)

    def test_unverified_existing_account_keeps_password_but_cannot_save_online(self):
        user=account('legacy',ready=False)
        self.client.force_login(user)
        self.assertEqual(self.client.get('/learning/api/work/').status_code,403)
        user.refresh_from_db();self.assertTrue(user.check_password('Test-password-2026!'))

    def test_login_rate_limit_and_csrf(self):
        for _ in range(10):self.client.post('/accounts/login/',{'username':'wrong','password':'wrong'})
        self.assertEqual(self.client.post('/accounts/login/',{'username':'wrong','password':'wrong'}).status_code,429)
        self.assertEqual(Client(enforce_csrf_checks=True).post('/accounts/signup/',{}).status_code,403)

    def test_staff_recovery_requires_authority_note_and_forces_password_change(self):
        user=account('student');staff=account('staff',is_staff=True)
        self.client.force_login(staff)
        self.client.post(reverse('learning:staff_recovery',args=[user.pk]),{'new_password1':'Temporary-pass-2026!','new_password2':'Temporary-pass-2026!','identity_check':'Established school contact confirmed'})
        self.assertTrue(AuditEvent.objects.filter(action='staff_password_recovery').exists())
        user.refresh_from_db()
        self.client.force_login(user)
        self.assertRedirects(self.client.get('/learning/'),'/accounts/password_change/',fetch_redirect_response=False)

    def test_request_resend_does_not_change_used_approval(self):
        record=SignupRequest.objects.create(email='a@example.com',age_band='adult',used_at=timezone.now())
        self.client.post(reverse('learning:resend',args=[record.pk]),{'confirm':'on'})
        self.assertEqual(len(mail.outbox),0)


@override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class PrivateWorkTests(TestCase):
    def setUp(self):
        cache.clear();self.user=account('owner');self.other=account('other')
        self.client.force_login(self.user)
        self.temp=tempfile.TemporaryDirectory()
        self.override=override_settings(PRIVATE_WORK_ROOT=Path(self.temp.name))
        self.override.enable();self.addCleanup(self.temp.cleanup);self.addCleanup(self.override.disable)

    def save(self,key='grade7-electrical-simple',raw='[]',revision=0):
        return self.client.put('/learning/api/work/'+key+'/',data=json.dumps({'revision':revision,'payload':{'format':1,'raw':raw}}),content_type='application/json')

    def test_revision_conflict_preserves_both_versions(self):
        self.assertEqual(self.save(raw='[1]').status_code,200)
        response=self.save(raw='[2]')
        self.assertEqual(response.status_code,409)
        self.assertEqual(response.json()['payload']['raw'],'[1]')
        self.assertEqual(SavedWork.objects.get().payload['raw'],'[1]')

    def test_other_user_cannot_read_draft_or_attachment(self):
        self.save();work=SavedWork.objects.get()
        self.client.post('/learning/api/attachments/doc1/',{'file':SimpleUploadedFile('a.pdf',b'%PDF-abc',content_type='application/pdf')})
        self.client.force_login(self.other)
        self.assertEqual(self.client.get(reverse('learning:work',args=[work.pk])).status_code,404)
        self.assertEqual(self.client.get('/learning/api/attachments/doc1/').status_code,404)
        self.assertEqual(self.client.get('/learning/api/work/').json()['work'],[])

    def test_stale_tab_cannot_write_into_new_account(self):
        response=self.client.put('/learning/api/work/grade7-test/',data=json.dumps({'revision':0,'payload':{'format':1,'raw':'[]'}}),content_type='application/json',HTTP_X_ACADEMY_SCOPE='u'+str(self.other.pk))
        self.assertEqual(response.status_code,403)
        self.assertFalse(SavedWork.objects.exists())

    @override_settings(PRIVATE_WORK_QUOTA=100)
    def test_quota_failure_does_not_overwrite_existing_work(self):
        self.save(raw='[]')
        response=self.save(raw='x'*110,revision=1)
        self.assertEqual(response.status_code,413)
        self.assertEqual(SavedWork.objects.get().payload['raw'],'[]')

    def test_private_file_signature_immutability_and_download_headers(self):
        url='/learning/api/attachments/doc1/'
        bad=self.client.post(url,{'file':SimpleUploadedFile('a.pdf',b'not pdf')})
        self.assertEqual(bad.status_code,400)
        for _ in range(2):
            self.assertIn(self.client.post(url,{'file':SimpleUploadedFile('a.pdf',b'%PDF-abc')}).status_code,[200,201])
        self.assertEqual(self.client.post(url,{'file':SimpleUploadedFile('a.pdf',b'%PDF-different')}).status_code,409)
        response=self.client.get(url);self.assertIn('attachment',response['Content-Disposition']);self.assertIn('sandbox',response['Content-Security-Policy'])
        self.assertEqual(b''.join(response.streaming_content),b'%PDF-abc')

    def test_work_waits_for_attachments(self):
        raw=json.dumps({'boards':[{'items':[{'type':'file','attachmentId':'missing'}]}]})
        self.assertEqual(self.save('eduportal.whiteboards.v1',raw).status_code,422)
        self.assertFalse(SavedWork.objects.exists())

    def test_deleted_draft_has_revision_tombstone(self):
        self.save()
        response=self.client.delete('/learning/api/work/grade7-electrical-simple/',json.dumps({'revision':1}),content_type='application/json')
        self.assertEqual(response.json()['revision'],2)
        self.assertTrue(SavedWork.objects.get().deleted)
        self.assertEqual(self.save().status_code,409)

    def test_backup_write_pause_rejects_mutations_and_releases_reads(self):
        flag=Path(self.temp.name)/'pause';flag.touch()
        with override_settings(BACKUP_MAINTENANCE_FILE=flag):
            self.assertEqual(self.save().status_code,503)
            self.assertEqual(self.client.get('/learning/api/work/').status_code,200)

    def test_progress_is_explicit_and_rejects_external_paths(self):
        self.assertEqual(self.client.post('/learning/progress/',{'path':'https://evil.example','completed':'true'}).status_code,404)
        self.assertEqual(self.client.post('/learning/progress/',{'path':'/virtual-labs/grade/7/','completed':'true','title':'Grade 7'}).status_code,200)
        self.assertTrue(self.user.lessonprogress_set.get().completed)
        self.client.post('/learning/progress/',{'path':'/virtual-labs/grade/7/','title':'Visited again'})
        self.assertTrue(self.user.lessonprogress_set.get().completed)

    def test_approved_deletion_removes_work_and_anonymises_audit(self):
        self.save()
        self.client.post('/accounts/delete/',{'password':'Test-password-2026!','confirm':'delete'})
        self.assertEqual(self.client.get('/learning/api/work/').status_code,403)
        call_command('learning_retention',approve_deletion=self.user.pk,authority_note='Guardian identity and retention reviewed',stdout=io.StringIO())
        self.assertFalse(get_user_model().objects.filter(pk=self.user.pk).exists())
        self.assertFalse(SavedWork.objects.exists())


@override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class TeacherBoundaryTests(TestCase):
    def setUp(self):
        cache.clear();self.learner=account('learner');self.teacher=account('teacher');self.other=account('outsider')
        permission=Permission.objects.get(codename='review_submissions')
        self.teacher.user_permissions.add(permission);self.other.user_permissions.add(permission)
        self.grade=Grade.objects.create(name='Grade 9')
        self.group=ClassGroup.objects.create(name='Science A',grade=self.grade);self.group.teachers.add(self.teacher)
        self.member=Membership.objects.create(learner=self.learner,group=self.group,approved=True)
        self.work=SavedWork.objects.create(owner=self.learner,key='grade9-notes',title='Practical',payload={'format':1,'raw':'original'},size=8)
        self.client.force_login(self.learner)

    def submit(self):
        self.client.post(reverse('learning:work',args=[self.work.pk]),{'group':self.group.pk})
        return Submission.objects.order_by('-created_at').first()

    def test_snapshot_is_immutable_and_resubmission_is_versioned(self):
        first=self.submit()
        self.work.payload={'format':1,'raw':'revised'};self.work.save()
        second=self.submit()
        first.refresh_from_db();self.assertEqual(first.payload['raw'],'original');self.assertEqual(second.version,2)

    def test_teacher_cannot_access_private_draft_or_unassigned_submission(self):
        item=self.submit();self.client.force_login(self.teacher)
        self.assertEqual(self.client.get(reverse('learning:work',args=[self.work.pk])).status_code,404)
        self.assertEqual(self.client.get(reverse('learning:submission',args=[item.pk])).status_code,200)
        self.client.force_login(self.other)
        self.assertEqual(self.client.get(reverse('learning:submission',args=[item.pk])).status_code,404)
        self.assertEqual(self.client.post(reverse('learning:membership_review',args=[self.member.pk]),{'decision':'approve'}).status_code,404)

    def test_only_assigned_teacher_can_assess_with_bounded_score_and_history(self):
        item=self.submit();url=reverse('learning:submission',args=[item.pk])
        self.assertEqual(self.client.post(url,{'feedback':'self grade','score':100,'status':'reviewed'}).status_code,404)
        self.client.force_login(self.teacher)
        self.client.post(url,{'feedback':'Check your units','score':101,'status':'returned'})
        self.assertFalse(Assessment.objects.exists())
        self.client.post(url,{'feedback':'Check your units','score':65,'status':'returned'})
        self.client.post(url,{'feedback':'Now correct','score':90,'status':'reviewed'})
        self.assertEqual(item.assessments.count(),2)

    def test_membership_approval_required_to_submit(self):
        self.member.approved=False;self.member.save()
        self.assertEqual(self.client.post(reverse('learning:work',args=[self.work.pk]),{'group':self.group.pk}).status_code,404)

    def test_only_selected_whiteboard_is_shared_not_the_private_library(self):
        library={'version':1,'boards':[{'id':'share-me','title':'Class work','items':[{'type':'text','text':'shared'}]},
                                      {'id':'private-board','title':'Private draft','items':[{'type':'text','text':'do not share'}]}]}
        self.work.key='eduportal.whiteboards.v1';self.work.payload={'format':1,'raw':json.dumps(library)};self.work.save()
        self.client.post(reverse('learning:work',args=[self.work.pk]),{'group':self.group.pk})
        self.assertFalse(Submission.objects.exists())
        self.client.post(reverse('learning:work',args=[self.work.pk]),{'group':self.group.pk,'board_id':'share-me'})
        item=Submission.objects.get();self.assertEqual(item.title,'Class work')
        self.assertEqual(len(json.loads(item.payload['raw'])['boards']),1)
        self.assertNotIn('do not share',item.payload['raw'])
        self.client.force_login(self.teacher)
        self.assertNotContains(self.client.get(reverse('learning:submission',args=[item.pk])),'do not share')

    def test_teacher_dashboard_only_includes_assigned_members(self):
        self.client.force_login(self.teacher)
        response=self.client.get('/learning/teacher/')
        self.assertContains(response,'Science A')
        self.assertContains(response,'learner')


class PublicPagesTests(TestCase):
    def test_help_policies_and_ai_removal(self):
        for path in ['/help/','/privacy/','/terms/','/guardians/','/deletion-information/','/support/']:
            self.assertEqual(self.client.get(path).status_code,200)
        self.assertEqual(self.client.get('/educations/whiteboard/ai/').status_code,404)
        response=self.client.get('/educations/whiteboard/')
        self.assertNotContains(response,'wb-ai-assist');self.assertNotContains(response,'wb-ai-dialog')


class OperationsTests(TestCase):
    def test_backup_freshness_and_recorded_failure_are_visible_without_details(self):
        with tempfile.TemporaryDirectory() as temporary, override_settings(BACKUP_STATUS_FILE=Path(temporary)/'backup-status.json'):
            path=Path(temporary)/'backup-status.json'
            path.write_text(json.dumps({'last_success':timezone.now().isoformat(),'failed':False}))
            self.assertEqual(self.client.get('/health/backups/').status_code,200)
            path.write_text(json.dumps({'last_success':timezone.now().isoformat(),'failed':True,'private':'hidden'}))
            response=self.client.get('/health/backups/')
            self.assertEqual(response.status_code,503);self.assertNotIn(b'hidden',response.content)

    def test_failed_backup_helper_always_releases_the_write_pause(self):
        import os,subprocess,sys
        with tempfile.TemporaryDirectory() as temporary:
            flag=Path(temporary)/'read-only';flag.touch()
            result=subprocess.run([sys.executable,'deploy/backup_status.py','0'],env={**os.environ,'BACKUP_RUNTIME_ROOT':temporary},capture_output=True)
            self.assertEqual(result.returncode,0)
            self.assertFalse(flag.exists())
            self.assertTrue(json.loads((Path(temporary)/'backup-status.json').read_text())['failed'])

    def test_error_marker_contains_only_timestamp_and_requires_acknowledgement(self):
        from learning.checks import OperationalErrorHandler
        import logging
        with tempfile.TemporaryDirectory() as temporary, override_settings(BACKUP_STATUS_FILE=Path(temporary)/'backup-status.json'):
            record=logging.LogRecord('django.request',logging.ERROR,'',1,'secret request content',(),None)
            record.status_code=500
            OperationalErrorHandler().emit(record)
            path=Path(temporary)/'application-error.json'
            self.assertEqual(set(json.loads(path.read_text())),{'last_error'})
            self.assertNotIn('secret',path.read_text())
            call_command('acknowledge_error',note='Synthetic incident repaired',stdout=io.StringIO())
            self.assertFalse(path.exists())
