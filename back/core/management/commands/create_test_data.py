from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import random

from core.models import (
    SeekerProfile, Resume, Experience,
    Application, Scout, Message, Payment
)

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test data for development'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating test data...')
        
        # 1. 管理者アカウント作成
        admin_user, created = User.objects.get_or_create(
            email='admin@truemee.jp',
            defaults={
                'full_name': '管理者',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created admin: admin@truemee.jp'))

        # 2. 求職者アカウント作成（3名）
        seekers_data = [
            {
                'email': 'tanaka@example.com',
                'full_name': '田中 太郎',
                'password': 'user123',
                'profile': {
                    'birth_date': '1990-05-15',
                    'gender': 'male',
                    'phone': '090-1234-5678',
                    'postal_code': '100-0001',
                    'prefecture': '東京都',
                    'city': '千代田区',
                    'address': '千代田1-1-1',
                    'nearest_station': '東京駅',
                    'education_level': 'university',
                    'marital_status': 'single',
                    'desired_salary': 6000000,
                },
                'resume': {
                    'title': 'ITエンジニア5年の経験',
                    'summary': 'Webアプリケーション開発を中心に、フロントエンドからバックエンドまで幅広く経験してきました。',
                    'skills': 'Python, JavaScript, React, Django, AWS',
                },
                'experiences': [
                    {
                        'company_name': '株式会社テックソリューション',
                        'position': 'シニアエンジニア',
                        'start_date': '2020-04-01',
                        'end_date': None,
                        'is_current': True,
                        'description': 'Webアプリケーションの設計・開発・運用を担当。チームリーダーとして5名のメンバーをマネジメント。',
                    },
                    {
                        'company_name': 'Web開発株式会社',
                        'position': 'ジュニアエンジニア',
                        'start_date': '2018-04-01',
                        'end_date': '2020-03-31',
                        'is_current': False,
                        'description': 'ECサイトの開発・保守を担当。PHPからPythonへの移行プロジェクトに参加。',
                    }
                ],
                'education': [
                    {
                        'school_name': '東京工業大学',
                        'major': '情報工学科',
                        'degree': '学士',
                        'start_date': '2014-04-01',
                        'end_date': '2018-03-31',
                        'is_current': False,
                    }
                ]
            },
            {
                'email': 'suzuki@example.com',
                'full_name': '鈴木 花子',
                'password': 'user123',
                'profile': {
                    'birth_date': '1995-08-20',
                    'gender': 'female',
                    'phone': '090-2345-6789',
                    'postal_code': '150-0001',
                    'prefecture': '東京都',
                    'city': '渋谷区',
                    'address': '渋谷2-2-2',
                    'nearest_station': '渋谷駅',
                    'education_level': 'university',
                    'marital_status': 'single',
                    'desired_salary': 5000000,
                },
                'resume': {
                    'title': 'マーケティング3年経験',
                    'summary': 'デジタルマーケティングを中心に、SNS運用、コンテンツマーケティング、広告運用を経験。',
                    'skills': 'Google Analytics, Facebook Ads, SEO, コンテンツ企画',
                },
                'experiences': [
                    {
                        'company_name': 'マーケティング株式会社',
                        'position': 'マーケティングマネージャー',
                        'start_date': '2021-04-01',
                        'end_date': None,
                        'is_current': True,
                        'description': 'デジタルマーケティング戦略の立案と実行。月間1000万円の広告予算を管理。',
                    }
                ],
                'education': [
                    {
                        'school_name': '慶應義塾大学',
                        'major': '商学部',
                        'degree': '学士',
                        'start_date': '2015-04-01',
                        'end_date': '2019-03-31',
                        'is_current': False,
                    }
                ]
            },
            {
                'email': 'yamada@example.com',
                'full_name': '山田 次郎',
                'password': 'user123',
                'profile': {
                    'birth_date': '1988-03-10',
                    'gender': 'male',
                    'phone': '090-3456-7890',
                    'postal_code': '541-0041',
                    'prefecture': '大阪府',
                    'city': '大阪市中央区',
                    'address': '北浜3-3-3',
                    'nearest_station': '北浜駅',
                    'education_level': 'graduate',
                    'marital_status': 'married',
                    'desired_salary': 8000000,
                },
                'resume': {
                    'title': '営業管理職10年の実績',
                    'summary': 'BtoB営業として10年の経験。最後の3年間は営業部長として20名のチームを統括。',
                    'skills': '法人営業, チームマネジメント, CRM, 予算管理',
                },
                'experiences': [
                    {
                        'company_name': '総合商社株式会社',
                        'position': '営業部長',
                        'start_date': '2021-01-01',
                        'end_date': None,
                        'is_current': True,
                        'description': '営業部門の統括。年間売上目標50億円の達成に向けてチームを指導。',
                    }
                ],
                'education': [
                    {
                        'school_name': '大阪大学大学院',
                        'major': '経営学研究科',
                        'degree': '修士',
                        'start_date': '2010-04-01',
                        'end_date': '2012-03-31',
                        'is_current': False,
                    }
                ]
            }
        ]

        for seeker_data in seekers_data:
            user, created = User.objects.get_or_create(
                email=seeker_data['email'],
                defaults={
                    'full_name': seeker_data['full_name'],
                    'role': 'user',
                    'is_active': True,
                }
            )
            if created:
                user.set_password(seeker_data['password'])
                user.save()
                
                # プロフィール作成
                profile = SeekerProfile.objects.create(
                    user=user,
                    **seeker_data['profile']
                )
                
                # 履歴書作成
                resume = Resume.objects.create(
                    user=user,
                    **seeker_data['resume'],
                    is_active=True
                )
                
                # 職歴作成
                for exp_data in seeker_data['experiences']:
                    Experience.objects.create(
                        resume=resume,
                        **exp_data
                    )
                
                # 学歴はResumeモデルに直接保存（簡略化）
                if seeker_data['education']:
                    edu = seeker_data['education'][0]
                    resume.education_school = edu['school_name']
                    resume.education_major = edu['major']
                    resume.education_degree = edu['degree']
                    resume.save()
                
                self.stdout.write(self.style.SUCCESS(f'Created seeker: {user.email}'))

        # 3. 企業アカウント作成（3社）
        companies_data = [
            {
                'email': 'hr@techcorp.jp',
                'company_name': '株式会社テックコーポレーション',
                'password': 'company123',
                'company_url': 'https://techcorp.jp',
                'employee_count': 500,
                'founded_year': 2010,
                'capital': 100000000,
                'industry': 'IT・通信',
                'description': '最先端のAI技術を活用したソリューションを提供するIT企業です。',
                'headquarters': '東京都港区',
            },
            {
                'email': 'recruit@marketing.jp',
                'company_name': 'マーケティングジャパン株式会社',
                'password': 'company123',
                'company_url': 'https://marketing.jp',
                'employee_count': 150,
                'founded_year': 2015,
                'capital': 50000000,
                'industry': 'マーケティング・広告',
                'description': 'デジタルマーケティングに特化した総合広告代理店です。',
                'headquarters': '東京都渋谷区',
            },
            {
                'email': 'jobs@salesforce.jp',
                'company_name': '営業ソリューション株式会社',
                'password': 'company123',
                'company_url': 'https://salesforce.jp',
                'employee_count': 300,
                'founded_year': 2008,
                'capital': 80000000,
                'industry': '営業・コンサルティング',
                'description': 'BtoB営業支援とコンサルティングサービスを提供しています。',
                'headquarters': '大阪府大阪市',
            }
        ]

        for company_data in companies_data:
            company, created = User.objects.get_or_create(
                email=company_data['email'],
                defaults={
                    'full_name': company_data['company_name'],
                    'company_name': company_data['company_name'],
                    'role': 'company',
                    'is_active': True,
                    'company_url': company_data['company_url'],
                    'employee_count': company_data['employee_count'],
                    'founded_year': company_data['founded_year'],
                    'capital': company_data['capital'],
                    'industry': company_data['industry'],
                    'company_description': company_data['description'],
                    'headquarters': company_data['headquarters'],
                }
            )
            if created:
                company.set_password(company_data['password'])
                company.save()
                self.stdout.write(self.style.SUCCESS(f'Created company: {company.email}'))

        # 4. スカウト・応募データ作成
        seekers = User.objects.filter(role='user')
        companies = User.objects.filter(role='company')
        
        if seekers.exists() and companies.exists():
            # スカウト作成
            for company in companies[:2]:
                for seeker in seekers[:2]:
                    scout, created = Scout.objects.get_or_create(
                        company=company,
                        seeker=seeker,
                        defaults={
                            'scout_message': f'{seeker.full_name}様の経験とスキルに大変興味を持ちました。ぜひ一度お話をお聞かせください。',
                            'status': random.choice(['sent', 'viewed', 'responded']),
                        }
                    )
                    if created:
                        self.stdout.write(f'Created scout from {company.company_name} to {seeker.full_name}')
            
            # 応募作成
            for seeker in seekers[:2]:
                for company in companies[:2]:
                    application, created = Application.objects.get_or_create(
                        applicant=seeker,
                        company=company,
                        defaults={
                            'status': random.choice(['pending', 'viewed', 'accepted', 'rejected']),
                            'cover_letter': 'この度は貴社の求人を拝見し、応募させていただきました。',
                        }
                    )
                    if created:
                        self.stdout.write(f'Created application from {seeker.full_name} to {company.company_name}')
            
            # メッセージ作成
            for i in range(5):
                sender = random.choice(list(seekers) + list(companies))
                receiver = random.choice(list(seekers) + list(companies))
                if sender != receiver:
                    Message.objects.create(
                        sender=sender,
                        receiver=receiver,
                        subject=f'お問い合わせ {i+1}',
                        content=f'これはテストメッセージ {i+1} です。',
                        is_read=random.choice([True, False]),
                    )

        self.stdout.write(self.style.SUCCESS('Successfully created all test data!'))
        
        # アカウント情報を表示
        self.stdout.write('\n' + '='*50)
        self.stdout.write('テストアカウント情報:')
        self.stdout.write('='*50)
        
        self.stdout.write('\n【管理者】')
        self.stdout.write('Email: admin@truemee.jp')
        self.stdout.write('Password: admin123')
        
        self.stdout.write('\n【求職者】')
        for seeker_data in seekers_data:
            self.stdout.write(f"Email: {seeker_data['email']}")
            self.stdout.write(f"Password: {seeker_data['password']}")
            self.stdout.write(f"Name: {seeker_data['full_name']}\n")
        
        self.stdout.write('\n【企業】')
        for company_data in companies_data:
            self.stdout.write(f"Email: {company_data['email']}")
            self.stdout.write(f"Password: {company_data['password']}")
            self.stdout.write(f"Company: {company_data['company_name']}\n")
        
        self.stdout.write('='*50)