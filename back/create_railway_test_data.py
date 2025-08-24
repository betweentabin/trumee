#!/usr/bin/env python
"""
Railway用の簡単なテストデータ作成スクリプト
"""
import os
import sys
import django

# Django設定をセットアップ
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'back.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from core.models import SeekerProfile

User = get_user_model()

def create_simple_test_users():
    print("Creating simple test users for Railway...")
    
    # 1. 求職者アカウント
    user, created = User.objects.get_or_create(
        email='tanaka@example.com',
        defaults={
            'username': 'tanaka',
            'full_name': '田中 太郎',
            'role': 'user',
            'is_active': True,
        }
    )
    if created:
        user.set_password('user123')
        user.save()
        print(f"✅ Created seeker: {user.email}")
    
    # 2. 企業アカウント
    company, created = User.objects.get_or_create(
        email='hr@techcorp.jp',
        defaults={
            'username': 'techcorp',
            'full_name': '株式会社テックコーポレーション',
            'company_name': '株式会社テックコーポレーション',
            'role': 'company',
            'is_active': True,
        }
    )
    if created:
        company.set_password('company123')
        company.save()
        print(f"✅ Created company: {company.email}")
    
    # 3. 管理者アカウント
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
        print(f"✅ Created admin: {admin.email}")
    
    print("\n" + "="*50)
    print("✨ Test users created successfully!")
    print("="*50)
    print("\n【テストアカウント】")
    print("求職者: tanaka@example.com / user123")
    print("企業: hr@techcorp.jp / company123") 
    print("管理者: admin@truemee.jp / admin123")
    print("="*50)

if __name__ == '__main__':
    create_simple_test_users()
