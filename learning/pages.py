from django.shortcuts import render
from .models import POLICY_VERSION


def help_page(request):
    return render(request, 'learning/help.html')


def policy(request, kind):
    return render(request, 'learning/policy.html', {'kind': kind, 'policy_version': POLICY_VERSION})
