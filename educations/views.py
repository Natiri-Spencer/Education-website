import json
import logging
from decimal import Decimal, InvalidOperation

from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import (
    Grade, Subject, PDFResource, VideoResource, ImageResource,
    ShortCourse, CourseEnrollment,
)
from .forms import PDFForm, VideoForm, ImageForm
from .forms import MpesaCheckoutForm
from .mpesa import MpesaError, initiate_stk_push


logger = logging.getLogger(__name__)


def home(request):
    latest_pdfs = PDFResource.objects.select_related("subject").order_by("-uploaded_at", "-id")[:5]
    latest_images = ImageResource.objects.select_related("subject").order_by("-uploaded_at", "-id")[:5]
    latest_videos = VideoResource.objects.select_related("subject").order_by("-uploaded_at", "-id")[:5]

    return render(request, "educations/home.xhtml", {
        "pdfs": latest_pdfs,
        "images": latest_images,
        "videos": latest_videos,
    })


def about_us(request):
    return render(request, "educations/about_us.xhtml")


def virtual_labs(request, grade=None):
    requested_grade = str(grade) if grade is not None else request.GET.get("grade", "")
    selected_grade = requested_grade if requested_grade in {"7", "8", "9"} else ""
    return render(request, "educations/virtual_labs.xhtml", {
        "selected_grade": selected_grade,
        "grade_selected": bool(selected_grade),
        "grade_has_labs": selected_grade == "7",
    })


def course_catalog(request):
    courses = ShortCourse.objects.filter(
        is_published=True,
        subject__grade__name__in=("Grade 7", "Grade 8", "Grade 9"),
    ).select_related("subject", "subject__grade")
    courses_by_grade = {f"Grade {number}": [] for number in range(7, 10)}
    for course in courses:
        courses_by_grade[course.subject.grade.name].append(course)
    return render(request, "educations/course_catalog.xhtml", {"courses_by_grade": courses_by_grade})


def course_detail(request, slug):
    course = get_object_or_404(
        ShortCourse.objects.filter(is_published=True).select_related(
            "subject", "subject__grade"
        ).prefetch_related("modules"),
        slug=slug,
        subject__grade__name__in=("Grade 7", "Grade 8", "Grade 9"),
    )
    checkout_form = MpesaCheckoutForm()
    already_enrolled = request.user.is_authenticated and CourseEnrollment.objects.filter(
        user=request.user, course=course, status=CourseEnrollment.Status.PAID
    ).exists()
    return render(request, "educations/course_detail.xhtml", {
        "course": course,
        "checkout_form": checkout_form,
        "already_enrolled": already_enrolled,
    })


@login_required(login_url="accounts:login")
def course_checkout(request, slug):
    if request.method != "POST":
        return redirect("educations:course_detail", slug=slug)

    course = get_object_or_404(
        ShortCourse.objects.select_related("subject", "subject__grade"),
        slug=slug,
        is_published=True,
        subject__grade__name__in=("Grade 7", "Grade 8", "Grade 9"),
    )
    if CourseEnrollment.objects.filter(
        user=request.user, course=course, status=CourseEnrollment.Status.PAID
    ).exists():
        messages.info(request, "You are already enrolled in this course.")
        return redirect("educations:course_detail", slug=slug)

    form = MpesaCheckoutForm(request.POST)
    if course.price is None or not course.price.is_finite() or course.price < 1:
        messages.error(request, "This course is not available for payment yet.")
        return redirect("educations:course_detail", slug=slug)
    if not course.price.to_integral_value() == course.price:
        messages.error(request, "This course price is not set to a whole KES amount.")
        return redirect("educations:course_detail", slug=slug)
    if not form.is_valid():
        return render(request, "educations/course_detail.xhtml", {
            "course": course,
            "checkout_form": form,
            "already_enrolled": False,
        }, status=400)

    enrollment = CourseEnrollment.objects.create(
        user=request.user,
        course=course,
        amount=course.price,
        currency=course.currency,
        phone_number=form.cleaned_data["phone_number"],
    )
    try:
        response = initiate_stk_push(
            phone_number=enrollment.phone_number,
            amount=enrollment.amount,
            course_title=course.title,
        )
    except MpesaError as exc:
        enrollment.status = CourseEnrollment.Status.FAILED
        enrollment.save(update_fields=["status", "updated_at"])
        logger.warning("Could not start M-Pesa enrollment payment: %s", exc)
        messages.error(request, str(exc))
        return redirect("educations:course_detail", slug=slug)

    enrollment.checkout_request_id = response["CheckoutRequestID"]
    enrollment.merchant_request_id = response.get("MerchantRequestID", "")
    enrollment.save(update_fields=["checkout_request_id", "merchant_request_id", "updated_at"])
    return redirect("educations:enrollment_status", enrollment_id=enrollment.id)


