# Resume Truemee - Django完全移行開発案（SQLite版）

## 📋 エグゼクティブサマリー

FirebaseベースのシステムをDjango + SQLiteベースのシステムに完全移行し、将来的な機械学習統合を可能にする開発案です。

### 移行の主要メリット
- **データ一元管理**: Django内で全データを管理し、複雑性を削減
- **機械学習対応**: scikit-learn、TensorFlowなどとの直接統合が可能
- **コスト削減**: Firebase利用料金が不要（月額数万円の削減見込み）
- **柔軟性向上**: SQLによる複雑なクエリやデータ分析が可能
- **シンプルな運用**: SQLiteは組み込みDBで運用が簡単、中規模サービスには十分

## 🏗 アーキテクチャ設計

### 現在のアーキテクチャ
```
Frontend (Next.js) → Firebase Auth → Firestore
                   → Django API → （部分的にFirestore参照）
```

### 新アーキテクチャ
```
Frontend (Next.js) → Django REST API → Django ORM → SQLite
                   → Django Auth     → ML Pipeline → 推薦システム
                                                    → スコアリング
```

## 📊 データベース設計（Django Models）

### 1. 認証・ユーザー管理

```python
# core/models.py

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
import uuid

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

class User(AbstractBaseUser):
    USER_TYPES = (
        ('seeker', '求職者'),
        ('company', '企業'),
        ('admin', '管理者'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPES)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # 機械学習用メタデータ
    last_activity = models.DateTimeField(null=True, blank=True)
    activity_score = models.FloatField(default=0.0)  # ユーザー活性度スコア
    
    USERNAME_FIELD = 'email'
    objects = CustomUserManager()
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email', 'user_type']),
            models.Index(fields=['created_at']),
        ]
```

### 2. 求職者プロフィール

```python
class SeekerProfile(models.Model):
    GENDER_CHOICES = (
        ('male', '男性'),
        ('female', '女性'),
        ('other', 'その他'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seeker_profile')
    
    # 基本情報
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    first_name_kana = models.CharField(max_length=50)
    last_name_kana = models.CharField(max_length=50)
    birthday = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=20)
    
    # 住所情報
    prefecture = models.CharField(max_length=10)
    city = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    
    # 学歴
    university = models.CharField(max_length=100, blank=True)
    faculty = models.CharField(max_length=100, blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)
    
    # キャリア情報
    experience_years = models.IntegerField(default=0)
    current_salary = models.IntegerField(null=True, blank=True)  # 万円単位
    desired_salary = models.IntegerField(null=True, blank=True)
    
    # 機械学習用特徴量
    profile_completeness = models.FloatField(default=0.0)  # プロフィール充実度
    skill_level = models.IntegerField(default=1)  # 1-5のスキルレベル
    
    class Meta:
        db_table = 'seeker_profiles'
        indexes = [
            models.Index(fields=['prefecture']),
            models.Index(fields=['experience_years']),
            models.Index(fields=['current_salary']),
        ]
```

### 3. 企業プロフィール

```python
class CompanyProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile')
    
    # 企業情報
    company_name = models.CharField(max_length=200)
    company_name_kana = models.CharField(max_length=200, blank=True)
    
    # 担当者情報
    contact_first_name = models.CharField(max_length=50)
    contact_last_name = models.CharField(max_length=50)
    contact_phone = models.CharField(max_length=20)
    department = models.CharField(max_length=100, blank=True)
    
    # 企業詳細
    capital = models.BigIntegerField(null=True, blank=True)  # 資本金（円）
    employees_count = models.IntegerField(null=True, blank=True)
    founded_year = models.IntegerField(null=True, blank=True)
    url = models.URLField(blank=True)
    industry = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    # サブスクリプション
    is_premium = models.BooleanField(default=False)
    premium_expires_at = models.DateTimeField(null=True, blank=True)
    monthly_scout_limit = models.IntegerField(default=10)
    scouts_used_this_month = models.IntegerField(default=0)
    
    # 機械学習用データ
    hiring_success_rate = models.FloatField(default=0.0)
    average_response_time = models.FloatField(default=0.0)  # 時間単位
    
    class Meta:
        db_table = 'company_profiles'
        indexes = [
            models.Index(fields=['industry']),
            models.Index(fields=['is_premium']),
        ]
```

### 4. 履歴書・職務経歴書

