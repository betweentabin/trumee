"""
URL configuration for back project.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.utils import timezone

def health_check(request):
    """Simple health check for Railway"""
    return JsonResponse({
        "status": "ok", 
        "message": "Backend is running",
        "version": "v2",
        "timestamp": timezone.now().isoformat()
    })

urlpatterns = [
    path('', health_check, name='health-check'),  # Root health check
    path('admin/', admin.site.urls),
    # REST APIエンドポイント
    path('api/v1/', include('core.urls_api')),  # 既存API（互換性用）
    path('api/v2/', include('core.urls_api_v2')),  # 新しいAPI
]