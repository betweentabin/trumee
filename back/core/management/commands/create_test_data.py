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
            
            # 求職者プロフィール作成
            profile = SeekerProfile.objects.create(
                user=user,
                birth_date=date(1990 + random.randint(0, 10), random.randint(1, 12), random.randint(1, 28)),
                preferred_salary=random.randint(300, 800) * 10000,
                preferred_location='東京都',
                preferred_industry=random.choice(industries),
                skills=', '.join(random.sample(skills, random.randint(2, 4))),
                bio=f'{name}です。{random.choice(industries)}業界での経験があります。'
            )
            
            # 経験を追加
            Experience.objects.create(
                user=user,
                company_name=f'株式会社{random.choice(["サンプル", "テスト", "デモ"])}',
                position=random.choice(['エンジニア', 'デザイナー', 'マネージャー']),
                start_date=date(2020, random.randint(1, 12), 1),
                end_date=date(2023, random.randint(1, 12), 28),
                description='サンプル業務経験です。'
            )
            
            # 学歴を追加
            Education.objects.create(
                user=user,
                school_name=f'{random.choice(["東京", "大阪", "名古屋"])}大学',
                degree=random.choice(['学士', '修士']),
                field_of_study=random.choice(['情報工学', '経済学', 'デザイン学']),
                start_date=date(2016, 4, 1),
                end_date=date(2020, 3, 31)
            )
            
            self.stdout.write(f'Created seeker: {name} ({user.email})')

    def create_test_companies(self, count):
        """テスト企業を作成"""
        company_names = [
            'テック株式会社',
            '株式会社イノベーション',
            'デジタルソリューションズ',
            '株式会社フューチャー',
            'クリエイティブ・カンパニー'
        ]
        
        industries = ['IT・ソフトウェア', 'コンサルティング', '製造業', '金融・保険', 'メディア・広告']
        
        for i in range(count):
            company_name = company_names[i % len(company_names)]
            
            # 企業ユーザー作成
            user = User.objects.create(
                username=f'company{i+1}',
                email=f'company{i+1}@example.com',
                password=make_password('testpass123'),
                role='company',
                company_name=company_name,
                capital=random.randint(1000, 10000) * 10000,
                employee_count=random.randint(10, 1000),
                founded_year=random.randint(2000, 2020),
                industry=random.choice(industries),
                company_description=f'{company_name}は{random.choice(industries)}業界のリーディングカンパニーです。',
                headquarters='東京都渋谷区',
                phone=f'03-{random.randint(1000,9999)}-{random.randint(1000,9999)}'
            )
            
            # 企業プロフィール作成
            CompanyProfile.objects.create(
                user=user,
                business_description=f'{company_name}の詳細な事業内容です。',
                website_url=f'https://{company_name.lower().replace(" ", "")}.com',
                benefits='各種社会保険完備、交通費支給、研修制度充実'
            )
            
            self.stdout.write(f'Created company: {company_name} ({user.email})')