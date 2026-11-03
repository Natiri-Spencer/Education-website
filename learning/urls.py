from django.urls import path
from . import account_views as a, work_views as w, pages

app_name = 'learning'
urlpatterns = [
    path('accounts/signup/', a.signup, name='signup'),
    path('accounts/complete-profile/', a.complete_profile, name='complete_profile'),
    path('accounts/approval/<str:token>/', a.approve, name='approve'),
    path('accounts/finish/<str:token>/', a.finish_signup, name='finish_signup'),
    path('accounts/resend/<uuid:pk>/', a.resend, name='resend'),
    path('accounts/staff-recovery/<int:pk>/', a.staff_recovery, name='staff_recovery'),
    path('learning/', w.dashboard, name='dashboard'),
    path('learning/grade/', w.choose_grade, name='choose_grade'),
    path('learning/join/', w.join_class, name='join'),
    path('learning/teacher/', w.teacher_dashboard, name='teacher'),
    path('learning/membership/<int:pk>/', w.membership_review, name='membership_review'),
    path('learning/work/<int:pk>/', w.work_detail, name='work'),
    path('learning/submission/<uuid:pk>/', w.submission_detail, name='submission'),
    path('learning/submission/<uuid:pk>/attachment/<str:key>/', w.submission_attachment, name='submission_attachment'),
    path('learning/submission/<uuid:pk>/export/', w.submission_export, name='submission_export'),
    path('learning/api/work/', w.work_api, name='work_api'),
    path('learning/api/work/<str:key>/', w.work_api, name='work_item'),
    path('learning/api/attachments/<str:key>/', w.attachment_api, name='attachment_api'),
    path('learning/progress/', w.progress, name='progress'),
    path('learning/export/', w.export_work, name='export'),
    path('accounts/delete/', w.delete_account, name='delete'),
    path('help/', pages.help_page, name='help'),
    path('support/', w.support, name='support'),
    path('privacy/', pages.policy, {'kind':'privacy'}, name='privacy'),
    path('terms/', pages.policy, {'kind':'terms'}, name='terms'),
    path('guardians/', pages.policy, {'kind':'guardians'}, name='guardians'),
    path('deletion-information/', pages.policy, {'kind':'deletion'}, name='deletion_information'),
]
