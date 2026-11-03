import io
import json
from pathlib import Path
import re
import zipfile

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Count, Q
from django.http import FileResponse, Http404, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import resolve, Resolver404
from django.utils import timezone
from django.views.decorators.http import require_http_methods, require_POST
from django.views.decorators.cache import never_cache
from django.views.decorators.debug import sensitive_post_parameters

from educations.models import Grade
from .account_views import form_page
from .forms import ReviewForm, SupportForm
from .models import Attachment, AuditEvent, ClassGroup, LessonProgress, Membership, Profile, SavedWork, Submission
from .services import FILE_KEY, WORK_KEY, attachment_ids, deliver, eligible, guard, limited, teacher_groups, used_bytes


@login_required
def dashboard(request):
    return render(request, 'learning/dashboard.html', {
        'work': SavedWork.objects.filter(owner=request.user, deleted=False).order_by('-updated_at'),
        'memberships': Membership.objects.filter(learner=request.user).select_related('group'),
        'submissions': Submission.objects.filter(owner=request.user).select_related('group').prefetch_related('assessments').order_by('-created_at'),
        'progress': LessonProgress.objects.filter(owner=request.user).order_by('-updated_at')[:20],
        'teacher_groups': teacher_groups(request.user), 'used_mb': round(used_bytes(request.user)/1024**2, 2),
        'ready': eligible(request.user), 'profile': Profile.objects.filter(user=request.user).first(),
        'grade_choices': Grade.objects.all(),
        'attachments': Attachment.objects.filter(owner=request.user),
    })


