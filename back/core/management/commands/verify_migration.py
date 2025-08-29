"""
データ移行の検証とレポート生成コマンド

使用方法:
python manage.py verify_migration

機能:
- Firestoreと新DBのデータ数比較
- データ整合性チェック
- 移行漏れの検出
- 詳細レポートの生成
"""

from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from core.models import User, SeekerProfile, CompanyProfile, Resume, Experience
from core.firebase import db
from tabulate import tabulate
import json
from datetime import datetime


class Command(BaseCommand):
    help = 'データ移行の検証とレポート生成'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            help='レポート出力ファイル名',
            default=None
        )
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='詳細レポートを生成',
        )

    def handle(self, *args, **options):
        self.output_file = options['output']
        self.detailed = options['detailed']
        
        self.stdout.write(
            self.style.SUCCESS('🔍 データ移行検証を開始します...')
        )
        
        report = self.generate_migration_report()
        
        if self.output_file:
            self.save_report_to_file(report)
        
        self.display_report(report)

    def generate_migration_report(self) -> dict:
        """移行レポートを生成"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'firestore_counts': self.get_firestore_counts(),
            'django_counts': self.get_django_counts(),
            'data_integrity': self.check_data_integrity(),
            'missing_data': self.check_missing_data(),
        }
        
        if self.detailed:
            report['detailed_analysis'] = self.detailed_analysis()
        
        return report

    def get_firestore_counts(self) -> dict:
        """Firestoreのデータ数を取得"""
        try:
            counts = {}
            
            # ユーザー数
            users_count = len(list(db.collection('users').stream()))
            counts['users'] = users_count
            
            # 求職者数
            seekers_count = len(list(db.collection('seekers').stream()))
            counts['seekers'] = seekers_count
            
            # 履歴書数
            resumes_count = len(list(db.collection('resumes').stream()))
            counts['resumes'] = resumes_count
            
            # ロール別ユーザー数
            user_docs = db.collection('users').stream()
            role_counts = {'user': 0, 'company': 0, 'other': 0}
            for doc in user_docs:
                data = doc.to_dict()
                role = data.get('role', 'other')
                role_counts[role] = role_counts.get(role, 0) + 1
            
            counts['users_by_role'] = role_counts
            
            return counts
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Firestore データ取得エラー: {str(e)}')
            )
            return {}

    def get_django_counts(self) -> dict:
        """Djangoの新DBのデータ数を取得"""
        return {
            'users': User.objects.count(),
            'seeker_profiles': SeekerProfile.objects.count(),
            'company_profiles': CompanyProfile.objects.count(),
            'resumes': Resume.objects.count(),
            'experiences': Experience.objects.count(),
            'users_by_role': {
                'user': User.objects.filter(role='user').count(),
                'company': User.objects.filter(role='company').count(),
                'admin': User.objects.filter(role='admin').count(),
            }
        }

    def check_data_integrity(self) -> dict:
        """データ整合性をチェック"""
        integrity_issues = []
        
        # ユーザーとプロフィールの関連チェック
        users_without_profiles = User.objects.filter(
            role='user'
        ).exclude(
            seeker_profile__isnull=False
        ).count()
        
        if users_without_profiles > 0:
            integrity_issues.append(
                f'求職者ユーザーでプロフィールが欠如: {users_without_profiles}件'
            )
        
        # 企業ユーザーとプロフィールの関連チェック
        companies_without_profiles = User.objects.filter(
            role='company'
        ).exclude(
            company_profile__isnull=False
        ).count()
        
        if companies_without_profiles > 0:
            integrity_issues.append(
                f'企業ユーザーでプロフィールが欠如: {companies_without_profiles}件'
            )
        
        # 履歴書の職歴チェック
        resumes_without_experiences = Resume.objects.filter(
            experiences__isnull=True
        ).count()
        
        if resumes_without_experiences > 0:
            integrity_issues.append(
                f'職歴がない履歴書: {resumes_without_experiences}件'
            )
        
        # 必須フィールドのチェック
        users_without_email = User.objects.filter(
            Q(email__isnull=True) | Q(email='')
        ).count()
        
        if users_without_email > 0:
            integrity_issues.append(
                f'メールアドレスが欠如しているユーザー: {users_without_email}件'
            )
        
        return {
            'issues_found': len(integrity_issues),
            'issues': integrity_issues,
            'status': 'OK' if len(integrity_issues) == 0 else 'ISSUES_FOUND'
        }

    def check_missing_data(self) -> dict:
        """移行漏れをチェック"""
        missing_data = []
        
        try:
            # Firestoreの全ユーザーメールアドレスを取得
            firestore_emails = set()
            for doc in db.collection('users').stream():
                data = doc.to_dict()
                if data.get('email'):
                    firestore_emails.add(data['email'])
            
            # Django DBの全ユーザーメールアドレスを取得
            django_emails = set(User.objects.values_list('email', flat=True))
            
            # 移行漏れをチェック
            missing_emails = firestore_emails - django_emails
            extra_emails = django_emails - firestore_emails
            
            if missing_emails:
                missing_data.append(f'Firestoreにあるが新DBにないユーザー: {len(missing_emails)}件')
            
            if extra_emails:
                missing_data.append(f'新DBにあるがFirestoreにないユーザー: {len(extra_emails)}件')
            
        except Exception as e:
            missing_data.append(f'比較エラー: {str(e)}')
        
        return {
            'issues_found': len(missing_data),
            'issues': missing_data,
            'status': 'OK' if len(missing_data) == 0 else 'MISSING_DATA_FOUND'
        }

    def detailed_analysis(self) -> dict:
        """詳細分析を実行"""
        return {
            'user_distribution': self.analyze_user_distribution(),
            'resume_completeness': self.analyze_resume_completeness(),
            'data_quality': self.analyze_data_quality(),
        }

    def analyze_user_distribution(self) -> dict:
        """ユーザー分布の分析"""
        return {
            'total_users': User.objects.count(),
            'seekers': User.objects.filter(role='user').count(),
            'companies': User.objects.filter(role='company').count(),
            'premium_users': User.objects.filter(is_premium=True).count(),
            'users_with_phone': User.objects.exclude(phone='').count(),
        }

    def analyze_resume_completeness(self) -> dict:
        """履歴書完成度の分析"""
        total_resumes = Resume.objects.count()
        complete_resumes = Resume.objects.filter(
            skills__isnull=False,
            self_pr__isnull=False,
            experiences__isnull=False
        ).distinct().count()
        
        return {
            'total_resumes': total_resumes,
            'complete_resumes': complete_resumes,
            'completion_rate': round((complete_resumes / total_resumes * 100), 2) if total_resumes > 0 else 0,
            'resumes_with_skills': Resume.objects.exclude(skills='').count(),
            'resumes_with_self_pr': Resume.objects.exclude(self_pr='').count(),
            'resumes_with_experiences': Resume.objects.filter(experiences__isnull=False).distinct().count(),
        }

    def analyze_data_quality(self) -> dict:
        """データ品質の分析"""
        return {
            'users_with_full_name': User.objects.exclude(full_name='').count(),
            'users_with_kana': User.objects.exclude(kana='').count(),
            'seekers_with_birthday': SeekerProfile.objects.filter(birthday__isnull=False).count(),
            'seekers_with_prefecture': SeekerProfile.objects.exclude(prefecture='').count(),
            'companies_with_description': CompanyProfile.objects.exclude(company_description='').count(),
        }

    def display_report(self, report: dict):
        """レポートをコンソールに表示"""
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('📊 データ移行検証レポート'))
        self.stdout.write('=' * 60)
        
        # データ数比較
        self.stdout.write('\n🔢 データ数比較:')
        firestore_counts = report['firestore_counts']
        django_counts = report['django_counts']
        
        comparison_data = [
            ['データ種別', 'Firestore', '新DB', '差分'],
            ['ユーザー', firestore_counts.get('users', 0), django_counts.get('users', 0), 
             django_counts.get('users', 0) - firestore_counts.get('users', 0)],
            ['求職者', firestore_counts.get('seekers', 0), django_counts.get('seeker_profiles', 0),
             django_counts.get('seeker_profiles', 0) - firestore_counts.get('seekers', 0)],
            ['履歴書', firestore_counts.get('resumes', 0), django_counts.get('resumes', 0),
             django_counts.get('resumes', 0) - firestore_counts.get('resumes', 0)],
        ]
        
        self.stdout.write(tabulate(comparison_data, headers='firstrow', tablefmt='grid'))
        
        # データ整合性
        self.stdout.write('\n🔍 データ整合性チェック:')
        integrity = report['data_integrity']
        status_style = self.style.SUCCESS if integrity['status'] == 'OK' else self.style.ERROR
        self.stdout.write(status_style(f"ステータス: {integrity['status']}"))
        
        if integrity['issues']:
            for issue in integrity['issues']:
                self.stdout.write(self.style.WARNING(f"⚠️  {issue}"))
        else:
            self.stdout.write(self.style.SUCCESS("✅ 問題は見つかりませんでした"))
        
        # 移行漏れチェック
        self.stdout.write('\n📝 移行漏れチェック:')
        missing = report['missing_data']
        status_style = self.style.SUCCESS if missing['status'] == 'OK' else self.style.ERROR
        self.stdout.write(status_style(f"ステータス: {missing['status']}"))
        
        if missing['issues']:
            for issue in missing['issues']:
                self.stdout.write(self.style.WARNING(f"⚠️  {issue}"))
        else:
            self.stdout.write(self.style.SUCCESS("✅ 移行漏れは見つかりませんでした"))
        
        # 詳細分析（オプション）
        if self.detailed and 'detailed_analysis' in report:
            self.display_detailed_analysis(report['detailed_analysis'])

    def display_detailed_analysis(self, analysis: dict):
        """詳細分析結果を表示"""
        self.stdout.write('\n📈 詳細分析:')
        
        # ユーザー分布
        user_dist = analysis['user_distribution']
        self.stdout.write('\n👥 ユーザー分布:')
        user_data = [
            ['項目', '件数'],
            ['総ユーザー数', user_dist['total_users']],
            ['求職者', user_dist['seekers']],
            ['企業', user_dist['companies']],
            ['プレミアムユーザー', user_dist['premium_users']],
            ['電話番号登録済み', user_dist['users_with_phone']],
        ]
        self.stdout.write(tabulate(user_data, headers='firstrow', tablefmt='grid'))
        
        # 履歴書完成度
        resume_comp = analysis['resume_completeness']
        self.stdout.write(f'\n📄 履歴書完成度: {resume_comp["completion_rate"]}%')
        resume_data = [
            ['項目', '件数'],
            ['総履歴書数', resume_comp['total_resumes']],
            ['完成履歴書', resume_comp['complete_resumes']],
            ['スキル記載済み', resume_comp['resumes_with_skills']],
            ['自己PR記載済み', resume_comp['resumes_with_self_pr']],
            ['職歴あり', resume_comp['resumes_with_experiences']],
        ]
        self.stdout.write(tabulate(resume_data, headers='firstrow', tablefmt='grid'))

    def save_report_to_file(self, report: dict):
        """レポートをファイルに保存"""
        try:
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2, default=str)
            
            self.stdout.write(
                self.style.SUCCESS(f'📁 レポートを保存しました: {self.output_file}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ レポート保存エラー: {str(e)}')
            )
