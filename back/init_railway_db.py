#!/usr/bin/env python
"""
Railway初回デプロイ時にテストユーザーを作成するスクリプト
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

def init_railway_database():
    print("🚂 Initializing Railway database with test users...")
    
    # データベースが空かチェック
    if User.objects.count() > 0:
        print("⚠️  Database already has users. Skipping initialization.")
        return
    
    try:
        # 1. スーパーユーザー作成
        admin = User.objects.create_user(
            email='admin@truemee.jp',
            username='admin',
            full_name='管理者',
            role='user',
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )
        admin.set_password('admin123')
        admin.save()
        print(f"✅ Created admin: {admin.email}")
        
        # 2. 求職者作成
        seeker = User.objects.create_user(
            email='tanaka@example.com',
            username='tanaka',
            full_name='田中 太郎',
            role='user',
            is_active=True,
        )
        seeker.set_password('user123')
        seeker.save()
        
        # プロフィール作成
        SeekerProfile.objects.create(
            user=seeker,
            first_name='太郎',
            last_name='田中',
            first_name_kana='タロウ',
            last_name_kana='タナカ',
            prefecture='東京都',
            desired_salary='5000000',
        )
        print(f"✅ Created seeker: {seeker.email}")
        
        # 3. 企業作成
        company = User.objects.create_user(
            email='hr@techcorp.jp',
            username='techcorp',
            full_name='株式会社テックコーポレーション',
            company_name='株式会社テックコーポレーション',
            role='company',
            is_active=True,
        )
        company.set_password('company123')
        company.save()
        print(f"✅ Created company: {company.email}")
        
        print("\n🎉 Railway database initialization completed!")
        print("📋 Test accounts created:")
        print("- Admin: admin@truemee.jp / admin123")
        print("- Seeker: tanaka@example.com / user123")
        print("- Company: hr@techcorp.jp / company123")
        
    except Exception as e:
        print(f"❌ Error during initialization: {str(e)}")
        raise

if __name__ == '__main__':
    init_railway_database()
