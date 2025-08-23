#!/usr/bin/env python
"""
簡単なテストデータ作成スクリプト
"""
import os
import sys
import django

# Django設定をセットアップ
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'back.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from core.models import SeekerProfile, Resume, Experience, Application, Scout, Message
import random
from datetime import datetime

User = get_user_model()

def create_test_data():
    print("テストデータを作成中...")
    
    # 1. 管理者アカウント
    admin, created = User.objects.get_or_create(
        email='admin@truemee.jp',
        username='admin',
        defaults={
            'full_name': '管理者',
            'role': 'user',  # とりあえずuserとして作成
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
        }
    )
    if created:
        admin.set_password('admin123')
        admin.save()
        print(f"✅ 管理者作成: admin@truemee.jp")
    
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
    
    created_seekers = []
    for data in seekers_data:
        user, created = User.objects.get_or_create(
            email=data['email'],
            username=data['username'],
            defaults={
                'full_name': data['full_name'],
                'role': 'user',
                'is_active': True,
            }
        )
        if created:
            user.set_password(data['password'])
            user.save()
            
            # プロフィール作成
            SeekerProfile.objects.create(
                user=user,
                first_name=data['full_name'].split()[1] if ' ' in data['full_name'] else data['full_name'],
                last_name=data['full_name'].split()[0] if ' ' in data['full_name'] else '',
                first_name_kana='タロウ' if '太郎' in data['full_name'] else 'ハナコ' if '花子' in data['full_name'] else 'ジロウ',
                last_name_kana='タナカ' if '田中' in data['full_name'] else 'スズキ' if '鈴木' in data['full_name'] else 'ヤマダ',
                birthday=datetime(1990, 5, 15).date(),
                prefecture='東京都',
                desired_salary=5000000,
            )
            
            # 履歴書作成
            resume = Resume.objects.create(
                user=user,
                desired_job='エンジニア',
                skills='Python, JavaScript, React',
                self_pr='真面目に仕事に取り組みます。'
            )
            
            # 職歴作成
            Experience.objects.create(
                resume=resume,
                company='テック株式会社',
                position='エンジニア',
                period_from=datetime(2020, 4, 1).date(),
                period_to=None,  # 現在も在籍
                employment_type='fulltime',
                business='Webアプリケーション開発を担当'
            )
            
            print(f"✅ 求職者作成: {data['email']}")
        created_seekers.append(user)
    
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
    
    created_companies = []
    for data in companies_data:
        company, created = User.objects.get_or_create(
            email=data['email'],
            username=data['username'],
            defaults={
                'full_name': data['company_name'],
                'company_name': data['company_name'],
                'role': 'company',
                'is_active': True,
                'company_url': f"https://{data['username']}.jp",
                'employee_count': random.randint(50, 500),
                'founded_year': random.randint(2005, 2020),
                'capital': random.randint(10000000, 100000000),
                'industry': 'IT・通信',
                'company_description': 'テスト企業です。',
                'headquarters': '東京都',
            }
        )
        if created:
            company.set_password(data['password'])
            company.save()
            print(f"✅ 企業作成: {data['email']}")
        created_companies.append(company)
    
    # 4. スカウト・応募データ
    # スカウト作成（企業→求職者）
    for company in created_companies[:2]:
        for seeker in created_seekers[:2]:
            scout, created = Scout.objects.get_or_create(
                company=company,
                seeker=seeker,
                defaults={
                    'scout_message': f'{seeker.full_name}様のスキルに興味があります。',
                    'status': random.choice(['sent', 'viewed', 'responded']),
                }
            )
            if created:
                print(f"  📧 スカウト: {company.company_name} → {seeker.full_name}")
    
    # 応募作成（求職者→企業）
    for seeker in created_seekers[:2]:
        for company in created_companies[:2]:
            app, created = Application.objects.get_or_create(
                applicant=seeker,
                company=company,
                defaults={
                    'status': random.choice(['pending', 'viewed', 'accepted']),
                }
            )
            if created:
                print(f"  📝 応募: {seeker.full_name} → {company.company_name}")
    
    # メッセージ作成
    for i in range(3):
        sender = random.choice(created_seekers + created_companies)
        receiver = random.choice(created_seekers + created_companies)
        if sender != receiver:
            Message.objects.create(
                sender=sender,
                receiver=receiver,
                subject=f'テストメッセージ {i+1}',
                content=f'これはテストメッセージです。',
                is_read=random.choice([True, False]),
            )
    
    print("\n" + "="*60)
    print("✨ テストデータ作成完了！")
    print("="*60)
    
    print("\n📋 テストアカウント情報:")
    print("-"*60)
    
    print("\n【管理者】")
    print("  Email: admin@truemee.jp")
    print("  Password: admin123")
    
    print("\n【求職者】")
    for data in seekers_data:
        print(f"  Email: {data['email']}")
        print(f"  Password: {data['password']}")
        print(f"  Name: {data['full_name']}\n")
    
    print("【企業】")
    for data in companies_data:
        print(f"  Email: {data['email']}")
        print(f"  Password: {data['password']}")
        print(f"  Company: {data['company_name']}\n")
    
    print("="*60)

if __name__ == '__main__':
    create_test_data()