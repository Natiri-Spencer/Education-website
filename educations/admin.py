from django.contrib import admin

# Register your models here.
from .models import (
    Grade, Subject, PDFResource, VideoResource, ImageResource,
    ShortCourse, CourseModule, CourseEnrollment,
)


class CourseModuleInline(admin.TabularInline):
    model = CourseModule
    extra = 1
    fields = ("position", "title", "description")
    show_change_link = True


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "position", "curriculum_reference")
    list_filter = ("course", "course__subject__grade")
    search_fields = ("title", "course__title", "curriculum_reference", "learning_outcomes")
    list_select_related = ("course",)
    fieldsets = (
        ("Module", {"fields": ("course", "position", "title", "description")}),
        ("Curriculum alignment", {"fields": ("curriculum_reference", "learning_outcomes")}),
        ("Teaching and learning", {"fields": ("lesson_content", "activities", "assessment")}),
        ("Diagrams and interactive activities", {"fields": ("diagram_kind", "diagram_caption", "simulation_kind")}),
        ("Teacher only", {"fields": ("teacher_notes",)}),
    )


@admin.register(ShortCourse)
class ShortCourseAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "is_published")
    exclude = ("price", "currency")
    list_filter = ("is_published", "subject__grade")
    search_fields = ("title", "subject__name", "subject__grade__name")
    prepopulated_fields = {"slug": ("title",)}
    inlines = (CourseModuleInline,)


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("user", "course", "amount", "currency", "status", "mpesa_receipt", "created_at")
    list_filter = ("status", "currency", "created_at")
    search_fields = ("user__username", "course__title", "phone_number", "mpesa_receipt")
    readonly_fields = ("checkout_request_id", "merchant_request_id", "mpesa_receipt", "created_at", "updated_at")

admin.site.register(Grade)
admin.site.register(Subject)
admin.site.register(PDFResource)
admin.site.register(VideoResource)
admin.site.register(ImageResource)
