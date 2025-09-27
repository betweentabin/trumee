from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (
    User, SeekerProfile, CompanyProfile, Resume, Experience, Education, Certification,
    Application, Scout, Message, Payment, JobPosting,
    ActivityLog, MLModel, MLPrediction, CompanyMonthlyPage, ResumeFile,
    InterviewQuestion, PromptTemplate, Annotation,
)


class UserSerializer(serializers.ModelSerializer):
    """ユーザーシリアライザー"""
    scout_credits_total = serializers.IntegerField(read_only=True)
    scout_credits_used = serializers.IntegerField(read_only=True)
    scout_credits_remaining = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'role', 'full_name', 
            'kana', 'gender', 'company_name', 'capital', 
            'company_url', 'phone', 'is_premium', 'premium_expiry', 'plan_tier',
            'scout_credits_total', 'scout_credits_used',
            'scout_credits_remaining',
            # 管理者可視のためのフラグを公開（read-only）
            'is_staff', 'is_superuser',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_staff', 'is_superuser']

    def get_scout_credits_remaining(self, obj):
        try:
            return obj.scout_credits_remaining
        except Exception:
            return 0


class UserRegisterSerializer(serializers.ModelSerializer):
    """ユーザー登録シリアライザー"""
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'username', 'role', 
            'full_name', 'kana', 'phone', 'gender'
        ]
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(
            **validated_data,
            password=password
        )
        return user


class CompanyRegisterSerializer(serializers.ModelSerializer):
    """企業登録シリアライザー"""
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'username', 'first_name', 'last_name',
            'company_name', 'capital', 'company_url', 'phone', 'campaign_code'
        ]
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        
        user = User.objects.create_user(
            **validated_data,
            password=password,
            role='company',
            full_name=f"{last_name} {first_name}"
        )
        return user


