from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotFound
from firebase_admin import auth as firebase_auth, firestore
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from django.contrib.auth.hashers import check_password
import os
import shutil
from datetime import datetime, timezone
import firebase_admin

from .firebase import db
from .serializers import *
from .auth_decorators import require_auth, require_role, optional_auth
import requests
import bcrypt
import jwt
import datetime

import stripe

from rest_framework.decorators import api_view
from django.http import JsonResponse
from math import ceil
from typing import List, Dict, Any
import smtplib
from email.mime.text import MIMEText

stripe.api_key = settings.STRIPE_SECRET_KEY
import traceback
from django.contrib.auth.hashers import make_password

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "default-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXP_DELTA_SECONDS = int(os.getenv("JWT_EXP_DELTA_SECONDS", str(3600*24*30)))  # token valid for 30 days
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "")

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload  # contains user_id, email, role, exp etc
    except jwt.ExpiredSignatureError:
        return None  # token expired
    except jwt.InvalidTokenError:
        return None  # invalid token


@api_view(['POST'])
def register_user(request):
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        try:
            data = serializer.validated_data

            # 1) Create Firebase Auth user
            user_record = firebase_auth.create_user(
                email=data['email'],
                password=data['password']
            )

            password = make_password(data['password'])

            print(data,'data')
            # 2) Save profile in Firestore
            db.collection("users").document(user_record.uid).set({
                "id": user_record.uid,
                "email": data['email'],
                "full_name": data['full_name'],
                "kana": data['kana'],
                "phone": data['phone'],
                "gender": data['gender'],
                "password": password,
                "role": data['role'],
                "created_at": firestore.SERVER_TIMESTAMP,
            })
            
            # 4) Return both uid and custom_token
            return JsonResponse({
                "message": "User registered",
                "uid": user_record.uid,
                "email": data['email'],
            })

        except firebase_auth.EmailAlreadyExistsError:
            return Response({"detail": "Email already in use"}, status=400)
        except Exception as e:
            return Response({"detail": f"Registration failed: {str(e)}"}, status=500)

    return Response(serializer.errors, status=400)



@api_view(['POST'])
def register_company(request):
    print("Received register_company request")

    try:
        data = request.data
        print("Request data:", data)

        # Firebase Auth user creation

    
        password_hash = make_password(data['pwd'])

        print(password_hash)
        # Firestore save
        db.collection("users").document(data['email']).set({
            "email": data['email'],
            "first_name": data['first_name'],
            "last_name": data['last_name'],
            "phone": data['phone'],
            "company_name": data['company_name'],
            "capital": data['capital'],
            "campaign_code": data['campaign_code'],
            "url": data.get('url', ''),  # optional
            "password": password_hash,
            "role": data['role'],
            "created_at": firestore.SERVER_TIMESTAMP,
        })

        return JsonResponse({"message": "User registered", "email": data['email'], "role": data['role']})

    except firebase_auth.EmailAlreadyExistsError:
        return Response({"detail": "Email already in use"}, status=400)

    except Exception as e:
        return Response({"detail": f"Registration failed: {str(e)}"}, status=500)


def send_registration_link(to_email):
    link = "http://85.131.248.214:3000/auth/history"
    body = f"""
    Thank you for registering.

    To continue your registration, please click the link below:
    {link}
    """

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = "Continue Your Registration"
    msg["From"] = "webdeveloper0330@gmail.com"
    msg["To"] = to_email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("webdeveloper0330@gmail.com", "skwshjdwyd")  # Use App Password
            server.send_message(msg)
        print("Email sent successfully")
    except Exception as e:
        print("Failed to send email:", e)

