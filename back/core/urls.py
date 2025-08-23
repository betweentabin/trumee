from django.urls import path, include
from . import views

urlpatterns = [
    # 新しいREST API (メインAPI)
    path('api/v1/', include('core.urls_api')),
    
    # 旧エンドポイント - 段階的に廃止予定
    # 以下のエンドポイントは新しいREST APIに移行済み
    # 互換性のため一時的に保持していますが、フロントエンドの移行が完了次第削除します
    
    # === 認証関連（api/v1/auth/に移行済み） ===
    # path('auth/register/', views.register_user, name='register'),
    # path('auth/login/', views.login),
    # path('auth/company/register/', views.register_company),
    
    # === 履歴書関連（api/v1/resumes/に移行済み） ===
    # path('seekers/savehistory/', views.save_career_history, name='save_career_history'),
    # path('auth/save-resume/', views.save_resume),
    # path('get-resume-data/', views.get_resume_data),
    # path('auth/history/', views.get_history),
    
    # === プロフィール関連（api/v1/user/profile/に移行済み） ===
    # path('seeker/profile/', views.get_profile_by_uid),
    # path('userinfo/', views.get_userinfo),
    # path('update-password/', views.update_password),
    
    # === 検索関連（api/v1/search/に移行済み） ===
    # path('business/searchseekers/', views.get_all_seekers),
    # path('search/company/', views.get_all_company),
    
    # === 応募・スカウト関連（api/v1/applications/, api/v1/scouts/に移行済み） ===
    # path('seeker/apply/', views.apply_users),
    # path('seeker/apply/cancel/', views.apply_users_cancel),
    # path('seeker/scout/', views.scout_users),
    # path('seeker/scout/cancel/', views.scout_users_cancel),
    # path('business/scout/', views.search_scout_user),
    # path('business/search/applied_users/', views.search_applied_user),
    
    # === メッセージ関連（api/v1/messages/に移行済み） ===
    # path('message/tocompany/', views.message_to_company),
    # path('message/touser/', views.message_to_user),
    # path('message/', views.save_message),
    # path('message/reply/', views.save_message_reply),
    # path('get_all_message/', views.get_all_message),
    
    # === 企業情報関連（api/v1/companies/に移行済み） ===
    # path('fetch/companydata/', views.fetch_company_data),
    # path('save/companyinfo/', views.save_companyinfo),
    
    # === 支払い関連（api/v1/payments/に移行済み） ===
    # path('payment/', views.save_payment_info),
    # path('create-checkout-session/', views.create_checkout_session),
    
    # === 管理者関連（api/v1/admin/に移行済み） ===
    # path('admin/seekers/', views.get_seekers, name='get_seekers'),
    # path('seekers/detail/', views.get_seekers_detail),
]
