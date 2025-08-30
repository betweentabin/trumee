#!/usr/bin/env python
"""
プロフィールページテスト用のユーザーを作成するスクリプト
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random

# Django環境をセットアップ
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'back.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import (
    SeekerProfile, CompanyProfile, Resume, Experience, 
    Education, Certification, UserPrivacySettings, UserProfileExtension
)

User = get_user_model()

def create_test_users():
    """2つのテストユーザーを作成"""
    
    # テストユーザー1: 田中太郎（公開プロフィール）
    user1, created = User.objects.update_or_create(
        email='tanaka.taro@example.com',
        defaults={
            'username': 'tanaka.taro',  # usernameを追加
            'full_name': '田中太郎',
            'phone': '090-1234-5678',
            'role': 'seeker',
            'is_active': True,
        }
    )
    if created:
        user1.set_password('password123')
        user1.save()
        print(f"✅ ユーザー1を作成: {user1.email}")
    else:
        print(f"📝 ユーザー1は既存: {user1.email}")
    
    # プロフィール拡張情報を作成
    profile_ext1, _ = UserProfileExtension.objects.update_or_create(
        user=user1,
        defaults={
            'bio': """ソフトウェアエンジニアとして10年以上の経験があります。
フルスタック開発が得意で、特にReactとDjangoを使ったWebアプリケーション開発に強みがあります。

チーム開発はもちろん、個人でのプロダクト開発も行っており、
常に新しい技術を学び、実践することを心がけています。

【得意分野】
- フロントエンド: React, Next.js, TypeScript
- バックエンド: Django, Node.js, FastAPI
- インフラ: AWS, Docker, Kubernetes
- DB: PostgreSQL, MongoDB, Redis""",
            'headline': 'フルスタックエンジニア | React & Django専門',
            'location': '東京都渋谷区',
            'website_url': 'https://tanaka-portfolio.com',
            'github_url': 'https://github.com/tanaka-taro',
            'linkedin_url': 'https://linkedin.com/in/tanaka-taro',
            'available_for_work': True,
        }
    )
    
    # プライバシー設定（公開）
    privacy1, _ = UserPrivacySettings.objects.update_or_create(
        user=user1,
        defaults={
            'is_profile_public': True,
            'show_email': True,
            'show_phone': False,
            'show_resumes': True,
        }
    )
    
    # シーカープロフィール
    seeker1, _ = SeekerProfile.objects.update_or_create(
        user=user1,
        defaults={
            'experience_years': 10,
            'prefecture': '東京都',
            'current_salary': '800万円',
            'desired_salary': '1000万円',
        }
    )
    
    # 履歴書を作成
    resume1, _ = Resume.objects.update_or_create(
        user=user1,
        title='フルスタックエンジニア履歴書',
        defaults={
            'description': 'Web開発のフルスタックエンジニアとしての経歴',
            'is_active': True,
            'extra_data': {
                'skills': ['React', 'Django', 'TypeScript', 'Python', 'AWS'],
                'languages': ['日本語', '英語']
            }
        }
    )
    
    # 職歴を追加
    Experience.objects.update_or_create(
        resume=resume1,
        company='株式会社テックイノベーション',
        defaults={
            'position': 'シニアエンジニア',
            'period_from': datetime.now().date() - timedelta(days=365*3),
            'period_to': None,
            'employment_type': 'fulltime',
            'business': 'SaaSプロダクトの開発リード',
        }
    )
    
    # 学歴を追加
    Education.objects.update_or_create(
        resume=resume1,
        school_name='東京工業大学',
        defaults={
            'faculty': '情報理工学院',
            'education_type': 'graduate',
            'graduation_date': datetime.now().date() - timedelta(days=365*12),
        }
    )
    
    print(f"  - プロフィール拡張: {profile_ext1.headline}")
    print(f"  - プライバシー設定: 公開={privacy1.is_profile_public}")
    print(f"  - ユーザーID: {user1.id}")
    print(f"  - プロフィールURL: /users/{user1.id}")
    
    # テストユーザー2: 山田花子（限定公開プロフィール）
    user2, created = User.objects.update_or_create(
        email='yamada.hanako@example.com',
        defaults={
            'username': 'yamada.hanako',  # usernameを追加
            'full_name': '山田花子',
            'phone': '080-9876-5432',
            'role': 'seeker',
            'is_active': True,
        }
    )
    if created:
        user2.set_password('password123')
        user2.save()
        print(f"\n✅ ユーザー2を作成: {user2.email}")
    else:
        print(f"\n📝 ユーザー2は既存: {user2.email}")
    
    # プロフィール拡張情報を作成
    profile_ext2, _ = UserProfileExtension.objects.update_or_create(
        user=user2,
        defaults={
            'bio': """デザインとマーケティングの両方の経験を活かし、
ユーザー中心のプロダクト開発に取り組んでいます。

UI/UXデザインから、グロースハック、データ分析まで幅広く対応可能です。""",
            'headline': 'プロダクトデザイナー | UI/UX & グロースハック',
            'location': '大阪府大阪市',
            'website_url': 'https://yamada-design.jp',
            'available_for_work': False,
        }
    )
    
    # プライバシー設定（限定公開）
    privacy2, _ = UserPrivacySettings.objects.update_or_create(
        user=user2,
        defaults={
            'is_profile_public': True,  # プロフィールは公開
            'show_email': False,  # メールは非公開
            'show_phone': False,  # 電話番号は非公開
            'show_resumes': False,  # 履歴書は非公開
        }
    )
    
    # シーカープロフィール
    seeker2, _ = SeekerProfile.objects.update_or_create(
        user=user2,
        defaults={
            'experience_years': 7,
            'prefecture': '大阪府',
            'current_salary': '600万円',
            'desired_salary': '700万円',
        }
    )
    
    # 履歴書を作成
    resume2, _ = Resume.objects.update_or_create(
        user=user2,
        title='プロダクトデザイナー履歴書',
        defaults={
            'description': 'デザインとマーケティングの経験',
            'is_active': False,  # 非公開
            'extra_data': {
                'skills': ['Figma', 'Adobe XD', 'Google Analytics', 'SQL'],
                'languages': ['日本語']
            }
        }
    )
    
    print(f"  - プロフィール拡張: {profile_ext2.headline}")
    print(f"  - プライバシー設定: 公開={privacy2.is_profile_public}, 履歴書公開={privacy2.show_resumes}")
    print(f"  - ユーザーID: {user2.id}")
    print(f"  - プロフィールURL: /users/{user2.id}")
    
    return user1, user2

if __name__ == '__main__':
    print("=== プロフィールテスト用ユーザーを作成 ===\n")
    user1, user2 = create_test_users()
    
    print("\n=== 作成完了 ===")
    print("\n📌 ログイン情報:")
    print(f"ユーザー1: tanaka.taro@example.com / password123")
    print(f"ユーザー2: yamada.hanako@example.com / password123")
    
    print("\n📌 プロフィールページ:")
    print(f"http://localhost:3000/users/{user1.id}")
    print(f"http://localhost:3000/users/{user2.id}")
    
    print("\n✨ テストユーザーの作成が完了しました！")