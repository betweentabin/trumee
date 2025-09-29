from django.db import migrations


class Migration(migrations.Migration):
    # Merge migration to resolve parallel 0015 heads
    dependencies = [
        ('core', '0015_add_message_parent'),
        ('core', '0015_allow_multiple_scouts'),
    ]

    operations = []