```python
class Resume(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='resume')
    
    # 自己PR
    self_introduction = models.TextField(blank=True)
    
    # 希望条件
    desired_job_types = models.JSONField(default=list)  # 職種リスト
    desired_industries = models.JSONField(default=list)  # 業界リスト
    desired_locations = models.JSONField(default=list)  # 勤務地リスト
    
    # ステータス
    is_complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    # AI分析結果（機械学習で使用）
    keyword_vectors = models.JSONField(default=dict)  # TF-IDFベクトル
    skill_scores = models.JSONField(default=dict)  # スキル別スコア
    match_score = models.FloatField(default=0.0)  # マッチング適性スコア
    
    class Meta:
        db_table = 'resumes'

class WorkExperience(models.Model):
    EMPLOYMENT_TYPES = (
        ('full_time', '正社員'),
        ('contract', '契約社員'),
        ('part_time', 'パート・アルバイト'),
        ('dispatch', '派遣社員'),
        ('freelance', 'フリーランス'),
    )
    
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='experiences')
    
    company_name = models.CharField(max_length=200)
    position = models.CharField(max_length=100)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES)
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)  # nullは現職
    is_current = models.BooleanField(default=False)
    
    department = models.CharField(max_length=100, blank=True)
    team_size = models.IntegerField(null=True, blank=True)
    
    # 業務内容
    description = models.TextField()
    achievements = models.TextField(blank=True)
    
    # 使用技術・ツール
    skills_used = models.JSONField(default=list)
    
    class Meta:
        db_table = 'work_experiences'
        ordering = ['-start_date']

class Skill(models.Model):
    SKILL_LEVELS = (
        (1, '初級'),
        (2, '中級'),
        (3, '上級'),
        (4, 'エキスパート'),
        (5, 'マスター'),
    )
    
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='skills')
    
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)  # プログラミング、ツール、資格など
    level = models.IntegerField(choices=SKILL_LEVELS)
    years_of_experience = models.FloatField(default=0)
    
    # 機械学習用
    demand_score = models.FloatField(default=0.0)  # 市場での需要スコア
    
    class Meta:
        db_table = 'skills'
        unique_together = ['resume', 'name']
```

### 5. マッチング機能

```python
class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('pending', '選考中'),
        ('reviewing', '書類選考中'),
        ('interview', '面接段階'),
        ('accepted', '内定'),
        ('rejected', '不採用'),
        ('withdrawn', '辞退'),
    )
    
    seeker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    company = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_applications')
    
    applied_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    status_updated_at = models.DateTimeField(auto_now=True)
    
    # メッセージ
    cover_letter = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # 機械学習用マッチングスコア
    compatibility_score = models.FloatField(default=0.0)  # 0-100のスコア
    predicted_success_rate = models.FloatField(default=0.0)  # 成功確率
    
    class Meta:
        db_table = 'job_applications'
        unique_together = ['seeker', 'company']
        indexes = [
            models.Index(fields=['status', 'applied_at']),
        ]

class Scout(models.Model):
    STATUS_CHOICES = (
        ('sent', '送信済み'),
        ('viewed', '既読'),
        ('interested', '興味あり'),
        ('not_interested', '興味なし'),
        ('expired', '期限切れ'),
    )
    
    company = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_scouts')
    seeker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_scouts')
    
    sent_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    message = models.TextField()
    
    # スカウト理由（機械学習で生成）
    match_reasons = models.JSONField(default=list)  # マッチング理由のリスト
    ai_score = models.FloatField(default=0.0)  # AIによる推奨スコア
    
    class Meta:
        db_table = 'scouts'
        unique_together = ['company', 'seeker']
        indexes = [
            models.Index(fields=['status', 'sent_at']),
            models.Index(fields=['expires_at']),
        ]
```

### 6. 決済・サブスクリプション

```python
class Subscription(models.Model):
    PLAN_TYPES = (
        ('free', '無料プラン'),
        ('basic', 'ベーシック'),
        ('premium', 'プレミアム'),
        ('enterprise', 'エンタープライズ'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default='free')
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # 利用制限
    monthly_scout_limit = models.IntegerField(default=10)
    can_view_full_profile = models.BooleanField(default=False)
    can_use_ai_matching = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'subscriptions'

class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='JPY')
    
    stripe_payment_intent_id = models.CharField(max_length=255)
    status = models.CharField(max_length=20)
    
    paid_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-paid_at']
```

### 7. 機械学習用データモデル

