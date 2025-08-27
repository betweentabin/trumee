"""
Custom JWT Authentication for Django REST Framework
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
        
        # Verify token
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            # Get user from database
            user_id = payload.get("user_id")
            if not user_id:
                raise AuthenticationFailed("Invalid token payload")
            
            try:
                user = User.objects.get(id=user_id)
                if not user.is_active:
                    raise AuthenticationFailed("User is not active")
                
                # Add extra info to user object
                user.user_role = payload.get("role")
                return (user, token)
            except User.DoesNotExist:
                raise AuthenticationFailed("User not found")
                
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid token")
    
    def authenticate_header(self, request):
        return 'Bearer'