from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid


class User(AbstractUser):
    """カスタムユーザーモデル（求職者・企業共通）"""
    ROLE_CHOICES = [
        ('user', '求職者'),
        ('company', '企業'),
    ]
    
    GENDER_CHOICES = [
        ('male', '男性'),
        ('female', '女性'),
        ('other', 'その他'),
    ]
    
    # 基本情報
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, db_index=True)
    
    # 求職者用フィールド
    full_name = models.CharField(max_length=100, blank=True)
    kana = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    
    # 企業用フィールド
    company_name = models.CharField(max_length=200, blank=True, db_index=True)
    capital = models.BigIntegerField(null=True, blank=True)
    company_url = models.URLField(blank=True)
    campaign_code = models.CharField(max_length=50, blank=True)
    employee_count = models.IntegerField(null=True, blank=True)
    founded_year = models.IntegerField(null=True, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    company_description = models.TextField(blank=True)
    headquarters = models.CharField(max_length=200, blank=True)
    
    # 共通フィールド
    phone = models.CharField(max_length=20, blank=True)
    is_premium = models.BooleanField(default=False)
    premium_expiry = models.DateTimeField(null=True, blank=True)
    
    # メタデータ
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email', 'role']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        if self.role == 'company':
            return f"{self.company_name} ({self.email})"
        return f"{self.full_name} ({self.email})"


class SeekerProfile(models.Model):
    """求職者詳細プロフィール"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seeker_profile')
    
    # 個人情報
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    first_name_kana = models.CharField(max_length=50)
    last_name_kana = models.CharField(max_length=50)
    birthday = models.DateField(null=True, blank=True)
    prefecture = models.CharField(max_length=20, blank=True)
    
    # 学歴情報
    faculty = models.CharField(max_length=100, blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)
    
    # キャリア情報
    experience_years = models.IntegerField(default=0)
    current_salary = models.CharField(max_length=50, blank=True)
    desired_salary = models.CharField(max_length=50, blank=True)
    
    # 機械学習用フィールド
    skill_vector = models.JSONField(default=list, blank=True)  # スキルの特徴ベクトル
    profile_embeddings = models.JSONField(default=dict, blank=True)  # プロフィールの埋め込み表現
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seeker_profiles'
    
    def __str__(self):
        return f"{self.last_name} {self.first_name}"


class Resume(models.Model):
    """履歴書・職務経歴書"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    submitted_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    
    # 希望職種
    desired_job = models.CharField(max_length=100, blank=True)
    desired_industries = models.JSONField(default=list, blank=True)
    desired_locations = models.JSONField(default=list, blank=True)
    
    # スキル
    skills = models.TextField(blank=True)
    
    # 自己PR
    self_pr = models.TextField(blank=True)
    
    # 機械学習用フィールド
    resume_vector = models.JSONField(default=list, blank=True)  # 履歴書全体の特徴ベクトル
    match_score = models.FloatField(default=0.0)  # マッチングスコア
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'resumes'
        indexes = [
            models.Index(fields=['-submitted_at']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.submitted_at.strftime('%Y-%m-%d')}"


class Experience(models.Model):
    """職歴"""
    EMPLOYMENT_TYPES = [
        ('fulltime', '正社員'),
        ('contract', '契約社員'),
        ('parttime', 'パート・アルバイト'),
        ('dispatch', '派遣'),
        ('other', 'その他'),
    ]
    
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='experiences')
    
    company = models.CharField(max_length=200)
    period_from = models.DateField()
    period_to = models.DateField(null=True, blank=True)  # nullの場合は現在
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES)
    position = models.CharField(max_length=100, blank=True)
    business = models.TextField(blank=True)
    capital = models.CharField(max_length=50, blank=True)
    team_size = models.CharField(max_length=50, blank=True)
    tasks = models.TextField()
    industry = models.CharField(max_length=100, blank=True)
    
    # 機械学習用フィールド
    experience_embeddings = models.JSONField(default=dict, blank=True)  # 職歴の埋め込み表現
    skill_tags = models.JSONField(default=list, blank=True)  # 抽出されたスキルタグ
    
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'experiences'
        ordering = ['order', '-period_from']
    
    def __str__(self):
        return f"{self.company} ({self.period_from})"


class Application(models.Model):
    """応募情報"""
    STATUS_CHOICES = [
        ('pending', '未確認'),
        ('viewed', '確認済み'),
        ('accepted', '選考中'),
        ('rejected', '不採用'),
        ('hired', '採用'),
    ]
    
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    company = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_applications')
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    
    # 機械学習用フィールド
    match_score = models.FloatField(default=0.0)  # AIによるマッチングスコア
    recommendation_rank = models.IntegerField(null=True, blank=True)  # 推薦順位
    
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'applications'
        unique_together = ['applicant', 'company']
        indexes = [
            models.Index(fields=['status', '-applied_at']),
            models.Index(fields=['company', 'status']),
            models.Index(fields=['applicant', '-applied_at']),
        ]
    
    def __str__(self):
        return f"{self.applicant.email} → {self.company.company_name}"


