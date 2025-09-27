# Generated manually to add Annotation model and link Message.annotation

from django.db import migrations, models
import uuid
import django.db.models.deletion


class Migration(migrations.Migration):

    # 既存のマージ済み最新に依存させ、葉ノード競合を回避
    dependencies = [
        ('core', '0013_merge_0012_billing_0008_scout_credits'),
    ]

    operations = [
        migrations.CreateModel(
            name='Annotation',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, serialize=False, editable=False)),
                ('subject', models.CharField(default='resume_advice', max_length=200, db_index=True)),
                ('anchor_id', models.CharField(max_length=100, db_index=True)),
                ('start_offset', models.IntegerField(default=0)),
                ('end_offset', models.IntegerField(default=0)),
                ('quote', models.TextField(blank=True)),
                ('selector_meta', models.JSONField(blank=True, default=dict)),
                ('is_resolved', models.BooleanField(default=False)),
                ('resolved_at', models.DateTimeField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_annotations', to='core.user')),
                ('resolved_by', models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_annotations', to='core.user', null=True, blank=True)),
                ('resume', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='annotations', to='core.resume')),
            ],
            options={
                'db_table': 'annotations',
            },
        ),
        migrations.AddIndex(
            model_name='annotation',
            index=models.Index(fields=['resume', 'subject'], name='annotations_resume_subject_idx'),
        ),
        migrations.AddIndex(
            model_name='annotation',
            index=models.Index(fields=['resume', 'anchor_id', 'start_offset'], name='annotations_resume_anchor_idx'),
        ),
        migrations.AddField(
            model_name='message',
            name='annotation',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, related_name='messages', to='core.annotation', null=True, blank=True),
        ),
    ]
