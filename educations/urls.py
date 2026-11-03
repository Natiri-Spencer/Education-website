"""Define URL for educations app."""
from django.urls import path
from .import views
from .whiteboard_recognition import recognize_handwriting
from .curriculum_lessons import fertilization_lesson, fertilization_asset, pregnancy_lesson, pregnancy_asset, adolescence_lesson, adolescence_asset
from .curriculum_lessons import reproductive_system_lesson, reproductive_system_asset

app_name = 'educations'

urlpatterns = [
    path('grade-7/integrated-science/living-things-and-environment/female-reproductive-system/', reproductive_system_lesson, {'system': 'female'}, name='female_system_lesson'),
    path('grade-7/integrated-science/living-things-and-environment/female-reproductive-system/media/<slug:kind>/', reproductive_system_asset, {'system': 'female'}, name='female_system_asset'),
    path('grade-7/integrated-science/living-things-and-environment/male-reproductive-system/', reproductive_system_lesson, {'system': 'male'}, name='male_system_lesson'),
    path('grade-7/integrated-science/living-things-and-environment/male-reproductive-system/media/<slug:kind>/', reproductive_system_asset, {'system': 'male'}, name='male_system_asset'),
    path('grade-7/integrated-science/living-things-and-environment/physical-changes-during-adolescence/', adolescence_lesson, name='adolescence_lesson'),
    path('grade-7/integrated-science/living-things-and-environment/physical-changes-during-adolescence/media/<slug:kind>/', adolescence_asset, name='adolescence_asset'),
    path('grade-7/integrated-science/living-things-and-environment/implantation-and-pregnancy/', pregnancy_lesson, name='pregnancy_lesson'),
    path('grade-7/integrated-science/living-things-and-environment/implantation-and-pregnancy/media/<slug:kind>/', pregnancy_asset, name='pregnancy_asset'),
    path('grade-7/integrated-science/living-things-and-environment/fertilisation/', fertilization_lesson, name='fertilization_lesson'),
    path('grade-7/integrated-science/living-things-and-environment/fertilisation/media/<slug:kind>/', fertilization_asset, name='fertilization_asset'),
    # Homepage
    path('', views.home, name='home'),
    path('pdfs/', views.pdf_list, name='pdf_list'),
    path('videos/', views.video_list, name='video_list'),
    path('images/', views.image_list, name='image_list'),
    path('courses/', views.course_catalog, name='course_catalog'),
    path('whiteboard/', views.whiteboard, name='whiteboard'),
    path('whiteboard/recognize/', recognize_handwriting, name='whiteboard_recognize'),
    path('courses/<slug:slug>/', views.course_detail, name='course_detail'),
    path('courses/<slug:slug>/modules/<int:module_id>/', views.course_module, name='course_module'),
    path('courses/<slug:slug>/checkout/', views.course_checkout, name='course_checkout'),
    path('enrollment/<int:enrollment_id>/', views.enrollment_status, name='enrollment_status'),
    # Upload routes (staff/admin only)
    path('upload/pdf/', views.upload_pdf, name='upload_pdf'),
    path('upload/video/', views.upload_video, name='upload_video'),
    path('upload/image/', views.upload_image, name='upload_image'),

    # Grade-specific resources
    path('grade/<int:grade_id>/resources/', views.grade_resources, name='grade_resources'),
    path('subject/<int:subject_id>/resources/', views.subject_resources, name='subject_resources'),

]
