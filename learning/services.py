import hashlib
import logging
import re

from django.conf import settings
from django.core import signing
from django.core.cache import cache
from django.core.mail import send_mail
from django.db.models import Sum
from django.http import JsonResponse

from .models import Attachment, Profile, SavedWork, Submission

logger = logging.getLogger(__name__)


def limited(request, action, limit=10, seconds=3600, identity=''):
    # The edge proxy supplies a single client address; never use a forwarded
    # visitor-supplied list as an authentication or ownership signal.
    address = (request.META.get('HTTP_X_ACADEMY_CLIENT_IP', '') if settings.SECURE_PROXY_SSL_HEADER else '') or request.META.get('REMOTE_ADDR', '')
    identity = identity.strip().casefold()
    digest = hashlib.sha256(f'{address}:{identity}'.encode()).hexdigest()
    key = f'learning-rate:{action}:{digest}'
    try:
        cache.add(key, 0, seconds)
        return cache.incr(key) > limit
    except Exception:
        logger.error('Request limiter unavailable')
        return True


def deliver(subject, text, recipient):
    try:
        # Reserve a shared daily allowance, including failed delivery attempts.
        from django.utils import timezone
        key = 'academy-mail-' + timezone.now().date().isoformat()
        cache.add(key, 0, 172800)
        if cache.incr(key) > settings.ACADEMY_DAILY_EMAIL_LIMIT:
            return False
        return send_mail(subject, text, settings.DEFAULT_FROM_EMAIL, [recipient], fail_silently=False) == 1
    except Exception:
        logger.error('Transactional email delivery failed; message retained as pending')
        return False


def signup_capacity():
    from django.utils import timezone
    key = 'academy-signup-capacity-' + timezone.now().date().isoformat()
    try:
        cache.add(key, 0, 172800)
        return cache.incr(key) <= 200
    except Exception:
        return False


def signup_token(record):
    return signing.dumps({'id': str(record.pk), 'email': record.email, 'policy': record.policy_version}, salt='academy-signup')


def read_signup(token):
    from .models import POLICY_VERSION, SignupRequest
    data = signing.loads(token, salt='academy-signup', max_age=86400)
    return SignupRequest.objects.get(pk=data['id'], email=data['email'], policy_version=POLICY_VERSION, used_at__isnull=True)


def eligible(user):
    if not user.is_authenticated or not user.is_active:
        return False
    profile = Profile.objects.filter(user=user).first()
    if profile and (profile.deletion_requested_at or profile.must_change_password):
        return False
    return user.is_staff or bool(profile and profile.ready)


def guard(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Sign in to use private online saving.'}, status=401)
    if request.headers.get('X-Academy-Scope', 'u'+str(request.user.pk)) != 'u'+str(request.user.pk):
        return JsonResponse({'error': 'The signed-in account changed. Reload this tab; its device draft is retained separately.'}, status=403)
    if not eligible(request.user):
        return JsonResponse({'error': 'Complete account verification and consent before saving online.', 'profile_url': '/accounts/complete-profile/'}, status=403)


def teacher_groups(user):
    from .models import ClassGroup
    if user.is_staff:
        return ClassGroup.objects.all()
    if user.has_perm('learning.review_submissions'):
        return user.teaching_groups.all()
    return ClassGroup.objects.none()


def used_bytes(user):
    return sum(model.objects.filter(owner=user).aggregate(n=Sum('size'))['n'] or 0
               for model in (SavedWork, Attachment, Submission))


WORK_KEY = re.compile(r'^(?:eduportal\.whiteboards\.v1|grade[789][a-zA-Z0-9_.:-]{1,150})$')
FILE_KEY = re.compile(r'^[a-zA-Z0-9][a-zA-Z0-9_:-]{0,159}$')


def attachment_ids(value):
    found = set()
    def visit(item):
        if isinstance(item, dict):
            if item.get('type') == 'file' and isinstance(item.get('attachmentId'), str):
                found.add(item['attachmentId'])
            for child in item.values():
                visit(child)
        elif isinstance(item, list):
            for child in item:
                visit(child)
    visit(value)
    return found
