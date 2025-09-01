from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView
)

from .views_api import (
    health_check, RegisterView, LoginView, LogoutView, UserProfileView,
    SeekerProfileViewSet, ResumeViewSet, ExperienceViewSet,
    ApplicationViewSet, ScoutViewSet, MessageViewSet,
    PaymentViewSet, search_seekers, dashboard_stats,
    search_companies, get_company_detail, 
    create_stripe_checkout_session, get_admin_seekers
)
from . import views_api_v2

router = DefaultRouter()
router.register(r'seeker-profiles', SeekerProfileViewSet, basename='seeker-profile')
router.register(r'resumes', ResumeViewSet, basename='resume')
router.register(r'experiences', ExperienceViewSet, basename='experience')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'scouts', ScoutViewSet, basename='scout')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    # ヘルスチェック（認証不要）
    path('', health_check, name='health-check'),
    
    # 認証
    path('auth/register/', RegisterView.as_view(), name='api-register'),
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/logout/', LogoutView.as_view(), name='api-logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    
    # ユーザープロフィール
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    
    # 検索・統計
    path('search/seekers/', search_seekers, name='search-seekers'),
    path('search/companies/', search_companies, name='search-companies'),
    path('companies/<str:company_id>/', get_company_detail, name='company-detail'),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    
    # 決済
    path('payments/checkout/', create_stripe_checkout_session, name='stripe-checkout'),
    
    # 管理者用
    path('admin/seekers/', get_admin_seekers, name='admin-seekers'),
    
    # 新しい管理者API（v2からインポート）
    path('admin/seminars/', views_api_v2.admin_seminars, name='admin-seminars'),
    path('admin/publications/', views_api_v2.admin_publications, name='admin-publications'),
    path('admin/news/', views_api_v2.admin_news, name='admin-news'),
    
    # ViewSet ルート
    path('', include(router.urls)),
]