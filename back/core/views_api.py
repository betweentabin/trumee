from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import datetime
from django.http import JsonResponse

from .models import (
    User, SeekerProfile, Resume, Experience,
    Application, Scout, Message, Payment
)
from .serializers import (
    UserSerializer, UserRegisterSerializer, CompanyRegisterSerializer,
    LoginSerializer, SeekerProfileSerializer, ResumeSerializer,
    ResumeCreateSerializer, ExperienceSerializer, ApplicationSerializer,
    ScoutSerializer, MessageSerializer, PaymentSerializer
)
from .notifications import (
    send_scout_notification,
    send_application_notification,
    send_application_status_update,
    send_message_notification
)
from .notifications import (
    send_scout_notification,
    send_application_notification,
    send_application_status_update,
    send_message_notification
)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """ヘルスチェック用API（認証不要）"""
    return Response({
        'status': 'ok',
        'message': 'Resume Truemee API is running',
        'timestamp': datetime.now().isoformat(),
    }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """ユーザー登録API"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        role = request.data.get('role', 'user')
        
        if role == 'company':
            serializer = CompanyRegisterSerializer(data=request.data)
        else:
            serializer = UserRegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # JWTトークン生成
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """ログインAPI"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            
            # JWTトークン生成
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """ログアウトAPI"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """ユーザープロフィールAPI"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SeekerProfileViewSet(viewsets.ModelViewSet):
    """求職者プロフィールViewSet"""
    serializer_class = SeekerProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'user':
            return SeekerProfile.objects.filter(user=self.request.user)
        return SeekerProfile.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ResumeViewSet(viewsets.ModelViewSet):
    """履歴書ViewSet"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ResumeCreateSerializer
        return ResumeSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'user':
            return Resume.objects.filter(user=user).prefetch_related('experiences')
        elif user.role == 'company':
            # 企業は応募者の履歴書を閲覧可能
            return Resume.objects.filter(
                Q(user__applications__company=user) |
                Q(user__received_scouts__company=user)
            ).distinct().prefetch_related('experiences')
        
        return Resume.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """履歴書をアクティブにする"""
        resume = self.get_object()
        Resume.objects.filter(user=request.user).update(is_active=False)
        resume.is_active = True
        resume.save()
        return Response({'message': 'Resume activated'})


class ExperienceViewSet(viewsets.ModelViewSet):
    """職歴ViewSet"""
    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'user':
            return Experience.objects.filter(resume__user=self.request.user)
        return Experience.objects.none()


class ApplicationViewSet(viewsets.ModelViewSet):
    """応募ViewSet"""
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'user':
            return Application.objects.filter(applicant=user)
        elif user.role == 'company':
            return Application.objects.filter(company=user)
        
        return Application.objects.none()
    
    def perform_create(self, serializer):
        application = serializer.save(applicant=self.request.user)
        # 応募通知を送信
        send_application_notification(application)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """応募ステータス更新"""
        application = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Application.STATUS_CHOICES):
            old_status = application.status
            application.status = new_status
            if new_status == 'viewed' and not application.viewed_at:
                application.viewed_at = datetime.now()
            application.save()
            
            # ステータス変更通知を送信（初回閲覧以外）
            if old_status != new_status and new_status != 'pending':
                send_application_status_update(application)
            
            return Response({'message': 'Status updated'})
        
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)


class ScoutViewSet(viewsets.ModelViewSet):
    """スカウトViewSet"""
    serializer_class = ScoutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'user':
            return Scout.objects.filter(seeker=user)
        elif user.role == 'company':
            return Scout.objects.filter(company=user)
        
        return Scout.objects.none()
    
    def perform_create(self, serializer):
        scout = serializer.save(company=self.request.user)
        # スカウト通知を送信
        send_scout_notification(scout)
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """スカウト閲覧"""
        scout = self.get_object()
        if not scout.viewed_at:
            scout.viewed_at = datetime.now()
            scout.status = 'viewed'
            scout.save()
        return Response({'message': 'Scout viewed'})
    
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """スカウト返信"""
        scout = self.get_object()
        scout.responded_at = datetime.now()
        scout.status = 'responded'
        scout.save()
        return Response({'message': 'Scout responded'})


class MessageViewSet(viewsets.ModelViewSet):
    """メッセージViewSet"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        # メッセージ通知を送信
        send_message_notification(message)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """未読メッセージ数"""
        count = Message.objects.filter(
            receiver=request.user,
            is_read=False
        ).count()
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """既読にする"""
        message = self.get_object()
        if message.receiver == request.user:
            message.is_read = True
            message.read_at = datetime.now()
            message.save()
            return Response({'message': 'Message marked as read'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)


class PaymentViewSet(viewsets.ModelViewSet):
    """支払い情報ViewSet"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # デフォルト支払い方法の設定
        if serializer.validated_data.get('is_default'):
            Payment.objects.filter(user=self.request.user).update(is_default=False)
        serializer.save(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_seekers(request):
    """求職者検索API"""
    print(f"DEBUG: User email: {request.user.email}, Role: {request.user.role}, Is authenticated: {request.user.is_authenticated}")
    print(f"DEBUG: User model class: {request.user.__class__.__name__}")
    print(f"DEBUG: User role type: {type(request.user.role)}, value: '{request.user.role}'")
    
    if request.user.role != 'company':
        return Response({
            'error': 'Permission denied', 
            'user_role': request.user.role,
            'user_email': request.user.email,
            'expected_role': 'company'
        }, status=status.HTTP_403_FORBIDDEN)
    
    query = request.GET.get('q', '')
    skills = request.GET.get('skills', '')
    location = request.GET.get('location', '')
    
    seekers = User.objects.filter(role='user')
    
    if query:
        seekers = seekers.filter(
            Q(full_name__icontains=query) |
            Q(email__icontains=query)
        )
    
    if skills:
        seekers = seekers.filter(
            resumes__skills__icontains=skills
        ).distinct()
    
    if location:
        seekers = seekers.filter(
            seeker_profile__prefecture__icontains=location
        )
    
    serializer = UserSerializer(seekers[:50], many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """ダッシュボード統計API"""
    user = request.user
    
    if user.role == 'user':
        stats = {
            'applications': Application.objects.filter(applicant=user).count(),
            'scouts': Scout.objects.filter(seeker=user).count(),
            'unread_messages': Message.objects.filter(receiver=user, is_read=False).count(),
            'profile_views': 0,  # 実装予定
        }
    elif user.role == 'company':
        stats = {
            'applications': Application.objects.filter(company=user).count(),
            'scouts_sent': Scout.objects.filter(company=user).count(),
            'unread_messages': Message.objects.filter(receiver=user, is_read=False).count(),
            'active_jobs': 0,  # 実装予定
        }
    else:
        stats = {}
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_companies(request):
    """企業検索API"""
    from django.db.models import Q
    from rest_framework.pagination import PageNumberPagination
    
    queryset = User.objects.filter(role='company')
    
    # 検索パラメータ
    keyword = request.query_params.get('keyword', '')
    industry = request.query_params.get('industry', '')
    location = request.query_params.get('location', '')
    
    if keyword:
        queryset = queryset.filter(
            Q(company_name__icontains=keyword) |
            Q(company_url__icontains=keyword)
        )
    
    # ページネーション
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(queryset, request)
    
    serializer = UserSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_company_detail(request, company_id):
    """企業詳細情報取得API"""
    try:
        company = User.objects.get(id=company_id, role='company')
        serializer = UserSerializer(company)
        
        # 追加情報を含める
        data = serializer.data
        data['active_scouts'] = Scout.objects.filter(
            company=company, 
            status__in=['sent', 'viewed']
        ).count()
        data['total_applications'] = Application.objects.filter(company=company).count()
        
        return Response(data)
    except User.DoesNotExist:
        return Response(
            {'error': '企業が見つかりません'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_stripe_checkout_session(request):
    """Stripe Checkout Session作成API"""
    import stripe
    from django.conf import settings
    
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    try:
        # プラン情報を取得
        plan_type = request.data.get('plan_type', 'basic')
        
        # プラン別の価格設定
        prices = {
            'basic': 5000,  # 5,000円
            'premium': 10000,  # 10,000円
            'enterprise': 30000,  # 30,000円
        }
        
        amount = prices.get(plan_type, 5000)
        
        # Checkout Session作成
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'jpy',
                    'product_data': {
                        'name': f'Resume Truemee {plan_type.title()} Plan',
                        'description': f'{plan_type.title()}プランの購読',
                    },
                    'unit_amount': amount * 100,  # Stripeは最小単位で扱う
                },
                'quantity': 1,
            }],
            mode='subscription' if plan_type != 'basic' else 'payment',
            success_url='http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:3000/payment/cancel',
            customer_email=request.user.email,
            metadata={
                'user_id': str(request.user.id),
                'plan_type': plan_type,
            }
        )
        
        return Response({
            'checkout_url': session.url,
            'session_id': session.id
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_seekers(request):
    """管理者用求職者一覧API"""
    # 管理者権限チェック
    if not request.user.is_staff:
        return Response(
            {'error': '管理者権限が必要です'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    queryset = User.objects.filter(role='user')
    
    # フィルタリング
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
    paginator.page_size = 50
    page = paginator.paginate_queryset(queryset, request)
    
    serializer = UserSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)