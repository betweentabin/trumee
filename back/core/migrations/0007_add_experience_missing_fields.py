# Generated manually to add missing Experience fields

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_add_resume_title_description'),
    ]

    operations = [
        # Add missing fields to Experience model
        migrations.AddField(
            model_name='experience',
            name='achievements',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='experience',
            name='technologies_used',
            field=models.JSONField(blank=True, default=list),
        ),
        # Fix Experience.id to UUID
        migrations.AlterField(
            model_name='experience',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]
