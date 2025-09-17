from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_add_experience_missing_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='companyprofile',
            name='billing_company_name',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='companyprofile',
            name='billing_department',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='companyprofile',
            name='billing_zip',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='companyprofile',
            name='billing_address',
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddField(
            model_name='companyprofile',
            name='billing_email',
            field=models.EmailField(blank=True, max_length=254),
        ),
    ]

