# core/utils.py
from firebase_admin import auth
from django.http import JsonResponse

def verify_token(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, JsonResponse({"detail": "Missing or invalid token"}, status=401)
    try:
        token = auth_header.split(" ")[1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token, None
    except Exception:
        return None, JsonResponse({"detail": "Invalid token"}, status=401)
