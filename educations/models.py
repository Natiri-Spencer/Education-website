from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db.models import Case, IntegerField, Value, When
from django.db.models.functions import Lower

class Grade(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    


class Subject(models.Model):
    grade = models.ForeignKey(
        Grade,
        related_name="subjects",
        on_delete=models.CASCADE,
        default=1
    )
    name = models.CharField(max_length=100)

    class Meta:
        ordering = (
            Case(
                When(name__iexact="C.R.E", then=Value(0)),
                When(name__iexact="Social", then=Value(1)),
                When(name__iexact="Science and Technology", then=Value(2)),
                When(name__iexact="Mathematics", then=Value(3)),
                When(name__iexact="Kiswahili", then=Value(4)),
                When(name__iexact="English", then=Value(5)),
                default=Value(6),
                output_field=IntegerField(),
            ),
            Lower("name"),
        )

    def __str__(self):
        return f"{self.name} ({self.grade.name})"


class PDFResource(models.Model):
    subject = models.ForeignKey(
        Subject,
        related_name="pdfs",
        on_delete=models.CASCADE,
        default=1
    )
    title = models.CharField(max_length=200)
    pdf_file = models.FileField(upload_to="pdfs/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.subject.name}"


class VideoResource(models.Model):
    subject = models.ForeignKey(
        Subject,
        related_name="videos",
        on_delete=models.CASCADE,
        default=1
    )
    title = models.CharField(max_length=200)
    video_file = models.FileField(upload_to="videos/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.subject.name}"


class ImageResource(models.Model):
    subject = models.ForeignKey(
        Subject,
        related_name="images",
        on_delete=models.CASCADE,
        default=1
    )
    title = models.CharField(max_length=200)
    image_file = models.ImageField(upload_to="images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.subject.name}"


class ShortCourse(models.Model):
    subject = models.ForeignKey(
        Subject,
        related_name="short_courses",
        on_delete=models.PROTECT,
    )
    title = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True)
    summary = models.CharField(max_length=280)
    description = models.TextField()
    duration_weeks = models.PositiveSmallIntegerField(default=4)
    price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="KES")
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("subject__grade__name", "title")

    def clean(self):
        if self.subject_id and self.subject.grade.name not in {"Grade 7", "Grade 8", "Grade 9"}:
            raise ValidationError({"subject": "Short courses are available for Grades 7 to 9."})
        if self.price is not None and self.price < 1:
            raise ValidationError({"price": "Course price must be at least KES 1."})
        if self.price is not None and self.price != self.price.to_integral_value():
            raise ValidationError({"price": "M-Pesa course prices must be whole Kenyan shillings."})
        if self.currency != "KES":
            raise ValidationError({"currency": "M-Pesa course payments currently support KES only."})

    def __str__(self):
        return f"{self.title} ({self.subject.grade.name})"


class CourseModule(models.Model):
    course = models.ForeignKey(ShortCourse, related_name="modules", on_delete=models.CASCADE)
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    position = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ("position", "id")
        constraints = [
            models.UniqueConstraint(fields=("course", "position"), name="unique_course_module_position"),
        ]

    def __str__(self):
        return f"{self.course.title}: {self.title}"


class CourseEnrollment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Payment pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Payment failed"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="course_enrollments", on_delete=models.PROTECT)
    course = models.ForeignKey(ShortCourse, related_name="enrollments", on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=3, default="KES")
    phone_number = models.CharField(max_length=12)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    checkout_request_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    merchant_request_id = models.CharField(max_length=100, blank=True)
    mpesa_receipt = models.CharField(max_length=32, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user} · {self.course} · {self.get_status_display()}"