```python
class MLFeatureStore(models.Model):
    """機械学習用の特徴量ストア"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ml_features')
    
    # ユーザー行動特徴
    login_frequency = models.FloatField(default=0.0)  # 月間ログイン回数
    profile_views = models.IntegerField(default=0)  # プロフィール閲覧数
    application_rate = models.FloatField(default=0.0)  # 応募率
    response_rate = models.FloatField(default=0.0)  # 返信率
    
    # テキスト特徴（事前計算済み）
    resume_embedding = models.JSONField(default=list)  # Doc2Vec/BERT埋め込み
    skill_vector = models.JSONField(default=list)  # スキルのone-hotエンコーディング
    
    # 推薦システム用
    preference_vector = models.JSONField(default=list)  # ユーザー嗜好ベクトル
    interaction_history = models.JSONField(default=list)  # 過去のインタラクション
    
    last_calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ml_feature_store'

class MatchingResult(models.Model):
    """マッチング結果の記録（学習用）"""
    seeker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matching_results_as_seeker')
    company = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matching_results_as_company')
    
    score = models.FloatField()  # マッチングスコア
    algorithm_version = models.CharField(max_length=20)  # 使用したアルゴリズムのバージョン
    
    # 結果
    was_applied = models.BooleanField(default=False)
    was_hired = models.BooleanField(default=False)
    
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'matching_results'
        indexes = [
            models.Index(fields=['score', 'calculated_at']),
        ]
```

## 🔄 データ移行計画

### フェーズ1: 準備段階（1週間）

#### 1.1 環境構築
```bash
# requirements.txt
Django==5.0.6
djangorestframework==3.15.2
django-cors-headers==4.4.0
python-decouple==3.8  # 環境変数管理
celery==5.3.4  # 非同期タスク
redis==5.0.1  # キャッシュ
pandas==2.1.4  # データ処理
scikit-learn==1.3.2  # 機械学習
numpy==1.24.3  # 数値計算
django-extensions==3.2.3  # 開発ツール
```

#### 1.2 Django設定
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        # SQLite最適化設定
        'OPTIONS': {
            'init_command': (
                "PRAGMA journal_mode=WAL;"  # Write-Ahead Loggingで高速化
                "PRAGMA synchronous=NORMAL;"  # 同期モード調整
                "PRAGMA cache_size=10000;"  # キャッシュサイズ拡大
                "PRAGMA temp_store=MEMORY;"  # 一時データをメモリに
            ),
        }
    }
}

# 機械学習設定
ML_CONFIG = {
    'MODEL_PATH': BASE_DIR / 'ml_models',
    'FEATURE_EXTRACTION_INTERVAL': 3600,  # 1時間ごと
    'MATCHING_ALGORITHM': 'collaborative_filtering',
}
```

### フェーズ2: データ移行（1-2週間）

#### 2.1 移行スクリプト
```python
# management/commands/migrate_from_firebase.py
import firebase_admin
from firebase_admin import firestore
from django.core.management.base import BaseCommand
from core.models import User, SeekerProfile, CompanyProfile, Resume

class Command(BaseCommand):
    def handle(self, *args, **options):
        db = firestore.client()
        
        # ユーザー移行
        users_ref = db.collection('users')
        for doc in users_ref.stream():
            data = doc.to_dict()
            user = User.objects.create(
                email=data['email'],
                user_type='seeker' if data['role'] == 'user' else 'company'
            )
            
            if data['role'] == 'user':
                # 求職者プロフィール作成
                SeekerProfile.objects.create(
                    user=user,
                    first_name=data.get('full_name', '').split()[0],
                    last_name=data.get('full_name', '').split()[-1],
                    # ... その他のフィールド
                )
            else:
                # 企業プロフィール作成
                CompanyProfile.objects.create(
                    user=user,
                    company_name=data.get('company_name', ''),
                    # ... その他のフィールド
                )
```

#### 2.2 段階的移行戦略

1. **読み取り専用期間**（1週間）
   - Django DBにデータをコピー
   - 読み取りはDjango、書き込みはFirebase

2. **デュアルライト期間**（1週間）
   - 両方のDBに書き込み
   - 整合性チェック

3. **完全移行**
   - Firebaseを切り離し
   - Django DBのみ使用

### フェーズ3: 機械学習統合（2週間）

#### 3.1 レコメンデーションエンジン
```python
# ml/recommendation_engine.py
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.ensemble import RandomForestClassifier