@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body.decode() or "{}")
        email = data.get("email")
        raw_password = data.get('password')
        print(email,raw_password,'ee')

        if not email or not raw_password:
            return JsonResponse({"detail": "Email and password required"}, status=400)

        # Find user document by email
        users_ref = db.collection("users")
        query = users_ref.where("email", "==", email).limit(1).stream()
        user_doc = next(query, None)
        if not user_doc:
            return JsonResponse({"detail": "User not found"}, status=404)

        user_data = user_doc.to_dict()
        stored_password_hash = user_data.get('password')
        if not stored_password_hash:
            return JsonResponse({"detail": "User password not set"}, status=500)

        # Verify password
        if check_password(raw_password, stored_password_hash):
    # Password correct — issue JWT token
            print('kkk')
            payload = {
                "user_id": user_doc.id,
                "email": email,
                "role": user_data.get("role", ""),
                "exp": datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXP_DELTA_SECONDS)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

            return JsonResponse({
                "message": "Login successful",
                "uid": user_doc.id,
                "email": email,
                "role": user_data.get("role", ""),
                "token": token
            })
        else:
            # Password incorrect
            return JsonResponse({"detail": "Invalid password"}, status=401)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"detail": str(e), "type": type(e).__name__}, status=500)

@api_view(['POST'])
@require_auth
def save_career_history(request):
    data = request.data
    # Use email from authenticated token
    email = request.user_email or data.get("email_or_id")

    try:
        data["email_or_id"] = email
        db.collection("seekers").document(email).set(data)
        return Response({"message": "Seeker profile saved", "uid": email})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@parser_classes([JSONParser])
def save_resume(request):
    # 1. Check Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=401)

    id_token = auth_header.split(" ")[1]

    # 2. Verify token
    try:
        decoded_token = verify_token(id_token)
        email = decoded_token.get("email")
        if not email:
            return Response({"detail": "Email not found in token"}, status=401)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=401)

    # 3. Validate and save resume data
    serializer = ResumeSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        data["email"] = email
        data["submittedAt"] = datetime.utcnow().isoformat()

        db.collection("resumes").document(email).set(data)

        return Response({"status": "success", "message": "Resume saved"})
    else:
        # Log validation errors for debugging
        print(serializer.errors)
        return Response(serializer.errors, status=400)
    

@api_view(['POST'])
def get_profile_by_uid(request):
    uid = request.data.get('uid')
    if not uid:
        return Response({'error': 'UID is required'}, status=400)

    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        return Response({"error": "User not found"}, status=404)

    return Response(user_doc.to_dict())
    
@api_view(['GET'])
def get_history(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=401)

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = verify_token(id_token)
        email = decoded_token.get("email")
        if not email:
            return Response({"detail": "Email not found in token"}, status=401)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=401)

    doc = db.collection("seekers").document(email).get()
    print(doc.to_dict())
    if not doc.exists:
        return Response({"detail": "User not found"}, status=404)

    return Response(doc.to_dict(), status=status.HTTP_200_OK)

@api_view(['GET'])
def get_all_seekers(request):
    print('get all seekers')
    try:
        histories_ref = db.collection("seekers")
        docs = histories_ref.stream()

        seekers = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id  # include document ID if needed
            seekers.append(data)

        return Response(seekers)

    except Exception as e:
        return Response({"detail": f"Failed to fetch seekers: {str(e)}"}, status=500)


@api_view(['GET'])
def get_all_company(request):
    try:
        histories_ref = db.collection("users")
        docs = histories_ref.stream()

        users = []
        for doc in docs:
            data = doc.to_dict()
            if data.get("role") == "company":
                safe_data = {
                    "first_name": data.get("first_name"),
                    "last_name": data.get("last_name"),
                    "company_name": data.get("company_name"),
                    "capital": data.get("capital"),
                    "phone": data.get("phone"),
                    "email_or_id": data.get("email"),
                    "url": data.get("url"),
                    "subscriptions": data.get("subscriptions"),
                    "messages": data.get("messages", []),  # ✅ keep array
                }
                users.append(safe_data)

        return Response(users, status=200)
    except Exception as e:
        return Response({"detail": f"Error fetching companies: {str(e)}"}, status=500)


