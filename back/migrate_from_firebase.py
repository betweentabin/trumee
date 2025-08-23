#!/usr/bin/env python
"""
FirebaseからDjangoへのデータ移行スクリプト
使用方法: python migrate_from_firebase.py
"""

import os
import sys
import json
from datetime import datetime
import django
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Django環境のセットアップ
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'back.settings')
django.setup()

from core.models import (
    User, SeekerProfile, Resume, Experience,
    Application, Scout, Message, Payment
)
from django.db import transaction
from django.utils import timezone

# Firebase初期化
cred = credentials.Certificate('firebase_key.json')
firebase_admin.initialize_app(cred)
db = firestore.client()


class FirebaseToDjangoMigrator:
    def __init__(self):
        self.db = db
        self.user_mapping = {}  # Firebase UID -> Django User ID のマッピング
        self.resume_mapping = {}  # Firebase email -> Django Resume ID のマッピング
        
    def log(self, message):
        """ログ出力"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")
    
    def migrate_all(self):
        """全データの移行"""
        self.log("データ移行を開始します...")
        
        try:
            with transaction.atomic():
                self.migrate_users()
                self.migrate_seekers()
                self.migrate_resumes()
                self.migrate_applications()
                self.migrate_scouts()
                self.migrate_messages()
                self.migrate_payments()
                
            self.log("データ移行が完了しました！")
            self.print_statistics()
            
        except Exception as e:
            self.log(f"エラーが発生しました: {str(e)}")
            raise
    
    def migrate_users(self):
        """ユーザーデータの移行"""
        self.log("ユーザーデータを移行中...")
        
        users_ref = self.db.collection('users')
        users = users_ref.stream()
        
        count = 0
        for doc in users:
            user_data = doc.to_dict()
            email = user_data.get('email')
            
            if not email:
                continue
            
            # 既存ユーザーチェック
            if User.objects.filter(email=email).exists():
                user = User.objects.get(email=email)
                self.user_mapping[doc.id] = user.id
                self.log(f"  既存ユーザーをスキップ: {email}")
                continue
            
            try:
                # 新規ユーザー作成
                user = User.objects.create_user(
                    username=email.split('@')[0],
                    email=email,
                    password='temp_password_' + doc.id[:8],  # 仮パスワード
                    role=user_data.get('role', 'user'),
                    full_name=user_data.get('full_name', ''),
                    kana=user_data.get('kana', ''),
                    phone=user_data.get('phone', ''),
                    gender=self._convert_gender(user_data.get('gender')),
                    company_name=user_data.get('company_name', ''),
                    capital=user_data.get('capital', ''),
                    company_url=user_data.get('url', ''),
                )
                
                # サブスクリプション情報
                if user_data.get('subscriptions', {}).get('premiumPlan'):
                    user.is_premium = True
                    user.save()
                
                self.user_mapping[doc.id] = user.id
                count += 1
                self.log(f"  ユーザー作成: {email}")
                
            except Exception as e:
                self.log(f"  エラー（ユーザー {email}）: {str(e)}")
        
        self.log(f"  {count}件のユーザーを移行しました")
    
    def migrate_seekers(self):
        """求職者詳細データの移行"""
        self.log("求職者プロフィールを移行中...")
        
        seekers_ref = self.db.collection('seekers')
        seekers = seekers_ref.stream()
        
        count = 0
        for doc in seekers:
            seeker_data = doc.to_dict()
            email = seeker_data.get('email_or_id')
            
            if not email:
                continue
            
            try:
                user = User.objects.filter(email=email).first()
                if not user or user.role != 'user':
                    continue
                
                # 既存プロフィールチェック
                if hasattr(user, 'seeker_profile'):
                    self.log(f"  既存プロフィールをスキップ: {email}")
                    continue
                
                # プロフィール作成
                profile = SeekerProfile.objects.create(
                    user=user,
                    first_name=seeker_data.get('first_name', ''),
                    last_name=seeker_data.get('last_name', ''),
                    first_name_kana=seeker_data.get('first_name_kana', ''),
                    last_name_kana=seeker_data.get('last_name_kana', ''),
                    birthday=self._parse_date(seeker_data.get('birthday')),
                    prefecture=seeker_data.get('prefecture', ''),
                    faculty=seeker_data.get('faculty', ''),
                    graduation_year=seeker_data.get('graduation_year'),
                    experience_years=seeker_data.get('experience_years', 0),
                    current_salary=seeker_data.get('current_salary', ''),
                    desired_salary=seeker_data.get('desired_salary', ''),
                )
                
                count += 1
                self.log(f"  プロフィール作成: {email}")
                
            except Exception as e:
                self.log(f"  エラー（プロフィール {email}）: {str(e)}")
        
        self.log(f"  {count}件のプロフィールを移行しました")
    
    def migrate_resumes(self):
        """履歴書データの移行"""
        self.log("履歴書データを移行中...")
        
        resumes_ref = self.db.collection('resumes')
        resumes = resumes_ref.stream()
        
        count = 0
        exp_count = 0
        
        for doc in resumes:
            resume_data = doc.to_dict()
            email = resume_data.get('email')
            
            if not email:
                continue
            
            try:
                user = User.objects.filter(email=email).first()
                if not user:
                    continue
                
                # 履歴書作成
                resume = Resume.objects.create(
                    user=user,
                    submitted_at=self._parse_datetime(resume_data.get('submittedAt')),
                    desired_job=resume_data.get('job', {}).get('job', ''),
                    desired_industries=resume_data.get('job', {}).get('desired_industries', []),
                    desired_locations=resume_data.get('job', {}).get('desired_locations', []),
                    skills=resume_data.get('skill', {}).get('skill', ''),
                    self_pr=resume_data.get('profile', {}).get('profile', ''),
                )
                
                self.resume_mapping[email] = resume.id
                
                # 職歴データ
                experiences = resume_data.get('experiences', [])
                for i, exp_data in enumerate(experiences):
                    try:
                        Experience.objects.create(
                            resume=resume,
                            company=exp_data.get('company', ''),
                            period_from=self._parse_date(exp_data.get('periodFrom')),
                            period_to=self._parse_date(exp_data.get('periodTo')),
                            employment_type=self._convert_employment_type(exp_data.get('employment_type')),
                            position=exp_data.get('position', ''),
                            business=exp_data.get('business', ''),
                            capital=exp_data.get('capital', ''),
                            team_size=exp_data.get('teamSize', ''),
                            tasks=exp_data.get('tasks', ''),
                            industry=exp_data.get('industry', ''),
                            order=i,
                        )
                        exp_count += 1
                    except Exception as e:
                        self.log(f"    職歴エラー: {str(e)}")
                
                count += 1
                self.log(f"  履歴書作成: {email} （職歴{len(experiences)}件）")
                
            except Exception as e:
                self.log(f"  エラー（履歴書 {email}）: {str(e)}")
        
        self.log(f"  {count}件の履歴書、{exp_count}件の職歴を移行しました")
    
    def migrate_applications(self):
        """応募データの移行"""
        self.log("応募データを移行中...")
        
        count = 0
        
        # users コレクションから apply_list を取得
        users_ref = self.db.collection('users').where('role', '==', 'company')
        companies = users_ref.stream()
        
        for company_doc in companies:
            company_data = company_doc.to_dict()
            company_email = company_data.get('email')
            apply_list = company_data.get('apply_list', [])
            
            if not company_email or not apply_list:
                continue
            
            try:
                company_user = User.objects.filter(email=company_email).first()
                if not company_user:
                    continue
                
                for applicant_email in apply_list:
                    try:
                        applicant = User.objects.filter(email=applicant_email).first()
                        if not applicant:
                            continue
                        
                        # 重複チェック
                        if Application.objects.filter(
                            applicant=applicant,
                            company=company_user
                        ).exists():
                            continue
                        
                        Application.objects.create(
                            applicant=applicant,
                            company=company_user,
                            resume_id=self.resume_mapping.get(applicant_email),
                            status='pending',
                        )
                        count += 1
                        
                    except Exception as e:
                        self.log(f"    応募エラー: {str(e)}")
                
            except Exception as e:
                self.log(f"  エラー（応募 {company_email}）: {str(e)}")
        
        self.log(f"  {count}件の応募を移行しました")
    
    def migrate_scouts(self):
        """スカウトデータの移行"""
        self.log("スカウトデータを移行中...")
        
        count = 0
        
        # users コレクションから scout_list を取得
        users_ref = self.db.collection('users').where('role', '==', 'user')
        seekers = users_ref.stream()
        
        for seeker_doc in seekers:
            seeker_data = seeker_doc.to_dict()
            seeker_email = seeker_data.get('email')
            scout_list = seeker_data.get('scout_list', [])
            
            if not seeker_email or not scout_list:
                continue
            
            try:
                seeker_user = User.objects.filter(email=seeker_email).first()
                if not seeker_user:
                    continue
                
                for company_email in scout_list:
                    try:
                        company = User.objects.filter(email=company_email).first()
                        if not company:
                            continue
                        
                        # 重複チェック
                        if Scout.objects.filter(
                            company=company,
                            seeker=seeker_user
                        ).exists():
                            continue
                        
                        Scout.objects.create(
                            company=company,
                            seeker=seeker_user,
                            scout_message='Firebaseから移行されたスカウト',
                            status='sent',
                        )
                        count += 1
                        
                    except Exception as e:
                        self.log(f"    スカウトエラー: {str(e)}")
                
            except Exception as e:
                self.log(f"  エラー（スカウト {seeker_email}）: {str(e)}")
        
        self.log(f"  {count}件のスカウトを移行しました")
    
    def migrate_messages(self):
        """メッセージデータの移行"""
        self.log("メッセージデータを移行中...")
        
        messages_ref = self.db.collection('messages')
        messages = messages_ref.stream()
        
        count = 0
        for doc in messages:
            msg_data = doc.to_dict()
            
            try:
                sender_email = msg_data.get('sender')
                receiver_email = msg_data.get('receiver')
                
                if receiver_email == 'admin':
                    continue  # 管理者宛メッセージはスキップ
                
                sender = User.objects.filter(email=sender_email).first()
                receiver = User.objects.filter(email=receiver_email).first()
                
                if not sender or not receiver:
                    continue
                
                content = msg_data.get('content', {})
                Message.objects.create(
                    sender=sender,
                    receiver=receiver,
                    subject=content.get('subject', ''),
                    content=content.get('message', ''),
                    is_read=msg_data.get('read', False),
                )
                count += 1
                
            except Exception as e:
                self.log(f"  エラー（メッセージ）: {str(e)}")
        
        self.log(f"  {count}件のメッセージを移行しました")
    
    def migrate_payments(self):
        """支払い情報の移行"""
        self.log("支払い情報を移行中...")
        
        payments_ref = self.db.collection('payments')
        payments = payments_ref.stream()
        
        count = 0
        for doc in payments:
            payment_data = doc.to_dict()
            email = payment_data.get('email')
            
            if not email:
                continue
            
            try:
                user = User.objects.filter(email=email).first()
                if not user:
                    continue
                
                payment_method = payment_data.get('paymentMethod')
                
                if payment_method == 'credit':
                    Payment.objects.create(
                        user=user,
                        payment_method='credit',
                        card_last4=payment_data.get('cardNumber', '')[-4:] if payment_data.get('cardNumber') else '',
                        # カード番号全体は保存しない（セキュリティ）
                    )
                elif payment_method == 'bank':
                    Payment.objects.create(
                        user=user,
                        payment_method='bank',
                        bank_name=payment_data.get('bankName', ''),
                        branch_name=payment_data.get('branchName', ''),
                        account_type=payment_data.get('accountType', ''),
                        account_holder=payment_data.get('accountHolder', ''),
                    )
                
                count += 1
                
            except Exception as e:
                self.log(f"  エラー（支払い {email}）: {str(e)}")
        
        self.log(f"  {count}件の支払い情報を移行しました")
    
    def _convert_gender(self, gender):
        """性別の変換"""
        if gender == '男性':
            return 'male'
        elif gender == '女性':
            return 'female'
        else:
            return 'other'
    
    def _convert_employment_type(self, emp_type):
        """雇用形態の変換"""
        mapping = {
            '正社員': 'fulltime',
            '契約社員': 'contract',
            'パート': 'parttime',
            'アルバイト': 'parttime',
            '派遣': 'dispatch',
        }
        return mapping.get(emp_type, 'other')
    
    def _parse_date(self, date_str):
        """日付文字列のパース"""
        if not date_str:
            return None
        try:
            if date_str == '現在':
                return None
            # YYYY-MM-DD or YYYY-MM 形式を想定
            if len(date_str) == 7:  # YYYY-MM
                date_str += '-01'
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except:
            return None
    
    def _parse_datetime(self, datetime_str):
        """日時文字列のパース"""
        if not datetime_str:
            return timezone.now()
        try:
            # ISO形式を想定
            return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        except:
            return timezone.now()
    
    def print_statistics(self):
        """移行統計の出力"""
        self.log("\n=== 移行統計 ===")
        self.log(f"ユーザー数: {User.objects.count()}")
        self.log(f"求職者プロフィール数: {SeekerProfile.objects.count()}")
        self.log(f"履歴書数: {Resume.objects.count()}")
        self.log(f"職歴数: {Experience.objects.count()}")
        self.log(f"応募数: {Application.objects.count()}")
        self.log(f"スカウト数: {Scout.objects.count()}")
        self.log(f"メッセージ数: {Message.objects.count()}")
        self.log(f"支払い情報数: {Payment.objects.count()}")


if __name__ == '__main__':
    migrator = FirebaseToDjangoMigrator()
    
    print("=== Firebase から Django へのデータ移行 ===")
    print("警告: このスクリプトは既存のDjangoデータベースにデータを追加します。")
    print("重複データのチェックは行いますが、バックアップを取ることをお勧めします。")
    
    response = input("\n続行しますか？ (yes/no): ")
    if response.lower() == 'yes':
        migrator.migrate_all()
    else:
        print("移行をキャンセルしました。")