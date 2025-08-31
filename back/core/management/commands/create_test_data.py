from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from core.models import User, SeekerProfile, CompanyProfile, Resume, Experience, Education
from datetime import datetime, date
import random


class Command(BaseCommand):
    help = 'Create test data for the application'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=10,
            help='Number of test users to create'
        )
        parser.add_argument(
            '--companies',
            type=int,
            default=5,
            help='Number of test companies to create'
        )

    def handle(self, *args, **options):
        users_count = options['users']
        companies_count = options['companies']
        
        # 既存のテストデータを削除
        self.stdout.write(self.style.WARNING('Deleting existing test data...'))
        User.objects.filter(email__contains='@example.com').delete()
        self.stdout.write(self.style.SUCCESS('Existing test data deleted.'))
        
        self.stdout.write(self.style.SUCCESS(f'Creating {users_count} test users and {companies_count} test companies...'))
        
        # テスト求職者を作成
        self.create_test_seekers(users_count)
        
        # テスト企業を作成
        self.create_test_companies(companies_count)
        
        self.stdout.write(self.style.SUCCESS('Test data created successfully!'))

    def create_test_seekers(self, count):
        """テスト求職者を作成"""
        sample_names = [
            ('田中太郎', 'タナカタロウ'),
            ('佐藤花子', 'サトウハナコ'),
            ('鈴木一郎', 'スズキイチロウ'),
            ('高橋美咲', 'タカハシミサキ'),
            ('伊藤健太', 'イトウケンタ'),
            ('渡辺さくら', 'ワタナベサクラ'),
            ('山本大輔', 'ヤマモトダイスケ'),
            ('中村あい', 'ナカムラアイ'),
            ('小林翔太', 'コバヤシショウタ'),
            ('加藤美穂', 'カトウミホ'),
        ]
        
        skills = ['Python', 'JavaScript', 'React', 'Django', 'Node.js', 'AWS', 'Docker', 'PostgreSQL']
        industries = ['IT・通信', '金融', '製造業', 'コンサルティング', '小売・流通']
        

        
        for i in range(count):
            name, kana = sample_names[i % len(sample_names)]
            first_name, last_name = name.split()[:2] if ' ' in name else (name[:1], name[1:])
            first_kana, last_kana = kana.split()[:2] if ' ' in kana else (kana[:2], kana[2:])
            
            # ユーザー作成
            user = User.objects.create(
                username=f'testuser{i+1}',
                email=f'testuser{i+1}@example.com',
                password=make_password('testpass123'),
                role='user',
                full_name=name,
                kana=kana,
                gender=random.choice(['male', 'female']),
                phone=f'090-{random.randint(1000,9999)}-{random.randint(1000,9999)}'
            )
            
            # 求職者プロフィール作成 (正しいフィールド名を使用)
                profile = SeekerProfile.objects.create(
                    user=user,
                first_name=first_name,
                last_name=last_name,
                first_name_kana=first_kana,
                last_name_kana=last_kana,
                birthday=date(1990 + random.randint(0, 10), random.randint(1, 12), random.randint(1, 28)),
                prefecture='東京都',
                desired_salary=f'{random.randint(300, 800)}万円',
                experience_years=random.randint(1, 10),
                faculty=random.choice(['情報工学科', '経済学部', 'デザイン学科']),
                graduation_year=2020 + random.randint(0, 4)
            )
            
            # 履歴書を作成
                resume = Resume.objects.create(
                    user=user,
                    title=f'{first_name} {last_name}の履歴書',
                    is_active=True,
                    description=f'{first_name} {last_name}の職務経歴書です。',
                    skills='Python, Django, JavaScript, React, HTML, CSS',
                    self_pr='積極的に新しい技術を学び、チームワークを大切にして業務に取り組んでいます。'
                )
            
            # 経験を追加
                    Experience.objects.create(
                        resume=resume,
                company=f'株式会社{random.choice(["サンプル", "テスト", "デモ"])}',
                position=random.choice(['エンジニア', 'デザイナー', 'マネージャー']),
                period_from=date(2020, random.randint(1, 12), 1),
                period_to=date(2023, random.randint(1, 12), 28),
                employment_type='fulltime',
                tasks='サンプル業務経験です。'
            )
            
            # 学歴を追加
            Education.objects.create(
                resume=resume,
                school_name=f'{random.choice(["東京", "大阪", "名古屋"])}大学',
                faculty=random.choice(['情報工学科', '経済学部', 'デザイン学科']),
                major=random.choice(['情報工学', '経済学', 'デザイン学']),
                education_type='university',
                graduation_year=2020,
                graduation_month=3
            )
            
            self.stdout.write(f'Created seeker: {name} ({user.email})')

    def create_test_companies(self, count):
        """テスト企業を作成"""
        company_names = [
            'テック株式会社',
            '株式会社イノベーション',
            'デジタルソリューションズ',
            '株式会社フューチャー',
            'クリエイティブ・カンパニー',
            'AI研究所株式会社',
            'グローバル・システムズ',
            'スタートアップ・ラボ'
        ]
        
        industries = ['IT・ソフトウェア', 'コンサルティング', '製造業', '金融・保険', 'メディア・広告']
        
        for i in range(count):
            company_name = company_names[i % len(company_names)]
            capital_amount = random.randint(1000, 10000) * 10000
            employee_count = random.randint(10, 1000)
            founded_year = random.randint(2000, 2020)
            industry = random.choice(industries)
            
            # 企業ユーザー作成 (Userモデルの企業フィールドを使用)
            user = User.objects.create(
                username=f'company{i+1}',
                email=f'company{i+1}@example.com',
                password=make_password('testpass123'),
                role='company',
                company_name=company_name,
                capital=capital_amount,
                employee_count=employee_count,
                founded_year=founded_year,
                industry=industry,
                company_description=f'{company_name}は{industry}業界のリーディングカンパニーです。',
                headquarters='東京都渋谷区',
                phone=f'03-{random.randint(1000,9999)}-{random.randint(1000,9999)}'
            )
            
            # CompanyProfileも作成 (正しいフィールド名を使用)
            CompanyProfile.objects.create(
                user=user,
                company_name=company_name,
                capital=capital_amount,
                employee_count=employee_count,
                founded_year=founded_year,
                industry=industry,
                company_description=f'{company_name}は{industry}業界のリーディングカンパニーです。',
                headquarters='東京都渋谷区'
            )
            
            self.stdout.write(f'Created company: {company_name} ({user.email})')