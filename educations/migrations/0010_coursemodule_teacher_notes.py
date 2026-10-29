from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("educations", "0009_coursemodule_activities_coursemodule_assessment_and_more")]
    operations = [
        migrations.AddField(
            model_name="coursemodule", name="teacher_notes",
            field=models.TextField(blank=True, help_text="Private marking guidance and curriculum review notes. Visible only in the editor and editor preview."),
        ),
    ]
