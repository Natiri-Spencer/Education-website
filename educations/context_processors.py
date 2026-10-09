from .models import Grade
from django.db.models import IntegerField
from django.db.models.functions import Cast, Substr

def grades_context(request):
    return {
        "grades": Grade.objects.annotate(
            _grade_number=Cast(Substr("name", 7), IntegerField())
        ).order_by("_grade_number", "name").prefetch_related("subjects")
    }
