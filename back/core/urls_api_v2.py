"""
API v2 URL設定

新しいデータベーススキーマに対応したAPIエンドポイント
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_api_v2
from . import views_api  # reuse Stripe checkout in v2 namespace
from . import views_api_v2

# DRF Router設定
router = DefaultRouter()
router.register(r'seeker-profiles', views_api_v2.SeekerProfileViewSet, basename='seekerprofile')
router.register(r'company-profiles', views_api_v2.CompanyProfileViewSet, basename='companyprofile')
router.register(r'resumes', views_api_v2.ResumeViewSet, basename='resume')
router.register(r'experiences', views_api_v2.ExperienceViewSet, basename='experience')
router.register(r'educations', views_api_v2.EducationViewSet, basename='education')
router.register(r'certifications', views_api_v2.CertificationViewSet, basename='certification')
router.register(r'resume-files', views_api_v2.ResumeFileViewSet, basename='resumefile')
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

    # 管理者
    path('admin/seekers/', views_api_v2.admin_seekers_v2, name='admin-seekers-v2'),
    path('admin/users/', views_api_v2.admin_users_v2, name='admin-users-v2'),
    path('admin/users/<uuid:user_id>/overview/', views_api_v2.admin_user_overview, name='admin-user-overview'),
    path('admin/users/<uuid:user_id>/resumes/', views_api_v2.admin_user_resumes, name='admin-user-resumes'),
    path('admin/users/<uuid:user_id>/plan/', views_api_v2.admin_update_user_plan, name='admin-user-update-plan'),
    
    # プロフィール
    path('profile/me/', views_api_v2.user_profile_v2, name='user-profile-v2'),
    
    # ユーザープロフィール公開API（新規追加）
    path('users/<uuid:user_id>/', views_api_v2.user_public_profile, name='user-public-profile'),
    path('users/<uuid:user_id>/update/', views_api_v2.update_user_info, name='update-user-info'),
    path('users/<uuid:user_id>/privacy/', views_api_v2.user_privacy_settings, name='user-privacy-settings'),
    path('users/<uuid:user_id>/resumes/', views_api_v2.user_public_resumes, name='user-public-resumes'),
    path('users/<uuid:user_id>/resumes/<uuid:resume_id>/', views_api_v2.user_public_resume_detail, name='user-public-resume-detail'),
    
    # 求職者専用エンドポイント
    path('seeker/profile/', views_api_v2.seeker_profile_detail, name='seeker-profile-detail'),
    path('seeker/resumes/', views_api_v2.seeker_resumes_list, name='seeker-resumes-list'),
    path('seeker/scouts/', views_api_v2.seeker_scouts_list, name='seeker-scouts-list'),
    path('seeker/applications/', views_api_v2.seeker_applications_list, name='seeker-applications-list'),
    path('seeker/saved-jobs/', views_api_v2.seeker_saved_jobs, name='seeker-saved-jobs'),
    path('seeker/messages/', views_api_v2.seeker_messages_list, name='seeker-messages-list'),
    
    # 企業専用エンドポイント
    path('company/dashboard/', views_api_v2.company_dashboard, name='company-dashboard'),
    path('company/profile/', views_api_v2.company_profile_detail, name='company-profile-detail'),
    path('company/jobs/new/', views_api_v2.company_jobs_new, name='company-jobs-new'),
    path('company/scouts/', views_api_v2.company_scouts_list, name='company-scouts-list'),
    path('company/applications/', views_api_v2.company_applications_list, name='company-applications-list'),
    path('company/monthly/', views_api_v2.company_monthly_list, name='company-monthly-list'),
    path('company/monthly/current/', views_api_v2.company_monthly_current, name='company-monthly-current'),
    path('company/monthly/<int:year>/<int:month>/', views_api_v2.company_monthly_detail, name='company-monthly-detail'),
    # 企業が求職者の履歴書（公開用サニタイズ）を参照
    path('company/users/<uuid:user_id>/resumes/', views_api_v2.company_view_user_resumes, name='company-view-user-resumes'),
    
    # 共通エンドポイント
    path('user/settings/', views_api_v2.user_settings, name='user-settings'),

    # Jobs: Cap/Tickets (read-only minimal)
    path('jobs/<uuid:job_id>/cap_plan/', views_api_v2.job_cap_plan_detail, name='job-cap-plan-detail'),
    path('jobs/<uuid:job_id>/tickets/', views_api_v2.job_ticket_ledger_detail, name='job-ticket-ledger-detail'),
    # Jobs: Cap/Tickets (mutations)
    path('jobs/<uuid:job_id>/cap_plan/set/', views_api_v2.job_cap_plan_upsert, name='job-cap-plan-upsert'),
    path('jobs/<uuid:job_id>/tickets/issue/', views_api_v2.job_ticket_issue, name='job-ticket-issue'),
    path('jobs/<uuid:job_id>/tickets/consume/', views_api_v2.job_ticket_consume, name='job-ticket-consume'),
    
    # Resume PDF endpoints
    path('resumes/download-pdf/', views_api_v2.download_resume_pdf, name='download-resume-pdf'),
    path('resumes/send-pdf/', views_api_v2.send_resume_pdf, name='send-resume-pdf'),

    # Payments (Stripe)
    path('payments/checkout/', views_api.create_stripe_checkout_session, name='stripe-checkout-v2'),
    path('payments/webhook/', views_api_v2.stripe_webhook, name='stripe-webhook-v2'),
    
    # 添削メッセージ（管理者↔ユーザー）
    path('advice/messages/', views_api_v2.advice_messages, name='advice-messages'),
    path('advice/threads/', views_api_v2.advice_threads, name='advice-threads'),
    path('advice/notifications/', views_api_v2.advice_notifications, name='advice-notifications'),
    path('advice/mark_read/', views_api_v2.advice_mark_read, name='advice-mark-read'),
    # 注釈API
    path('advice/annotations/', views_api_v2.advice_annotations, name='advice-annotations'),
    path('advice/annotations/<uuid:annotation_id>/', views_api_v2.advice_annotation_detail, name='advice-annotation-detail'),

    # 面接質問・テンプレート
    path('interview/categories/', views_api_v2.interview_categories_v2, name='interview-categories'),
    path('interview/questions/', views_api_v2.interview_questions_v2, name='interview-questions'),
    path('interview/personalize/', views_api_v2.interview_personalize_v2, name='interview-personalize'),
    path('templates/render/', views_api_v2.template_render_v2, name='template-render'),

    # 企業↔求職者メッセージ
    path('company/messages/', views_api_v2.company_messages, name='company-messages'),
    
    # ViewSet URLs
    path('', include(router.urls)),
]
