from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_add_experience_missing_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='ResumeFile',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('file', models.FileField(upload_to='resumes/')),
                ('original_name', models.CharField(max_length=255)),
                ('content_type', models.CharField(max_length=100, blank=True)),
                ('size', models.BigIntegerField(default=0)),
                ('description', models.CharField(max_length=255, blank=True)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='resume_files', to='core.user')),
            ],
            options={
                'db_table': 'resume_files',
                'ordering': ['-uploaded_at'],
            },
        ),
        migrations.AddIndex(
            model_name='resumefile',
            index=models.Index(fields=['user', '-uploaded_at'], name='core_resumefile_user_uploaded_idx'),
        ),
    ]

