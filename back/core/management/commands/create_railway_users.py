from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import SeekerProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test users for Railway production database'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating test users for Railway...')
        
        # 1. 管理者アカウント
        admin, created = User.objects.get_or_create(
            email='admin@truemee.jp',
            defaults={
                'username': 'admin',
                'full_name': '管理者',
                'role': 'user',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created admin: {admin.email}'))
        else:
            self.stdout.write(f'Admin already exists: {admin.email}')
        
        # 2. 求職者アカウント
        seeker, created = User.objects.get_or_create(
            email='tanaka@example.com',
            defaults={
                'username': 'tanaka',
                'full_name': '田中 太郎',
                'role': 'user',
                'is_active': True,
            }
        )
        if created:
            seeker.set_password('user123')
            seeker.save()
            
            # プロフィール作成
            SeekerProfile.objects.get_or_create(
                user=seeker,
                defaults={
                    'first_name': '太郎',
                    'last_name': '田中',
                    'first_name_kana': 'タロウ',
                    'last_name_kana': 'タナカ',
                    'prefecture': '東京都',
                    'desired_salary': '5000000',
                }
            )
            
            self.stdout.write(self.style.SUCCESS(f'✅ Created seeker: {seeker.email}'))
        else:
            self.stdout.write(f'Seeker already exists: {seeker.email}')
        
        # 3. 企業アカウント
        company, created = User.objects.get_or_create(
            email='hr@techcorp.jp',
            defaults={
                'username': 'techcorp',
                'full_name': '株式会社テックコーポレーション',
                'company_name': '株式会社テックコーポレーション',
                'role': 'company',
                'is_active': True,
                'company_url': 'https://techcorp.jp',
                'employee_count': 100,
                'founded_year': 2010,
                'capital': 50000000,
                'industry': 'IT・通信',
                'company_description': 'テスト企業です。',
                'headquarters': '東京都',
            }
        )
        if created:
            company.set_password('company123')
            company.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created company: {company.email}'))
        else:
            self.stdout.write(f'Company already exists: {company.email}')
        
        self.stdout.write(self.style.SUCCESS('\n🎉 Test users creation completed!'))
        self.stdout.write('\n📋 Test accounts:')
        self.stdout.write('管理者: admin@truemee.jp / admin123')
        self.stdout.write('求職者: tanaka@example.com / user123')
        self.stdout.write('企業: hr@techcorp.jp / company123')