class LoginSerializer(serializers.Serializer):
    """ログインシリアライザー"""
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(email=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            data['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        
        return data


class SeekerProfileSerializer(serializers.ModelSerializer):
    """求職者プロフィールシリアライザー"""
    full_name = serializers.CharField(read_only=True)
    full_name_kana = serializers.CharField(read_only=True)
    
    class Meta:
        model = SeekerProfile
        fields = [
            'id', 'user', 'first_name', 'last_name', 'first_name_kana', 'last_name_kana',
            'full_name', 'full_name_kana', 'birthday', 'prefecture', 'faculty',
            'graduation_year', 'experience_years', 'current_salary', 'desired_salary',
            'skill_vector', 'profile_embeddings', 'updated_at'
        ]
        read_only_fields = ['user', 'full_name', 'full_name_kana', 'updated_at']


class CompanyProfileSerializer(serializers.ModelSerializer):
    """企業プロフィールシリアライザー"""
    class Meta:
        model = CompanyProfile
        fields = [
            'id', 'user', 'company_name', 'capital', 'company_url', 'campaign_code',
            'employee_count', 'founded_year', 'industry', 'company_description',
            'headquarters', 'contact_person', 'contact_department',
            'billing_company_name', 'billing_department', 'billing_zip', 'billing_address', 'billing_email',
            'updated_at'
        ]
        read_only_fields = ['user', 'updated_at']


class EducationSerializer(serializers.ModelSerializer):
    """学歴シリアライザー"""
    # 実際のDBスキーマに合わせてフィールドをマッピング
    major = serializers.CharField(source='department', allow_blank=True, required=False)
    graduation_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Education
        fields = [
            'id', 'resume', 'school_name', 'faculty', 'major',
            'graduation_date', 'education_type', 'order'
        ]
        read_only_fields = ['resume']
    
    def get_graduation_date(self, obj):
        """graduation_year/monthから日付を構築"""
        if hasattr(obj, 'graduation_year') and obj.graduation_year:
            month = getattr(obj, 'graduation_month', 3)  # デフォルト3月
            try:
                from datetime import date
                return date(obj.graduation_year, month, 1).isoformat()
            except:
                return None
        return None


class CertificationSerializer(serializers.ModelSerializer):
    """資格シリアライザー"""
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Certification
        fields = [
            'id', 'resume', 'name', 'issuer', 'obtained_date',
            'expiry_date', 'is_expired', 'order'
        ]
        read_only_fields = ['resume', 'is_expired']


class ExperienceSerializer(serializers.ModelSerializer):
    """職歴シリアライザー"""
    duration_months = serializers.IntegerField(read_only=True)
    is_current = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Experience
        fields = [
            'id', 'resume', 'company', 'period_from', 'period_to',
            'employment_type', 'position', 'business', 'capital', 'team_size',
            'tasks', 'industry', 'achievements', 'technologies_used',
            'duration_months', 'is_current', 'order', 'skill_tags',
            'experience_embeddings'
        ]
        read_only_fields = ['resume', 'duration_months', 'is_current']


class ResumeSerializer(serializers.ModelSerializer):
    """履歴書シリアライザー"""
    experiences = ExperienceSerializer(many=True, read_only=True)
    # 一時的にeducationsを除外（DBスキーマ不整合のため）
    # educations = EducationSerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    is_complete = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Resume
        fields = [
            'id', 'user', 'user_email', 'title', 'description', 'objective',
            'submitted_at', 'is_active', 'desired_job', 'desired_industries', 
            'desired_locations', 'skills', 'self_pr', 'experiences',
            'certifications', 'match_score', 'is_complete', 'extra_data',
            'resume_vector', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'is_complete', 'created_at', 'updated_at']


class ResumeCreateSerializer(serializers.ModelSerializer):
    """履歴書作成シリアライザー"""
    experiences = ExperienceSerializer(many=True, required=False)
    # 一時的にeducationsを除外（DBスキーマ不整合のため）
    # educations = EducationSerializer(many=True, required=False)
    certifications = CertificationSerializer(many=True, required=False)
    
    class Meta:
        model = Resume
        fields = [
            'id', 'title', 'description', 'objective', 'desired_job', 
            'desired_industries', 'desired_locations',
            'skills', 'self_pr', 'experiences', 'certifications',
            'extra_data'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        experiences_data = validated_data.pop('experiences', [])
        # 一時的にeducations処理を除外
        # educations_data = validated_data.pop('educations', [])
        certifications_data = validated_data.pop('certifications', [])
        
        # extra_data はここでそのまま保存（JSONField）
        resume = Resume.objects.create(**validated_data)
        
        # 職歴作成
        for i, exp_data in enumerate(experiences_data):
            exp_data['order'] = i
            Experience.objects.create(resume=resume, **exp_data)
        
        # 学歴作成は一時的に無効化
        # for i, edu_data in enumerate(educations_data):
        #     edu_data['order'] = i
        #     Education.objects.create(resume=resume, **edu_data)
        
        # 資格作成
        for i, cert_data in enumerate(certifications_data):
            cert_data['order'] = i
            Certification.objects.create(resume=resume, **cert_data)
        
        return resume


class ResumeUpdateSerializer(serializers.ModelSerializer):
    """履歴書更新シリアライザー"""
    experiences = ExperienceSerializer(many=True, required=False)
    educations = EducationSerializer(many=True, required=False)
    certifications = CertificationSerializer(many=True, required=False)
    
    class Meta:
        model = Resume
        fields = [
            'title', 'description', 'objective', 'desired_job', 
            'desired_industries', 'desired_locations',
            'skills', 'self_pr', 'is_active', 'experiences', 'educations', 'certifications',
            'extra_data'
        ]
    
    def update(self, instance, validated_data):
        experiences_data = validated_data.pop('experiences', None)
        educations_data = validated_data.pop('educations', None)
        certifications_data = validated_data.pop('certifications', None)
        
        # 基本情報更新（extra_data も含む）
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 職歴更新
        if experiences_data is not None:
            instance.experiences.all().delete()
            for i, exp_data in enumerate(experiences_data):
                exp_data['order'] = i
                Experience.objects.create(resume=instance, **exp_data)
        
        # 学歴更新
        if educations_data is not None:
            instance.educations.all().delete()
            for i, edu_data in enumerate(educations_data):
                edu_data['order'] = i
                Education.objects.create(resume=instance, **edu_data)
        
        # 資格更新
        if certifications_data is not None:
            instance.certifications.all().delete()
            for i, cert_data in enumerate(certifications_data):
                cert_data['order'] = i
                Certification.objects.create(resume=instance, **cert_data)
        
        return instance


class ResumeFileSerializer(serializers.ModelSerializer):
    """履歴書ファイルシリアライザー"""
    file_url = serializers.SerializerMethodField()
    
    # 許可するContent-Typeと最大サイズ（影響を抑えるため広めに許可）
    ALLOWED_CONTENT_TYPES = {
        'application/pdf',
        'image/png',
        'image/jpeg',
        'application/msword',  # .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
    }
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    class Meta:
        model = ResumeFile
        fields = [
            'id', 'user', 'original_name', 'content_type', 'size', 'description',
            'file', 'file_url', 'uploaded_at'
        ]
        read_only_fields = ['user', 'file_url', 'uploaded_at']

    def validate_file(self, f):
        # Content-Type の検証
        content_type = getattr(f, 'content_type', '') or ''
        size = getattr(f, 'size', 0) or 0
        if content_type and content_type not in self.ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError('許可されていないファイル形式です（pdf, png, jpg, doc, docx を許可）')
        # サイズ検証
        if size and size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError('ファイルサイズが大きすぎます（最大10MB）')
        return f

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            url = obj.file.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None


class JobPostingSerializer(serializers.ModelSerializer):
    """求人投稿シリアライザー"""
    company_name = serializers.CharField(source='company.company_profile.company_name', read_only=True, default='')
    
    class Meta:
        model = JobPosting
        fields = [
            'id', 'company', 'company_name', 'title', 'description', 'requirements',
            'employment_type', 'salary_min', 'salary_max', 'location', 'remote_allowed',
            'experience_required', 'skills_required', 'benefits', 'deadline',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'created_at', 'updated_at']


class ApplicationSerializer(serializers.ModelSerializer):
    """応募情報シリアライザー"""
    applicant_name = serializers.CharField(source='applicant.full_name', read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    job_posting = JobPostingSerializer(read_only=True)
    job_posting_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = Application
        fields = [
            'id', 'applicant', 'applicant_name', 'company', 'company_name',
            'job_posting', 'job_posting_id', 'resume', 'status', 'applied_at', 'viewed_at',
            'match_score', 'recommendation_rank', 'notes'
        ]
        read_only_fields = ['applied_at', 'viewed_at', 'job_posting']


class ScoutSerializer(serializers.ModelSerializer):
    """スカウトシリアライザー"""
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    seeker_name = serializers.CharField(source='seeker.full_name', read_only=True)
    
    class Meta:
        model = Scout
        fields = [
            'id', 'company', 'company_name', 'seeker', 'seeker_name',
            'status', 'scout_message', 'scouted_at', 'viewed_at',
            'responded_at', 'expires_at', 'match_score', 'success_probability'
        ]
        read_only_fields = ['scouted_at', 'viewed_at', 'responded_at']


class MessageSerializer(serializers.ModelSerializer):
    """メッセージシリアライザー"""
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.full_name', read_only=True)
    annotation = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'receiver', 'receiver_name',
            'subject', 'content', 'is_read', 'read_at',
            'application', 'scout', 'annotation', 'created_at'
        ]
        read_only_fields = ['created_at', 'read_at']


class AnnotationSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.full_name', read_only=True)

    class Meta:
        model = Annotation
        fields = [
            'id', 'resume', 'subject', 'anchor_id',
            'start_offset', 'end_offset', 'quote', 'selector_meta',
            'created_by', 'created_by_name', 'is_resolved',
            'resolved_at', 'resolved_by', 'resolved_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'resolved_at', 'resolved_by']


class PaymentSerializer(serializers.ModelSerializer):
    """支払い情報シリアライザー"""
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'payment_method', 'card_last4', 'card_brand',
            'bank_name', 'branch_name', 'account_type',
            'is_default', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'card_token': {'write_only': True},
            'account_number': {'write_only': True},
            'account_holder': {'write_only': True}
        }


class ActivityLogSerializer(serializers.ModelSerializer):
    """活動履歴シリアライザー"""
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'action', 'details', 'target_user',
            'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = ['created_at']


class MLModelSerializer(serializers.ModelSerializer):
    """機械学習モデルシリアライザー"""
    class Meta:
        model = MLModel
        fields = '__all__'
        read_only_fields = ['created_at']


class MLPredictionSerializer(serializers.ModelSerializer):
    """機械学習予測結果シリアライザー"""
    class Meta:
        model = MLPrediction
        fields = '__all__'
        read_only_fields = ['created_at']


class CompanyMonthlyPageSerializer(serializers.ModelSerializer):
    """企業月次ページシリアライザー"""
    page_url = serializers.CharField(read_only=True)

    class Meta:
        model = CompanyMonthlyPage
        fields = [
            'id', 'company', 'year', 'month', 'title', 'content',
            'is_published', 'page_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['company', 'page_url', 'created_at', 'updated_at']


class InterviewQuestionSerializer(serializers.ModelSerializer):
    """質問マスタシリアライザー"""
    class Meta:
        model = InterviewQuestion
        fields = [
            'id', 'type', 'category', 'subcategory', 'text', 'answer_guide',
            'difficulty', 'tags', 'locale', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PromptTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptTemplate
        fields = ['id', 'name', 'target', 'template_text', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# 互換性のための旧シリアライザー（段階的に削除予定）
class CompanyUpdateSerializer(serializers.ModelSerializer):
    """企業情報更新シリアライザー（互換性用）"""
    subscriptions = serializers.DictField(
        child=serializers.BooleanField(), 
        required=False
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'full_name', 'company_name', 'capital',
            'phone', 'company_url', 'subscriptions'
        ]
    
    def update(self, instance, validated_data):
        subscriptions = validated_data.pop('subscriptions', None)
        
        if subscriptions and 'premiumPlan' in subscriptions:
            instance.is_premium = subscriptions['premiumPlan']
        
        return super().update(instance, validated_data)