@api_view(['POST'])
def apply_users(request):
    # 1. Get token from header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    id_token = auth_header.split(" ")[1]

    try:
        # 2. Decode Firebase token to get user email
        decoded_token = verify_token(id_token)
        user_email = decoded_token.get("email")
        if not user_email:
            return Response({"detail": "Email not found in token"}, status=status.HTTP_401_UNAUTHORIZED)
    except firebase_auth.ExpiredIdTokenError:
        return Response({"error": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)
    except firebase_auth.InvalidIdTokenError:
        return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

    users_ref = db.collection("users")
    query = users_ref.where("email", "==", user_email).limit(1)
    results = query.get()

    if not results:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    # Get the document reference from query result
    user_ref = results[0].reference

    # Optional: Debug
    print("Found user doc:", user_ref.id, "for email:", user_email)

    # 4. Update the document
    user_ref.update({"apply": True})
    updated_data = user_ref.get().to_dict()
    print("Updated doc data:", updated_data)


    # 4. Get company email from request body
    company_email = request.data.get("email_or_id")
    if not company_email:
        return Response({"error": "company_email is required"}, status=status.HTTP_400_BAD_REQUEST)
    # 4) Query Firestore to find company document by email
    company_query = db.collection("users").where("email", "==", company_email).limit(1).get()
    if not company_query:
        return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
    company_doc = company_query[0]
    company_ref = company_doc.reference
    # 5) Read existing apply_list or initialize it
    company_data = company_doc.to_dict()
    apply_list = company_data.get("apply_list", [])
    # 6) Append user_email if not already in the list
    if user_email not in apply_list:
        apply_list.append(user_email)
        company_ref.update({"apply_list": apply_list})
    return Response({"message": "Application processed successfully", "data": updated_data}, status=status.HTTP_200_OK)

@api_view(['POST'])
def apply_users_cancel(request):
    # 1. Get token from header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    id_token = auth_header.split(" ")[1]

    try:
        # 2. Decode Firebase token to get user email
        decoded_token = verify_token(id_token)
        user_email = decoded_token.get("email")
        if not user_email:
            return Response({"detail": "Email not found in token"}, status=status.HTTP_401_UNAUTHORIZED)
    except firebase_auth.ExpiredIdTokenError:
        return Response({"error": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)
    except firebase_auth.InvalidIdTokenError:
        return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

    users_ref = db.collection("users")
    query = users_ref.where("email", "==", user_email).limit(1)
    results = query.get()

    if not results:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    # Get the document reference from query result
    user_ref = results[0].reference

    # Optional: Debug
    print("Found user doc:", user_ref.id, "for email:", user_email)

    # 3. Set 'apply' field to False for the user
    user_ref.update({"apply": False})
    updated_data = user_ref.get().to_dict()
    print("Updated user doc data:", updated_data)

    # 4. Get company email from request body
    company_email = request.data.get("email")
    if not company_email:
        return Response({"error": "company_email is required"}, status=status.HTTP_400_BAD_REQUEST)

    # 5. Query Firestore to find company document by email
    company_query = db.collection("users").where("email", "==", company_email).limit(1).get()
    if not company_query:
        return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)

    company_doc = company_query[0]
    company_ref = company_doc.reference

    # 6. Read existing apply_list or initialize it
    company_data = company_doc.to_dict()
    apply_list = company_data.get("apply_list", [])

    # 7. Remove user_email from apply_list if present
    if user_email in apply_list:
        apply_list.remove(user_email)
        company_ref.update({"apply_list": apply_list})

    return Response({"message": "Application cancelled successfully", "data": updated_data}, status=status.HTTP_200_OK)

@api_view(['POST'])
def scout_users(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    id_token = auth_header.split(" ")[1]

    try:
        # 1. Decode Firebase token to get company email
        decoded_token = verify_token(id_token)
        company_email = decoded_token.get("email")
        if not company_email:
            return Response({"detail": "Email not found in token"}, status=status.HTTP_401_UNAUTHORIZED)
    except firebase_auth.ExpiredIdTokenError:
        return Response({"error": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)
    except firebase_auth.InvalidIdTokenError:
        return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

    # 2. Get company document from Firestore and update 'scout' to True
    company_query = db.collection("users").where("email", "==", company_email).limit(1).get()
    if not company_query:
        return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
    company_doc = company_query[0]
    company_ref = company_doc.reference
    company_ref.update({"scout": True})

    # Optional debug
    print("Company", company_email, "updated with scout=True")

    # 3. Get user email from POST body
    user_email = request.data.get("email_or_id")
    if not user_email:
        return Response({"error": "User email is required"}, status=status.HTTP_400_BAD_REQUEST)

    # 4. Find user by email
    user_query = db.collection("users").where("email", "==", user_email).limit(1).get()
    if not user_query:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    user_doc = user_query[0]
    user_ref = user_doc.reference

    # 5. Update user's scout_list
    user_data = user_doc.to_dict()
    scout_list = user_data.get("scout_list", [])

    if company_email not in scout_list:
        scout_list.append(company_email)
        user_ref.update({"scout_list": scout_list})
        print(f"Added {company_email} to {user_email}'s scout_list")

    return Response({
        "message": "Scouting processed successfully",
        "company_email": company_email,
        "scouted_user_email": user_email,
        "updated_scout_list": scout_list
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def scout_users_cancel(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    id_token = auth_header.split(" ")[1]

    try:
        # 1. Decode Firebase token to get company email
        decoded_token = verify_token(id_token)
        company_email = decoded_token.get("email")
        if not company_email:
            return Response({"detail": "Email not found in token"}, status=status.HTTP_401_UNAUTHORIZED)
    except firebase_auth.ExpiredIdTokenError:
        return Response({"error": "Token expired"}, status=status.HTTP_401_UNAUTHORIZED)
    except firebase_auth.InvalidIdTokenError:
        return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

    # 2. Get company document from Firestore and update 'scout' to False
    company_query = db.collection("users").where("email", "==", company_email).limit(1).get()
    if not company_query:
        return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
    company_doc = company_query[0]
    company_ref = company_doc.reference
    company_ref.update({"scout": False})

    print("Company", company_email, "updated with scout=False")

    # 3. Get user email from POST body
    user_email = request.data.get("email_or_id")
    if not user_email:
        return Response({"error": "User email is required"}, status=status.HTTP_400_BAD_REQUEST)

    # 4. Find user by email
    user_query = db.collection("users").where("email", "==", user_email).limit(1).get()
    if not user_query:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    user_doc = user_query[0]
    user_ref = user_doc.reference

    # 5. Remove company_email from user's scout_list
    user_data = user_doc.to_dict()
    scout_list = user_data.get("scout_list", [])

    if company_email in scout_list:
        scout_list.remove(company_email)
        user_ref.update({"scout_list": scout_list})
        print(f"Removed {company_email} from {user_email}'s scout_list")

    return Response({
        "message": "Scouting cancellation processed successfully",
        "company_email": company_email,
        "user_email": user_email,
        "updated_scout_list": scout_list
    }, status=status.HTTP_200_OK)

    
@api_view(['POST'])
def update_password(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    id_token = auth_header.split(" ")[1]

    try:
        # Verify token and get decoded data
        decoded_token = verify_token(id_token)
        email = decoded_token.get("email")
        if not email:
            return Response({"detail": "Email not found in token"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        new_password = request.data.get("newPassword")
 
        hashed_password = make_password(new_password)

        # Update password in Firestore
        users_ref = db.collection("users")
        results = users_ref.where("email", "==", email).limit(1).get()

        if not results:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # 3. Use the found document
        doc = results[0]
        if not doc.exists:
            return Response({"detail": "User not found"}, status=404)

        doc.reference.update({"password": hashed_password})

        return Response({"message": "Password updated successfully"})
    except Exception as e:
        return Response({"detail": f"Server error: {str(e)}"}, status=500)
    

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def save_payment_info(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = verify_token(id_token)
        user_email = decoded_token.get("email")
        if not user_email:
            return Response({"detail": "Email not found in token"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data
    payment_method = data.get('paymentMethod')

    if payment_method == "credit":
        required_fields = ["cardNumber", "cardHolder", "cardExpiry", "cardCvv"]
        if not all(data.get(field) for field in required_fields):
            return Response({"detail": "Missing credit card fields"}, status=status.HTTP_400_BAD_REQUEST)
        payment_data = {field: data[field] for field in required_fields}
        payment_data["paymentMethod"] = "credit"

    elif payment_method == "bank":
        required_fields = ["bankName", "branchName", "accountType", "accountNumber", "accountHolder"]
        if not all(data.get(field) for field in required_fields):
            return Response({"detail": "Missing bank account fields"}, status=status.HTTP_400_BAD_REQUEST)
        payment_data = {field: data[field] for field in required_fields}
        payment_data["paymentMethod"] = "bank"

    else:
        return Response({"detail": "Invalid payment method"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        db.collection("payments").document(user_email).set({
            **payment_data,
            "email": user_email,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })
        return Response({"message": "支払い情報を保存しました。"})
    except Exception as e:
        return Response({"detail": f"保存に失敗しました: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_resume_data(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=401)

    id_token = auth_header.split(" ")[1]

    # Verify token
    try:
        decoded_token = verify_token(id_token)
        email = decoded_token.get("email")
        if not email:
            return Response({"detail": "Email not found in token"}, status=401)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=401)

    # Fetch resume & user data
    try:
        resume_doc = db.collection("resumes").document(email).get()
        resume_data = resume_doc.to_dict() if resume_doc.exists else None

        user_query = db.collection("users").where("email", "==", email).limit(1).get()
        user_data = user_query[0].to_dict() if user_query else None

        return Response({
            "resume": resume_data,
            "user": user_data
        })
    except Exception as e:
        return Response({"detail": f"Error fetching data: {str(e)}"}, status=500)


@api_view(['GET'])
def get_userinfo(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=401)

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = verify_token(id_token)
        email = decoded_token.get("email")
        
        if not email:
            return Response({"detail": "Email not found in token"}, status=401)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=401)

    doc = db.collection("histories").document(email).get()
    if not doc.exists:
        return Response({"detail": "User not found"}, status=404)

    return Response(doc.to_dict(), status=status.HTTP_200_OK)

@api_view(['POST'])
def message_to_company(request):
    # 1) Extract and verify token
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=401)

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = verify_token(id_token)
        email = decoded_token.get("email")
        print(email, 'email')
        if not email:
            return Response({"detail": "Email not found in token"}, status=401)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=401)

    # 2) Find the user in USERS collection
    users_ref = db.collection("users")
    user_query = users_ref.where("email", "==", email).limit(1).stream()
    user_doc = next(user_query, None)
    if not user_doc:
        return JsonResponse({"detail": "User not found"}, status=404)

    user_data = user_doc.to_dict()
    user_name = user_data.get("full_name", "")

    # 3) Parse request body
    try:
        data = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return Response({"detail": "Invalid JSON"}, status=400)

    company_email = data.get("company")
    message_text = data.get("message")
    if not company_email or not message_text:
        return Response({"detail": "Both 'company' and 'message' are required"}, status=400)

    # 4) Find the company in USERS collection
    company_ref = db.collection("users")
    company_query = company_ref.where("email", "==", company_email).limit(1).stream()
    company_doc = next(company_query, None)
    if not company_doc:
        return JsonResponse({"detail": "Company not found"}, status=404)

    company_data = company_doc.to_dict()
    messages = company_data.get("messages", [])

    # Append new message
    messages.append({
        "userName": user_name,
        "message": message_text
    })

    # 5) Update the company document in Firestore
    # company_doc.id is the document ID, so we get a DocumentReference
    db.collection("users").document(company_doc.id).update({"messages": messages})

    return Response({
        "message": "Message sent successfully",
        "company": company_email,
        "messages": messages
    }, status=200)


@api_view(['POST'])
def message_to_user(request):
    # 1) Extract and verify token
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=401)

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = verify_token(id_token)
        email = decoded_token.get("email")
        print(email, 'email')
        if not email:
            return Response({"detail": "Email not found in token"}, status=401)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=401)

    # 2) Find the user in USERS collection
    company_ref = db.collection("users")
    company_query = company_ref.where("email", "==", email).limit(1).stream()
    company_doc = next(company_query, None)
    if not company_doc:
        return JsonResponse({"detail": "User not found"}, status=404)

    company_data = company_doc.to_dict()
    company_name = company_data.get("company_name", "")

    # 3) Parse request body
    try:
        data = json.loads(request.body.decode() or "{}")
    except json.JSONDecodeError:
        return Response({"detail": "Invalid JSON"}, status=400)

    user_email = data.get("user")
    message_text = data.get("message")
    if not user_email or not message_text:
        return Response({"detail": "Both 'company' and 'message' are required"}, status=400)

    # 4) Find the company in USERS collection
    user_ref = db.collection("users")
    user_query = user_ref.where("email", "==", user_email).limit(1).stream()
    user_doc = next(user_query, None)
    if not user_doc:
        return JsonResponse({"detail": "Company not found"}, status=404)

    user_data = user_doc.to_dict()
    print(user_data,'iiiiuuuu')
    messages = user_data.get("messages", [])

    # Append new message
    messages.append({
        "companyName": company_name,
        "message": message_text
    })

    # 5) Update the company document in Firestore
    # company_doc.id is the document ID, so we get a DocumentReference
    db.collection("users").document(user_doc.id).update({"messages": messages})

    return Response({
        "message": "Message sent successfully",
        "user": user_email,
        "messages": messages
    }, status=200)

@api_view(['GET'])
def fetch_company_data(request):
    # 1. Extract and verify token
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=401)

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = verify_token(id_token)
        email = decoded_token.get("email")
        if not email:
            return Response({"detail": "Email not found in token"}, status=401)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=401)

    # 2. Query Firestore for the user
    users_ref = db.collection("users")
    results = users_ref.where("email", "==", email).limit(1).get()

    if not results:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    # 3. Use the found document
    doc = results[0]
    if not doc.exists:
        return Response({"detail": "User not found"}, status=404)

    user_data = doc.to_dict()

    # Optional debug log
    print(f"Found user doc ID: {doc.id}, email: {email}")
    print("User data:", user_data)

    return Response(user_data, status=status.HTTP_200_OK)

@api_view(['POST'])
def save_companyinfo(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=401)

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = verify_token(id_token)
        email = decoded_token.get("email")
        if not email:
            return Response({"detail": "Email not found in token"}, status=401)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=401)

    serializer = CompanyUpdateSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        data["email"] = email

        db.collection("users").document(email).set(data)

        return Response({"status": "success", "message": "Resume saved"})
    else:
        print(serializer.errors)
        return Response(serializer.errors, status=400)


@api_view(['GET'])
def search_scout_user(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=401)

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = verify_token(id_token)
        user_email = decoded_token.get("email")
        if not user_email:
            return Response({"detail": "Email not found in token"}, status=401)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=401)

    try:
        # Retrieve all users with role == "user"
        users_ref = db.collection("users").where("role", "==", "user")
        users_docs = users_ref.stream()

        filtered_users = []
        for doc in users_docs:
            user_data = doc.to_dict()
            filtered_users.append(user_data)

        if not filtered_users:
            return Response({"detail": "No users found after filtering"}, status=status.HTTP_404_NOT_FOUND)

        # Return list of users and the requesting user's email
        return Response({"data": filtered_users, "email": user_email}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def search_applied_user(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"detail": "Missing or invalid token"}, status=401)

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = verify_token(id_token)
        company_email = decoded_token.get("email")
        print(company_email)
        if not company_email:
            return Response({"detail": "Email not found in token"}, status=401)
    except Exception as e:
        return Response({"detail": f"Invalid token: {str(e)}"}, status=401)

    try:
        # 1. Get company document by email
        users_ref = db.collection("users")
        results = users_ref.where("email", "==", company_email).limit(1).get()

        if not results:
            return Response({"error": "Company user not found"}, status=status.HTTP_404_NOT_FOUND)

        doc = results[0]
        if not doc.exists:
            return Response({"detail": "Company user not found"}, status=status.HTTP_404_NOT_FOUND)

        company_data = doc.to_dict()
        apply_list = company_data.get('apply_list', [])
        print(company_data)

        if not apply_list:
            return Response({"detail": "Apply list is empty"}, status=status.HTTP_404_NOT_FOUND)

        # 2. Retrieve users whose emails are in apply_list (chunked because of Firestore limits)
        applied_users = []
        chunk_size = 10

        for i in range(0, len(apply_list), chunk_size):
            chunk = apply_list[i:i + chunk_size]
            users_ref = db.collection("users").where("email", "in", chunk)
            users_docs = users_ref.stream()
            for user_doc in users_docs:
                applied_users.append(user_doc.to_dict())

        if not applied_users:
            return Response({"detail": "No users found in apply list"}, status=status.HTTP_404_NOT_FOUND)

        return Response(applied_users, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
def create_checkout_session(request):
    if request.method == 'POST':
        try:
            print('kkkkk')  # Confirm function is called
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                mode='payment',
                line_items=[
                    {
                        'price_data': {
                            'currency': 'jpy',
                            'product_data': {
                                'name': '有料プラン加入',
                            },
                            'unit_amount': 50000,  # 50,000円
                        },
                        'quantity': 1,
                    },
                ],
                success_url=f"{settings.FRONTEND_URL}/success",
                cancel_url=f"{settings.FRONTEND_URL}/cancel",
            )
            return JsonResponse({'id': session.id})
        except Exception as e:
            print('Error creating checkout session:', str(e))
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)


@api_view(['GET'])
def get_seekers(request):
    """
    GET /api/admin/seekers?page=1&limit=10
    """
    try:
        # --- pagination params ---
        page = int(request.GET.get("page", 1))
        if page < 1:
            page = 1
        limit = int(request.GET.get("limit", 10))
        if limit <= 0:
            limit = 10

        # --- base query: role == "user" ---
        users_ref = db.collection("users").where("role", "==", "user")

        # Count all docs
        all_docs = list(users_ref.stream())
        total_count = len(all_docs)
        total_pages = ceil(total_count / limit) if total_count > 0 else 1
        if page > total_pages:
            page = total_pages

        # --- get paginated docs ---
        start = (page - 1) * limit
        page_query = users_ref.offset(start).limit(limit)
        page_docs = list(page_query.stream())

        results: List[Dict[str, Any]] = []

        for user_doc in page_docs:
            user_data = user_doc.to_dict()
            email = user_data.get("email", "").strip()
            status = user_data.get("apply", False)
            created_At = user_data.get("created_at")
            id = user_data.get("id")
            print(status)
            if not email:
                continue  # skip if no email

            # --- find matching seeker ---
            seekers_query = db.collection("seekers").where("email_or_id", "==", email).stream()

            for seeker_doc in seekers_query:
                seeker_data = seeker_doc.to_dict()
                results.append({
                    "id": id,
                    "email": seeker_data.get("email_or_id"),
                    "birthday": seeker_data.get("birthday"),
                    "first_name": seeker_data.get("first_name"),
                    "last_name": seeker_data.get("last_name"),
                    "first_name_kana": seeker_data.get("first_name_kana"),
                    "last_name_kana": seeker_data.get("last_name_kana"),
                    "prefecture": seeker_data.get("prefecture"),
                    "sex": seeker_data.get("sex"),
                    "phone": seeker_data.get("phone"),
                    "faculty": seeker_data.get("faculty"),
                    "status": status,
                    "created_At": created_At
                    # ... add other seeker fields you need ...
                })

        return JsonResponse({
            "list": results,
            "page": page,
            "totalPages": total_pages,
            "totalCount": total_count,
        }, safe=False)

    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=500)

@api_view(['POST'])
def get_seekers_detail(request):
    email = request.data.get('email')
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        docs = db.collection("resumes").where("email", "==", email).stream()
        results = list(docs)

        if len(results) == 0:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        doc = results[0]
        user_data = doc.to_dict()

        # もし分割して返したいなら
        response_data = {
            "experiences": user_data.get("experiences", []),
            "profile": user_data.get("profile", {}),
            "skill": user_data.get("skill", {}),
            "job": user_data.get("job", {}),
            "email": user_data.get("email", ""),
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


@api_view(['POST'])
def save_message(request):
    # 1. Check Authorization header
    token = request.headers.get('Authorization')

    if not token or not token.startswith("Bearer "):
        return Response({"error": "Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    # 2. Extract token value
    id_token = token.split(" ")[1]

    # 3. Verify token and get sender email
    try:
        decoded_token = verify_token(id_token)
        sender_email = decoded_token.get("email")
        if not sender_email:
            return Response({"error": "Invalid token: no email found"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"error": f"Invalid token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

    # 4. Get message data
    content = request.data.get("content")
    print(content.get('message'))

    if not content:
        return Response({"error": "Missing 'content' or 'receiver'"}, status=status.HTTP_400_BAD_REQUEST)

    # 5. Prepare message document
    message_doc = {
        "sender": sender_email,
        "receiver": "admin",
        "content": content,
        "created_at": firestore.SERVER_TIMESTAMP

    }
    # 6. Save to Firestore (MESSAGES collection)
    try:
        db.collection("messages").add(message_doc)
        return Response({"status": "success", "message": "Message stored successfully"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": f"Failed to store message: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def save_message_reply(request):
    # 1. Check Authorization header
    token = request.headers.get('Authorization')

    if not token or not token.startswith("Bearer "):
        return Response({"error": "Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    # 2. Extract token value
    id_token = token.split(" ")[1]

    # 3. Verify token and get sender email
    try:
        decoded_token = verify_token(id_token)
        sender_email = decoded_token.get("email")
        if not sender_email:
            return Response({"error": "Invalid token: no email found"}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"error": f"Invalid token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

    # 4. Get message data
    content = request.data.get("content")
    receiver = request.data.get("type")
    print(content.get('message'))

    if not content:
        return Response({"error": "Missing 'content' or 'receiver'"}, status=status.HTTP_400_BAD_REQUEST)

    # 5. Prepare message document
    message_doc = {
        "sender": sender_email,
        "receiver": receiver,
        "content": content,
        "created_at": firestore.SERVER_TIMESTAMP
    }

    # 6. Save to Firestore (MESSAGES collection)
    try:
        db.collection("messages").add(message_doc)
        return Response({"status": "success", "message": "Message stored successfully"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": f"Failed to store message: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def get_all_message(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return Response({"error": "Missing or invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    id_token = auth_header.split(" ")[1]

    try:
        decoded_token = verify_token(id_token)
    except Exception as e:
        return Response({"error": f"Invalid token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)

    user_email = decoded_token.get("email")
    if not user_email:
        return Response({"error": "No email found in token"}, status=status.HTTP_400_BAD_REQUEST)

    messages_ref = db.collection("messages")
    sender_query = messages_ref.where("sender", "==", user_email).stream()
    receiver_query = messages_ref.where("receiver", "==", user_email).stream()

    messages = []
    for doc in sender_query:
        msg = doc.to_dict()
        msg["id"] = doc.id
        messages.append(msg)

    for doc in receiver_query:
        msg = doc.to_dict()
        msg["id"] = doc.id
        messages.append(msg)

    messages.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return Response(messages)