@login_required(login_url="accounts:login")
def enrollment_status(request, enrollment_id):
    enrollment = get_object_or_404(
        CourseEnrollment.objects.select_related("course", "course__subject", "course__subject__grade"),
        pk=enrollment_id,
        user=request.user,
    )
    return render(request, "educations/enrollment_status.xhtml", {"enrollment": enrollment})


@csrf_exempt
@require_POST
def mpesa_callback(request):
    try:
        payload = json.loads(request.body)
        callback = payload["Body"]["stkCallback"]
        checkout_id = callback["CheckoutRequestID"]
    except (json.JSONDecodeError, KeyError, TypeError):
        return JsonResponse({"ResultCode": 1, "ResultDesc": "Invalid callback payload"}, status=400)

    with transaction.atomic():
        enrollment = CourseEnrollment.objects.select_for_update().filter(
            checkout_request_id=checkout_id
        ).first()
        if enrollment is None or enrollment.status == CourseEnrollment.Status.PAID:
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})
        if callback.get("MerchantRequestID") != enrollment.merchant_request_id:
            logger.error("M-Pesa merchant request did not match enrollment %s", enrollment.pk)
            return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})

        if callback.get("ResultCode") == 0:
            metadata = {
                item.get("Name"): item.get("Value")
                for item in callback.get("CallbackMetadata", {}).get("Item", [])
            }
            try:
                paid_amount = Decimal(str(metadata.get("Amount")))
            except (InvalidOperation, TypeError):
                paid_amount = None
            paid_phone = str(metadata.get("PhoneNumber", ""))
            receipt = str(metadata.get("MpesaReceiptNumber", ""))
            if paid_amount == enrollment.amount and paid_phone == enrollment.phone_number and receipt:
                enrollment.status = CourseEnrollment.Status.PAID
                enrollment.mpesa_receipt = receipt
            else:
                logger.error("M-Pesa callback did not match enrollment %s", enrollment.pk)
        else:
            enrollment.status = CourseEnrollment.Status.FAILED
        enrollment.save(update_fields=["status", "mpesa_receipt", "updated_at"])

    return JsonResponse({"ResultCode": 0, "ResultDesc": "Accepted"})


def design_samples(request):
    return render(request, "educations/layout_samples.xhtml")


def grade_resources(request, grade_id):
    grade = get_object_or_404(Grade, id=grade_id)
    subjects = grade.subjects.all()
    return render(request, "educations/grade_resources.xhtml", {
        "grade": grade,
        "subjects": subjects,
    })

def subject_resources(request, subject_id):
    subject = get_object_or_404(Subject, id=subject_id)
    resources = {
        "pdfs": subject.pdfs.all(),
        "videos": subject.videos.all(),
        "images": subject.images.all(),
    }
    return render(request, "educations/subject_resources.xhtml", {
        "subject": subject,
        "resources": resources,
    })


def pdf_list(request):
    pdfs = Paginator(
        PDFResource.objects.select_related("subject").order_by("-uploaded_at", "-id"), 20
    ).get_page(request.GET.get("page"))
    return render(request, "educations/pdf_list.xhtml", {"pdfs": pdfs, "page_obj": pdfs})


def video_list(request):
    videos = Paginator(
        VideoResource.objects.select_related("subject").order_by("-uploaded_at", "-id"), 20
    ).get_page(request.GET.get("page"))
    return render(request, "educations/video_list.xhtml", {"videos": videos, "page_obj": videos})


def image_list(request):
    images = Paginator(
        ImageResource.objects.select_related("subject").order_by("-uploaded_at", "-id"), 20
    ).get_page(request.GET.get("page"))
    return render(request, "educations/image_list.xhtml", {"images": images, "page_obj": images})

@staff_member_required(login_url="accounts:login")
def upload_pdf(request):
    if request.method == "POST":
        form = PDFForm(request.POST, request.FILES)
        if form.is_valid():
            resource = form.save()
            messages.success(request, f'"{resource.title}" was uploaded successfully.')
            return redirect("educations:pdf_list")
    else:
        form = PDFForm()
    return render(request, "educations/upload_pdf.xhtml", {"form": form})

@staff_member_required(login_url="accounts:login")
def upload_video(request):
    if request.method == "POST":
        form = VideoForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect("educations:video_list")
    else:
        form = VideoForm()
    return render(request, "educations/upload_video.xhtml", {"form": form})

@staff_member_required(login_url="accounts:login")
def upload_image(request):
    if request.method == "POST":
        form = ImageForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect("educations:image_list")
    else:
        form = ImageForm()
    return render(request, "educations/upload_image.xhtml", {"form": form})
