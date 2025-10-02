# Generated manually to add InterviewSlot model

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_cap_ticket_models'),
    ]

    operations = [
        migrations.CreateModel(
            name='InterviewSlot',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('proposed_by', models.CharField(max_length=10, choices=[('company', '企業'), ('seeker', '求職者')])),
                ('start_time', models.DateTimeField()),
                ('end_time', models.DateTimeField()),
                ('status', models.CharField(max_length=10, choices=[('proposed', '候補'), ('accepted', '確定'), ('declined', '辞退'), ('expired', '期限切れ')], default='proposed')),
                ('accepted_at', models.DateTimeField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('job_posting', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='interview_slots', to='core.jobposting')),
                ('seeker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='interview_slots', to='core.user')),
                ('ticket_consumption', models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, related_name='interview_slots', to='core.ticketconsumption')),
            ],
            options={
                'db_table': 'interview_slots',
            },
        ),
        migrations.AddIndex(
            model_name='interviewslot',
            index=models.Index(fields=['job_posting', 'seeker', 'status'], name='core_is_job_seeker_status_idx'),
        ),
        migrations.AddIndex(
            model_name='interviewslot',
            index=models.Index(fields=['-created_at'], name='core_is_created_idx'),
        ),
    ]

