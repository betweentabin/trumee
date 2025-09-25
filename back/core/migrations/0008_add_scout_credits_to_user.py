from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_add_experience_missing_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='scout_credits_total',
            field=models.IntegerField(default=100),
        ),
        migrations.AddField(
            model_name='user',
            name='scout_credits_used',
            field=models.IntegerField(default=0),
        ),
    ]

