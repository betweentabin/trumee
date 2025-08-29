"""
URL configuration for back project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # REST APIエンドポイント
    path('api/v1/', include('core.urls_api')),  # 既存API（互換性用）
    path('api/v2/', include('core.urls_api_v2')),  # 新しいAPI
]