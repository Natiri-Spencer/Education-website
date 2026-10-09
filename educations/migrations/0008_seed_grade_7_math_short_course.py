from decimal import Decimal

from django.db import migrations


def add_sample_course(apps, schema_editor):
    Grade = apps.get_model("educations", "Grade")
    Subject = apps.get_model("educations", "Subject")
    ShortCourse = apps.get_model("educations", "ShortCourse")
    CourseModule = apps.get_model("educations", "CourseModule")

    grade, _ = Grade.objects.get_or_create(name="Grade 7")
    subject, _ = Subject.objects.get_or_create(grade=grade, name="Mathematics")
    course, _ = ShortCourse.objects.update_or_create(
        slug="grade-7-fractions-decimals-percentages",
        defaults={
            "subject": subject,
            "title": "Fractions, Decimals and Percentages",
            "summary": "Build confidence moving between fractions, decimals and percentages, then use them to solve everyday problems.",
            "description": (
                "A four-week mathematics short course for Grade 7 learners.\n\n"
                "Work through clear examples and guided practice, then apply each skill to everyday number problems. "
                "The course outline introduces the key topics; lesson materials can be added as the course is prepared."
            ),
            "duration_weeks": 4,
            "price": Decimal("500.00"),
            "currency": "KES",
            "is_published": True,
        },
    )
    modules = [
        (
            1,
            "Fractions and equivalent values",
            "Review numerator and denominator, find equivalent fractions, simplify fractions, and compare values using common denominators.",
        ),
        (
            2,
            "Decimals and place value",
            "Read decimal place value, compare and order decimals, and convert between tenths, hundredths, and fractions.",
        ),
        (
            3,
            "Percentages in everyday contexts",
            "Understand percent as parts per hundred and calculate simple percentages of quantities, including discounts and score results.",
        ),
        (
            4,
            "Mixed practice and review",
            "Choose an efficient representation, solve mixed fraction-decimal-percentage problems, and review common mistakes.",
        ),
    ]
    for position, title, description in modules:
        CourseModule.objects.get_or_create(
            course=course,
            position=position,
            defaults={"title": title, "description": description},
        )


class Migration(migrations.Migration):
    dependencies = [("educations", "0007_shortcourse_courseenrollment_coursemodule")]

    operations = [migrations.RunPython(add_sample_course, migrations.RunPython.noop)]
