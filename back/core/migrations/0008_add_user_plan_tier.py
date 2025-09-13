from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_add_experience_missing_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='plan_tier',
            field=models.CharField(max_length=20, blank=True, db_index=True),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['plan_tier'], name='users_plan_tier_idx'),
        ),
    ]

