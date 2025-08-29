"""
API v2 URL設定

新しいデータベーススキーマに対応したAPIエンドポイント
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_api_v2

# DRF Router設定
router = DefaultRouter()
router.register(r'seeker-profiles', views_api_v2.SeekerProfileViewSet, basename='seekerprofile')
router.register(r'company-profiles', views_api_v2.CompanyProfileViewSet, basename='companyprofile')
router.register(r'resumes', views_api_v2.ResumeViewSet, basename='resume')
router.register(r'experiences', views_api_v2.ExperienceViewSet, basename='experience')
router.register(r'educations', views_api_v2.EducationViewSet, basename='education')
router.register(r'certifications', views_api_v2.CertificationViewSet, basename='certification')
router.register(r'applications', views_api_v2.ApplicationViewSet, basename='application')
router.register(r'scouts', views_api_v2.ScoutViewSet, basename='scout')

urlpatterns = [
    # テスト用
    path('health/', views_api_v2.health_check_v2, name='health-check-v2'),
    
    # 認証関連
    path('auth/register-user/', views_api_v2.register_user_v2, name='register-user-v2'),
    path('auth/register-company/', views_api_v2.register_company_v2, name='register-company-v2'),
    path('auth/login/', views_api_v2.login_v2, name='login-v2'),
    
    # 検索・マッチング
    path('search/seekers/', views_api_v2.search_seekers_v2, name='search-seekers-v2'),
    
    # ダッシュボード・統計
    path('dashboard/stats/', views_api_v2.dashboard_stats_v2, name='dashboard-stats-v2'),
    
    # プロフィール
    path('profile/me/', views_api_v2.user_profile_v2, name='user-profile-v2'),
    
    # ViewSet URLs
    path('', include(router.urls)),
]
