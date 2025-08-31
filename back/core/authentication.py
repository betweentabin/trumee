"""
Custom JWT Authentication for Django REST Framework
Uses custom JWT tokens generated in views_api_v2.py
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
import jwt
import os

User = get_user_model()

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "default-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


class JWTAuthentication(BaseAuthentication):
    """
    Custom JWT Authentication class for DRF ViewSets
    Compatible with custom JWT tokens from views_api_v2.py
    """
    
    def authenticate(self, request):
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            return None
        
        # Extract token (format: "Bearer <token>")
        try:
            token_type, token = auth_header.split(" ")
            if token_type.lower() != "bearer":
                return None
        except ValueError:
            return None
        
        # Verify token using PyJWT (same as views_api_v2.py)
        try:
            # Decode and validate the token
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            # Get user from database
            user_id = payload.get('user_id')
            if not user_id:
                raise AuthenticationFailed("Token is invalid or expired")
            
            try:
                user = User.objects.get(id=user_id)
                if not user.is_active:
                    raise AuthenticationFailed("User is not active")
                
                return (user, token)
            except User.DoesNotExist:
                raise AuthenticationFailed("User not found")
                
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token is invalid or expired")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Token is invalid or expired")
    
    def authenticate_header(self, request):
        return 'Bearer'