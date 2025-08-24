# Generated manually for creating test data

from django.db import migrations
from django.contrib.auth import get_user_model
from datetime import datetime

def create_test_data(apps, schema_editor):
    User = get_user_model()
    SeekerProfile = apps.get_model('core', 'SeekerProfile')
    Resume = apps.get_model('core', 'Resume')
    Experience = apps.get_model('core', 'Experience')
    
    # 1. 管理者アカウント
    admin, created = User.objects.get_or_create(
        email='admin@truemee.jp',
        defaults={
            'username': 'admin',
            'full_name': '管理者',
            'role': 'user',  # roleは後でadminに変更
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
        }
    )
    if created:
        admin.set_password('admin123')
        admin.save()
    
    # 2. 求職者アカウント（3名）
    seekers_data = [
        {
            'email': 'tanaka@example.com',
            'username': 'tanaka',
            'full_name': '田中 太郎',
            'password': 'user123',
        },
        {
            'email': 'suzuki@example.com',
            'username': 'suzuki',
            'full_name': '鈴木 花子',
            'password': 'user123',
        },
        {
            'email': 'yamada@example.com',
            'username': 'yamada',
            'full_name': '山田 次郎',
            'password': 'user123',
        }
    ]
    
    for data in seekers_data:
        user, created = User.objects.get_or_create(
            email=data['email'],
            defaults={
                'username': data['username'],
                'full_name': data['full_name'],
                'role': 'user',
                'is_active': True,
            }
        )
        if created:
            user.set_password(data['password'])
            user.save()
            
            # プロフィール作成
            SeekerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'first_name': data['full_name'].split()[1] if ' ' in data['full_name'] else data['full_name'],
                    'last_name': data['full_name'].split()[0] if ' ' in data['full_name'] else '',
                    'first_name_kana': 'タロウ' if '太郎' in data['full_name'] else 'ハナコ' if '花子' in data['full_name'] else 'ジロウ',
                    'last_name_kana': 'タナカ' if '田中' in data['full_name'] else 'スズキ' if '鈴木' in data['full_name'] else 'ヤマダ',
                    'birthday': datetime(1990, 5, 15).date(),
                    'prefecture': '東京都',
                    'desired_salary': '5000000',
                }
            )
    
    # 3. 企業アカウント（3社）
    companies_data = [
        {
            'email': 'hr@techcorp.jp',
            'username': 'techcorp',
            'company_name': '株式会社テックコーポレーション',
            'password': 'company123',
        },
        {
            'email': 'recruit@marketing.jp',
            'username': 'marketing',
            'company_name': 'マーケティングジャパン株式会社',
            'password': 'company123',
        },
        {
            'email': 'jobs@salesforce.jp',
            'username': 'salesforce',
            'company_name': '営業ソリューション株式会社',
            'password': 'company123',
        }
    ]
    
    for data in companies_data:
        company, created = User.objects.get_or_create(
            email=data['email'],
            defaults={
                'username': data['username'],
                'full_name': data['company_name'],
                'company_name': data['company_name'],
                'role': 'company',
                'is_active': True,
                'company_url': f"https://{data['username']}.jp",
                'employee_count': 100,
                'founded_year': 2010,
                'capital': 50000000,
                'industry': 'IT・通信',
                'company_description': 'テスト企業です。',
                'headquarters': '東京都',
            }
        )
        if created:
            company.set_password(data['password'])
            company.save()


def reverse_test_data(apps, schema_editor):
    User = get_user_model()
    # テストデータを削除
    test_emails = [
        'admin@truemee.jp',
        'tanaka@example.com',
        'suzuki@example.com', 
        'yamada@example.com',
        'hr@techcorp.jp',
        'recruit@marketing.jp',
        'jobs@salesforce.jp'
    ]
    User.objects.filter(email__in=test_emails).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_user_company_description_user_employee_count_and_more'),
    ]

    operations = [
        migrations.RunPython(create_test_data, reverse_test_data),
    ]
