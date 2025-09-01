"""
新しいデータベーススキーマに対応したAPI v2エンドポイント

主な変更点:
- UUID主キーの対応
- 新しいモデル (CompanyProfile, Education, Certification) のサポート
- 拡張されたシリアライザーの活用
- より堅牢なエラーハンドリング
"""

from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import jwt
import datetime
import os

from .models import (
    User, SeekerProfile, CompanyProfile, Resume, Experience, 
    Education, Certification, Application, Scout, Message
)
from .serializers import (
    UserSerializer, SeekerProfileSerializer, CompanyProfileSerializer,
    ResumeSerializer, ResumeCreateSerializer, ResumeUpdateSerializer,
    ExperienceSerializer, EducationSerializer, CertificationSerializer,
    ApplicationSerializer, ScoutSerializer, MessageSerializer,
    UserRegisterSerializer, CompanyRegisterSerializer, LoginSerializer
)

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "default-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXP_DELTA_SECONDS = int(os.getenv("JWT_EXP_DELTA_SECONDS", str(3600*24*30)))

def generate_jwt_token(user):
    """JWT トークンを生成"""
    payload = {
        'user_id': str(user.id),
        'email': user.email,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXP_DELTA_SECONDS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token):
    """JWT トークンを検証"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ============================================================================
# テスト用エンドポイント
# ============================================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check_v2(request):
    """ヘルスチェック API v2 - シンプル版"""
    from datetime import datetime
    return Response({
        'status': 'OK',
        'version': 'v2',
        'message': 'API v2 is working',
        'timestamp': datetime.now().isoformat(),
    }, status=status.HTTP_200_OK)

# ============================================================================
# 認証関連エンドポイント
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user_v2(request):
    """求職者ユーザー登録 API v2"""
    from .models import UserPrivacySettings, UserProfileExtension
    
    serializer = UserRegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            with transaction.atomic():
                user = serializer.save()
                
                # 求職者プロフィールを作成
                SeekerProfile.objects.create(
                    user=user,
                    first_name=request.data.get('first_name', ''),
                    last_name=request.data.get('last_name', ''),
                    first_name_kana=request.data.get('first_name_kana', ''),
                    last_name_kana=request.data.get('last_name_kana', ''),
                )
                
                # プロフィール拡張情報を作成（デフォルト値で）
                UserProfileExtension.objects.create(
                    user=user,
                    bio='',
                    headline='',
                    location='',
                    available_for_work=True  # 求職者なのでデフォルトTrue
                )
                
                # プライバシー設定を作成（デフォルト値で）
                UserPrivacySettings.objects.create(
                    user=user,
                    is_profile_public=False,  # デフォルトは非公開
                    show_email=False,
                    show_phone=False,
                    show_resumes=True  # 履歴書はデフォルト公開
                )
                
                # DRFトークン取得または作成
                drf_token, created = Token.objects.get_or_create(user=user)
                
                return Response({
                    'message': 'User registered successfully',
                    'user': UserSerializer(user).data,
                    'drf_token': drf_token.key,
                    'token': drf_token.key  # 後方互換性のため
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'detail': f'Registration failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_company_v2(request):
    """企業ユーザー登録 API v2"""
    from .models import UserPrivacySettings, UserProfileExtension
    
    serializer = CompanyRegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            with transaction.atomic():
                user = serializer.save()
                
                # 企業プロフィールを作成
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
                
                # プロフィール拡張情報を作成（企業用デフォルト値）
                UserProfileExtension.objects.create(
                    user=user,
                    bio=user.company_description or '',
                    headline=f'{user.company_name} - 採用担当',
                    location=user.headquarters or '',
                    website_url=user.company_url or '',
                    available_for_work=False  # 企業なのでFalse
                )
                
                # プライバシー設定を作成（企業用デフォルト値）
                UserPrivacySettings.objects.create(
                    user=user,
                    is_profile_public=True,  # 企業は基本公開
                    show_email=True,  # 連絡先は公開
                    show_phone=True,
                    show_resumes=False  # 履歴書は関係ない
                )
                
                # DRFトークン取得または作成
                drf_token, created = Token.objects.get_or_create(user=user)
                
                return Response({
                    'message': 'Company registered successfully',
                    'user': UserSerializer(user).data,
                    'drf_token': drf_token.key,
                    'token': drf_token.key  # 後方互換性のため
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'detail': f'Registration failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_v2(request):
    """ユーザーログイン API v2"""
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # DRFトークン取得または作成
        drf_token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'drf_token': drf_token.key,  # DRFトークン
            'token': drf_token.key  # 後方互換性のため
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# プロフィール関連エンドポイント
# ============================================================================

class SeekerProfileViewSet(viewsets.ModelViewSet):
    """求職者プロフィール ViewSet"""
    serializer_class = SeekerProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SeekerProfile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CompanyProfileViewSet(viewsets.ModelViewSet):
    """企業プロフィール ViewSet"""
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CompanyProfile.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ============================================================================
# 履歴書関連エンドポイント
# ============================================================================

class ResumeViewSet(viewsets.ModelViewSet):
    """履歴書 ViewSet"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ResumeCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ResumeUpdateSerializer
        return ResumeSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_experience(self, request, pk=None):
        """職歴追加"""
        resume = self.get_object()
        serializer = ExperienceSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(resume=resume)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_education(self, request, pk=None):
        """学歴追加"""
        resume = self.get_object()
        serializer = EducationSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(resume=resume)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_certification(self, request, pk=None):
        """資格追加"""
        resume = self.get_object()
        serializer = CertificationSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(resume=resume)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def completeness_check(self, request, pk=None):
        """履歴書完成度チェック"""
        resume = self.get_object()
        
        completeness = {
            'is_complete': resume.is_complete,
            'has_skills': bool(resume.skills),
            'has_self_pr': bool(resume.self_pr),
            'has_experiences': resume.experiences.exists(),
            'has_educations': resume.educations.exists(),
            'has_certifications': resume.certifications.exists(),
            'experience_count': resume.experiences.count(),
            'education_count': resume.educations.count(),
            'certification_count': resume.certifications.count(),
        }
        
        return Response(completeness, status=status.HTTP_200_OK)


