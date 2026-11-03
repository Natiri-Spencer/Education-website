from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.views import LoginView, PasswordChangeView
from django.core import signing
from django.db import IntegrityError, transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.views.decorators.debug import sensitive_post_parameters

from .forms import ApprovalForm, RecoveryForm, SignupCompleteForm, SignupStartForm, StaffRecoveryForm
from .models import AuditEvent, POLICY_VERSION, Profile, SignupRequest
from .services import deliver, limited, read_signup, signup_token, signup_capacity


def form_page(request, title, form=None, text='', button='Continue', **extra):
    return render(request, 'learning/form.html', dict(title=title, form=form, text=text, button=button,
        local_email_preview=settings.DEBUG and settings.EMAIL_BACKEND.endswith('console.EmailBackend'), **extra))


class SafeLoginView(LoginView):
    template_name = 'registration/login.html'

    def post(self, request, *args, **kwargs):
        if limited(request, 'login', 10, 900, request.POST.get('username', '')) or limited(request, 'login-network', 300, 900):
            return HttpResponse('Too many sign-in attempts. Try again in 15 minutes.', status=429)
        return super().post(request, *args, **kwargs)


class SafePasswordChangeView(PasswordChangeView):
    template_name = 'registration/password_change_form.html'
    success_url = reverse_lazy('learning:dashboard')

    def form_valid(self, form):
        result = super().form_valid(form)
        Profile.objects.filter(user=self.request.user).update(must_change_password=False)
        return result


@require_http_methods(['GET', 'POST'])
def signup(request):
    if not settings.PUBLIC_REGISTRATION_ENABLED:
        return form_page(request, 'Registration is not open yet', text='Public registration opens after email, privacy, restoration and classroom-trial checks are approved. You can still browse public learning resources.')
    return start_verification(request, False)


@login_required
@require_http_methods(['GET', 'POST'])
def complete_profile(request):
    return start_verification(request, True)


def start_verification(request, existing):
    form = SignupStartForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        if form.cleaned_data['website'] or limited(request, 'signup', 5, identity=form.cleaned_data['email']) or limited(request, 'signup-network', 100):
            return form_page(request, 'Please try later', text='Too many requests. Please wait an hour before trying again.')
        if not signup_capacity():
            return form_page(request, 'Account requests temporarily paused', text='Please try tomorrow or contact academy staff. Existing sign-ins and learning resources remain available.')
        record = SignupRequest.objects.create(email=form.cleaned_data['email'], age_band=form.cleaned_data['age_band'],
                                              user=request.user if existing else None)
        token = signup_token(record)
        url = request.build_absolute_uri(reverse('learning:approve', args=[token]))
        text = ('A request was made to create or verify an account at CBE STEM ACADEMY. '
                'If the learner is under 18, this must be completed by their parent or authorised guardian. '
                'No learner username or password has been collected for a new account. '
                'Review the policies and explicitly approve at the link below. It expires in 24 hours. '
                'Ignore this message if you did not expect it.\n\n' + url)
        sent = deliver('Approve your CBE STEM ACADEMY account request', text, record.email)
        return form_page(request, 'Check the recovery inbox' if sent else 'Email is waiting',
                         text='If delivery succeeds, the recovery inbox will receive the approval link. If it does not arrive, use Resend approval after a few minutes.',
                         resend_url=reverse('learning:resend', args=[record.pk]))
    return form_page(request, 'Complete account verification' if existing else 'Create a learner account', form,
                     'Start with the recovery email and age band. Under-18 learners use a guardian’s email. Email control is not proof of guardianship; disputed requests are reviewed by academy staff.')


@require_http_methods(['GET', 'POST'])
def resend(request, pk):
    # Opaque UUIDs prevent enumeration; response is identical for missing/used requests.
    if request.method == 'POST' and ApprovalResendForm(request.POST).is_valid() and not limited(request, 'resend', 5):
        record = SignupRequest.objects.filter(pk=pk, used_at__isnull=True, created_at__gte=timezone.now()-timezone.timedelta(days=7)).first()
        if record:
            url = request.build_absolute_uri(reverse('learning:approve', args=[signup_token(record)]))
            deliver('Your CBE STEM ACADEMY approval link', 'Review and approve this request if expected. Link expires in 24 hours:\n'+url, record.email)
        return form_page(request, 'Approval requested', text='If this request can be processed, an approval message will be sent. Please check the inbox or try again later.')
    return form_page(request, 'Resend approval', ApprovalResendForm(), button='Resend approval')


from django import forms
class ApprovalResendForm(forms.Form):
    confirm = forms.BooleanField(label='Send another approval message for this request')


def valid_request(token):
    try:
        return read_signup(token)
    except (signing.BadSignature, SignupRequest.DoesNotExist, ValueError, KeyError):
        return None


