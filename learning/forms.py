from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm, UserCreationForm

from .models import Assessment, Profile


class SignupStartForm(forms.Form):
    age_band = forms.ChoiceField(label='Age band', choices=[('minor', 'Under 18'), ('adult', '18 or older')])
    email = forms.EmailField(label='Recovery email — use your guardian’s email if under 18')
    acknowledge = forms.BooleanField(label='I have read the privacy and guardian information. Under-18 learners must obtain guardian approval first.')
    website = forms.CharField(required=False, widget=forms.HiddenInput)


class ApprovalForm(forms.Form):
    responsible = forms.BooleanField(label='I control this email address. If this request concerns a learner under 18, I am their parent or authorised guardian and approve account creation and the described processing.')
    policies = forms.BooleanField(label='I have read the Privacy, Terms and Guardian Information pages.')


class SignupCompleteForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = get_user_model()
        fields = ('username',)


class RecoveryForm(PasswordResetForm):
    username = forms.CharField(max_length=150, label='Username')

    def get_users(self, email):
        username = self.cleaned_data['username']
        for user in super().get_users(email):
            profile = Profile.objects.filter(user=user, email_verified_at__isnull=False, deletion_requested_at__isnull=True).first()
            if user.username == username and profile:
                yield user


class StaffRecoveryForm(SetPasswordForm):
    identity_check = forms.CharField(max_length=300, label='Identity check completed (record the method; do not enter identity-document numbers)')


class ReviewForm(forms.ModelForm):
    class Meta:
        model = Assessment
        fields = ('feedback', 'score', 'status')


class SupportForm(forms.Form):
    email = forms.EmailField(label='Your reply email')
    subject = forms.CharField(max_length=120)
    message = forms.CharField(max_length=3000, widget=forms.Textarea)
    website = forms.CharField(required=False, widget=forms.HiddenInput)
