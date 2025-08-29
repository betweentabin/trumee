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
    """ヘルスチェック API v2"""
    return Response({
        'status': 'OK',
        'version': 'v2',
        'message': 'API v2 is working'
    }, status=status.HTTP_200_OK)

# ============================================================================
# 認証関連エンドポイント
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user_v2(request):
    """求職者ユーザー登録 API v2"""
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
                
                token = generate_jwt_token(user)
                
                return Response({
                    'message': 'User registered successfully',
                    'user': UserSerializer(user).data,
                    'token': token
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
                
                token = generate_jwt_token(user)
                
                return Response({
                    'message': 'Company registered successfully',
                    'user': UserSerializer(user).data,
                    'token': token
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
        
        # JWTトークンも生成（互換性のため）
        jwt_token = generate_jwt_token(user)
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'token': jwt_token,  # JWTトークン
            'drf_token': drf_token.key  # DRFトークン
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
            return Application.objects.filter(company=self.request.user)
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
            return Scout.objects.filter(company=self.request.user)
        elif self.request.user.role == 'user':
            return Scout.objects.filter(seeker=self.request.user)
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
