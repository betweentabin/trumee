from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import SeekerProfile, Resume, Experience
from datetime import date

User = get_user_model()

class Command(BaseCommand):
    help = '特定のテストユーザーを作成（一昨日まで動いていたアカウント）'

    def handle(self, *args, **kwargs):
        self.stdout.write('🔧 特定のテストユーザーを作成中...')
        
        # 1. 求職者アカウント (complete.test@example.com)
        self.stdout.write('\n👤 求職者アカウントを作成中...')
        seeker, created = User.objects.get_or_create(
            email='complete.test@example.com',
            defaults={
                'username': 'complete_test',
                'full_name': '完全 テスト',
                'role': 'user',
                'is_active': True,
            }
        )
        if created:
            seeker.set_password('test123')
            seeker.save()
            self.stdout.write(
                self.style.SUCCESS(f'✅ 求職者作成: {seeker.email}')
            )
            
            # 求職者プロフィール作成
            try:
                profile, profile_created = SeekerProfile.objects.get_or_create(
                    user=seeker,
                    defaults={
                        'first_name': 'テスト',
                        'last_name': '完全',
                        'first_name_kana': 'テスト',
                        'last_name_kana': 'カンゼン',
                        'birthday': date(1990, 1, 1),
                        'prefecture': '東京都',
                        'experience_years': 5,
                        'desired_salary': '6000000',
                    }
                )
                if profile_created:
                    self.stdout.write('  ✅ プロフィール作成完了')
                    
                    # 基本的な履歴書作成
                    resume, resume_created = Resume.objects.get_or_create(
                        user=seeker,
                        defaults={
                            'desired_job': 'Webエンジニア',
                            'desired_industries': ['IT・通信', 'Webサービス'],
                            'desired_locations': ['東京都', '神奈川県'],
                            'skills': 'Python, Django, JavaScript, React, PostgreSQL',
                            'self_pr': '5年間のWebアプリケーション開発経験があります。バックエンドからフロントエンドまで幅広く対応可能です。',
                            'is_active': True,
                        }
                    )
                    if resume_created:
                        self.stdout.write('  ✅ 履歴書作成完了')
                        
                        # 職歴作成
                        Experience.objects.get_or_create(
                            resume=resume,
                            company='株式会社テックカンパニー',
                            defaults={
                                'period_from': date(2019, 4, 1),
                                'period_to': date(2024, 3, 31),
                                'employment_type': 'fulltime',
                                'position': 'Webエンジニア',
                                'business': 'Webアプリケーション開発',
                                'tasks': 'Webアプリケーションの設計・開発・運用。Python/Djangoを使用したバックエンド開発、React.jsを使用したフロントエンド開発。',
                                'industry': 'IT・通信',
                                'order': 1,
                            }
                        )
                        self.stdout.write('  ✅ 職歴作成完了')
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'  ⚠️ プロフィール作成エラー: {e}')
                )
        else:
            self.stdout.write(f'  ℹ️ 既存ユーザー: {seeker.email}')
        
        # 2. 企業アカウント (company.test@example.com)
        self.stdout.write('\n🏢 企業アカウントを作成中...')
        company, created = User.objects.get_or_create(
            email='company.test@example.com',
            defaults={
                'username': 'test_company',
                'company_name': 'テスト企業株式会社',
                'role': 'company',
                'is_active': True,
                'industry': 'IT・通信',
                'employee_count': 50,
                'founded_year': 2010,
                'headquarters': '東京都渋谷区',
                'company_description': 'Webサービス開発を主業務とするIT企業です。',
                'company_url': 'https://test-company.example.com',
            }
        )
        if created:
            company.set_password('company123')
            company.save()
            self.stdout.write(
                self.style.SUCCESS(f'✅ 企業作成: {company.email}')
            )
        else:
            self.stdout.write(f'  ℹ️ 既存企業: {company.email}')
        
        # 3. 管理者アカウント (admin.complete@truemee.jp)
        self.stdout.write('\n👨‍💻 管理者アカウントを作成中...')
        admin, created = User.objects.get_or_create(
            email='admin.complete@truemee.jp',
            defaults={
                'username': 'admin_complete',
                'full_name': '管理者',
                'role': 'user',  # ユーザーモデルのROLE_CHOICESには'admin'がないため'user'として作成
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(
                self.style.SUCCESS(f'✅ 管理者作成: {admin.email}')
            )
        else:
            self.stdout.write(f'  ℹ️ 既存管理者: {admin.email}')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(
            self.style.SUCCESS('✨ テストユーザー作成完了！')
        )
        self.stdout.write('='*60)
        self.stdout.write('\n📋 ログイン情報:')
        self.stdout.write('┌─────────────────────────────────────────────────────────────┐')
        self.stdout.write('│ 役割      │ メールアドレス               │ パスワード   │ 名前                 │ 遷移先    │')
        self.stdout.write('├─────────────────────────────────────────────────────────────┤')
        self.stdout.write('│ 🧑‍💼 求職者  │ complete.test@example.com   │ test123     │ 完全 テスト           │ /users    │')
        self.stdout.write('│ 🏢 企業    │ company.test@example.com    │ company123  │ テスト企業株式会社      │ /company  │')
        self.stdout.write('│ 👨‍💻 管理者  │ admin.complete@truemee.jp   │ admin123    │ 管理者               │ /users    │')
        self.stdout.write('└─────────────────────────────────────────────────────────────┘')
        self.stdout.write('\n🚀 Vercelでログインテストを実行してください！')
