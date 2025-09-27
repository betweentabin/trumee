"""
新しいデータベーススキーマに対応したAPI v2エンドポイント

主な変更点:
- UUID主キーの対応
- 新しいモデル (CompanyProfile, Education, Certification) のサポート
- 拡張されたシリアライザーの活用
- より堅牢なエラーハンドリング
"""

from rest_framework import status, viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db import connection
from django.db.models.functions import Cast
from django.db.models import IntegerField
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings
from django.utils import timezone
import jwt
import datetime
import os
from django.core.cache import cache

from .models import (
    User, SeekerProfile, CompanyProfile, Resume, Experience, 
    Education, Certification, Application, Scout, Message, JobPosting,
    CompanyMonthlyPage, ResumeFile, InterviewQuestion, PromptTemplate, Annotation, Payment
)
from .serializers import (
    UserSerializer, SeekerProfileSerializer, CompanyProfileSerializer,
    ResumeSerializer, ResumeCreateSerializer, ResumeUpdateSerializer,
    ExperienceSerializer, EducationSerializer, CertificationSerializer,
    ApplicationSerializer, ScoutSerializer, MessageSerializer, JobPostingSerializer,
    UserRegisterSerializer, CompanyRegisterSerializer, LoginSerializer,
    CompanyMonthlyPageSerializer, ResumeFileSerializer,
    InterviewQuestionSerializer, PromptTemplateSerializer,
    AnnotationSerializer,
)
from .ai import gemini as gemini_client
from .utils_templates import render_prompt_with_resume

# Import PDF generation views (conditional import)
try:
    from reportlab.lib.pagesizes import A4
    REPORTLAB_AVAILABLE = True
    REPORTLAB_ERROR = None
except ImportError as e:
    REPORTLAB_AVAILABLE = False
    REPORTLAB_ERROR = str(e)

if REPORTLAB_AVAILABLE:
    try:
        from api_v2.views.resume_views import download_resume_pdf, send_resume_pdf
    except ImportError:
        # Fallback if the views file is not found
        from django.http import JsonResponse
        
        def download_resume_pdf(request):
            return JsonResponse(
                {'error': 'PDF generation views not found'},
                status=500
            )
        
        def send_resume_pdf(request):
            return JsonResponse(
                {'error': 'PDF generation views not found'},
                status=500
            )