class Scout(models.Model):
    """スカウト情報"""
    STATUS_CHOICES = [
        ('sent', '送信済み'),
        ('viewed', '確認済み'),
        ('responded', '返信済み'),
        ('expired', '期限切れ'),
    ]
    
    company = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_scouts')
    seeker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_scouts')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    scout_message = models.TextField()
    scouted_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # 機械学習用フィールド
    match_score = models.FloatField(default=0.0)  # AIによるマッチングスコア
    success_probability = models.FloatField(default=0.0)  # 成功確率予測
    
    class Meta:
        db_table = 'scouts'
        unique_together = ['company', 'seeker']
        indexes = [
            models.Index(fields=['status', '-scouted_at']),
            models.Index(fields=['seeker', 'status']),
            models.Index(fields=['company', '-scouted_at']),
        ]
    
    def __str__(self):
        return f"{self.company.company_name} → {self.seeker.email}"


class Message(models.Model):
    """メッセージ"""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    
    subject = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # 関連付け
    application = models.ForeignKey(Application, on_delete=models.CASCADE, null=True, blank=True)
    scout = models.ForeignKey(Scout, on_delete=models.CASCADE, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messages'
        indexes = [
            models.Index(fields=['receiver', 'is_read', '-created_at']),
            models.Index(fields=['sender', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.sender.email} → {self.receiver.email}: {self.subject[:30]}"


class Payment(models.Model):
    """支払い情報"""
    PAYMENT_METHODS = [
        ('credit', 'クレジットカード'),
        ('bank', '銀行振込'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    
    # クレジットカード情報（トークン化して保存）
    card_token = models.CharField(max_length=255, blank=True)
    card_last4 = models.CharField(max_length=4, blank=True)
    card_brand = models.CharField(max_length=20, blank=True)
    
    # 銀行情報
    bank_name = models.CharField(max_length=100, blank=True)
    branch_name = models.CharField(max_length=100, blank=True)
    account_type = models.CharField(max_length=20, blank=True)
    account_number = models.CharField(max_length=20, blank=True)
    account_holder = models.CharField(max_length=100, blank=True)
    
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
    
    def __str__(self):
        return f"{self.user.email} - {self.get_payment_method_display()}"


class ActivityLog(models.Model):
    """活動履歴（機械学習用データ収集）"""
    ACTION_TYPES = [
        ('login', 'ログイン'),
        ('logout', 'ログアウト'),
        ('profile_view', 'プロフィール閲覧'),
        ('resume_view', '履歴書閲覧'),
        ('application', '応募'),
        ('scout', 'スカウト'),
        ('message', 'メッセージ'),
        ('search', '検索'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    
    # 詳細データ（JSON形式で柔軟に保存）
    details = models.JSONField(default=dict, blank=True)
    
    # 関連オブジェクト
    target_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='targeted_activities')
    
    # セッション情報
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'activity_logs'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.created_at}"


class MLModel(models.Model):
    """機械学習モデル管理"""
    MODEL_TYPES = [
        ('matching', 'マッチング'),
        ('recommendation', '推薦'),
        ('salary_prediction', '年収予測'),
        ('success_prediction', '成功確率予測'),
    ]
    
    name = models.CharField(max_length=100)
    model_type = models.CharField(max_length=50, choices=MODEL_TYPES)
    version = models.CharField(max_length=20)
    
    # モデルファイルパス
    model_path = models.CharField(max_length=255)
    
    # パフォーマンス指標
    accuracy = models.FloatField(null=True, blank=True)
    precision = models.FloatField(null=True, blank=True)
    recall = models.FloatField(null=True, blank=True)
    f1_score = models.FloatField(null=True, blank=True)
    
    # トレーニング情報
    training_data_size = models.IntegerField(null=True, blank=True)
    training_date = models.DateTimeField(null=True, blank=True)
    parameters = models.JSONField(default=dict, blank=True)
    
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ml_models'
        unique_together = ['model_type', 'version']
    
    def __str__(self):
        return f"{self.name} v{self.version} ({'Active' if self.is_active else 'Inactive'})"


class MLPrediction(models.Model):
    """機械学習予測結果"""
    model = models.ForeignKey(MLModel, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ml_predictions')
    
    # 予測タイプ別の結果
    prediction_type = models.CharField(max_length=50)
    prediction_value = models.FloatField()
    confidence = models.FloatField()
    
    # 入力特徴量
    input_features = models.JSONField(default=dict)
    
    # 結果のフィードバック
    actual_value = models.FloatField(null=True, blank=True)
    feedback = models.CharField(max_length=20, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ml_predictions'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['model', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.prediction_type}: {self.prediction_value}"