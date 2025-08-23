"""
Authentication decorators for API views
"""
from functools import wraps
from django.http import JsonResponse
from rest_framework import status
import jwt
import os

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "default-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def require_auth(view_func):
    """
    Decorator to require JWT authentication for API views
    """
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return JsonResponse(
                {"error": "認証が必要です", "detail": "Authorization header missing"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Extract token (format: "Bearer <token>")
        try:
            token_type, token = auth_header.split(" ")
            if token_type.lower() != "bearer":
                raise ValueError("Invalid token type")
        except ValueError:
            return JsonResponse(
                {"error": "無効な認証形式", "detail": "Invalid authorization format"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verify token
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            # Add user info to request
            request.user_id = payload.get("user_id")
            request.user_email = payload.get("email")
            request.user_role = payload.get("role")
        except jwt.ExpiredSignatureError:
            return JsonResponse(
                {"error": "トークンの有効期限が切れています", "detail": "Token expired"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except jwt.InvalidTokenError:
            return JsonResponse(
                {"error": "無効なトークンです", "detail": "Invalid token"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return view_func(request, *args, **kwargs)
    
    return wrapped_view

def require_role(allowed_roles):
    """
    Decorator to require specific user roles
    
    Usage:
    @require_role(['admin', 'company'])
    def my_view(request):
        ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            # First check authentication
            auth_check = require_auth(lambda r, *a, **k: None)(request)
            if auth_check is not None:
                return auth_check
            
            # Check role
            user_role = getattr(request, 'user_role', None)
            if user_role not in allowed_roles:
                return JsonResponse(
                    {"error": "権限がありません", "detail": f"Role '{user_role}' not allowed"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return view_func(request, *args, **kwargs)
        
        return wrapped_view
    
    return decorator

def optional_auth(view_func):
    """
    Decorator to optionally extract user info from JWT token if present
    Does not require authentication but adds user info if token is valid
    """
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        
        if auth_header:
            try:
                token_type, token = auth_header.split(" ")
                if token_type.lower() == "bearer":
                    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                    # Add user info to request
                    request.user_id = payload.get("user_id")
                    request.user_email = payload.get("email")
                    request.user_role = payload.get("role")
            except (ValueError, jwt.InvalidTokenError):
                # If token is invalid, just continue without user info
                pass
        
        return view_func(request, *args, **kwargs)
    
    return wrapped_view