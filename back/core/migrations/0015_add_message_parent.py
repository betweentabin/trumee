from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_add_annotations'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='parent',
            field=models.ForeignKey(null=True, blank=True, on_delete=models.deletion.CASCADE, related_name='replies', to='core.message'),
        ),
    ]

