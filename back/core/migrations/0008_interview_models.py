# Generated manually to add InterviewQuestion and PromptTemplate models

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_add_experience_missing_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='InterviewQuestion',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[('interview', '面接'), ('self_pr', '自己PR'), ('resume', '職務経歴書'), ('motivation', '志望動機')], db_index=True, max_length=20)),
                ('category', models.CharField(blank=True, db_index=True, max_length=50)),
                ('subcategory', models.CharField(blank=True, max_length=50)),
                ('text', models.TextField()),
                ('answer_guide', models.TextField(blank=True)),
                ('difficulty', models.CharField(choices=[('easy', '初級'), ('medium', '中級'), ('hard', '上級')], db_index=True, default='medium', max_length=10)),
                ('tags', models.JSONField(blank=True, default=list)),
                ('locale', models.CharField(db_index=True, default='ja-JP', max_length=20)),
                ('source', models.CharField(blank=True, help_text='csv/manual/ai など', max_length=20)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'interview_questions',
            },
        ),
        migrations.CreateModel(
            name='PromptTemplate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('target', models.CharField(choices=[('self_pr', '自己PR'), ('resume_summary', '職務経歴書サマリ'), ('apply_reason', '志望理由')], db_index=True, max_length=30)),
                ('template_text', models.TextField()),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'prompt_templates',
            },
        ),
        migrations.AddIndex(
            model_name='interviewquestion',
            index=models.Index(fields=['type', 'category', 'difficulty'], name='core_interv_type_ca_8c7362_idx'),
        ),
        migrations.AddIndex(
            model_name='interviewquestion',
            index=models.Index(fields=['locale', 'is_active'], name='core_interv_locale__bd0f36_idx'),
        ),
        migrations.AddIndex(
            model_name='prompttemplate',
            index=models.Index(fields=['target', 'is_active'], name='core_prompt_target__b6b9d3_idx'),
        ),
    ]