class ExperienceViewSet(viewsets.ModelViewSet):
    """職歴 ViewSet"""
    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Experience.objects.filter(resume__user=self.request.user)


class EducationViewSet(viewsets.ModelViewSet):
    """学歴 ViewSet"""
    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Education.objects.filter(resume__user=self.request.user)


class CertificationViewSet(viewsets.ModelViewSet):
    """資格 ViewSet"""
    serializer_class = CertificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Certification.objects.filter(resume__user=self.request.user)


# ============================================================================
# 検索・マッチング関連エンドポイント
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_seekers_v2(request):
    """求職者検索 API v2"""
    if request.user.role != 'company':
        return Response({
            'detail': 'この機能は企業ユーザーのみ利用可能です'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # クエリパラメーター取得
    keyword = request.GET.get('keyword', '')
    prefecture = request.GET.get('prefecture', '')
    industry = request.GET.get('industry', '')
    experience_years_min = request.GET.get('experience_years_min')
    experience_years_max = request.GET.get('experience_years_max')
    
    # 検索クエリ構築
    queryset = SeekerProfile.objects.select_related('user').prefetch_related(
        'user__resumes__experiences'
    )
    
    if keyword:
        # スキルや自己PRにキーワードが含まれる履歴書を持つ求職者
        queryset = queryset.filter(
            user__resumes__skills__icontains=keyword
        ) | queryset.filter(
            user__resumes__self_pr__icontains=keyword
        )
    
    if prefecture:
        queryset = queryset.filter(prefecture=prefecture)
    
    if industry:
        queryset = queryset.filter(
            user__resumes__experiences__industry=industry
        )
    
    if experience_years_min:
        queryset = queryset.filter(experience_years__gte=int(experience_years_min))
    
    if experience_years_max:
        queryset = queryset.filter(experience_years__lte=int(experience_years_max))
    
    # 重複排除
    queryset = queryset.distinct()
    
    # ページネーション
    page_size = int(request.GET.get('page_size', 20))
    page = int(request.GET.get('page', 1))
    start = (page - 1) * page_size
    end = start + page_size
    
    results = queryset[start:end]
    total_count = queryset.count()
    
    # レスポンス生成
    serializer = SeekerProfileSerializer(results, many=True)
    
    return Response({
        'results': serializer.data,
        'count': total_count,
        'page': page,
        'page_size': page_size,
        'total_pages': (total_count + page_size - 1) // page_size
    }, status=status.HTTP_200_OK)


# ============================================================================
# スカウト・応募関連エンドポイント
# ============================================================================

class ApplicationViewSet(viewsets.ModelViewSet):
    """応募 ViewSet"""
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'user':
            return Application.objects.filter(applicant=self.request.user)
        elif self.request.user.role == 'company':
            return Application.objects.filter(company_id=self.request.user.id)
        return Application.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.role == 'user':
            serializer.save(applicant=self.request.user)
        else:
            return Response({
                'detail': '求職者のみ応募できます'
            }, status=status.HTTP_403_FORBIDDEN)


class ScoutViewSet(viewsets.ModelViewSet):
    """スカウト ViewSet"""
    serializer_class = ScoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'company':
            return Scout.objects.filter(company_id=self.request.user.id)
        elif self.request.user.role == 'user':
            return Scout.objects.filter(seeker_id=self.request.user.id)
        return Scout.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.role == 'company':
            serializer.save(company=self.request.user)
        else:
            return Response({
                'detail': '企業のみスカウトを送信できます'
            }, status=status.HTTP_403_FORBIDDEN)
    
    @action(detail=True, methods=['post'])
    def mark_viewed(self, request, pk=None):
        """スカウト閲覧済みマーク"""
        scout = self.get_object()
        scout.viewed_at = datetime.datetime.now()
        scout.status = 'viewed'
        scout.save()
        
        return Response({
            'message': 'スカウトを閲覧済みにマークしました'
        }, status=status.HTTP_200_OK)


# ============================================================================
# 統計・ダッシュボード関連エンドポイント
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats_v2(request):
    """ダッシュボード統計 API v2"""
    user = request.user
    
    if user.role == 'user':
        # 求職者向け統計
        stats = {
            'resumes_count': user.resumes.count(),
            'active_resumes_count': user.resumes.filter(is_active=True).count(),
            'applications_count': user.applications.count(),
            'scouts_received_count': user.received_scouts.count(),
            'recent_activities': []
        }
        
    elif user.role == 'company':
        # 企業向け統計
        stats = {
            'applications_received_count': user.received_applications.count(),
            'scouts_sent_count': user.sent_scouts.count(),
            'pending_applications_count': user.received_applications.filter(status='pending').count(),
            'active_scouts_count': user.sent_scouts.filter(status='sent').count(),
            'recent_activities': []
        }
        
    else:
        stats = {}
    
    return Response(stats, status=status.HTTP_200_OK)


# ============================================================================
# ユーティリティエンドポイント
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_v2(request):
    """ユーザープロフィール取得 API v2"""
    user = request.user
    data = UserSerializer(user).data
    
    # ロール別の追加情報
    if user.role == 'user' and hasattr(user, 'seeker_profile'):
        data['seeker_profile'] = SeekerProfileSerializer(user.seeker_profile).data
    elif user.role == 'company' and hasattr(user, 'company_profile'):
        data['company_profile'] = CompanyProfileSerializer(user.company_profile).data
    
    return Response(data, status=status.HTTP_200_OK)


# ====================================================================
# ユーザープロフィール公開API（新規追加）
# ====================================================================

@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def user_public_profile(request, user_id):
    """
    公開ユーザープロフィール取得・更新
    GET /api/v2/users/{user_id}/ - プロフィール取得（公開/非公開は自動判定）
    PATCH /api/v2/users/{user_id}/ - プロフィール更新（本人のみ）
    """
    from .models import UserPrivacySettings, UserProfileExtension
    
    try:
        user = User.objects.select_related(
            'privacy_settings',
            'profile_extension',
            'seeker_profile'
        ).prefetch_related(
            'resumes'
        ).get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # プライバシー設定を確認（なければ作成）
        if not hasattr(user, 'privacy_settings'):
            UserPrivacySettings.objects.create(user=user)
            user.refresh_from_db()
        
        # 本人かどうかチェック
        is_owner = request.user.is_authenticated and str(request.user.id) == str(user_id)
        
        # レスポンスデータを構築
        response_data = {
            'id': str(user.id),
            'full_name': user.full_name,
            'role': user.role,
        }
        
        if is_owner:
            # 本人の場合は全情報を返す
            response_data.update({
                'email': user.email,
                'phone': user.phone,
                'created_at': user.created_at,
                'updated_at': user.updated_at,
            })
            
            # プライバシー設定
            if hasattr(user, 'privacy_settings'):
                response_data['privacy_settings'] = {
                    'is_profile_public': user.privacy_settings.is_profile_public,
                    'show_email': user.privacy_settings.show_email,
                    'show_phone': user.privacy_settings.show_phone,
                    'show_resumes': user.privacy_settings.show_resumes,
                }
        else:
            # 他人の場合は公開設定を確認
            if not user.privacy_settings.is_profile_public:
                return Response({'error': 'This profile is private'}, status=status.HTTP_403_FORBIDDEN)
            
            # 公開設定に応じて情報を追加
            if user.privacy_settings.show_email:
                response_data['email'] = user.email
            if user.privacy_settings.show_phone:
                response_data['phone'] = user.phone
        
        # プロフィール拡張情報
        if hasattr(user, 'profile_extension'):
            response_data['profile_extension'] = {
                'bio': user.profile_extension.bio,
                'headline': user.profile_extension.headline,
                'profile_image_url': user.profile_extension.profile_image_url,
                'location': user.profile_extension.location,
                'website_url': user.profile_extension.website_url,
                'github_url': user.profile_extension.github_url,
                'linkedin_url': user.profile_extension.linkedin_url,
                'available_for_work': user.profile_extension.available_for_work,
            }
        
        # 履歴書情報（公開設定がTrueの場合）
        if user.privacy_settings.show_resumes or is_owner:
            if is_owner:
                # 本人は全履歴書を見れる
                resumes = user.resumes.all()
            else:
                # 他人は公開履歴書のみ
                resumes = user.resumes.filter(is_active=True)
            
            response_data['resumes'] = [{
                'id': str(resume.id),
                'title': resume.title,
                'description': resume.description,
                'is_active': resume.is_active,
                'created_at': resume.created_at,
            } for resume in resumes]
        
        # 求職者プロフィール（求職者の場合）
        if user.role == 'user' and hasattr(user, 'seeker_profile'):
            seeker_data = {
                'experience_years': user.seeker_profile.experience_years,
                'prefecture': user.seeker_profile.prefecture,
            }
            if is_owner:
                seeker_data.update({
                    'current_salary': user.seeker_profile.current_salary,
                    'desired_salary': user.seeker_profile.desired_salary,
                })
            response_data['seeker_profile'] = seeker_data
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # 本人のみ更新可能
        if not request.user.is_authenticated or str(request.user.id) != str(user_id):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # 更新可能なフィールドを制限
        allowed_fields = ['full_name', 'phone']
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        # ユーザー情報を更新
        for field, value in update_data.items():
            setattr(user, field, value)
        user.save()
        
        # プロフィール拡張情報を更新
        if 'profile_extension' in request.data:
            profile_ext, created = UserProfileExtension.objects.get_or_create(user=user)
            ext_data = request.data['profile_extension']
            allowed_ext_fields = ['bio', 'headline', 'profile_image_url', 'location', 
                                 'website_url', 'github_url', 'linkedin_url', 'available_for_work']
            
            for field in allowed_ext_fields:
                if field in ext_data:
                    setattr(profile_ext, field, ext_data[field])
            profile_ext.save()
        
        # プライバシー設定を更新
        if 'privacy_settings' in request.data:
            privacy, created = UserPrivacySettings.objects.get_or_create(user=user)
            privacy_data = request.data['privacy_settings']
            allowed_privacy_fields = ['is_profile_public', 'show_email', 'show_phone', 'show_resumes']
            
            for field in allowed_privacy_fields:
                if field in privacy_data:
                    setattr(privacy, field, privacy_data[field])
            privacy.save()
        
        return Response({'message': 'Profile updated successfully'}, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_privacy_settings(request, user_id):
    """
    プライバシー設定の取得・更新
    GET /api/v2/users/{user_id}/privacy/ - 設定取得
    PUT /api/v2/users/{user_id}/privacy/ - 設定更新
    """
    from .models import UserPrivacySettings
    
    # 本人のみアクセス可能
    if str(request.user.id) != str(user_id):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    privacy_settings, created = UserPrivacySettings.objects.get_or_create(
        user_id=user_id
    )
    
    if request.method == 'GET':
        data = {
            'is_profile_public': privacy_settings.is_profile_public,
            'show_email': privacy_settings.show_email,
            'show_phone': privacy_settings.show_phone,
            'show_resumes': privacy_settings.show_resumes,
        }
        return Response(data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        allowed_fields = ['is_profile_public', 'show_email', 'show_phone', 'show_resumes']
        
        for field in allowed_fields:
            if field in request.data:
                setattr(privacy_settings, field, request.data[field])
        
        privacy_settings.save()
        
        return Response({
            'message': 'Privacy settings updated successfully',
            'is_profile_public': privacy_settings.is_profile_public,
            'show_email': privacy_settings.show_email,
            'show_phone': privacy_settings.show_phone,
            'show_resumes': privacy_settings.show_resumes,
        }, status=status.HTTP_200_OK)


# ============================================================================
# 求職者専用エンドポイント
# ============================================================================

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def seeker_profile_detail(request):
    """
    求職者プロフィール取得・更新
    GET /api/v2/seeker/profile/
    PUT /api/v2/seeker/profile/
    """
    if request.user.role != 'user':
        return Response({'error': 'This endpoint is for seekers only'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        profile = request.user.seeker_profile
    except SeekerProfile.DoesNotExist:
        # プロフィールがない場合は作成
        profile = SeekerProfile.objects.create(
            user=request.user,
            first_name='',
            last_name='',
            first_name_kana='',
            last_name_kana=''
        )
    
    if request.method == 'GET':
        serializer = SeekerProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = SeekerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seeker_resumes_list(request):
    """
    求職者の履歴書一覧
    GET /api/v2/seeker/resumes/
    """
    if request.user.role != 'user':
        return Response({'error': 'This endpoint is for seekers only'}, status=status.HTTP_403_FORBIDDEN)
    
    resumes = Resume.objects.filter(user=request.user).order_by('-updated_at')
    serializer = ResumeSerializer(resumes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seeker_scouts_list(request):
    """
    求職者が受け取ったスカウト一覧
    GET /api/v2/seeker/scouts/
    """
    if request.user.role != 'user':
        return Response({'error': 'This endpoint is for seekers only'}, status=status.HTTP_403_FORBIDDEN)
    
    scouts = Scout.objects.filter(seeker=request.user).order_by('-scouted_at')
    serializer = ScoutSerializer(scouts, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seeker_applications_list(request):
    """
    求職者の応募履歴一覧
    GET /api/v2/seeker/applications/
    """
    if request.user.role != 'user':
        return Response({'error': 'This endpoint is for seekers only'}, status=status.HTTP_403_FORBIDDEN)
    
    applications = Application.objects.filter(applicant=request.user).order_by('-applied_at')
    serializer = ApplicationSerializer(applications, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def seeker_saved_jobs(request):
    """
    保存した求人の管理
    GET /api/v2/seeker/saved-jobs/
    POST /api/v2/seeker/saved-jobs/
    DELETE /api/v2/seeker/saved-jobs/{job_id}/
    """
    if request.user.role != 'user':
        return Response({'error': 'This endpoint is for seekers only'}, status=status.HTTP_403_FORBIDDEN)
    
    # 保存した求人機能は別モデルが必要なため、現時点では空配列を返す
    if request.method == 'GET':
        return Response([], status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        return Response({'message': 'Job saved successfully'}, status=status.HTTP_201_CREATED)
    
    elif request.method == 'DELETE':
        return Response({'message': 'Job removed from saved list'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seeker_messages_list(request):
    """
    求職者のメッセージ一覧
    GET /api/v2/seeker/messages/
    """
    if request.user.role != 'user':
        return Response({'error': 'This endpoint is for seekers only'}, status=status.HTTP_403_FORBIDDEN)
    
    messages = Message.objects.filter(receiver=request.user).order_by('-created_at')
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================================
# 企業専用エンドポイント
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_dashboard(request):
    """
    企業ダッシュボード情報
    GET /api/v2/company/dashboard/
    """
    if request.user.role != 'company':
        return Response({'error': 'This endpoint is for companies only'}, status=status.HTTP_403_FORBIDDEN)
    
    stats = {
        'applications_received': Application.objects.filter(company=request.user).count(),
        'scouts_sent': Scout.objects.filter(company=request.user).count(),
        'pending_applications': Application.objects.filter(company=request.user, status='pending').count(),
        'active_scouts': Scout.objects.filter(company=request.user, status='sent').count(),
        'recent_applications': ApplicationSerializer(
            Application.objects.filter(company=request.user).order_by('-applied_at')[:5],
            many=True
        ).data
    }
    
    return Response(stats, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def company_profile_detail(request):
    """
    企業プロフィール取得・更新
    GET /api/v2/company/profile/
    PUT /api/v2/company/profile/
    """
    if request.user.role != 'company':
        return Response({'error': 'This endpoint is for companies only'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        profile = request.user.company_profile
    except CompanyProfile.DoesNotExist:
        # プロフィールがない場合は作成
        profile = CompanyProfile.objects.create(
            user=request.user,
            company_name=request.user.company_name or ''
        )
    
    if request.method == 'GET':
        serializer = CompanyProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = CompanyProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def company_jobs_new(request):
    """
    新規求人作成
    POST /api/v2/company/jobs/new/
    """
    if request.user.role != 'company':
        return Response({'error': 'This endpoint is for companies only'}, status=status.HTTP_403_FORBIDDEN)
    
    # 求人モデルが必要なため、現時点では仮実装
    return Response({'message': 'Job posted successfully', 'job_id': 'dummy-id'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_scouts_list(request):
    """
    企業が送信したスカウト一覧
    GET /api/v2/company/scouts/
    """
    if request.user.role != 'company':
        return Response({'error': 'This endpoint is for companies only'}, status=status.HTTP_403_FORBIDDEN)
    
    scouts = Scout.objects.filter(company=request.user).order_by('-scouted_at')
    serializer = ScoutSerializer(scouts, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_applications_list(request):
    """
    企業が受け取った応募一覧
    GET /api/v2/company/applications/
    """
    if request.user.role != 'company':
        return Response({'error': 'This endpoint is for companies only'}, status=status.HTTP_403_FORBIDDEN)
    
    applications = Application.objects.filter(company=request.user).order_by('-applied_at')
    serializer = ApplicationSerializer(applications, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================================
# 共通エンドポイント
# ============================================================================

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    """
    ユーザー設定の取得・更新
    GET /api/v2/user/settings/
    PUT /api/v2/user/settings/
    """
    from .models import UserPrivacySettings, UserProfileExtension
    
    if request.method == 'GET':
        # プライバシー設定
        privacy, _ = UserPrivacySettings.objects.get_or_create(user=request.user)
        # プロフィール拡張
        profile_ext, _ = UserProfileExtension.objects.get_or_create(user=request.user)
        
        data = {
            'user': UserSerializer(request.user).data,
            'privacy_settings': {
                'is_profile_public': privacy.is_profile_public,
                'show_email': privacy.show_email,
                'show_phone': privacy.show_phone,
                'show_resumes': privacy.show_resumes,
            },
            'profile_extension': {
                'bio': profile_ext.bio,
                'headline': profile_ext.headline,
                'location': profile_ext.location,
                'website_url': profile_ext.website_url,
                'available_for_work': profile_ext.available_for_work,
            }
        }
        
        return Response(data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        # ユーザー基本情報の更新
        if 'user' in request.data:
            user_data = request.data['user']
            allowed_fields = ['full_name', 'phone', 'kana']
            for field in allowed_fields:
                if field in user_data:
                    setattr(request.user, field, user_data[field])
            request.user.save()
        
        # プライバシー設定の更新
        if 'privacy_settings' in request.data:
            privacy, _ = UserPrivacySettings.objects.get_or_create(user=request.user)
            privacy_data = request.data['privacy_settings']
            for field in ['is_profile_public', 'show_email', 'show_phone', 'show_resumes']:
                if field in privacy_data:
                    setattr(privacy, field, privacy_data[field])
            privacy.save()
        
        # プロフィール拡張の更新
        if 'profile_extension' in request.data:
            profile_ext, _ = UserProfileExtension.objects.get_or_create(user=request.user)
            ext_data = request.data['profile_extension']
            for field in ['bio', 'headline', 'location', 'website_url', 'available_for_work']:
                if field in ext_data:
                    setattr(profile_ext, field, ext_data[field])
            profile_ext.save()
        
        return Response({'message': 'Settings updated successfully'}, status=status.HTTP_200_OK)
