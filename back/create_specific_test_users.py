#!/usr/bin/env python
"""
特定のテストユーザーを作成するスクリプト
一昨日まで動いていたログインアカウントを再作成
"""
import os
import sys
import django

# Django設定をセットアップ
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'back.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from core.models import SeekerProfile, Resume, Experience
from datetime import datetime, date

User = get_user_model()

def create_specific_test_users():
    print("🔧 特定のテストユーザーを作成中...")
    
    # 1. 求職者アカウント (complete.test@example.com)
    print("\n👤 求職者アカウントを作成中...")
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
        print(f"✅ 求職者作成: {seeker.email}")
        
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
                print(f"  ✅ プロフィール作成完了")
                
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
                    print(f"  ✅ 履歴書作成完了")
                    
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
                    print(f"  ✅ 職歴作成完了")
        except Exception as e:
            print(f"  ⚠️ プロフィール作成エラー: {e}")
    else:
        print(f"  ℹ️ 既存ユーザー: {seeker.email}")
    
    # 2. 企業アカウント (company.test@example.com)
    print("\n🏢 企業アカウントを作成中...")
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
        print(f"✅ 企業作成: {company.email}")
    else:
        print(f"  ℹ️ 既存企業: {company.email}")
    
    # 3. 管理者アカウント (admin.complete@truemee.jp)
    print("\n👨‍💻 管理者アカウントを作成中...")
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
        print(f"✅ 管理者作成: {admin.email}")
    else:
        print(f"  ℹ️ 既存管理者: {admin.email}")
    
    print("\n" + "="*60)
    print("✨ テストユーザー作成完了！")
    print("="*60)
    print("\n📋 ログイン情報:")
    print("┌─────────────────────────────────────────────────────────────┐")
    print("│ 役割      │ メールアドレス               │ パスワード   │ 名前                 │ 遷移先    │")
    print("├─────────────────────────────────────────────────────────────┤")
    print("│ 🧑‍💼 求職者  │ complete.test@example.com   │ test123     │ 完全 テスト           │ /users    │")
    print("│ 🏢 企業    │ company.test@example.com    │ company123  │ テスト企業株式会社      │ /company  │")
    print("│ 👨‍💻 管理者  │ admin.complete@truemee.jp   │ admin123    │ 管理者               │ /users    │")
    print("└─────────────────────────────────────────────────────────────┘")
    print("\n🚀 Vercelでログインテストを実行してください！")

if __name__ == '__main__':
    try:
        create_specific_test_users()
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
