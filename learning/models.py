import secrets
import uuid
import os

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

POLICY_VERSION = '2026-11-03'


class PrivateWorkStorage(FileSystemStorage):
    @property
    def base_location(self):
        return str(settings.PRIVATE_WORK_ROOT)

    @property
    def location(self):
        return os.path.abspath(self.base_location)

    @property
    def base_url(self):
        return None


def private_storage():
    return PrivateWorkStorage(file_permissions_mode=0o600, directory_permissions_mode=0o700)


def private_path(instance, filename):
    return f'{instance.owner_id}/{uuid.uuid4().hex}'


def class_code():
    return secrets.token_hex(5).upper()


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='learning_profile')
    age_band = models.CharField(max_length=10, choices=[('minor', 'Under 18'), ('adult', '18 or older')], blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    guardian_approved_at = models.DateTimeField(null=True, blank=True)
    guardian_email = models.EmailField(blank=True)
    policy_version = models.CharField(max_length=30, blank=True)
    grade = models.ForeignKey('educations.Grade', null=True, blank=True, on_delete=models.SET_NULL)
    deletion_requested_at = models.DateTimeField(null=True, blank=True)
    must_change_password = models.BooleanField(default=False)

    @property
    def ready(self):
        return bool(not self.deletion_requested_at and self.policy_version == POLICY_VERSION and
                    self.email_verified_at and self.age_band in {'minor', 'adult'} and
                    (self.age_band == 'adult' or self.guardian_approved_at))


class SignupRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    age_band = models.CharField(max_length=10)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    approved_at = models.DateTimeField(null=True, blank=True)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    policy_version = models.CharField(max_length=30, default=POLICY_VERSION)


class AuditEvent(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    subject = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name='+')
    action = models.CharField(max_length=60)
    note = models.CharField(max_length=400, blank=True)
    created_at = models.DateTimeField(default=timezone.now)


class ClassGroup(models.Model):
    name = models.CharField(max_length=120)
    grade = models.ForeignKey('educations.Grade', on_delete=models.PROTECT)
    teachers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='teaching_groups', blank=True)
    code = models.CharField(max_length=20, unique=True, default=class_code)

    def __str__(self):
        return f'{self.name} · {self.grade}'

    class Meta:
        permissions = [('review_submissions', 'Review submissions from assigned classes')]


class Membership(models.Model):
    group = models.ForeignKey(ClassGroup, on_delete=models.CASCADE, related_name='memberships')
    learner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['group', 'learner'], name='unique_learning_membership')]


class Attachment(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    key = models.CharField(max_length=160)
    name = models.CharField(max_length=200)
    size = models.PositiveIntegerField()
    mime = models.CharField(max_length=100)
    file = models.FileField(storage=private_storage, upload_to=private_path)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['owner', 'key'], name='unique_private_attachment')]


class SavedWork(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    key = models.CharField(max_length=180)
    title = models.CharField(max_length=160)
    kind = models.CharField(max_length=20)
    payload = models.JSONField(default=dict)
    revision = models.PositiveIntegerField(default=1)
    size = models.PositiveIntegerField(default=0)
    deleted = models.BooleanField(default=False)
    assets = models.ManyToManyField(Attachment, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['owner', 'key'], name='unique_owned_work')]


class Submission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    group = models.ForeignKey(ClassGroup, on_delete=models.CASCADE, related_name='submissions')
    work_key = models.CharField(max_length=180)
    title = models.CharField(max_length=160)
    payload = models.JSONField()
    size = models.PositiveIntegerField(default=0)
    assets = models.ManyToManyField(Attachment, blank=True)
    version = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=15, default='submitted', choices=[('submitted', 'Submitted'), ('returned', 'Returned for changes'), ('reviewed', 'Reviewed')])
    created_at = models.DateTimeField(default=timezone.now)


class Assessment(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='assessments')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    feedback = models.TextField(max_length=4000)
    score = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    status = models.CharField(max_length=15, choices=[('returned', 'Returned for changes'), ('reviewed', 'Reviewed')])
    created_at = models.DateTimeField(default=timezone.now)


class LessonProgress(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    path = models.CharField(max_length=300)
    title = models.CharField(max_length=160)
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['owner', 'path'], name='unique_lesson_progress')]
