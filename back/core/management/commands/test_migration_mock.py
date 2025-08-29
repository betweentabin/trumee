"""
モックデータを使った移行機能テスト

Firebase接続が利用できない場合でも移行機能をテストできます
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth.hashers import make_password
from core.models import (
    User, SeekerProfile, CompanyProfile, Resume, 
    Experience, Education, Certification
)
import json
from datetime import datetime, date
import uuid


class Command(BaseCommand):
    help = 'モックデータを使った移行機能テスト'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-sample',
            action='store_true',
            help='サンプルデータを作成',
        )
        parser.add_argument(
            '--verify',
            action='store_true',
            help='データ検証のみ実行',
        )

    def handle(self, *args, **options):
        create_sample = options['create_sample']
        verify_only = options['verify']
        
        self.stdout.write(
            self.style.SUCCESS('🧪 移行機能テストを開始します...')
        )
        
        if create_sample:
            self.create_sample_data()
        
        if verify_only or create_sample:
            self.verify_data_structure()
        
        self.stdout.write(
            self.style.SUCCESS('✅ テストが完了しました！')
        )

    def create_sample_data(self):
        """サンプルデータの作成"""
        self.stdout.write('📝 サンプルデータを作成中...')
        
        # サンプル求職者データ
        seeker_data = {
            'email': 'test_seeker@example.com',
            'username': 'test_seeker',
            'password': make_password('testpass123'),
            'role': 'user',
            'full_name': '田中 太郎',
            'kana': 'タナカ タロウ',
            'gender': 'male',
            'phone': '090-1234-5678'
        }
        
        # サンプル企業データ
        company_data = {
            'email': 'test_company@example.com',
            'username': 'test_company',
            'password': make_password('testpass123'),
            'role': 'company',
            'company_name': 'テスト株式会社',
            'capital': 100000000,
            'company_url': 'https://test-company.com',
            'employee_count': 50,
            'founded_year': 2010,
            'industry': 'IT・ソフトウェア',
            'company_description': '革新的なソフトウェアソリューションを提供',
            'headquarters': '東京都渋谷区',
            'phone': '03-1234-5678'
        }
        
        try:
            with transaction.atomic():
                # 求職者作成
                seeker_user = self.create_or_update_user(seeker_data)
                seeker_profile = self.create_seeker_profile(seeker_user)
                resume = self.create_sample_resume(seeker_user)
                self.create_sample_experiences(resume)
                self.create_sample_education(resume)
                self.create_sample_certifications(resume)
                
                # 企業作成
                company_user = self.create_or_update_user(company_data)
                company_profile = self.create_company_profile(company_user)
                
                self.stdout.write(
                    self.style.SUCCESS(f'✅ サンプルデータ作成完了')
                )
                self.stdout.write(f'   求職者: {seeker_user.email}')
                self.stdout.write(f'   企業: {company_user.email}')
                self.stdout.write(f'   履歴書ID: {resume.id}')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ サンプルデータ作成エラー: {str(e)}')
            )
            raise

    def create_or_update_user(self, user_data):
        """ユーザーの作成または更新"""
        email = user_data['email']
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults=user_data
        )
        
        if not created:
            # 既存ユーザーの更新
            for key, value in user_data.items():
                setattr(user, key, value)
            user.save()
        
        return user

    def create_seeker_profile(self, user):
        """求職者プロフィール作成"""
        profile_data = {
            'first_name': '太郎',
            'last_name': '田中',
            'first_name_kana': 'タロウ',
            'last_name_kana': 'タナカ',
            'birthday': date(1990, 5, 15),
            'prefecture': '東京都',
            'faculty': '情報工学部',
            'graduation_year': 2013,
            'experience_years': 5,
            'current_salary': '500万円',
            'desired_salary': '600万円'
        }
        
        profile, created = SeekerProfile.objects.get_or_create(
            user=user,
            defaults=profile_data
        )
        
        return profile

    def create_company_profile(self, user):
        """企業プロフィール作成"""
        profile_data = {
            'company_name': user.company_name,
            'capital': user.capital,
            'company_url': user.company_url,
            'employee_count': user.employee_count,
            'founded_year': user.founded_year,
            'industry': user.industry,
            'company_description': user.company_description,
            'headquarters': user.headquarters,
            'contact_person': '採用担当者',
            'contact_department': '人事部'
        }
        
        profile, created = CompanyProfile.objects.get_or_create(
            user=user,
            defaults=profile_data
        )
        
        return profile

    def create_sample_resume(self, user):
        """サンプル履歴書作成"""
        resume_data = {
            'title': 'Webエンジニア希望',
            'description': 'フルスタックWebエンジニアとして成長していきたいです',
            'objective': '技術力向上と新しい挑戦を求めて転職を希望します',
            'skills': 'Python, Django, JavaScript, React, PostgreSQL, AWS',
            'self_pr': '''
5年間のWeb開発経験があります。
主にPythonとJavaScriptを使用したWebアプリケーション開発に従事してきました。
チームリーダーとして3名のメンバーをマネジメントした経験もあります。
新しい技術への学習意欲が高く、常に最新のトレンドをキャッチアップしています。
            '''.strip(),
            'desired_job': 'Webエンジニア',
            'desired_industries': ['IT・ソフトウェア', 'インターネット・Web'],
            'desired_locations': ['東京都', '神奈川県'],
            'is_active': True
        }
        
        resume = Resume.objects.create(user=user, **resume_data)
        return resume

    def create_sample_experiences(self, resume):
        """サンプル職歴作成"""
        experiences = [
            {
                'company': 'ABC株式会社',
                'period_from': date(2019, 4, 1),
                'period_to': None,  # 現在
                'employment_type': 'fulltime',
                'position': 'Webエンジニア',
                'business': 'Webアプリケーション開発',
                'capital': '1億円',
                'team_size': '5名',
                'tasks': '''
- ECサイトのバックエンド開発（Django）
- フロントエンド開発（React）
- データベース設計・最適化
- AWSインフラ構築・運用
- チームリーダーとしてメンバー管理
                '''.strip(),
                'industry': 'IT・ソフトウェア',
                'achievements': '売上20%向上に貢献するシステム改善を実施',
                'technologies_used': ['Python', 'Django', 'React', 'PostgreSQL', 'AWS'],
                'order': 0
            },
            {
                'company': 'XYZ Inc.',
                'period_from': date(2016, 4, 1),
                'period_to': date(2019, 3, 31),
                'employment_type': 'fulltime',
                'position': 'ジュニアエンジニア',
                'business': 'コーポレートサイト制作',
                'capital': '5000万円',
                'team_size': '3名',
                'tasks': '''
- WordPressサイト開発
- HTML/CSS/JavaScriptコーディング
- 顧客サポート業務
                '''.strip(),
                'industry': 'Web制作',
                'achievements': '月間10サイト以上の制作実績',
                'technologies_used': ['PHP', 'WordPress', 'jQuery', 'MySQL'],
                'order': 1
            }
        ]
        
        for exp_data in experiences:
            Experience.objects.create(resume=resume, **exp_data)

    def create_sample_education(self, resume):
        """サンプル学歴作成"""
        educations = [
            {
                'school_name': '○○大学',
                'faculty': '情報工学部',
                'major': '情報システム学科',
                'graduation_date': date(2016, 3, 31),
                'education_type': 'university',
                'order': 0
            },
            {
                'school_name': '△△高等学校',
                'faculty': '普通科',
                'major': '',
                'graduation_date': date(2012, 3, 31),
                'education_type': 'high_school',
                'order': 1
            }
        ]
        
        for edu_data in educations:
            Education.objects.create(resume=resume, **edu_data)

    def create_sample_certifications(self, resume):
        """サンプル資格作成"""
        certifications = [
            {
                'name': '基本情報技術者試験',
                'issuer': 'IPA（独立行政法人情報処理推進機構）',
                'obtained_date': date(2015, 12, 1),
                'expiry_date': None,
                'order': 0
            },
            {
                'name': 'AWS Certified Solutions Architect',
                'issuer': 'Amazon Web Services',
                'obtained_date': date(2020, 6, 15),
                'expiry_date': date(2023, 6, 15),
                'order': 1
            }
        ]
        
        for cert_data in certifications:
            Certification.objects.create(resume=resume, **cert_data)

    def verify_data_structure(self):
        """データ構造の検証"""
        self.stdout.write('🔍 データ構造を検証中...')
        
        # データ数の確認
        user_count = User.objects.count()
        seeker_count = SeekerProfile.objects.count()
        company_count = CompanyProfile.objects.count()
        resume_count = Resume.objects.count()
        experience_count = Experience.objects.count()
        education_count = Education.objects.count()
        certification_count = Certification.objects.count()
        
        self.stdout.write('\n📊 データ数:')
        self.stdout.write(f'  ユーザー: {user_count}')
        self.stdout.write(f'  求職者プロフィール: {seeker_count}')
        self.stdout.write(f'  企業プロフィール: {company_count}')
        self.stdout.write(f'  履歴書: {resume_count}')
        self.stdout.write(f'  職歴: {experience_count}')
        self.stdout.write(f'  学歴: {education_count}')
        self.stdout.write(f'  資格: {certification_count}')
        
        # リレーション確認
        self.stdout.write('\n🔗 リレーション確認:')
        
        for user in User.objects.all()[:3]:  # 最初の3件
            self.stdout.write(f'  ユーザー: {user.email} ({user.role})')
            
            if user.role == 'user' and hasattr(user, 'seeker_profile'):
                profile = user.seeker_profile
                self.stdout.write(f'    プロフィール: {profile.full_name}')
                
                for resume in user.resumes.all():
                    self.stdout.write(f'    履歴書: {resume.title}')
                    self.stdout.write(f'      職歴: {resume.experiences.count()}件')
                    self.stdout.write(f'      学歴: {resume.educations.count()}件')
                    self.stdout.write(f'      資格: {resume.certifications.count()}件')
            
            elif user.role == 'company' and hasattr(user, 'company_profile'):
                profile = user.company_profile
                self.stdout.write(f'    企業プロフィール: {profile.company_name}')
        
        # データ完整性チェック
        integrity_issues = []
        
        # 必須フィールドチェック
        users_without_email = User.objects.filter(email='').count()
        if users_without_email > 0:
            integrity_issues.append(f'メールアドレスが空のユーザー: {users_without_email}件')
        
        resumes_without_user = Resume.objects.filter(user__isnull=True).count()
        if resumes_without_user > 0:
            integrity_issues.append(f'ユーザーが関連付けられていない履歴書: {resumes_without_user}件')
        
        if integrity_issues:
            self.stdout.write('\n⚠️  整合性の問題:')
            for issue in integrity_issues:
                self.stdout.write(f'  {issue}')
        else:
            self.stdout.write('\n✅ データ整合性: 問題なし')
        
        # UUIDフィールドの確認
        uuid_fields_test = []
        for model, field_name in [
            (User, 'id'),
            (SeekerProfile, 'id'),
            (CompanyProfile, 'id'),
            (Resume, 'id'),
            (Experience, 'id'),
            (Education, 'id'),
            (Certification, 'id'),
        ]:
            if model.objects.exists():
                sample = model.objects.first()
                field_value = getattr(sample, field_name)
                if isinstance(field_value, uuid.UUID):
                    uuid_fields_test.append(f'{model.__name__}.{field_name}: OK')
                else:
                    uuid_fields_test.append(f'{model.__name__}.{field_name}: NG - {type(field_value)}')
        
        self.stdout.write('\n🆔 UUID フィールド確認:')
        for test_result in uuid_fields_test:
            self.stdout.write(f'  {test_result}')
