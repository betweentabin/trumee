from django.db import migrations


class Migration(migrations.Migration):

    # Merge the two leaf nodes into a single head
    dependencies = [
        ('core', '0012_merge_0008_interview_0011_billing'),
        ('core', '0008_add_scout_credits_to_user'),
    ]

    operations = []

