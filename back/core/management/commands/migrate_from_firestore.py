"""
Firestoreから新しいPostgreSQL/SQLiteデータベースへのデータ移行コマンド

使用方法:
python manage.py migrate_from_firestore

オプション:
--dry-run: 実際の移行は行わず、処理内容のみを表示
--collection: 特定のコレクションのみ移行 (users, seekers, resumes等)
--limit: 移行するドキュメント数の上限
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.contrib.auth.hashers import make_password
from core.models import (
    User, SeekerProfile, CompanyProfile, Resume, 
    Experience, Education, Certification
)
from core.firebase import db
import json
from datetime import datetime
import uuid
from typing import Dict, List, Any


class Command(BaseCommand):
    help = 'Firestoreからの既存データ移行'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='実際の移行は行わず、処理内容のみを表示',
        )
        parser.add_argument(
            '--collection',
            type=str,
            help='移行する特定のコレクション名',
            choices=['users', 'seekers', 'resumes', 'all'],
            default='all'
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='移行するドキュメント数の上限',
            default=None
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='既存のユーザーをスキップ',
        )

    def handle(self, *args, **options):
        self.dry_run = options['dry_run']
        self.collection = options['collection']
        self.limit = options['limit']
        self.skip_existing = options['skip_existing']
        
        self.stdout.write(
            self.style.SUCCESS('🚀 Firestoreデータ移行を開始します...')
        )
        
        if self.dry_run:
            self.stdout.write(
                self.style.WARNING('⚠️  DRY-RUNモード: 実際の移行は行いません')
            )

        try:
            if self.collection in ['users', 'all']:
                self.migrate_users()
            
            if self.collection in ['seekers', 'all']:
                self.migrate_seeker_profiles()
            
            if self.collection in ['resumes', 'all']:
                self.migrate_resumes()
            
            self.stdout.write(
                self.style.SUCCESS('✅ データ移行が完了しました！')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ 移行中にエラーが発生しました: {str(e)}')
            )
            raise CommandError(f'Migration failed: {str(e)}')

    def migrate_users(self):
        """Firestoreのusersコレクションからユーザーデータを移行"""
        self.stdout.write('👥 ユーザーデータの移行を開始...')
        
        try:
            # Firestoreからユーザーデータを取得
            users_ref = db.collection('users')
            if self.limit:
                users_docs = users_ref.limit(self.limit).stream()
            else:
                users_docs = users_ref.stream()
            
            migrated_count = 0
            skipped_count = 0
            
            for doc in users_docs:
                user_data = doc.to_dict()
                email = user_data.get('email')
                
                if not email:
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  メールアドレスが見つかりません: {doc.id}')
                    )
                    continue
                
                # 既存ユーザーのチェック
                if self.skip_existing and User.objects.filter(email=email).exists():
                    skipped_count += 1
                    continue
                
                if not self.dry_run:
                    try:
                        with transaction.atomic():
                            user = self.create_user_from_firestore(user_data, doc.id)
                            migrated_count += 1
                            self.stdout.write(f'✅ ユーザー移行完了: {user.email}')
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'❌ ユーザー移行失敗: {email} - {str(e)}')
                        )
                else:
                    migrated_count += 1
                    self.stdout.write(f'📋 [DRY-RUN] ユーザー: {email}')
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'👥 ユーザー移行完了: {migrated_count}件, スキップ: {skipped_count}件'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ ユーザー移行エラー: {str(e)}')
            )
            raise

    def create_user_from_firestore(self, user_data: Dict[str, Any], doc_id: str) -> User:
        """Firestoreのユーザーデータから新しいUserモデルを作成"""
        
        # ユーザー基本情報の抽出
        email = user_data.get('email')
        role = user_data.get('role', 'user')
        
        # パスワードの処理
        password = user_data.get('password')
        if not password or not password.startswith('pbkdf2_'):
            # Firestoreにハッシュ化されていないパスワードがある場合
            password = make_password('temporary_password_123')
        
        # ユーザー作成
        user = User.objects.create(
            # Firebase UIDを保持（必要に応じて）
            id=uuid.uuid4(),  # 新しいUUIDを生成
            username=user_data.get('username', email.split('@')[0]),
            email=email,
            password=password,
            role=role,
            
            # 求職者用フィールド
            full_name=user_data.get('full_name', ''),
            kana=user_data.get('kana', ''),
            gender=user_data.get('gender', ''),
            
            # 企業用フィールド
            company_name=user_data.get('company_name', ''),
            capital=self.safe_int(user_data.get('capital')),
            company_url=user_data.get('url', ''),
            campaign_code=user_data.get('campaign_code', ''),
            employee_count=self.safe_int(user_data.get('employee_count')),
            founded_year=self.safe_int(user_data.get('founded_year')),
            industry=user_data.get('industry', ''),
            company_description=user_data.get('company_description', ''),
            headquarters=user_data.get('headquarters', ''),
            
            # 共通フィールド
            phone=user_data.get('phone', ''),
            is_premium=user_data.get('subscriptions', {}).get('premiumPlan', False),
        )
        
        # 企業の場合、CompanyProfileも作成
        if role == 'company' and user.company_name:
            CompanyProfile.objects.create(
                user=user,
                company_name=user.company_name,
                capital=user.capital,
                company_url=user.company_url,
                campaign_code=user.campaign_code,
                employee_count=user.employee_count,
                founded_year=user.founded_year,
                industry=user.industry,
                company_description=user.company_description,
                headquarters=user.headquarters,
            )
        
        return user

    def migrate_seeker_profiles(self):
        """Firestoreのseekersコレクションから求職者プロフィールを移行"""
        self.stdout.write('👤 求職者プロフィールの移行を開始...')
        
        try:
            seekers_ref = db.collection('seekers')
            if self.limit:
                seekers_docs = seekers_ref.limit(self.limit).stream()
            else:
                seekers_docs = seekers_ref.stream()
            
            migrated_count = 0
            
            for doc in seekers_docs:
                seeker_data = doc.to_dict()
                email = seeker_data.get('email_or_id') or doc.id
                
                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  対応するユーザーが見つかりません: {email}')
                    )
                    continue
                
                if not self.dry_run:
                    try:
                        with transaction.atomic():
                            seeker_profile = self.create_seeker_profile_from_firestore(
                                user, seeker_data
                            )
                            migrated_count += 1
                            self.stdout.write(f'✅ 求職者プロフィール移行完了: {email}')
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'❌ 求職者プロフィール移行失敗: {email} - {str(e)}')
                        )
                else:
                    migrated_count += 1
                    self.stdout.write(f'📋 [DRY-RUN] 求職者プロフィール: {email}')
            
            self.stdout.write(
                self.style.SUCCESS(f'👤 求職者プロフィール移行完了: {migrated_count}件')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ 求職者プロフィール移行エラー: {str(e)}')
            )
            raise

    def create_seeker_profile_from_firestore(self, user: User, seeker_data: Dict[str, Any]) -> SeekerProfile:
        """Firestoreの求職者データからSeekerProfileを作成"""
        
        # 既存のプロフィールがあれば更新、なければ作成
        seeker_profile, created = SeekerProfile.objects.get_or_create(
            user=user,
            defaults={
                'first_name': seeker_data.get('first_name', ''),
                'last_name': seeker_data.get('last_name', ''),
                'first_name_kana': seeker_data.get('first_name_kana', ''),
                'last_name_kana': seeker_data.get('last_name_kana', ''),
                'birthday': self.parse_date(seeker_data.get('birthday')),
                'prefecture': seeker_data.get('prefecture', ''),
                'faculty': seeker_data.get('faculty', ''),
                'graduation_year': self.safe_int(seeker_data.get('graduation_year')),
                'experience_years': self.safe_int(seeker_data.get('experience_years')),
                'current_salary': seeker_data.get('current_salary', ''),
                'desired_salary': seeker_data.get('desired_salary', ''),
            }
        )
        
        return seeker_profile

    def migrate_resumes(self):
        """Firestoreのresumesコレクションから履歴書データを移行"""
        self.stdout.write('📄 履歴書データの移行を開始...')
        
        try:
            resumes_ref = db.collection('resumes')
            if self.limit:
                resumes_docs = resumes_ref.limit(self.limit).stream()
            else:
                resumes_docs = resumes_ref.stream()
            
            migrated_count = 0
            
            for doc in resumes_docs:
                resume_data = doc.to_dict()
                email = resume_data.get('email') or doc.id
                
                try:
                    user = User.objects.get(email=email)
                except User.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  対応するユーザーが見つかりません: {email}')
                    )
                    continue
                
                if not self.dry_run:
                    try:
                        with transaction.atomic():
                            resume = self.create_resume_from_firestore(user, resume_data)
                            migrated_count += 1
                            self.stdout.write(f'✅ 履歴書移行完了: {email}')
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'❌ 履歴書移行失敗: {email} - {str(e)}')
                        )
                else:
                    migrated_count += 1
                    self.stdout.write(f'📋 [DRY-RUN] 履歴書: {email}')
            
            self.stdout.write(
                self.style.SUCCESS(f'📄 履歴書移行完了: {migrated_count}件')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ 履歴書移行エラー: {str(e)}')
            )
            raise

    def create_resume_from_firestore(self, user: User, resume_data: Dict[str, Any]) -> Resume:
        """Firestoreの履歴書データからResumeを作成"""
        
        # 履歴書基本情報
        resume = Resume.objects.create(
            user=user,
            title='履歴書',  # デフォルトタイトル
            skills=resume_data.get('skill', {}).get('skill', ''),
            self_pr=resume_data.get('profile', {}).get('profile', ''),
            desired_job=resume_data.get('job', {}).get('job', ''),
            desired_industries=resume_data.get('job', {}).get('desired_industries', []),
            desired_locations=resume_data.get('job', {}).get('desired_locations', []),
            extra_data=resume_data,  # 元データを保持
            submitted_at=self.parse_datetime(resume_data.get('submittedAt')),
        )
        
        # 職歴データの移行
        experiences = resume_data.get('experiences', [])
        for i, exp_data in enumerate(experiences):
            if isinstance(exp_data, dict):
                Experience.objects.create(
                    resume=resume,
                    company=exp_data.get('company', ''),
                    period_from=self.parse_date(exp_data.get('periodFrom')),
                    period_to=self.parse_date(exp_data.get('periodTo')),
                    employment_type=self.map_employment_type(exp_data.get('employment_type')),
                    position=exp_data.get('position', ''),
                    business=exp_data.get('business', ''),
                    capital=exp_data.get('capital', ''),
                    team_size=exp_data.get('teamSize', ''),
                    tasks=exp_data.get('tasks', ''),
                    industry=exp_data.get('industry', ''),
                    order=i,
                )
        
        return resume

    # ユーティリティメソッド
    def safe_int(self, value) -> int:
        """安全にintに変換"""
        if value is None:
            return None
        try:
            return int(value)
        except (ValueError, TypeError):
            return None

    def parse_date(self, date_str):
        """日付文字列をDateオブジェクトに変換"""
        if not date_str:
            return None
        
        try:
            if isinstance(date_str, str):
                # "YYYY-MM-DD" or "YYYY-MM" 形式を処理
                if len(date_str) == 7:  # "YYYY-MM"
                    date_str += "-01"
                return datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return None
        
        return None

    def parse_datetime(self, datetime_str):
        """日時文字列をDateTimeオブジェクトに変換"""
        if not datetime_str:
            return datetime.now()
        
        try:
            return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return datetime.now()

    def map_employment_type(self, employment_type):
        """雇用形態のマッピング"""
        mapping = {
            '正社員': 'fulltime',
            '契約社員': 'contract',
            'パート・アルバイト': 'parttime',
            '派遣': 'dispatch',
            'アルバイト': 'parttime',
        }
        return mapping.get(employment_type, 'other')
