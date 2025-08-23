"""
URL configuration for back project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # 統一されたREST APIエンドポイント
    path('api/v1/', include('core.urls_api')),
]