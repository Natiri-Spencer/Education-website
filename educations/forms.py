import re

from django import forms
from django.core.validators import FileExtensionValidator
from .models import PDFResource, VideoResource, ImageResource

class PDFForm(forms.ModelForm):
    pdf_file = forms.FileField(
        validators=[FileExtensionValidator(allowed_extensions=["pdf"])],
        widget=forms.ClearableFileInput(attrs={
            "accept": ".pdf,application/pdf",
            "class": "form-control",
        }),
    )

    class Meta:
        model = PDFResource
        fields = ["subject", "title", "pdf_file"]
        widgets = {
            "subject": forms.Select(attrs={"class": "form-select"}),
            "title": forms.TextInput(attrs={"class": "form-control"}),
        }

class VideoForm(forms.ModelForm):
    class Meta:
        model = VideoResource
        fields = ["subject", "title", "video_file"]

class ImageForm(forms.ModelForm):
    class Meta:
        model = ImageResource
        fields = ["subject", "title", "image_file"]


class MpesaCheckoutForm(forms.Form):
    phone_number = forms.CharField(
        label="M-Pesa phone number",
        max_length=16,
        widget=forms.TextInput(attrs={
            "class": "form-control",
            "autocomplete": "tel",
            "placeholder": "07XX XXX XXX",
            "inputmode": "tel",
        }),
    )

    def clean_phone_number(self):
        phone = re.sub(r"[\s()\-]", "", self.cleaned_data["phone_number"])
        if phone.startswith("+"):
            phone = phone[1:]
        if phone.startswith("0"):
            phone = "254" + phone[1:]
        if not re.fullmatch(r"254[17]\d{8}", phone):
            raise forms.ValidationError("Enter a valid Kenyan mobile number, such as 0712 345 678.")
        return phone

