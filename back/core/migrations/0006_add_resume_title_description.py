# Generated manually to add missing Resume fields

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_add_user_profile_models'),
    ]

    operations = [
        migrations.AddField(
            model_name='resume',
            name='title',
            field=models.CharField(default='履歴書', max_length=200),
        ),
        migrations.AddField(
            model_name='resume',
            name='description',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='resume',
            name='objective',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='resume',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]
