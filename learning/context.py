from django.conf import settings
from .models import Profile
from .services import eligible


def learning_context(request):
    user = request.user
    return {'academy_config': {'scope': 'u'+str(user.pk) if user.is_authenticated else 'guest',
            'authenticated': user.is_authenticated, 'eligible': eligible(user),
            'api': '/learning/api/work/', 'assets': '/learning/api/attachments/'},
            'support_email': settings.PUBLIC_CONTACT_EMAIL,
            'academy_cloud_ready': eligible(user)}
