#!/usr/bin/env python
"""
Django管理者ユーザー作成スクリプト
使用方法: python create_superuser.py
"""

import os
import sys
import django

# Django環境のセットアップ
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'back.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()

def create_superuser():
    """管理者ユーザーを作成"""
    
    print("=================================")
    print("Django管理者ユーザー作成")
    print("=================================")
    print()
    
    # デフォルト値
    default_email = "admin@example.com"
    default_password = "admin123456"
    
    print(f"デフォルト管理者アカウントを作成します:")
    print(f"  Email: {default_email}")
    print(f"  Password: {default_password}")
    print()
    
    custom = input("カスタム設定を使用しますか？ (y/N): ").lower()
    
    if custom == 'y':
        email = input("Email: ").strip()
        password = input("Password: ").strip()
        
        if not email:
            email = default_email
        if not password:
            password = default_password
    else:
        email = default_email
        password = default_password
    
    try:
        # 既存ユーザーのチェック
        if User.objects.filter(email=email).exists():
            print(f"\nエラー: {email} は既に存在します。")
            
            update = input("パスワードを更新しますか？ (y/N): ").lower()
            if update == 'y':
                user = User.objects.get(email=email)
                user.set_password(password)
                user.is_staff = True
                user.is_superuser = True
                user.save()
                print(f"\n✅ {email} のパスワードを更新しました。")
            return
        
        # 新規作成
        user = User.objects.create_superuser(
            username=email.split('@')[0],
            email=email,
            password=password,
            role='admin'
        )
        
        print(f"\n✅ 管理者ユーザーを作成しました!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        
    except IntegrityError as e:
        print(f"\nエラー: ユーザー作成に失敗しました。")
        print(f"詳細: {str(e)}")
    except Exception as e:
        print(f"\n予期しないエラー: {str(e)}")

if __name__ == '__main__':
    create_superuser()
    print()
    print("管理画面にアクセス:")
    print("  http://localhost:4000/admin/")
    print()