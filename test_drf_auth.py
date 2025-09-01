#!/usr/bin/env python3
"""
DRF Token認証統一のテストスクリプト
"""

import requests
import json

# テスト用の設定
BASE_URL = "http://localhost:8000"
API_VERSION = "/api/v2"

def test_auth_flow():
    """認証フローのテスト"""
    
    print("=" * 50)
    print("DRF Token認証テスト")
    print("=" * 50)
    
    # 1. ユーザー登録
    print("\n1. ユーザー登録テスト")
    import time
    timestamp = int(time.time())
    register_data = {
        "username": f"test_drf_user_{timestamp}",
        "email": f"test_drf_{timestamp}@example.com",
        "password": "testpass123",
        "role": "user",
        "first_name": "Test",
        "last_name": "User"
    }
    test_email = register_data["email"]
    
    try:
        response = requests.post(
            f"{BASE_URL}{API_VERSION}/auth/register-user/",
            json=register_data
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ 登録成功")
            print(f"   - DRF Token: {data.get('drf_token', 'なし')}")
            print(f"   - Token (互換性): {data.get('token', 'なし')}")
            drf_token = data.get('drf_token')
        else:
            print(f"❌ 登録失敗: {response.status_code}")
            print(f"   エラー: {response.text}")
            return
    except Exception as e:
        print(f"❌ 登録エラー: {e}")
        return
    
    # 2. ログインテスト
    print("\n2. ログインテスト")
    login_data = {
        "email": test_email,
        "password": "testpass123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}{API_VERSION}/auth/login/",
            json=login_data
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ ログイン成功")
            print(f"   - DRF Token: {data.get('drf_token', 'なし')}")
            print(f"   - Token (互換性): {data.get('token', 'なし')}")
            drf_token = data.get('drf_token')
        else:
            print(f"❌ ログイン失敗: {response.status_code}")
            print(f"   エラー: {response.text}")
            return
    except Exception as e:
        print(f"❌ ログインエラー: {e}")
        return
    
    # 3. 認証が必要なAPIへのアクセステスト
    print("\n3. 認証が必要なAPIアクセステスト")
    
    # DRF Token形式でのアクセス
    print("\n   a) Token形式（正しい）")
    headers = {
        "Authorization": f"Token {drf_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}{API_VERSION}/profile/me/",
            headers=headers
        )
        
        if response.status_code == 200:
            print(f"   ✅ アクセス成功")
            user_data = response.json()
            print(f"      - Email: {user_data.get('email')}")
        else:
            print(f"   ❌ アクセス失敗: {response.status_code}")
            print(f"      エラー: {response.text}")
    except Exception as e:
        print(f"   ❌ アクセスエラー: {e}")
    
    # Bearer形式でのアクセス（エラーになるはず）
    print("\n   b) Bearer形式（エラーになるはず）")
    headers_bearer = {
        "Authorization": f"Bearer {drf_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}{API_VERSION}/user/profile/",
            headers=headers_bearer
        )
        
        if response.status_code == 200:
            print(f"   ⚠️  Bearer形式でもアクセス成功（設定に問題あり）")
        else:
            print(f"   ✅ Bearer形式は拒否された: {response.status_code}")
    except Exception as e:
        print(f"   ❌ アクセスエラー: {e}")
    
    print("\n" + "=" * 50)
    print("テスト完了")
    print("=" * 50)

if __name__ == "__main__":
    test_auth_flow()