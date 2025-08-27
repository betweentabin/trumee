"""
Custom JWT Authentication for Django REST Framework
Uses rest_framework_simplejwt tokens
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


class JWTAuthentication(BaseAuthentication):
    """
    Custom JWT Authentication class for DRF ViewSets
    Compatible with rest_framework_simplejwt tokens
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
        
        # Verify token using simplejwt
        try:
            # Validate the access token
            validated_token = AccessToken(token)
            
            # Get user from database
            user_id = validated_token.get('user_id')
            if not user_id:
                raise AuthenticationFailed("Invalid token payload")
            
            try:
                user = User.objects.get(id=user_id)
                if not user.is_active:
                    raise AuthenticationFailed("User is not active")
                
                return (user, token)
            except User.DoesNotExist:
                raise AuthenticationFailed("User not found")
                
        except TokenError as e:
            raise AuthenticationFailed(str(e))
    
    def authenticate_header(self, request):
        return 'Bearer'