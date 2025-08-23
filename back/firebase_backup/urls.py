from django.urls import path, include
from . import views

urlpatterns = [
    # 新しいREST API
    path('api/v1/', include('core.urls_api')),
    
    # 既存のエンドポイント（互換性のため保持）
    path('auth/register/', views.register_user, name='register'),
    path('auth/login/', views.login),
    # path('auth/company/login/', views.login_company),
    path('seekers/savehistory/', views.save_career_history, name='save_career_history'),
    path('auth/save-resume/', views.save_resume),
    path('seeker/profile/', views.get_profile_by_uid),
    path('auth/history/', views.get_history),
    path('update-password/', views.update_password),
    path('payment/', views.save_payment_info),
    path('get-resume-data/', views.get_resume_data),
    path('userinfo/', views.get_userinfo),
    path('business/searchseekers/', views.get_all_seekers),
    path('search/company/', views.get_all_company),
    path('seeker/apply/', views.apply_users),
    path('seeker/apply/cancel/', views.apply_users_cancel),
    path('seeker/scout/', views.scout_users),
    path('seeker/scout/cancel/', views.scout_users_cancel),
    path('message/tocompany/', views.message_to_company),
    path('message/touser/', views.message_to_user),
    path('fetch/companydata/', views.fetch_company_data),
    path('save/companyinfo/', views.save_companyinfo),
    path('business/scout/', views.search_scout_user),
    path('business/search/applied_users/', views.search_applied_user),
    path('create-checkout-session/', views.create_checkout_session),
    path("admin/seekers/", views.get_seekers, name="get_seekers"),
    path("seekers/detail/", views.get_seekers_detail),
    path("message/", views.save_message),
    path("message/reply/", views.save_message_reply),
    path("get_all_message/", views.get_all_message),
    path('auth/company/register/', views.register_company)
]