@login_required
@require_POST
def choose_grade(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    profile.grade = get_object_or_404(Grade, pk=request.POST.get('grade'))
    profile.save(update_fields=['grade'])
    return redirect('learning:dashboard')


@never_cache
@require_http_methods(['GET', 'PUT', 'DELETE'])
def work_api(request, key=None):
    denied = guard(request)
    if denied is not None:
        return denied
    if key is None:
        if request.method != 'GET':
            return JsonResponse({'error': 'Use an individual work URL.'}, status=405)
        query = SavedWork.objects.filter(owner=request.user)
        area = request.GET.get('area', '')
        if area in {'grade7', 'grade8', 'grade9'}:
            query = query.filter(key__startswith=area)
        elif area == 'whiteboard':
            query = query.filter(key='eduportal.whiteboards.v1')
        rows = []
        for item in query:
            row = {'key': item.key, 'title': item.title, 'revision': item.revision, 'deleted': item.deleted, 'updated': item.updated_at.isoformat()}
            if area:
                row['payload'] = item.payload
            rows.append(row)
        return JsonResponse({'work': rows, 'used': used_bytes(request.user), 'quota': settings.PRIVATE_WORK_QUOTA})
    if not WORK_KEY.fullmatch(key):
        return JsonResponse({'error': 'Unrecognised learning-work key.'}, status=400)
    if request.method == 'GET':
        item = get_object_or_404(SavedWork, owner=request.user, key=key)
        return JsonResponse({'key': key, 'payload': item.payload, 'revision': item.revision, 'deleted': item.deleted})
    if int(request.META.get('CONTENT_LENGTH') or 0) > settings.PRIVATE_WORK_QUOTA + 4096:
        return JsonResponse({'error': 'Work exceeds the private storage allowance. Export a backup or remove older work.'}, status=413)
    try:
        data = json.loads(request.body)
        revision = data['revision']
        if not isinstance(revision, int) or isinstance(revision, bool) or revision < 0:
            raise ValueError()
        payload = data.get('payload', {})
        if request.method != 'DELETE' and (not isinstance(payload, dict) or not isinstance(payload.get('raw'), str) or payload.get('format') != 1):
            raise ValueError()
        raw = payload.get('raw', '')
        native = json.loads(raw) if raw.strip().startswith(('{', '[')) else raw
        ids = attachment_ids(native)
        size = len(json.dumps(payload).encode()) if request.method != 'DELETE' else 0
    except (ValueError, KeyError, TypeError, RecursionError):
        return JsonResponse({'error': 'Invalid work format.'}, status=400)
    with transaction.atomic():
        get_user_model().objects.select_for_update().get(pk=request.user.pk)
        item = SavedWork.objects.filter(owner=request.user, key=key).first()
        if revision != (item.revision if item else 0):
            return JsonResponse({'error': 'A newer copy exists. Your device copy is retained.', 'revision': item.revision if item else 0, 'payload': item.payload if item else {}}, status=409)
        assets = list(Attachment.objects.filter(owner=request.user, key__in=ids))
        if request.method != 'DELETE' and len(assets) != len(ids):
            return JsonResponse({'error': 'Attachments are still waiting to upload. Your device copy is retained.'}, status=422)
        if used_bytes(request.user) - (item.size if item else 0) + size > settings.PRIVATE_WORK_QUOTA:
            return JsonResponse({'error': 'Storage allowance reached. Export a backup or delete older work.'}, status=413)
        if not item:
            if SavedWork.objects.filter(owner=request.user).count() >= 400:
                return JsonResponse({'error': 'Saved-work item limit reached. Export or remove older drafts.'}, status=413)
            item = SavedWork(owner=request.user, key=key)
        item.payload = {} if request.method == 'DELETE' else payload
        item.deleted = request.method == 'DELETE'
        item.kind = 'whiteboard' if key.startswith('eduportal.') else 'notebook'
        item.title = str(data.get('title') or key)[:160]
        item.size = size
        item.revision = revision + 1
        item.save()
        item.assets.set([] if item.deleted else assets)
    return JsonResponse({'revision': item.revision, 'deleted': item.deleted})


FILE_TYPES = {'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'ppt': 'application/vnd.ms-powerpoint', 'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'txt': 'text/plain', 'csv': 'text/csv'}


@never_cache
@require_http_methods(['GET', 'POST', 'DELETE'])
def attachment_api(request, key):
    denied = guard(request)
    if denied is not None:
        return denied
    if not FILE_KEY.fullmatch(key):
        raise Http404
    if request.method == 'GET':
        return download(get_object_or_404(Attachment, owner=request.user, key=key))
    if request.method == 'DELETE':
        asset = get_object_or_404(Attachment, owner=request.user, key=key)
        if asset.savedwork_set.exists() or asset.submission_set.exists():
            return JsonResponse({'error': 'This attachment is retained by saved work or a submission.'}, status=409)
        asset.delete()
        return JsonResponse({'deleted': True})
    upload = request.FILES.get('file')
    if not upload or upload.size > 10*1024**2 or not upload.size:
        return JsonResponse({'error': 'Choose a supported document up to 10 MB.'}, status=400)
    name = Path(upload.name).name[:200]
    ext = name.rsplit('.', 1)[-1].lower()
    header = upload.read(8)
    upload.seek(0)
    if (ext not in FILE_TYPES or (ext == 'pdf' and not header.startswith(b'%PDF-')) or
            (ext in {'docx', 'xlsx', 'pptx'} and not header.startswith(b'PK')) or
            (ext in {'doc', 'xls', 'ppt'} and header != bytes([208,207,17,224,161,177,26,225]))):
        return JsonResponse({'error': 'File type or document signature is invalid.'}, status=400)
    with transaction.atomic():
        get_user_model().objects.select_for_update().get(pk=request.user.pk)
        existing = Attachment.objects.filter(owner=request.user, key=key).first()
        if existing:
            # A document ID is immutable; retries must send identical bytes.
            import hashlib
            with existing.file.open('rb') as source:
                old = hashlib.file_digest(source, 'sha256').digest()
            new = hashlib.file_digest(upload, 'sha256').digest()
            if old != new:
                return JsonResponse({'error': 'Attachment ID already contains another document.'}, status=409)
            return JsonResponse({'key': key, 'size': existing.size})
        if used_bytes(request.user) + upload.size > settings.PRIVATE_WORK_QUOTA:
            return JsonResponse({'error': 'Private storage allowance reached.'}, status=413)
        if Attachment.objects.filter(owner=request.user).count() >= 200:
            return JsonResponse({'error': 'Document limit reached. Remove unused documents first.'}, status=413)
        asset = Attachment(owner=request.user, key=key, name=name, size=upload.size, mime=FILE_TYPES[ext])
        try:
            asset.file.save(name, upload, save=False)
            asset.save()
        except Exception:
            if asset.file.name:
                asset.file.delete(save=False)
            raise
    return JsonResponse({'key': key, 'size': asset.size}, status=201)


def download(asset):
    response = FileResponse(asset.file.open('rb'), as_attachment=True, filename=asset.name, content_type=asset.mime)
    response['Content-Security-Policy'] = "default-src 'none'; sandbox"
    response['X-Content-Type-Options'] = 'nosniff'
    response['Cache-Control'] = 'private, no-store'
    return response


@login_required
@require_POST
def join_class(request):
    if not eligible(request.user):
        return redirect('learning:complete_profile')
    if limited(request, 'class-code', 10, 900):
        return form_page(request, 'Try later', text='Too many class-code attempts.')
    group = ClassGroup.objects.filter(code=request.POST.get('code', '').strip().upper()).first()
    if group:
        Membership.objects.get_or_create(group=group, learner=request.user)
    return form_page(request, 'Class request received', text='If the code matches a class, its teacher will review the request. Return to My Learning to check its status.')


@login_required
def teacher_dashboard(request):
    groups = teacher_groups(request.user)
    if not request.user.is_staff and not request.user.has_perm('learning.review_submissions'):
        return form_page(request, 'Teacher access required', text='An administrator must approve your teacher role and assigned classes.')
    return render(request, 'learning/teacher.html', {'groups': groups,
        'memberships': Membership.objects.filter(group__in=groups).select_related('learner', 'group').annotate(completed_count=Count('learner__lessonprogress', filter=Q(learner__lessonprogress__completed=True), distinct=True)),
        'submissions': Submission.objects.filter(group__in=groups).select_related('owner', 'group').order_by('-created_at')})


@login_required
@require_POST
def membership_review(request, pk):
    member = get_object_or_404(Membership, pk=pk, group__in=teacher_groups(request.user))
    member.approved = request.POST.get('decision') == 'approve'
    member.save(update_fields=['approved'])
    AuditEvent.objects.create(actor=request.user, subject=member.learner, action='class_membership', note=str(member.group_id)+':'+str(member.approved))
    return redirect('learning:teacher')


@login_required
@require_http_methods(['GET', 'POST'])
def work_detail(request, pk):
    work = get_object_or_404(SavedWork, pk=pk, owner=request.user, deleted=False)
    groups = ClassGroup.objects.filter(memberships__learner=request.user, memberships__approved=True)
    boards = None
    if work.key == 'eduportal.whiteboards.v1':
        try:
            boards = json.loads(work.payload['raw'])['boards']
            if not isinstance(boards, list):
                raise ValueError()
        except (KeyError, ValueError, TypeError):
            return form_page(request, 'Whiteboard library needs repair', text='Export your device copy and open it in the whiteboard before submitting.')
    if request.method == 'POST':
        denied = guard(request)
        if denied is not None:
            return denied
        group = get_object_or_404(groups, pk=request.POST.get('group'))
        with transaction.atomic():
            get_user_model().objects.select_for_update().get(pk=request.user.pk)
            work = SavedWork.objects.select_for_update().get(pk=work.pk)
            payload, title, work_key = work.payload, work.title, work.key
            if boards is not None:
                current = json.loads(work.payload['raw'])
                board_id = request.POST.get('board_id', '')
                chosen = [b for b in current.get('boards', []) if isinstance(b,dict) and b.get('id') == board_id]
                if len(chosen) != 1 or not re.fullmatch(r'[-a-zA-Z0-9_]{1,100}', board_id):
                    return form_page(request, 'Choose one whiteboard', text='Select the individual board to share. Your other boards stay private.')
                payload = {'format':1, 'raw':json.dumps({'version':1,'activeId':board_id,'boards':chosen})}
                title = str(chosen[0].get('title') or 'Submitted whiteboard')[:160]
                work_key += ':'+board_id
            size = len(json.dumps(payload).encode())
            if used_bytes(request.user) + size > settings.PRIVATE_WORK_QUOTA:
                return form_page(request, 'Storage allowance reached', text='Download a backup or remove older drafts before submitting. Existing submissions are retained.')
            version = Submission.objects.filter(owner=request.user, group=group, work_key=work_key).count()+1
            submission = Submission.objects.create(owner=request.user, group=group, work_key=work_key, title=title,
                                                   payload=payload, size=size, version=version)
            try:
                native=json.loads(payload['raw'])
            except (KeyError, ValueError, TypeError):
                native=payload.get('raw','')
            submission.assets.set(work.assets.filter(key__in=attachment_ids(native)))
        return redirect('learning:submission', pk=submission.pk)
    return render(request, 'learning/work.html', {'work': work, 'groups': groups, 'boards':boards, 'payload': work.payload, 'assets': work.assets.all()})


@login_required
@require_http_methods(['GET', 'POST'])
def submission_detail(request, pk):
    item = get_object_or_404(Submission, pk=pk)
    teacher = teacher_groups(request.user).filter(pk=item.group_id).exists()
    if item.owner_id != request.user.pk and not teacher:
        raise Http404
    form = ReviewForm(request.POST or None) if teacher else None
    if request.method == 'POST':
        if not teacher:
            raise Http404
        if form.is_valid():
            with transaction.atomic():
                item = Submission.objects.select_for_update().get(pk=item.pk)
                assessment = form.save(commit=False)
                assessment.teacher = request.user
                assessment.submission = item
                assessment.save()
                item.status = assessment.status
                item.save(update_fields=['status'])
                AuditEvent.objects.create(actor=request.user, subject=item.owner, action='assessment', note=str(item.pk))
            return redirect('learning:submission', pk=item.pk)
    return render(request, 'learning/submission.html', {'submission': item, 'payload': item.payload,
        'assets': item.assets.all(), 'form': form, 'assessments': item.assessments.select_related('teacher').order_by('created_at')})


@login_required
@never_cache
def submission_attachment(request, pk, key):
    item = get_object_or_404(Submission, pk=pk)
    if item.owner_id != request.user.pk and not teacher_groups(request.user).filter(pk=item.group_id).exists():
        raise Http404
    return download(get_object_or_404(item.assets, key=key))


@login_required
@never_cache
def submission_export(request, pk):
    item = get_object_or_404(Submission, pk=pk)
    if item.owner_id != request.user.pk and not teacher_groups(request.user).filter(pk=item.group_id).exists():
        raise Http404
    from django.http import HttpResponse
    response = HttpResponse(json.dumps(item.payload), content_type='application/json')
    response['Content-Disposition'] = 'attachment; filename="submitted-work.json"'
    response['Cache-Control'] = 'private, no-store'
    return response


@login_required
@require_POST
def progress(request):
    denied = guard(request)
    if denied is not None:
        return denied
    path = request.POST.get('path', '')
    try:
        match = resolve(path)
    except (Resolver404, ValueError):
        raise Http404
    if not path.startswith(('/educations/grade-', '/virtual-labs/grade/', '/educations/courses/')) or len(path) > 300 or match.url_name in {'course_checkout'}:
        raise Http404
    item, _ = LessonProgress.objects.get_or_create(owner=request.user, path=path,
        defaults={'title': request.POST.get('title', path)[:160]})
    item.title = request.POST.get('title', item.title)[:160]
    if request.POST.get('completed') in {'true', 'false'}:
        item.completed = request.POST['completed'] == 'true'
    item.save()
    return JsonResponse({'saved': True})


@login_required
@never_cache
def export_work(request):
    target = io.BytesIO()
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
        work = list(SavedWork.objects.filter(owner=request.user).values('key','title','payload','revision','deleted'))
        submissions = list(Submission.objects.filter(owner=request.user).values('id','title','payload','version','status'))
        from django.core.serializers.json import DjangoJSONEncoder
        bundle.writestr('work.json', json.dumps({'format': 1, 'work': work, 'submissions': submissions}, cls=DjangoJSONEncoder))
        for asset in Attachment.objects.filter(owner=request.user):
            with asset.file.open('rb') as source, bundle.open('attachments/'+asset.key, 'w') as out:
                import shutil
                shutil.copyfileobj(source, out)
    target.seek(0)
    return FileResponse(target, as_attachment=True, filename='my-learning-backup.zip', content_type='application/zip')


@require_http_methods(['GET', 'POST'])
def support(request):
    form = SupportForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        if form.cleaned_data['website'] or limited(request, 'support', 3):
            return form_page(request, 'Please try later', text='Too many messages. Please wait an hour.')
        if not settings.SUPPORT_EMAIL:
            return form_page(request, 'Support email not configured', text='Contact your teacher or administrator. Your message was not sent; keep a copy and try again later.')
        sent = deliver('Academy support: '+form.cleaned_data['subject'],
                       'Reply address: '+form.cleaned_data['email']+'\n\n'+form.cleaned_data['message'], settings.SUPPORT_EMAIL)
        if sent:
            return form_page(request, 'Message sent', text='The academy will reply to the address you supplied. Do not send passwords or identity documents.')
        form.add_error(None, 'Email could not be delivered. Your message remains below; keep a copy and try later.')
    return form_page(request, 'Contact support', form, 'Describe the problem without passwords, private documents or unnecessary learner details.', button='Send message')


@login_required
@require_http_methods(['GET', 'POST'])
@sensitive_post_parameters('password')
def delete_account(request):
    if request.method == 'POST' and request.POST.get('confirm') == 'delete' and request.user.check_password(request.POST.get('password', '')):
        if request.user.is_staff or request.user.is_superuser:
            return form_page(request, 'Staff account deletion', text='An administrator must transfer your responsibilities before deleting a staff account.')
        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.deletion_requested_at = timezone.now()
        profile.save(update_fields=['deletion_requested_at'])
        AuditEvent.objects.create(actor=request.user, subject=request.user, action='deletion_requested')
        return form_page(request, 'Deletion requested', text='Online saving is paused. Staff will review this request and remove approved account data within 30 days. Backups expire through their 30-day retention schedule.')
    return render(request, 'learning/delete.html')
