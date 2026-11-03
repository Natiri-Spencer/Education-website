from pathlib import Path

from django.conf import settings
from django.shortcuts import redirect, render
from django.http import JsonResponse


class LearningSafetyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'POST' and request.path.startswith(('/accounts/', '/support/')):
            try:
                if int(request.META.get('CONTENT_LENGTH') or 0) > 65536:
                    return JsonResponse({'error': 'This form is too large. Keep messages under the displayed limits.'}, status=413)
            except ValueError:
                return JsonResponse({'error': 'Invalid request size.'}, status=400)
        if request.method in {'POST', 'PUT'} and request.path.startswith('/learning/api/'):
            try:
                length = int(request.META.get('CONTENT_LENGTH') or 0)
            except ValueError:
                return JsonResponse({'error': 'Invalid request size.'}, status=400)
            limit = 11*1024**2 if '/attachments/' in request.path else settings.PRIVATE_WORK_QUOTA+4096
            if length < 0 or length > limit:
                return JsonResponse({'error': 'Upload exceeds the allowed size. Your device copy is unchanged.'}, status=413)
        if request.method not in {'GET', 'HEAD', 'OPTIONS'} and Path(settings.BACKUP_MAINTENANCE_FILE).exists():
            if request.path.startswith('/learning/api/'):
                response = JsonResponse({'error': 'Backup in progress. Your changes remain on this device; retry shortly.'}, status=503)
            else:
                response = render(request, 'learning/maintenance.html', status=503)
            response['Retry-After'] = '60'
            return response
        if request.user.is_authenticated:
            from .models import Profile
            profile = Profile.objects.filter(user=request.user).first()
            if profile and profile.must_change_password and not request.path.startswith(('/accounts/password_change/', '/accounts/logout/', '/static/', '/health/', '/privacy/', '/terms/', '/help/')):
                return redirect('accounts:password_change')
        response = self.get_response(request)
        if request.path.startswith(('/learning/', '/accounts/')):
            response['Cache-Control'] = 'private, no-store'
            # Keep token paths out of referrers without turning HTTP development
            # form origins into "null", which correctly fails Django's CSRF check.
            response['Referrer-Policy'] = 'strict-origin'
        return response
