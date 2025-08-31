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
        # Note: Experience.id is already UUID in 0001_initial.py - no conversion needed
    ]
