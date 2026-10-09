from django.db import migrations


TARGET_SUBJECTS = [
    ("C.R.E", {"cre", "religiouseducation"}),
    ("Social", {"social", "socialstudies"}),
    ("Science and Technology", {"scienceandtechnology"}),
    ("Mathematics", {"mathematics"}),
    ("Kiswahili", {"kiswahili"}),
    ("English", {"english"}),
]


def normalized(value):
    return "".join(character.lower() for character in value if character.isalnum())


def subject_resource_count(subject):
    return (
        subject.pdfs.count()
        + subject.videos.count()
        + subject.images.count()
    )


def standardize_subjects(apps, schema_editor):
    Grade = apps.get_model("educations", "Grade")
    Subject = apps.get_model("educations", "Subject")
    PDFResource = apps.get_model("educations", "PDFResource")
    VideoResource = apps.get_model("educations", "VideoResource")
    ImageResource = apps.get_model("educations", "ImageResource")

    resources = (PDFResource, VideoResource, ImageResource)

    for grade_number in (4, 5, 6):
        grade, _ = Grade.objects.get_or_create(name=f"Grade {grade_number}")
        subjects = list(Subject.objects.filter(grade=grade))
        claimed = set()

        for canonical_name, aliases in TARGET_SUBJECTS:
            matches = [
                subject for subject in subjects
                if subject.pk not in claimed and normalized(subject.name) in aliases
            ]
            if matches:
                keep = max(matches, key=subject_resource_count)
                keep.name = canonical_name
                keep.save(update_fields=["name"])
                claimed.add(keep.pk)

                for duplicate in matches:
                    if duplicate.pk == keep.pk:
                        continue
                    for Resource in resources:
                        Resource.objects.filter(subject_id=duplicate.pk).update(subject_id=keep.pk)
                    duplicate.delete()
            else:
                keep = Subject.objects.create(grade=grade, name=canonical_name)
                claimed.add(keep.pk)

        # Remove only unused subjects outside the requested list. Keep any
        # subject that already contains uploaded resources.
        for subject in subjects:
            if subject.pk in claimed:
                continue
            if not subject_resource_count(subject):
                subject.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("educations", "0004_alter_imageresource_subject_and_more"),
    ]

    operations = [
        migrations.RunPython(standardize_subjects, migrations.RunPython.noop),
    ]