@require_http_methods(['GET', 'POST'])
def approve(request, token):
    record = valid_request(token)
    if not record:
        return form_page(request, 'Link unavailable', text='This link has expired or was already used. Start a new request or contact staff.')
    form = ApprovalForm(request.POST or None)
    if request.method == 'POST' and form.is_valid() and not limited(request, 'approval', 20):
        with transaction.atomic():
            record = SignupRequest.objects.select_for_update().get(pk=record.pk)
            if record.used_at:
                return form_page(request, 'Link already used')
            record.approved_at = timezone.now()
            if record.user_id:
                user = get_user_model().objects.select_for_update().get(pk=record.user_id)
                profile, _ = Profile.objects.get_or_create(user=user)
                if profile.deletion_requested_at:
                    return form_page(request, 'Account deletion pending', text='Contact staff before changing this account.')
                user.email = record.email
                user.save(update_fields=['email'])
                apply_consent(profile, record)
                record.used_at = timezone.now()
                AuditEvent.objects.create(subject=user, action='account_verification', note='Email control and consent acknowledged; guardian identity may require staff review.')
            record.save()
        if record.user_id:
            return form_page(request, 'Verification complete', text='The account can now use online saving. Sign in to continue.')
        return form_page(request, 'Approval recorded', text='The learner can now choose a username and password. Share the following completion link privately with the learner.',
                         finish_url=reverse('learning:finish_signup', args=[token]))
    return form_page(request, 'Review and approve the request', form,
                     'Approval applies to the current Privacy and Terms versions. Do not approve if you are not the intended account holder or an authorised guardian.')


def apply_consent(profile, record):
    profile.age_band = record.age_band
    profile.email_verified_at = timezone.now()
    profile.guardian_approved_at = record.approved_at if record.age_band == 'minor' else None
    profile.guardian_email = record.email if record.age_band == 'minor' else ''
    profile.policy_version = POLICY_VERSION
    profile.save()


@require_http_methods(['GET', 'POST'])
@sensitive_post_parameters('password1', 'password2')
def finish_signup(request, token):
    record = valid_request(token)
    if not record or not record.approved_at or record.user_id:
        return form_page(request, 'Approval needed', text='Obtain a valid approval link before providing learner details.')
    form = SignupCompleteForm(request.POST or None)
    if request.method == 'POST' and form.is_valid() and not limited(request, 'finish-signup', 10):
        with transaction.atomic():
            record = SignupRequest.objects.select_for_update().get(pk=record.pk)
            if record.used_at:
                return form_page(request, 'Link already used')
            user = form.save(commit=False)
            user.email = record.email
            user.is_staff = user.is_superuser = False
            try:
                with transaction.atomic():
                    user.save()
            except IntegrityError:
                form.add_error('username', 'That username has just been taken. Choose another username.')
                return form_page(request, 'Choose your learner account details', form)
            profile = Profile.objects.create(user=user)
            apply_consent(profile, record)
            record.user = user
            record.used_at = timezone.now()
            record.save()
            AuditEvent.objects.create(subject=user, action='public_account_created', note='Policy '+POLICY_VERSION)
        messages.success(request, 'Account created. Sign in with your new username and password.')
        return redirect('accounts:login')
    return form_page(request, 'Choose your learner account details', form)


@require_http_methods(['GET', 'POST'])
def recovery(request):
    form = RecoveryForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        if not limited(request, 'recovery', 5):
            # Use Django's one-use password token; deliver through the shared budget.
            from django.contrib.auth.tokens import default_token_generator
            from django.utils.encoding import force_bytes
            from django.utils.http import urlsafe_base64_encode
            for user in form.get_users(form.cleaned_data['email']):
                url = request.build_absolute_uri(reverse('accounts:password_reset_confirm', kwargs={
                    'uidb64': urlsafe_base64_encode(force_bytes(user.pk)), 'token': default_token_generator.make_token(user)}))
                deliver('Reset your CBE STEM ACADEMY password', 'If requested, reset your password using this private link. It expires in one hour:\n'+url, user.email)
        return form_page(request, 'Recovery requested', text='If the username and verified recovery email match an eligible account, a reset link will be sent. Otherwise contact academy staff. You can try again later if email is delayed.')
    return form_page(request, 'Forgotten password', form, 'Enter your username and verified recovery email. Under-18 learners may use their guardian’s recovery inbox.')


@user_passes_test(lambda u: u.is_active and u.is_staff)
@require_http_methods(['GET', 'POST'])
@sensitive_post_parameters('new_password1', 'new_password2')
def staff_recovery(request, pk):
    user = get_object_or_404(get_user_model(), pk=pk)
    if (user.is_staff or user.is_superuser) and not request.user.is_superuser:
        return HttpResponse('Only a superuser can recover staff accounts.', status=403)
    form = StaffRecoveryForm(user, request.POST or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.must_change_password = True
        profile.save(update_fields=['must_change_password'])
        AuditEvent.objects.create(actor=request.user, subject=user, action='staff_password_recovery', note=form.cleaned_data['identity_check'])
        return form_page(request, 'Temporary password set', text='Give the temporary password to the verified learner securely. They must change it at their next sign-in.')
    return form_page(request, 'Staff-assisted recovery for '+user.username, form, 'Verify identity through an established school or guardian contact. Never record identity-document numbers or passwords in the audit note.')
