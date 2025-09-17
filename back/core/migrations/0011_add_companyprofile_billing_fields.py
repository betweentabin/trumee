from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_merge_0008_add_resume_file_model_0009_merge'),
    ]

    operations = [
        # Apply DB changes idempotently (for environments where columns may already exist)
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE public.company_profiles "
                        "ADD COLUMN IF NOT EXISTS billing_company_name varchar(200) NOT NULL DEFAULT '' , "
                        "ADD COLUMN IF NOT EXISTS billing_department   varchar(100) NOT NULL DEFAULT '' , "
                        "ADD COLUMN IF NOT EXISTS billing_zip          varchar(20)  NOT NULL DEFAULT '' , "
                        "ADD COLUMN IF NOT EXISTS billing_address      varchar(300) NOT NULL DEFAULT '' , "
                        "ADD COLUMN IF NOT EXISTS billing_email        varchar(254) NOT NULL DEFAULT '' ;"
                    ),
                    reverse_sql=""
                ),
            ],
            state_operations=[
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
            ],
        )
    ]