class RecommendationEngine:
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000)
        self.matching_model = RandomForestClassifier(n_estimators=100)
    
    def calculate_match_score(self, seeker_id, company_id):
        """求職者と企業のマッチングスコアを計算"""
        seeker = User.objects.get(id=seeker_id)
        company = User.objects.get(id=company_id)
        
        # 特徴量抽出
        seeker_features = self.extract_seeker_features(seeker)
        company_features = self.extract_company_features(company)
        
        # スコア計算
        score = cosine_similarity(
            seeker_features.reshape(1, -1),
            company_features.reshape(1, -1)
        )[0][0]
        
        return score * 100  # 0-100のスコアに変換
    
    def recommend_jobs_for_seeker(self, seeker_id, limit=10):
        """求職者に仕事を推薦"""
        seeker = User.objects.get(id=seeker_id)
        companies = User.objects.filter(user_type='company', is_active=True)
        
        recommendations = []
        for company in companies:
            score = self.calculate_match_score(seeker_id, company.id)
            recommendations.append({
                'company': company,
                'score': score,
                'reasons': self.explain_match(seeker, company)
            })
        
        # スコアでソート
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:limit]
```

#### 3.2 スキル予測モデル
```python
# ml/skill_predictor.py
from transformers import BertTokenizer, BertModel
import torch

class SkillPredictor:
    def __init__(self):
        self.tokenizer = BertTokenizer.from_pretrained('bert-base-japanese')
        self.model = BertModel.from_pretrained('bert-base-japanese')
    
    def predict_required_skills(self, job_description):
        """職務内容から必要なスキルを予測"""
        inputs = self.tokenizer(job_description, return_tensors='pt', max_length=512, truncation=True)
        outputs = self.model(**inputs)
        
        # 埋め込みベクトルから関連スキルを予測
        embeddings = outputs.last_hidden_state.mean(dim=1)
        predicted_skills = self.skill_classifier(embeddings)
        
        return predicted_skills
    
    def calculate_skill_gap(self, seeker_skills, required_skills):
        """スキルギャップを分析"""
        missing_skills = set(required_skills) - set(seeker_skills)
        matching_skills = set(required_skills) & set(seeker_skills)
        
        return {
            'match_rate': len(matching_skills) / len(required_skills),
            'missing_skills': list(missing_skills),
            'recommendations': self.get_learning_recommendations(missing_skills)
        }
```

### フェーズ4: API実装（1週間）

#### 4.1 新しいAPIエンドポイント
```python
# api/views.py
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response

class UserViewSet(ModelViewSet):
    @action(detail=True, methods=['get'])
    def recommendations(self, request, pk=None):
        """ユーザーへの推薦を取得"""
        user = self.get_object()
        engine = RecommendationEngine()
        
        if user.user_type == 'seeker':
            recommendations = engine.recommend_jobs_for_seeker(user.id)
        else:
            recommendations = engine.recommend_seekers_for_company(user.id)
        
        serializer = RecommendationSerializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def calculate_compatibility(self, request, pk=None):
        """特定の相手との相性を計算"""
        user = self.get_object()
        target_id = request.data.get('target_id')
        
        score = RecommendationEngine().calculate_match_score(user.id, target_id)
        
        return Response({
            'score': score,
            'interpretation': self.interpret_score(score)
        })
```

## 📈 機械学習パイプライン

### 1. データ収集・前処理
```python
# ml/pipeline.py
class MLPipeline:
    def collect_training_data(self):
        """学習用データの収集"""
        # 成功した採用のデータ
        successful_matches = JobApplication.objects.filter(
            status='accepted'
        ).select_related('seeker', 'company')
        
        # 特徴量とラベルの作成
        X = []
        y = []
        
        for match in successful_matches:
            features = self.extract_features(match)
            X.append(features)
            y.append(1)  # 成功
        
        # 失敗例も追加
        failed_matches = JobApplication.objects.filter(
            status='rejected'
        ).select_related('seeker', 'company')[:len(successful_matches)]
        
        for match in failed_matches:
            features = self.extract_features(match)
            X.append(features)
            y.append(0)  # 失敗
        
        return np.array(X), np.array(y)
```

### 2. モデル学習・更新
```python
# Celeryタスクとして定期実行
@shared_task
def update_ml_models():
    """定期的にMLモデルを更新"""
    pipeline = MLPipeline()
    X, y = pipeline.collect_training_data()
    
    # モデル学習
    model = RandomForestClassifier(n_estimators=200)
    model.fit(X, y)
    
    # モデル保存
    joblib.dump(model, 'ml_models/matching_model.pkl')
    
    # パフォーマンス記録
    ModelPerformance.objects.create(
        model_name='matching_model',
        accuracy=model.score(X_test, y_test),
        version=datetime.now().strftime('%Y%m%d_%H%M%S')
    )
