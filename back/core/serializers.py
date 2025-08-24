from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import (
    User, SeekerProfile, Resume, Experience, 
    Application, Scout, Message, Payment,
    ActivityLog, MLModel, MLPrediction
)


class UserSerializer(serializers.ModelSerializer):
    """ユーザーシリアライザー"""
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'role', 'full_name', 
            'kana', 'gender', 'company_name', 'capital', 
            'company_url', 'phone', 'is_premium', 'premium_expiry',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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
    class Meta:
        model = SeekerProfile
        fields = '__all__'
        read_only_fields = ['user']


class ExperienceSerializer(serializers.ModelSerializer):
    """職歴シリアライザー"""
    class Meta:
        model = Experience
        fields = [
            'id', 'company', 'period_from', 'period_to',
            'employment_type', 'position', 'business',
            'capital', 'team_size', 'tasks', 'industry',
            'order', 'skill_tags'
        ]


class ResumeSerializer(serializers.ModelSerializer):
    """履歴書シリアライザー"""
    experiences = ExperienceSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Resume
        fields = [
            'id', 'user', 'user_email', 'submitted_at', 'is_active',
            'desired_job', 'desired_industries', 'desired_locations',
            'skills', 'self_pr', 'experiences', 'match_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class ResumeCreateSerializer(serializers.ModelSerializer):
    """履歴書作成シリアライザー"""
    experiences = ExperienceSerializer(many=True, required=False)
    
    class Meta:
        model = Resume
        fields = [
            'desired_job', 'desired_industries', 'desired_locations',
            'skills', 'self_pr', 'experiences'
        ]
    
    def create(self, validated_data):
        experiences_data = validated_data.pop('experiences', [])
        resume = Resume.objects.create(**validated_data)
        
        for exp_data in experiences_data:
            Experience.objects.create(resume=resume, **exp_data)
        
        return resume


class ApplicationSerializer(serializers.ModelSerializer):
    """応募情報シリアライザー"""
    applicant_name = serializers.CharField(source='applicant.full_name', read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'applicant', 'applicant_name', 'company', 'company_name',
            'resume', 'status', 'applied_at', 'viewed_at',
            'match_score', 'recommendation_rank', 'notes'
        ]
        read_only_fields = ['applied_at', 'viewed_at']


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
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'receiver', 'receiver_name',
            'subject', 'content', 'is_read', 'read_at',
            'application', 'scout', 'created_at'
        ]
        read_only_fields = ['created_at', 'read_at']


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