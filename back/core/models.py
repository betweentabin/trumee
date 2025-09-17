from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
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
    # 課金プラン（starter / standard / premium）。空は未契約（またはレガシー互換）
    plan_tier = models.CharField(max_length=20, blank=True, db_index=True)
    
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
            models.Index(fields=['plan_tier']),
        ]
    
    def __str__(self):
        if self.role == 'company':
            return f"{self.company_name} ({self.email})"
        return f"{self.full_name} ({self.email})"


class SeekerProfile(models.Model):
    """求職者詳細プロフィール"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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
    experience_years = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(50)])
    current_salary = models.CharField(max_length=50, blank=True)
    desired_salary = models.CharField(max_length=50, blank=True)
    
    # 機械学習用フィールド
    skill_vector = models.JSONField(default=list, blank=True)  # スキルの特徴ベクトル
    profile_embeddings = models.JSONField(default=dict, blank=True)  # プロフィールの埋め込み表現
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seeker_profiles'
        indexes = [
            models.Index(fields=['prefecture']),
            models.Index(fields=['experience_years']),
            models.Index(fields=['graduation_year']),
        ]
    
    def __str__(self):
        return f"{self.last_name} {self.first_name}"
    
    @property
    def full_name(self):
        return f"{self.last_name} {self.first_name}"
    
    @property
    def full_name_kana(self):
        return f"{self.last_name_kana} {self.first_name_kana}"


class CompanyProfile(models.Model):
    """企業詳細プロフィール"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile')
    
    # 企業基本情報
    company_name = models.CharField(max_length=200, db_index=True)
    capital = models.BigIntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    company_url = models.URLField(blank=True, max_length=500)
    campaign_code = models.CharField(max_length=50, blank=True)
    employee_count = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    founded_year = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1800)])
    industry = models.CharField(max_length=100, blank=True, db_index=True)
    company_description = models.TextField(blank=True)
    headquarters = models.CharField(max_length=200, blank=True)

    # 担当者情報
    contact_person = models.CharField(max_length=100, blank=True)
    contact_department = models.CharField(max_length=100, blank=True)

    # 請求書送付先
    billing_company_name = models.CharField(max_length=200, blank=True)
    billing_department = models.CharField(max_length=100, blank=True)
    billing_zip = models.CharField(max_length=20, blank=True)
    billing_address = models.CharField(max_length=300, blank=True)
    billing_email = models.EmailField(blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'company_profiles'
        indexes = [
            models.Index(fields=['company_name']),
            models.Index(fields=['industry']),
            models.Index(fields=['employee_count']),
            models.Index(fields=['founded_year']),
        ]
    
    def __str__(self):
        return self.company_name


class Education(models.Model):
    """学歴"""
    EDUCATION_TYPES = [
        ('high_school', '高等学校'),
        ('vocational', '専門学校'),
        ('junior_college', '短期大学'),
        ('university', '大学'),
        ('graduate', '大学院'),
        ('other', 'その他'),
    ]
    
    GRADUATION_STATUS_CHOICES = [
        ('graduated', '卒業'),
        ('expected', '卒業見込み'),
        ('enrolled', '在学中'),
        ('dropped', '中退'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey('Resume', on_delete=models.CASCADE, related_name='educations')
    
    school_name = models.CharField(max_length=200)
    faculty = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)  # 実際のDBカラム
    graduation_year = models.IntegerField(null=True, blank=True)  # 実際のDBカラム
    graduation_month = models.IntegerField(null=True, blank=True)  # 実際のDBカラム
    graduation_status = models.CharField(max_length=20, choices=GRADUATION_STATUS_CHOICES, blank=True)  # 実際のDBカラム
    education_type = models.CharField(max_length=20, choices=EDUCATION_TYPES)
    
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'educations'
        ordering = ['order', '-graduation_year', '-graduation_month']
    
    def __str__(self):
        return f"{self.school_name} - {self.faculty}"
    
    # 互換性のためのプロパティ
    @property
    def major(self):
        return self.department
    
    @major.setter
    def major(self, value):
        self.department = value
    
    @property
    def graduation_date(self):
        if self.graduation_year:
            try:
                from datetime import date
                month = self.graduation_month or 3
                return date(self.graduation_year, month, 1)
            except:
                return None
        return None


class Certification(models.Model):
    """資格・免許"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey('Resume', on_delete=models.CASCADE, related_name='certifications')
    
    name = models.CharField(max_length=200)
    issuer = models.CharField(max_length=200, blank=True)
    obtained_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'certifications'
        ordering = ['order', '-obtained_date']
    
    def __str__(self):
        return self.name
    
    @property
    def is_expired(self):
        if self.expiry_date:
            return timezone.now().date() > self.expiry_date
        return False


class Resume(models.Model):
    """履歴書・職務経歴書"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    
    # 基本情報
    title = models.CharField(max_length=200, default='履歴書')
    description = models.TextField(blank=True)
    objective = models.TextField(blank=True)  # 志望動機
    
    # 希望職種・条件
    desired_job = models.CharField(max_length=100, blank=True)
    desired_industries = models.JSONField(default=list, blank=True)
    desired_locations = models.JSONField(default=list, blank=True)
    
    # スキル・自己PR
    skills = models.TextField(blank=True)
    self_pr = models.TextField(blank=True)
    
    # 詳細データ（フロントエンドからの追加情報）
    extra_data = models.JSONField(default=dict, blank=True)
    
    # 機械学習用フィールド
    resume_vector = models.JSONField(default=list, blank=True)  # 履歴書全体の特徴ベクトル
    match_score = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])  # マッチングスコア
    
    # ステータス
    is_active = models.BooleanField(default=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'resumes'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['-submitted_at']),
            models.Index(fields=['is_active']),
            models.Index(fields=['-match_score']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    @property
    def is_complete(self):
        """履歴書が完成しているかチェック"""
        return bool(self.skills and self.self_pr and self.experiences.exists())


class ResumeFile(models.Model):
    """ユーザーがアップロードした履歴書ファイル（PDF/Word/Excel等）"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resume_files')
    # 実ファイル
    file = models.FileField(upload_to='resumes/')
    # メタ情報
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100, blank=True)
    size = models.BigIntegerField(default=0)
    description = models.CharField(max_length=255, blank=True)
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'resume_files'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['user', '-uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.original_name} ({self.user.email})"


class Experience(models.Model):
    """職歴"""
    EMPLOYMENT_TYPES = [
        ('fulltime', '正社員'),
        ('contract', '契約社員'),
        ('parttime', 'パート・アルバイト'),
        ('dispatch', '派遣'),
        ('freelance', 'フリーランス'),
        ('internship', 'インターンシップ'),
        ('other', 'その他'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='experiences')
    
    # 基本情報
    company = models.CharField(max_length=200)
    period_from = models.DateField()
    period_to = models.DateField(null=True, blank=True)  # nullの場合は現在
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPES)
    position = models.CharField(max_length=100, blank=True)
    
    # 企業・職務詳細
    business = models.TextField(blank=True)  # 事業内容
    capital = models.CharField(max_length=50, blank=True)  # 資本金
    team_size = models.CharField(max_length=50, blank=True)  # チーム規模
    tasks = models.TextField()  # 職務内容
    industry = models.CharField(max_length=100, blank=True, db_index=True)
    
    # 成果・実績
    achievements = models.TextField(blank=True)  # 成果・実績
    technologies_used = models.JSONField(default=list, blank=True)  # 使用技術
    
    # 機械学習用フィールド
    experience_embeddings = models.JSONField(default=dict, blank=True)  # 職歴の埋め込み表現
    skill_tags = models.JSONField(default=list, blank=True)  # 抽出されたスキルタグ
    
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'experiences'
        ordering = ['order', '-period_from']
        indexes = [
            models.Index(fields=['resume', 'order']),
            models.Index(fields=['industry']),
            models.Index(fields=['employment_type']),
            models.Index(fields=['period_from', 'period_to']),
        ]
    
    def __str__(self):
        return f"{self.company} - {self.position} ({self.period_from})"
    
    @property
    def duration_months(self):
        """勤務期間（月数）を計算"""
        from datetime import date
        
        # period_fromが文字列の場合は日付に変換
        if isinstance(self.period_from, str):
            try:
                period_from = date.fromisoformat(self.period_from)
            except ValueError:
                return 1
        else:
            period_from = self.period_from
        
        # period_toの処理
        if self.period_to is None:
            end_date = timezone.now().date()
        elif isinstance(self.period_to, str):
            try:
                end_date = date.fromisoformat(self.period_to)
            except ValueError:
                end_date = timezone.now().date()
        else:
            end_date = self.period_to
        
        if not period_from:
            return 1
            
        delta = end_date - period_from
        return max(1, delta.days // 30)  # 最低1ヶ月
    
    @property
    def is_current(self):
        """現在の職場かどうか"""
        return self.period_to is None


class JobPosting(models.Model):
    """求人投稿"""
    EMPLOYMENT_TYPE_CHOICES = [
        ('fulltime', '正社員'),
        ('contract', '契約社員'),
        ('parttime', 'パート・アルバイト'),
        ('internship', 'インターン'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_postings')
    
    # 基本情報
    title = models.CharField(max_length=200)
    description = models.TextField()
    requirements = models.TextField()
    
    # 雇用条件
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='fulltime')
    salary_min = models.IntegerField(null=True, blank=True)
    salary_max = models.IntegerField(null=True, blank=True)
    location = models.CharField(max_length=100)
    remote_allowed = models.BooleanField(default=False)
    
    # 要件
    experience_required = models.IntegerField(default=0)
    skills_required = models.TextField(blank=True)
    benefits = models.TextField(blank=True)
    
    # ステータス
    deadline = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_postings'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.company.company_name if hasattr(self.company, 'company_profile') else self.company.email}"


class Application(models.Model):
    """応募情報"""
    STATUS_CHOICES = [
        ('pending', '未確認'),
        ('viewed', '確認済み'),
        ('accepted', '選考中'),
        ('interview', '面接中'),
        ('offered', '内定'),
        ('rejected', '不採用'),
        ('hired', '採用'),
        ('withdrawn', '辞退'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    company = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_applications')
    job_posting = models.ForeignKey(JobPosting, on_delete=models.CASCADE, related_name='applications', null=True, blank=True)
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    # 機械学習用フィールド
    match_score = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    recommendation_rank = models.IntegerField(null=True, blank=True)
    
    # 詳細情報
    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    class Meta:
        db_table = 'applications'
        unique_together = ['applicant', 'company']
        indexes = [
            models.Index(fields=['status', '-applied_at']),
            models.Index(fields=['company', 'status']),
            models.Index(fields=['applicant', '-applied_at']),
            models.Index(fields=['-match_score']),
        ]
    
    def __str__(self):
        company_name = getattr(self.company, 'company_name', self.company.email)
        return f"{self.applicant.email} → {company_name}"


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


# ============================================================
# プロフィール関連モデル（ユーザープロフィール機能拡張用）
# ============================================================

class UserPrivacySettings(models.Model):
    """ユーザープロフィール公開設定（シンプル版）"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='privacy_settings')
    
    # 基本的な公開設定
    is_profile_public = models.BooleanField(default=False, help_text='プロフィールを公開するか')
    show_email = models.BooleanField(default=False, help_text='メールアドレスを公開するか')
    show_phone = models.BooleanField(default=False, help_text='電話番号を公開するか')
    show_resumes = models.BooleanField(default=True, help_text='履歴書を公開するか')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_privacy_settings'
        verbose_name = 'プライバシー設定'
        verbose_name_plural = 'プライバシー設定'
    
    def __str__(self):
        return f"{self.user.email} - Privacy Settings"


class UserProfileExtension(models.Model):
    """プロフィール拡張情報（シンプル版）"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile_extension')
    
    # プロフィール基本情報
    profile_image_url = models.URLField(max_length=500, blank=True, help_text='プロフィール画像URL')
    bio = models.TextField(blank=True, help_text='自己紹介')
    headline = models.CharField(max_length=200, blank=True, help_text='キャッチフレーズ')
    location = models.CharField(max_length=100, blank=True, help_text='居住地')
    
    # SNSリンク
    website_url = models.URLField(max_length=500, blank=True)
    github_url = models.URLField(max_length=500, blank=True)
    linkedin_url = models.URLField(max_length=500, blank=True)
    
    # ステータス
    available_for_work = models.BooleanField(default=True, help_text='仕事を探しているか')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profile_extensions'
        verbose_name = 'プロフィール拡張'
        verbose_name_plural = 'プロフィール拡張'
    
    def __str__(self):
        return f"{self.user.email} - Profile Extension"


class CompanyMonthlyPage(models.Model):
    """企業ごとの月次ページ（ダッシュボード用の簡易CMS）"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(User, on_delete=models.CASCADE, related_name='monthly_pages')
    year = models.IntegerField()
    month = models.IntegerField()
    title = models.CharField(max_length=200, blank=True)
    content = models.JSONField(default=dict, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'company_monthly_pages'
        constraints = [
            models.UniqueConstraint(fields=['company', 'year', 'month'], name='uniq_company_year_month')
        ]
        indexes = [
            models.Index(fields=['company', '-year', '-month']),
        ]

    def __str__(self):
        return f"{self.company.company_name or self.company.email} - {self.year}-{self.month:02d}"

    @property
    def page_url(self) -> str:
        """フロントエンドで表示するための推奨URL"""
        return f"/company/{self.company_id}/{self.year}/{self.month:02d}"