```

## 🚀 実装スケジュール

### 全体スケジュール（6-8週間）

| フェーズ | 期間 | タスク | 成果物 |
|---------|------|--------|--------|
| **Phase 1** | 1週間 | 環境構築・Django設定 | 開発環境完成 |
| **Phase 2** | 2週間 | モデル実装・マイグレーション | Djangoモデル完成 |
| **Phase 3** | 1-2週間 | Firebase→Djangoデータ移行 | データ移行完了 |
| **Phase 4** | 1週間 | 認証システム移行 | Django認証実装 |
| **Phase 5** | 2週間 | 機械学習統合 | MLパイプライン完成 |
| **Phase 6** | 1週間 | テスト・最適化 | 本番環境準備完了 |

### 詳細タスク

#### Week 1: 基盤構築
- [ ] Django プロジェクト設定
- [ ] PostgreSQL セットアップ
- [ ] モデル定義（User, Profile）
- [ ] 管理画面設定

#### Week 2-3: コア機能実装
- [ ] 認証システム実装
- [ ] 履歴書モデル実装
- [ ] マッチングモデル実装
- [ ] API基本実装

#### Week 4: データ移行
- [ ] 移行スクリプト作成
- [ ] テストデータ移行
- [ ] データ検証
- [ ] 本番データ移行

#### Week 5-6: 機械学習実装
- [ ] 特徴量エンジニアリング
- [ ] レコメンデーションエンジン
- [ ] スコアリングシステム
- [ ] A/Bテスト基盤

#### Week 7-8: 統合・最適化
- [ ] フロントエンド統合
- [ ] パフォーマンス最適化
- [ ] セキュリティ強化
- [ ] デプロイ準備

## 💰 コスト比較

### 現在のコスト（Firebase）
- Firestore: 月額 ¥15,000〜30,000
- Firebase Auth: 月額 ¥5,000〜10,000
- Firebase Storage: 月額 ¥3,000〜5,000
- **合計: 月額 ¥23,000〜45,000**

### 移行後のコスト（Django + SQLite）
- SQLite: **¥0**（組み込みDB、追加費用なし）
- EC2/VPS: 月額 ¥5,000〜15,000（中規模インスタンス）
- S3 (メディア): 月額 ¥1,000〜3,000
- バックアップ: 月額 ¥500〜1,000
- **合計: 月額 ¥6,500〜19,000**

### 削減効果
- **月額 ¥16,500〜26,000 のコスト削減**
- **年間 ¥198,000〜312,000 の削減**
- **初期投資回収期間: 2-3ヶ月**

## 🎯 成功指標（KPI）

### 技術的指標
- API レスポンスタイム: < 200ms (95パーセンタイル)
- データベースクエリ時間: < 50ms
- 機械学習予測精度: > 80%
- システム稼働率: > 99.9%

### ビジネス指標
- マッチング成功率: 20%向上
- ユーザーエンゲージメント: 30%向上
- 運用コスト: 30%削減
- 開発速度: 2倍向上

## ⚠️ リスクと対策

### リスク1: データ移行時のダウンタイム
**対策**: 
- Blue-Greenデプロイメント
- 段階的移行
- ロールバック計画

### リスク2: SQLiteのスケーラビリティ
**対策**:
- Write-Ahead Logging (WAL)モード使用
- 適切なインデックス設計
- 読み取り専用のレプリカ作成
- 将来的にPostgreSQLへの移行パスを確保
- キャッシュ戦略（Redis）でDB負荷軽減

### リスク3: セキュリティ脆弱性
**対策**:
- Django Security Middleware
- 定期的なセキュリティ監査
- WAF導入

## 📝 まとめ

### 推奨事項
1. **段階的移行**: 一度に全て移行せず、機能ごとに段階的に移行
2. **並行運用期間**: 1-2週間の並行運用で安定性確認
3. **機械学習は後回し**: まず基本機能を移行し、その後ML機能を追加
4. **テスト重視**: 各段階で十分なテストを実施

### 期待される成果
- **開発効率向上**: Django内で完結することで開発速度2倍
- **コスト削減**: 年間20-30万円の削減（SQLite利用による大幅削減）
- **機能拡張性**: 機械学習統合により高度な機能実装可能
- **保守性向上**: 単一システムによる保守の簡素化
- **運用簡素化**: SQLiteは管理不要で運用負荷が最小

### 次のアクション
1. この開発案の承認取得
2. 開発チーム編成
3. 開発環境構築開始
4. Phase 1の着手

---

*作成日: 2025年8月17日*
*作成者: Claude Code*