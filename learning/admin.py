from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.auth.admin import UserAdmin
from .models import Profile, SignupRequest, AuditEvent, ClassGroup, Membership, SavedWork, Attachment, Submission, Assessment, LessonProgress


@admin.action(description='Approve selected users as teachers (then assign their classes)')
def approve_teachers(modeladmin, request, queryset):
    group, _ = Group.objects.get_or_create(name='Academy teachers')
    group.permissions.add(Permission.objects.get(codename='review_submissions', content_type__app_label='learning'))
    for user in queryset.filter(is_active=True):
        user.groups.add(group)
        AuditEvent.objects.create(actor=request.user, subject=user, action='teacher_approved')
    messages.success(request, 'Teacher permissions granted. Assign the teachers to class groups; no admin access was granted.')


class AcademyUserAdmin(UserAdmin):
    actions = list(UserAdmin.actions or []) + [approve_teachers]


admin.site.unregister(get_user_model())
admin.site.register(get_user_model(), AcademyUserAdmin)


@admin.register(ClassGroup)
class ClassGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'grade', 'code')
    filter_horizontal = ('teachers',)
    readonly_fields = ('code',)


@admin.register(AuditEvent)
class AuditAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'action', 'actor', 'subject')
    readonly_fields = ('created_at', 'action', 'actor', 'subject', 'note')
    def has_add_permission(self, request):
        return False
    def has_change_permission(self, request, obj=None):
        return False


class ImmutableWorkAdmin(admin.ModelAdmin):
    def get_readonly_fields(self, request, obj=None):
        fields = [field.name for field in self.model._meta.fields if field.name != 'file'] + [field.name for field in self.model._meta.many_to_many]
        return fields + (['private_file_name'] if self.model is Attachment else [])
    def private_file_name(self, obj):
        return obj.file.name
    def get_exclude(self, request, obj=None):
        return ('file',) if self.model is Attachment else ()
    def has_add_permission(self, request):
        return False
    def has_delete_permission(self, request, obj=None):
        return False


for model in (SavedWork, Attachment, Submission, Assessment):
    admin.site.register(model, ImmutableWorkAdmin)
for model in (Profile, SignupRequest, Membership, LessonProgress):
    admin.site.register(model)
