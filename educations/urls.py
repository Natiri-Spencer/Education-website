"""Define URL for educations app."""
from django.urls import path
from .import views

app_name = 'educations'

urlpatterns = [
    # Homepage
    path('', views.home, name='home'),
    path('pdfs/', views.pdf_list, name='pdf_list'),
    path('videos/', views.video_list, name='video_list'),
    path('images/', views.image_list, name='image_list'),
    path('courses/', views.course_catalog, name='course_catalog'),
    path('courses/<slug:slug>/', views.course_detail, name='course_detail'),
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
