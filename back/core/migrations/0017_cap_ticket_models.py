# Generated manually to add JobCapPlan, JobTicketLedger, TicketConsumption

from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):

    dependencies = [
        # 最新のマージ後に適用されるよう依存を更新
        ('core', '0016_merge_0015_message_parent_0015_allow_multiple_scouts'),
    ]

    operations = [
        migrations.CreateModel(
            name='JobCapPlan',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('cap_percent', models.IntegerField(choices=[(20, '20%'), (22, '22%'), (25, '25%')])),
                ('cap_amount_limit', models.BigIntegerField(null=True, blank=True)),
                ('total_cost', models.BigIntegerField(default=0)),
                ('cap_reached_at', models.DateTimeField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('job_posting', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='cap_plan', to='core.jobposting')),
            ],
            options={
                'db_table': 'job_cap_plans',
            },
        ),
        migrations.CreateModel(
            name='JobTicketLedger',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('tickets_total', models.IntegerField(default=0)),
                ('tickets_used', models.IntegerField(default=0)),
                ('bonus_tickets_total', models.IntegerField(default=0)),
                ('rollover_allowed', models.BooleanField(default=False)),
                ('last_reset_at', models.DateTimeField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('job_posting', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='ticket_ledger', to='core.jobposting')),
            ],
            options={
                'db_table': 'job_ticket_ledgers',
            },
        ),
        migrations.CreateModel(
            name='TicketConsumption',
            fields=[
                ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ('interview_date', models.DateTimeField(null=True, blank=True)),
                ('notes', models.CharField(max_length=255, blank=True)),
                ('consumed_at', models.DateTimeField(auto_now_add=True)),
                ('application', models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, null=True, blank=True, related_name='ticket_consumptions', to='core.application')),
                ('ledger', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='consumptions', to='core.jobticketledger')),
                ('scout', models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, null=True, blank=True, related_name='ticket_consumptions', to='core.scout')),
                ('seeker', models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, null=True, blank=True, related_name='ticket_consumptions', to='core.user')),
            ],
            options={
                'db_table': 'ticket_consumptions',
            },
        ),
        migrations.AddIndex(
            model_name='jobcapplan',
            index=models.Index(fields=['cap_percent'], name='core_jobcap_cap_perc_idx'),
        ),
        migrations.AddIndex(
            model_name='jobcapplan',
            index=models.Index(fields=['-updated_at'], name='core_jobcap_updated_idx'),
        ),
        migrations.AddIndex(
            model_name='jobticketledger',
            index=models.Index(fields=['-updated_at'], name='core_jobtkt_updated_idx'),
        ),
        migrations.AddIndex(
            model_name='ticketconsumption',
            index=models.Index(fields=['ledger', '-consumed_at'], name='core_tkcons_ledger_idx'),
        ),
        migrations.AddIndex(
            model_name='ticketconsumption',
            index=models.Index(fields=['seeker', '-consumed_at'], name='core_tkcons_seeker_idx'),
        ),
    ]