else:
    # Fallback if reportlab is not installed
    from django.http import JsonResponse
    import sys
    
    def download_resume_pdf(request):
        error_msg = f'PDF generation is not available. Reportlab import error: {REPORTLAB_ERROR}'
        return JsonResponse(
            {
                'error': error_msg,
                'python_version': sys.version,
                'reportlab_error': REPORTLAB_ERROR
            },
            status=503
        )
    
    def send_resume_pdf(request):
        error_msg = f'PDF generation is not available. Reportlab import error: {REPORTLAB_ERROR}'
        return JsonResponse(
            {
                'error': error_msg,
                'python_version': sys.version,
                'reportlab_error': REPORTLAB_ERROR
            },
            status=503
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

def _rate_limit(request, key: str, limit: int, window_seconds: int) -> bool:
    """Simple IP+key-based rate limiter using Django cache.
    Returns True if within limit, False if over.
    """
    ip = request.META.get('REMOTE_ADDR') or 'unknown'
    cache_key = f"rl:{ip}:{key}"
    added = cache.add(cache_key, 1, timeout=window_seconds)
    if added:
        return True
    try:
        current = cache.incr(cache_key)
    except ValueError:
        cache.set(cache_key, 1, timeout=window_seconds)
        return True
    return current <= limit


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
# 面接質問・テンプレート関連（新規）
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def interview_categories_v2(request):
    """質問カテゴリ一覧（typeでフィルタ可能）"""
    qtype = request.GET.get('type')
    qs = InterviewQuestion.objects.filter(is_active=True)
    if qtype:
        qs = qs.filter(type=qtype)
    cats = list(qs.values_list('category', flat=True).distinct())
    # 既定カテゴリ（不足時の補完）
    defaults = ['basic', 'motivation', 'experience', 'personality', 'teamwork', 'future', 'stress']
    for d in defaults:
        if d and d not in cats:
            cats.append(d)
    return Response({'categories': cats}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def interview_questions_v2(request):
    """質問一覧取得。クエリ: type, category, difficulty, tags, limit"""
    qtype = request.GET.get('type')
    category = request.GET.get('category')
    difficulty = request.GET.get('difficulty')
    tags_csv = request.GET.get('tags', '')
    limit = int(request.GET.get('limit', '20'))

    qs = InterviewQuestion.objects.filter(is_active=True)
    if qtype:
        qs = qs.filter(type=qtype)
    if category:
        qs = qs.filter(category=category)
    if difficulty:
        qs = qs.filter(difficulty=difficulty)
    # JSONFieldのタグ検索はDB依存が強いのでMVPではアプリ側でフィルタ
    items = list(qs.order_by('category', 'difficulty', '-updated_at')[: max(0, min(limit, 100))])
    if tags_csv:
        tags = [t.strip() for t in tags_csv.split(',') if t.strip()]
        if tags:
            items = [x for x in items if any((t in (x.tags or [])) for t in tags)]

    data = InterviewQuestionSerializer(items, many=True).data
    return Response({'results': data, 'count': len(data)}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def interview_personalize_v2(request):
    """履歴書に基づき質問をパーソナライズして返す（+Geminiで追加生成）"""
    # レート制限（IPベース、1分10回）
    import logging
    logger = logging.getLogger(__name__)
    if not _rate_limit(request, 'interview_personalize', 10, 60):
        return Response({'detail': 'Too many requests'}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    body = request.data or {}
    qtype = str(body.get('type') or 'interview')
    limit = int(body.get('limit') or 5)
    resume_id = body.get('resume_id')

    # 対象履歴書を取得
    if resume_id:
        resume = get_object_or_404(Resume, id=resume_id, user=request.user)
    else:
        resume = Resume.objects.filter(user=request.user).order_by('-is_active', '-updated_at').first()
    if not resume:
        return Response({'detail': '履歴書が見つかりません'}, status=status.HTTP_404_NOT_FOUND)

    # ルールベース選定（簡易）：typeと基本カテゴリ優先
    base_qs = InterviewQuestion.objects.filter(is_active=True, type=qtype)
    # 経験情報があればexperienceカテゴリを優先
    prefer = 'experience' if resume.experiences.exists() else None
    selected = []
    for q in base_qs.order_by('category', 'difficulty', '-updated_at'):
        if prefer and q.category == prefer:
            selected.append(q)
        elif not prefer:
            selected.append(q)
        if len(selected) >= limit:
            break

    items = [
        {
            'text': q.text,
            'category': q.category,
            'difficulty': q.difficulty,
            'tips': [t for t in (q.answer_guide.split('\n') if q.answer_guide else []) if t.strip()],
            'source': 'rules',
        }
        for q in selected
    ]

    # Geminiで追加質問を生成（ENVが設定されていれば）
    added = []
    if getattr(settings, 'GEMINI_API_KEY', ''):
        try:
            # 履歴書概要を作成
            skills = (resume.skills or '').strip()
            exp_lines = []
            for e in resume.experiences.all()[:3]:
                exp_lines.append(f"会社:{e.company} 役割:{(e.position or '')} 実績:{(e.achievements or '')[:40]}")
            exp_text = "\n".join(exp_lines)
            prompt = (
                "以下の履歴書情報と既存質問例を参考に、日本語で面接想定質問を3つ生成してください。\n"
                "- 箇条書きで1行1問、質問文のみ。\n"
                "- 誇張や断定を避け、汎用的で実務に即した問いにする。\n\n"
                f"履歴書要約:\nスキル: {skills or '（未記載）'}\n経験:\n{exp_text or '（未記載）'}\n\n"
                f"既存質問例:\n" + "\n".join([x['text'] for x in items[:3]])
            )
            out = gemini_client.generate_text(prompt)
            for line in out.splitlines():
                q = line.strip().lstrip('-').lstrip('・').strip()
                if not q:
                    continue
                added.append({'text': q, 'category': 'generated', 'difficulty': 'medium', 'tips': [], 'source': 'gemini'})
                if len(added) >= max(0, limit - len(items)):
                    break
        except Exception as e:
            # 生成失敗は無視してルール分のみ返す（ログに残す）
            try:
                logger.warning('Gemini generation failed: %s', e)
            except Exception:
                pass

    return Response({'items': items + added, 'source': 'gemini+rules' if added else 'rules'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def template_render_v2(request):
    """テンプレートを履歴書でレンダリングして返す"""
    body = request.data or {}
    template_id = body.get('template_id')
    resume_id = body.get('resume_id')
    if not template_id:
        return Response({'detail': 'template_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    t = get_object_or_404(PromptTemplate, id=template_id, is_active=True)
    if resume_id:
        r = get_object_or_404(Resume, id=resume_id, user=request.user)
    else:
        r = Resume.objects.filter(user=request.user).order_by('-is_active', '-updated_at').first()
    if not r:
        return Response({'detail': '履歴書が見つかりません'}, status=status.HTTP_404_NOT_FOUND)

    # レンダリング
    rendered = render_prompt_with_resume(t, r)
    return Response({'text': rendered, 'template': PromptTemplateSerializer(t).data}, status=status.HTTP_200_OK)

# ============================================================================
# 管理者用エンドポイント
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_seekers_v2(request):
    """管理者用 求職者一覧 (API v2)

    互換エンドポイント。実体は admin_users_v2 と同等のロジックで
    role='user' に固定フィルタをかけたもの。
    """
    # 権限チェック
    if not request.user.is_staff:
        return Response({'detail': '管理者権限が必要です'}, status=status.HTTP_403_FORBIDDEN)

    queryset = User.objects.filter(role='user').order_by('-created_at')

    # フィルタ（v1互換）
    status_filter = request.query_params.get('status', '')
    date_from = request.query_params.get('date_from', '')
    date_to = request.query_params.get('date_to', '')

    if status_filter == 'active':
        queryset = queryset.filter(is_active=True)
    elif status_filter == 'premium':
        queryset = queryset.filter(is_premium=True)

    if date_from:
        queryset = queryset.filter(created_at__gte=date_from)
    if date_to:
        queryset = queryset.filter(created_at__lte=date_to)

    # ページネーション
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = int(request.query_params.get('page_size') or 50)
    page = paginator.paginate_queryset(queryset, request)

    serializer = UserSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_v2(request):
    """管理者用 ユーザー一覧 (API v2)

    クエリ: role=(user|company) で絞り込み可能。未指定は全件。
    status=(active|premium) フィルタ対応。日付範囲も同様。
    """
    if not request.user.is_staff:
        return Response({'detail': '管理者権限が必要です'}, status=status.HTTP_403_FORBIDDEN)

    role = request.query_params.get('role')
    queryset = User.objects.all().order_by('-created_at')
    if role in {'user', 'company'}:
        queryset = queryset.filter(role=role)

    status_filter = request.query_params.get('status', '')
    date_from = request.query_params.get('date_from', '')
    date_to = request.query_params.get('date_to', '')

    if status_filter == 'active':
        queryset = queryset.filter(is_active=True)
    elif status_filter == 'premium':
        queryset = queryset.filter(is_premium=True)

    if date_from:
        queryset = queryset.filter(created_at__gte=date_from)
    if date_to:
        queryset = queryset.filter(created_at__lte=date_to)

    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = int(request.query_params.get('page_size') or 50)
    page = paginator.paginate_queryset(queryset, request)
    serializer = UserSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_overview(request, user_id):
    """管理者用: 指定ユーザーの概要情報

    GET /api/v2/admin/users/<uuid:user_id>/overview/

    返却: 基本プロフィールと関連リソースの件数サマリ。
    """
    # 管理者のみ許可
    if not request.user.is_staff:
        return Response({'detail': '管理者権限が必要です'}, status=status.HTTP_403_FORBIDDEN)

    # ユーザー取得
    target = get_object_or_404(User, id=user_id)

    # 件数サマリ
    resumes_count = Resume.objects.filter(user=target).count()
    experiences_count = Experience.objects.filter(resume__user=target).count()

    # 応募とスカウト（求職者/企業で分岐）
    applications_as_applicant = Application.objects.filter(applicant=target).count()
    applications_as_company = Application.objects.filter(company=target).count()
    scouts_sent = Scout.objects.filter(company=target).count()
    scouts_received = Scout.objects.filter(seeker=target).count()

    # メッセージ（送受信）
    from django.db.models import Q
    messages_total = 0
    try:
        messages_total = target.sent_messages.count() + target.received_messages.count()
    except Exception:
        # 念のためのフォールバック
        messages_total = (
            __import__('core.models', fromlist=['Message']).Message.objects.filter(
                Q(sender=target) | Q(receiver=target)
            ).count()
        )

    # 最終アクティビティ（存在すれば）
    latest_activity = None
    try:
        from .models import ActivityLog
        latest = ActivityLog.objects.filter(user=target).order_by('-created_at').first()
        latest_activity = latest.created_at if latest else None
    except Exception:
        latest_activity = None

    # 追加属性
    # 年齢
    age = None
    try:
        if getattr(target, 'seeker_profile', None) and getattr(target.seeker_profile, 'birthday', None):
            from datetime import date
            b = target.seeker_profile.birthday
            today = date.today()
            age = today.year - b.year - ((today.month, today.day) < (b.month, b.day))
    except Exception:
        age = None

    # 最終ログイン
    last_login = getattr(target, 'last_login', None)

    # 最終課金日
    last_payment_at = None
    try:
        last_pay = Payment.objects.filter(user=target).order_by('-created_at').first()
        last_payment_at = getattr(last_pay, 'created_at', None)
    except Exception:
        last_payment_at = None

    # 最終添削者（Annotation or resume_advice Message）
    last_reviewed_by = None
    last_reviewed_by_name = None
    last_reviewed_at = None
    try:
        ann = Annotation.objects.filter(resume__user=target).order_by('-created_at').first()
        ann_time = getattr(ann, 'created_at', None)
        ann_user = getattr(ann, 'created_by', None)
    except Exception:
        ann_time = None
        ann_user = None
    try:
        msg = Message.objects.filter(subject='resume_advice', receiver=target, sender__is_staff=True).order_by('-created_at').first()
        msg_time = getattr(msg, 'created_at', None)
        msg_user = getattr(msg, 'sender', None)
    except Exception:
        msg_time = None
        msg_user = None

    pick_msg = False
    if ann_time and msg_time:
        pick_msg = msg_time >= ann_time
    elif msg_time and not ann_time:
        pick_msg = True
    else:
        pick_msg = False

    if pick_msg and msg_user:
        last_reviewed_by = str(getattr(msg_user, 'id', ''))
        last_reviewed_by_name = getattr(msg_user, 'full_name', '') or getattr(msg_user, 'email', '')
        last_reviewed_at = msg_time
    elif ann_user:
        last_reviewed_by = str(getattr(ann_user, 'id', ''))
        last_reviewed_by_name = getattr(ann_user, 'full_name', '') or getattr(ann_user, 'email', '')
        last_reviewed_at = ann_time

    data = {
        'user': {
            'id': str(target.id),
            'email': target.email,
            'role': target.role,
            'full_name': target.full_name,
            'company_name': getattr(target, 'company_name', ''),
            'is_active': target.is_active,
            'is_staff': target.is_staff,
            'is_premium': target.is_premium,
            'plan_tier': target.plan_tier,
            'created_at': target.created_at,
            'date_joined': getattr(target, 'date_joined', None),
            'last_login': last_login,
        },
        'counts': {
            'resumes': resumes_count,
            'experiences': experiences_count,
            'applications_as_applicant': applications_as_applicant,
            'applications_as_company': applications_as_company,
            'scouts_sent': scouts_sent,
            'scouts_received': scouts_received,
            'messages_total': messages_total,
        },
        'latest_activity_at': latest_activity,
        'attributes': {
            'age': age,
            'registered_at': target.created_at,
            'last_login_at': last_login,
            'last_payment_at': last_payment_at,
        },
        'review': {
            'last_reviewed_by': last_reviewed_by,
            'last_reviewed_by_name': last_reviewed_by_name,
            'last_reviewed_at': last_reviewed_at,
        },
    }

    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_resumes(request, user_id):
    """管理者用: 指定ユーザーの履歴書一覧を取得"""
    if not request.user.is_staff:
        return Response({'detail': '管理者権限が必要です'}, status=status.HTTP_403_FORBIDDEN)

    target = get_object_or_404(User, id=user_id)
    resumes_qs = Resume.objects.filter(user=target).order_by('-updated_at')
    data = ResumeSerializer(resumes_qs, many=True).data
    return Response(data, status=status.HTTP_200_OK)

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
    # Rate limit login attempts per IP+email: 10 tries / 10 minutes
    email_for_key = (request.data or {}).get('email') if hasattr(request, 'data') else None
    email_for_key = email_for_key or 'unknown'
    if not _rate_limit(request, f"login:{email_for_key}", limit=10, window_seconds=600):
        return Response({'detail': '試行回数が多すぎます。しばらくしてからお試しください。'}, status=429)

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
# ユーザー情報更新エンドポイント
# ============================================================================

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_info(request, user_id):
    """ユーザーの基本情報（email, phone）を更新"""
    try:
        # 自分のプロフィールのみ更新可能
        if str(request.user.id) != user_id:
            return Response({
                'error': '他のユーザーの情報は更新できません'
            }, status=status.HTTP_403_FORBIDDEN)
        
        user = get_object_or_404(User, id=user_id)
        
        # 更新可能なフィールドのみ更新
        if 'email' in request.data:
            user.email = request.data['email']
        if 'phone' in request.data:
            user.phone = request.data['phone']
        
        user.save()
        
        return Response({
            'id': str(user.id),
            'email': user.email,
            'phone': user.phone,
            'message': 'ユーザー情報を更新しました'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"User update error: {str(e)}")
        return Response({
            'error': 'ユーザー情報の更新に失敗しました',
            'detail': str(e) if settings.DEBUG else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# プロフィール関連エンドポイント
# ============================================================================

class SeekerProfileViewSet(viewsets.ModelViewSet):
    """求職者プロフィール ViewSet"""
    serializer_class = SeekerProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SeekerProfile.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        # Check if profile already exists
        if SeekerProfile.objects.filter(user=request.user).exists():
            # Update existing profile instead of creating new one
            instance = SeekerProfile.objects.get(user=request.user)
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Create new profile
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CompanyProfileViewSet(viewsets.ModelViewSet):
    """企業プロフィール ViewSet"""
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CompanyProfile.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        # Check if profile already exists
        if CompanyProfile.objects.filter(user=request.user).exists():
            # Update existing profile instead of creating new one
            instance = CompanyProfile.objects.get(user=request.user)
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            # Create new profile
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
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


class ResumeFileViewSet(viewsets.ModelViewSet):
    """履歴書ファイル ViewSet（アップロード/一覧/削除）"""
    serializer_class = ResumeFileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return ResumeFile.objects.filter(user=self.request.user).order_by('-uploaded_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """multipart/form-data でのファイルアップロード対応"""
        if 'file' not in request.FILES:
            return Response({'detail': 'file is required'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded = request.FILES['file']
        data = {
            'file': uploaded,
            'original_name': getattr(uploaded, 'name', ''),
            'content_type': getattr(uploaded, 'content_type', ''),
            'size': getattr(uploaded, 'size', 0),
            'description': request.data.get('description', ''),
        }

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


# ============================================================================
# 検索・マッチング関連エンドポイント
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_seekers_v2(request):
    """求職者検索 API v2"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        if request.user.role != 'company':
            return Response({
                'detail': 'この機能は企業ユーザーのみ利用可能です'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # クエリパラメーター取得
        keyword = request.GET.get('keyword', '')
        prefecture = request.GET.get('prefecture', '')
        industry = request.GET.get('industry', '')
        # 複数指定（CSVまたは多重キー）
        def get_list_param(name):
            values = request.GET.getlist(name)
            if values:
                flat = []
                for v in values:
                    if isinstance(v, str) and ',' in v:
                        flat.extend([s.strip() for s in v.split(',') if s.strip()])
                    elif v:
                        flat.append(v)
                return flat
            csv = request.GET.get(name, '')
            if csv:
                return [s.strip() for s in csv.split(',') if s.strip()]
            return []
        prefectures = get_list_param('prefectures')
        industries = get_list_param('industries')
        # 希望条件（新規追加）
        desired_locations = get_list_param('desired_locations')
        desired_industries = get_list_param('desired_industries')
        experience_years_min = request.GET.get('experience_years_min')
        experience_years_max = request.GET.get('experience_years_max')
        min_experience = request.GET.get('min_experience')  # 互換性のため
        max_experience = request.GET.get('max_experience')  # 互換性のため
        desired_job = request.GET.get('desired_job', '')
        min_salary = request.GET.get('min_salary')
        max_salary = request.GET.get('max_salary')
        
        # 検索クエリ構築
        queryset = SeekerProfile.objects.select_related('user')
        
        if keyword:
            # スキルや自己PRにキーワードが含まれる履歴書を持つ求職者
            from django.db.models import Q
            queryset = queryset.filter(
                Q(user__resumes__skills__icontains=keyword) |
                Q(user__resumes__self_pr__icontains=keyword)
            )
        
        # 居住地 or 希望勤務地
        if prefecture or prefectures or desired_locations:
            from django.db.models import Q
            pref_q = Q()
            if prefecture:
                pref_q |= Q(prefecture=prefecture)
            if prefectures:
                pref_q |= Q(prefecture__in=prefectures)
            if desired_locations:
                # DBによりJSON contains可否が異なるため分岐
                if connection.vendor == 'postgresql':
                    for loc in desired_locations:
                        pref_q |= Q(user__resumes__desired_locations__contains=[loc])
                else:
                    for loc in desired_locations:
                        pref_q |= Q(user__resumes__desired_locations__icontains=loc)
            queryset = queryset.filter(pref_q)
        
        # 経験業界 or 希望業界
        if industry or industries or desired_industries:
            from django.db.models import Q
            ind_q = Q()
            if industry:
                ind_q |= Q(user__resumes__experiences__industry=industry)
            if industries:
                ind_q |= Q(user__resumes__experiences__industry__in=industries)
            if desired_industries:
                if connection.vendor == 'postgresql':
                    for ind in desired_industries:
                        ind_q |= Q(user__resumes__desired_industries__contains=[ind])
                else:
                    for ind in desired_industries:
                        ind_q |= Q(user__resumes__desired_industries__icontains=ind)
            queryset = queryset.filter(ind_q)

        # 職種（希望職種）
        if desired_job:
            queryset = queryset.filter(
                user__resumes__desired_job__icontains=desired_job
            )
        
        # 経験年数フィルター
        if experience_years_min:
            try:
                queryset = queryset.filter(experience_years__gte=int(experience_years_min))
            except ValueError:
                pass
        elif min_experience:  # 互換性
            try:
                queryset = queryset.filter(experience_years__gte=int(min_experience))
            except ValueError:
                pass
        
        if experience_years_max:
            try:
                queryset = queryset.filter(experience_years__lte=int(experience_years_max))
            except ValueError:
                pass
        elif max_experience:  # 互換性
            try:
                queryset = queryset.filter(experience_years__lte=int(max_experience))
            except ValueError:
                pass
        
        # 年収（希望年収）
        if min_salary or max_salary:
            # 数値にキャストして比較（不正値は除外）
            queryset = queryset.annotate(
                desired_salary_int=Cast('desired_salary', IntegerField())
            )
            if min_salary:
                try:
                    queryset = queryset.filter(desired_salary_int__gte=int(min_salary))
                except ValueError:
                    pass
            if max_salary:
                try:
                    queryset = queryset.filter(desired_salary_int__lte=int(max_salary))
                except ValueError:
                    pass

        # 重複排除
        queryset = queryset.distinct()
        
        # ページネーション
        try:
            page_size = int(request.GET.get('page_size', 20))
            page = int(request.GET.get('page', 1))
        except ValueError:
            page_size = 20
            page = 1
        
        start = (page - 1) * page_size
        end = start + page_size
        
        # カウントを先に取得
        total_count = queryset.count()
        
        # 結果を取得
        results = queryset[start:end]
        
        # レスポンス生成
        serializer = SeekerProfileSerializer(results, many=True)
        
        return Response({
            'results': serializer.data,
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size if page_size > 0 else 0
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return Response({
            'error': 'Internal server error',
            'detail': str(e) if settings.DEBUG else 'An error occurred during search'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# スカウト・応募関連エンドポイント
# ============================================================================

class JobPostingViewSet(viewsets.ModelViewSet):
    """求人投稿 ViewSet"""
    serializer_class = JobPostingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'company':
            # 企業は自分の求人を管理
            return JobPosting.objects.filter(company=user)
        else:
            # 求職者は公開されている求人を閲覧
            return JobPosting.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        # 企業のみ求人投稿可能
        if self.request.user.role != 'company':
            raise serializers.ValidationError('企業のみ求人を投稿できます')
        serializer.save(company=self.request.user)


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
            # perform_create should not return a Response; raise instead
            raise PermissionDenied('求職者のみ応募できます')


class ScoutViewSet(viewsets.ModelViewSet):
    """スカウト ViewSet"""
    serializer_class = ScoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'company':
            # 企業は自分が送ったスカウトを取得
            return Scout.objects.filter(company=self.request.user).select_related('seeker', 'seeker__seeker_profile')
        elif self.request.user.role == 'user':
            # 求職者は自分が受け取ったスカウトを取得
            return Scout.objects.filter(seeker=self.request.user).select_related('company', 'company__company_profile')
        return Scout.objects.none()
    
    def list(self, request, *args, **kwargs):
        """スカウト一覧取得（詳細情報を含む）"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = serializer.data
        else:
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data
        
        # 各スカウトにseeker/companyの詳細情報を追加
        for i, scout in enumerate(queryset if page is None else page):
            if request.user.role == 'company':
                # 企業向け：seeker詳細を追加
                if scout.seeker:
                    seeker_details = {
                        'id': str(scout.seeker.id),
                        'email': scout.seeker.email,
                        'full_name': scout.seeker.full_name,
                        'username': scout.seeker.username,
                    }
                    if hasattr(scout.seeker, 'seeker_profile'):
                        seeker_details.update({
                            'prefecture': scout.seeker.seeker_profile.prefecture,
                            'experience_years': scout.seeker.seeker_profile.experience_years,
                        })
                    data[i]['seeker_details'] = seeker_details
            elif request.user.role == 'user':
                # 求職者向け：company詳細を追加
                if scout.company:
                    company_details = {
                        'id': str(scout.company.id),
                        'email': scout.company.email,
                        'full_name': scout.company.full_name,
                        'username': scout.company.username,
                    }
                    if hasattr(scout.company, 'company_profile'):
                        company_details.update({
                            'company_name': scout.company.company_profile.company_name,
                            'industry': scout.company.company_profile.industry,
                        })
                    data[i]['company_details'] = company_details
        
        if page is not None:
            return self.get_paginated_response(data)
        
        return Response(data)
    
    def retrieve(self, request, *args, **kwargs):
        """スカウト詳細取得（詳細情報を含む）"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # seeker/companyの詳細情報を追加
        if request.user.role == 'company' and instance.seeker:
            seeker_details = {
                'id': str(instance.seeker.id),
                'email': instance.seeker.email,
                'full_name': instance.seeker.full_name,
                'username': instance.seeker.username,
            }
            if hasattr(instance.seeker, 'seeker_profile'):
                seeker_details.update({
                    'prefecture': instance.seeker.seeker_profile.prefecture,
                    'experience_years': instance.seeker.seeker_profile.experience_years,
                })
            data['seeker_details'] = seeker_details
        elif request.user.role == 'user' and instance.company:
            company_details = {
                'id': str(instance.company.id),
                'email': instance.company.email,
                'full_name': instance.company.full_name,
                'username': instance.company.username,
            }
            if hasattr(instance.company, 'company_profile'):
                company_details.update({
                    'company_name': instance.company.company_profile.company_name,
                    'industry': instance.company.company_profile.industry,
                })
            data['company_details'] = company_details
        
        return Response(data)
    
    def create(self, request, *args, **kwargs):
        # 企業のみスカウトを作成可能
        if request.user.role != 'company':
            return Response({
                'detail': '企業のみスカウトを送信できます'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # クレジット残数チェック
        try:
            remaining = request.user.scout_credits_remaining
        except Exception:
            remaining = 0
        if remaining <= 0:
            return Response({
                'error': 'insufficient_credits',
                'detail': 'スカウトの残り送信可能数がありません。追加100通（¥10,000）の購入をご検討ください。',
                'purchase_url': '/companyinfo/payment'
            }, status=402)
        
        # companyフィールドを自動設定
        data = request.data.copy()
        data['company'] = request.user.id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # 送信成功時に使用数をインクリメント
        try:
            request.user.scout_credits_used = int(request.user.scout_credits_used) + 1
            request.user.save(update_fields=['scout_credits_used'])
        except Exception:
            pass
        
        # レスポンスにseekerの詳細情報を含める
        scout_data = serializer.data
        scout = serializer.instance
        
        # Seekerの詳細情報を追加
        if scout.seeker:
            try:
                seeker_profile = SeekerProfile.objects.get(user=scout.seeker)
                scout_data['seeker_details'] = {
                    'id': str(scout.seeker.id),
                    'email': scout.seeker.email,
                    'full_name': scout.seeker.full_name,
                    'profile': SeekerProfileSerializer(seeker_profile).data if seeker_profile else None
                }
            except SeekerProfile.DoesNotExist:
                scout_data['seeker_details'] = {
                    'id': str(scout.seeker.id),
                    'email': scout.seeker.email,
                    'full_name': scout.seeker.full_name,
                    'profile': None
                }
        
        return Response(scout_data, status=status.HTTP_201_CREATED)
    
    def perform_create(self, serializer):
        serializer.save(company=self.request.user)
    
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

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """スカウトに返信マーク（簡易）"""
        scout = self.get_object()
        # 求職者のみが自身の受け取ったスカウトに対して返信可能
        if request.user.role != 'user' or scout.seeker_id != request.user.id:
            return Response({'detail': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        scout.responded_at = datetime.datetime.now()
        scout.status = 'responded'
        scout.save()
        return Response({'message': '返信済みにしました'}, status=status.HTTP_200_OK)


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
            'recent_activities': [],
            'scout_credits_total': getattr(user, 'scout_credits_total', 0),
            'scout_credits_used': getattr(user, 'scout_credits_used', 0),
            'scout_credits_remaining': getattr(user, 'scout_credits_remaining', 0),
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


# ============================================================================
# 添削（ユーザー↔管理者）メッセージ API ー 既存 Message テーブルを活用
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def advice_messages(request):
    """
    ユーザーと管理者（is_staff）間のメッセージスレッドを簡易提供。
    - GET  : メッセージ一覧取得（subject='resume_advice' 限定）。
             管理者は `user_id` クエリで対象ユーザーを指定。一般ユーザーは最初の管理者が相手。
    - POST : メッセージ送信。body: { content, user_id? }
    既存の Message モデルと通知を利用するため、新規テーブルは不要。
    """
    from django.db.models import Q

    # subject はタブや種別（例: resume_advice, interview, advice）を区別するために使用
    DEFAULT_SUBJECT = 'resume_advice'
    subject_param = request.GET.get('subject') if request.method == 'GET' else (request.data or {}).get('subject')
    SUBJECT = subject_param or DEFAULT_SUBJECT

    # 対向ユーザーの決定
    def resolve_counterpart(for_user, specified_user_id=None):
        if for_user.is_staff:
            if not specified_user_id:
                return None
            try:
                # 管理者→指定ユーザー
                return User.objects.get(id=specified_user_id)
            except User.DoesNotExist:
                return None
        else:
            # 一般ユーザー→最初の管理者（存在しない場合は None）
            return User.objects.filter(is_staff=True).order_by('date_joined').first()

    if request.method == 'GET':
        user_id = request.GET.get('user_id')
        # 管理者は対象ユーザーを必須にして相互のメッセージのみ返す
        if request.user.is_staff:
            counterpart = resolve_counterpart(request.user, user_id)
            if counterpart is None:
                return Response({'error': 'counterpart_not_found'}, status=status.HTTP_404_NOT_FOUND)
            # 管理者は「自分宛てのもの」に限定せず、対象ユーザー×全管理者のやり取りを一覧できるようにする。
            # これにより、最初の管理者以外が閲覧してもメッセージが見える。
            qs = Message.objects.filter(subject=SUBJECT).filter(
                Q(sender=counterpart, receiver__is_staff=True) |
                Q(sender__is_staff=True, receiver=counterpart)
            ).order_by('created_at')
            return Response(MessageSerializer(qs, many=True).data)

        # 一般ユーザー: どの管理者とのやり取りでも一覧できるよう、相手を限定しない
        qs = Message.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        ).filter(
            Q(sender__is_staff=True) | Q(receiver__is_staff=True)
        ).filter(subject=SUBJECT).order_by('created_at')

        return Response(MessageSerializer(qs, many=True).data)

    # POST
    content = (request.data or {}).get('content', '').strip()
    user_id = (request.data or {}).get('user_id')
    if not content:
        return Response({'error': 'content_required'}, status=status.HTTP_400_BAD_REQUEST)

    counterpart = resolve_counterpart(request.user, user_id)
    if counterpart is None:
        return Response({'error': 'counterpart_not_found'}, status=status.HTTP_404_NOT_FOUND)

    # Optional: link to Annotation
    annotation = None
    data = request.data or {}
    ann_id = data.get('annotation_id')
    if ann_id:
        try:
            annotation = Annotation.objects.get(id=ann_id)
        except Annotation.DoesNotExist:
            annotation = None
    elif isinstance(data.get('annotation'), dict):
        ann_payload = data.get('annotation')
        try:
            resume = Resume.objects.get(id=ann_payload.get('resume'))
            if request.user.is_staff or str(resume.user_id) == str(request.user.id):
                annotation = Annotation.objects.create(
                    resume=resume,
                    subject=ann_payload.get('subject') or SUBJECT,
                    anchor_id=ann_payload.get('anchor_id') or '',
                    start_offset=int(ann_payload.get('start_offset') or 0),
                    end_offset=int(ann_payload.get('end_offset') or 0),
                    quote=ann_payload.get('quote') or '',
                    selector_meta=ann_payload.get('selector_meta') or {},
                    created_by=request.user,
                )
        except Resume.DoesNotExist:
            pass

    msg = Message.objects.create(
        sender=request.user,
        receiver=counterpart,
        subject=SUBJECT,
        content=content,
        annotation=annotation,
    )
    return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def advice_notifications(request):
    """管理者→ユーザー向けアドバイス系メッセージの未読サマリを返す。

    subjects = ['resume_advice', 'advice', 'interview']
    返却例:
    {
      'resume_advice': { 'unread': 2, 'latest_at': '2025-09-13T12:34:56Z' },
      'advice': { 'unread': 0, 'latest_at': null },
      'interview': { 'unread': 1, 'latest_at': '...' },
      'total_unread': 3
    }
    """
    subjects = ['resume_advice', 'advice', 'interview']
    data = {}
    total = 0
    for sub in subjects:
        qs = Message.objects.filter(
            receiver=request.user,
            subject=sub,
            is_read=False,
            sender__is_staff=True,
        ).order_by('-created_at')
        count = qs.count()
        latest = qs.first().created_at if count > 0 else None
        data[sub] = {
            'unread': count,
            'latest_at': latest,
        }
        total += count
    data['total_unread'] = total
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def advice_mark_read(request):
    """アドバイス系メッセージを既読化。body: { subject?: 'resume_advice'|'advice'|'interview' }
    未指定の場合は全件。
    返却: advice_notifications と同じサマリ
    """
    allowed = {'resume_advice', 'advice', 'interview'}
    subject = (request.data or {}).get('subject')
    qs = Message.objects.filter(
        receiver=request.user,
        is_read=False,
        sender__is_staff=True,
    )
    if subject in allowed:
        qs = qs.filter(subject=subject)
    # 既読更新
    qs.update(is_read=True, read_at=timezone.now())
    # 最新のサマリを返す
    return advice_notifications(request)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def advice_annotations(request):
    """注釈一覧/作成。
    GET: /api/v2/advice/annotations/?resume_id=...&subject=...
    POST: { resume, subject, anchor_id, start_offset, end_offset, quote?, selector_meta? }
    権限: 注釈対象の履歴書の所有者 or is_staff
    """
    def can_access(user, resume: Resume) -> bool:
        return user.is_staff or str(resume.user_id) == str(user.id)

    if request.method == 'GET':
        resume_id = request.GET.get('resume_id')
        subject = request.GET.get('subject') or 'resume_advice'
        if not resume_id:
            return Response({'error': 'resume_id_required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            resume = Resume.objects.get(id=resume_id)
        except Resume.DoesNotExist:
            return Response({'error': 'resume_not_found'}, status=status.HTTP_404_NOT_FOUND)
        if not can_access(request.user, resume):
            return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)
        qs = Annotation.objects.filter(resume=resume, subject=subject).order_by('created_at')
        return Response(AnnotationSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    # POST
    data = request.data or {}
    try:
        resume = Resume.objects.get(id=data.get('resume'))
    except Resume.DoesNotExist:
        return Response({'error': 'resume_not_found'}, status=status.HTTP_404_NOT_FOUND)
    if not can_access(request.user, resume):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    ann = Annotation.objects.create(
        resume=resume,
        subject=data.get('subject') or 'resume_advice',
        anchor_id=data.get('anchor_id') or '',
        start_offset=int(data.get('start_offset') or 0),
        end_offset=int(data.get('end_offset') or 0),
        quote=data.get('quote') or '',
        selector_meta=data.get('selector_meta') or {},
        created_by=request.user,
    )
    return Response(AnnotationSerializer(ann).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def advice_annotation_detail(request, annotation_id):
    """注釈の更新（主に解決/再オープン）"""
    try:
        ann = Annotation.objects.select_related('resume', 'resume__user').get(id=annotation_id)
    except Annotation.DoesNotExist:
        return Response({'error': 'not_found'}, status=status.HTTP_404_NOT_FOUND)
    if not (request.user.is_staff or str(ann.resume.user_id) == str(request.user.id)):
        return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data or {}
    if 'is_resolved' in data:
        value = bool(data['is_resolved'])
        ann.is_resolved = value
        ann.resolved_at = timezone.now() if value else None
        ann.resolved_by = request.user if value else None
    # 位置の微調整（任意）
    for key in ['start_offset', 'end_offset', 'anchor_id', 'selector_meta', 'quote', 'subject']:
        if key in data:
            setattr(ann, key, data[key])
    ann.save()
    return Response(AnnotationSerializer(ann).data, status=status.HTTP_200_OK)


# ============================================================================
# 企業 ↔ 求職者 メッセージAPI（既存 Message モデルを利用）
# ============================================================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def company_messages(request):
    from django.db.models import Q

    # 企業ユーザーのみ（is_staffは除外）
    if getattr(request.user, 'role', None) != 'company':
        return Response({'error': 'company_only'}, status=status.HTTP_403_FORBIDDEN)

    DEFAULT_SUBJECT = 'company'
    SUBJECT = (request.GET.get('subject') if request.method == 'GET' else (request.data or {}).get('subject')) or DEFAULT_SUBJECT

    if request.method == 'GET':
        seeker_id = request.GET.get('user_id')
        if not seeker_id:
            return Response({'error': 'user_id_required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            seeker = User.objects.get(id=seeker_id)
        except User.DoesNotExist:
            return Response({'error': 'user_not_found'}, status=status.HTTP_404_NOT_FOUND)

        qs = Message.objects.filter(subject=SUBJECT).filter(
            Q(sender=request.user, receiver=seeker) | Q(sender=seeker, receiver=request.user)
        ).order_by('created_at')
        return Response(MessageSerializer(qs, many=True).data)

    # POST: { user_id, content, scout_id?, application_id?, subject? }
    data = request.data or {}
    seeker_id = data.get('user_id')
    content = (data.get('content') or '').strip()
    if not seeker_id or not content:
        return Response({'error': 'user_id_and_content_required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        seeker = User.objects.get(id=seeker_id)
    except User.DoesNotExist:
        return Response({'error': 'user_not_found'}, status=status.HTTP_404_NOT_FOUND)

    msg_kwargs = {
        'sender': request.user,
        'receiver': seeker,
        'subject': SUBJECT,
        'content': content,
    }
    if data.get('scout_id'):
        try:
            msg_kwargs['scout'] = Scout.objects.get(id=data['scout_id'])
        except Scout.DoesNotExist:
            pass
    if data.get('application_id'):
        try:
            msg_kwargs['application'] = Application.objects.get(id=data['application_id'])
        except Application.DoesNotExist:
            pass

    msg = Message.objects.create(**msg_kwargs)
    return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


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

@api_view(['GET'])
@permission_classes([AllowAny])
def user_public_resumes(request, user_id):
    """
    公開ユーザーの履歴書一覧
    GET /api/v2/users/{user_id}/resumes/
    - 本人: すべての履歴書
    - 他人: プロフィールが公開かつ履歴書公開設定が有効な場合、is_active=True の履歴書のみ
    """
    from .models import UserPrivacySettings, Resume

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    is_owner = request.user.is_authenticated and str(request.user.id) == str(user_id)

    privacy, _ = UserPrivacySettings.objects.get_or_create(user=user)

    if not is_owner:
        if not privacy.is_profile_public:
            return Response({'error': 'This profile is private'}, status=status.HTTP_403_FORBIDDEN)
        if not privacy.show_resumes:
            return Response([], status=status.HTTP_200_OK)

    if is_owner:
        resumes_qs = Resume.objects.filter(user=user).order_by('-updated_at')
    else:
        resumes_qs = Resume.objects.filter(user=user, is_active=True).order_by('-updated_at')

    data = ResumeSerializer(resumes_qs, many=True).data
    if not is_owner:
        for r in data:
            r.pop('user_email', None)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def user_public_resume_detail(request, user_id, resume_id):
    """
    公開ユーザーの履歴書詳細
    GET /api/v2/users/{user_id}/resumes/{resume_id}/
    - 本人: 自分の履歴書を閲覧可能
    - 他人: プロフィール公開かつ履歴書公開設定が有効、かつ該当履歴書が is_active=True の場合のみ
    """
    from .models import UserPrivacySettings, Resume

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        resume = Resume.objects.get(id=resume_id, user=user)
    except Resume.DoesNotExist:
        return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)

    is_owner = request.user.is_authenticated and str(request.user.id) == str(user_id)

    privacy, _ = UserPrivacySettings.objects.get_or_create(user=user)

    if not is_owner:
        if not privacy.is_profile_public or not privacy.show_resumes or not resume.is_active:
            return Response({'error': 'This resume is not publicly available'}, status=status.HTTP_403_FORBIDDEN)

    data = ResumeSerializer(resume).data
    if not is_owner:
        data.pop('user_email', None)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_view_user_resumes(request, user_id):
    """
    企業が求職者の公開用履歴書を参照するためのエンドポイント。
    - 企業ロールのみアクセス可能
    - プライバシー設定に関わらず is_active=True の履歴書をサニタイズして返却
    - 連絡先など識別可能な情報は含めない
    """
    if getattr(request.user, 'role', None) != 'company':
        return Response({'error': 'Company role required'}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    resumes_qs = Resume.objects.filter(user=user, is_active=True).order_by('-updated_at')
    data = ResumeSerializer(resumes_qs, many=True).data
    for r in data:
        r.pop('user_email', None)
    return Response(data, status=status.HTTP_200_OK)


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
# 企業 月次ページ API
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_monthly_current(request):
    """
    今月分の月次ページを取得（なければ作成）
    GET /api/v2/company/monthly/current/
    """
    if request.user.role != 'company':
        return Response({'error': 'This endpoint is for companies only'}, status=status.HTTP_403_FORBIDDEN)

    today = datetime.date.today()
    page, created = CompanyMonthlyPage.objects.get_or_create(
        company=request.user, year=today.year, month=today.month,
        defaults={'title': f'{today.year}年{today.month}月のページ', 'content': {}}
    )
    serializer = CompanyMonthlyPageSerializer(page)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def company_monthly_list(request):
    """
    自社の月次ページ一覧
    GET /api/v2/company/monthly/
    """
    if request.user.role != 'company':
        return Response({'error': 'This endpoint is for companies only'}, status=status.HTTP_403_FORBIDDEN)
    pages = CompanyMonthlyPage.objects.filter(company=request.user).order_by('-year', '-month')
    serializer = CompanyMonthlyPageSerializer(pages, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def company_monthly_detail(request, year: int, month: int):
    """
    指定年月の月次ページ取得・更新
    GET /api/v2/company/monthly/<year>/<month>/
    PUT /api/v2/company/monthly/<year>/<month>/
    """
    if request.user.role != 'company':
        return Response({'error': 'This endpoint is for companies only'}, status=status.HTTP_403_FORBIDDEN)

    page = CompanyMonthlyPage.objects.filter(company=request.user, year=year, month=month).first()
    if not page:
        if request.method == 'GET':
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        # PUTのときは作成して更新扱い
        page = CompanyMonthlyPage.objects.create(company=request.user, year=year, month=month, title=f'{year}年{month}月のページ', content={})

    if request.method == 'GET':
        serializer = CompanyMonthlyPageSerializer(page)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if request.method == 'PUT':
        serializer = CompanyMonthlyPageSerializer(page, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(company=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
            allowed_fields = ['full_name', 'phone', 'kana', 'plan_tier', 'is_premium', 'premium_expiry']
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
