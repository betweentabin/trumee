from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_add_annotations'),
    ]

    operations = [
        # Remove unique constraint (company, seeker) on scouts to allow multiple records
        migrations.AlterUniqueTogether(
            name='scout',
            unique_together=set(),
        ),
        # Optional: add a helpful compound index to query by pair and recency
        migrations.AddIndex(
            model_name='scout',
            index=models.Index(fields=['company', 'seeker', '-scouted_at'], name='scout_pair_recent_idx'),
        ),
    ]

