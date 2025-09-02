import requests
import json

BASE_URL = "http://localhost:8000"

# Login as company
print("Testing Company Profile Creation...")
login_response = requests.post(f"{BASE_URL}/api/v2/auth/login/", json={
    "email": "testcompany@example.com",
    "password": "password123"
})

if login_response.status_code == 200:
    token = login_response.json().get("drf_token")
    headers = {"Authorization": f"Token {token}"}
    
    # Try to create company profile
    profile_data = {
        "company_name": "Test Company",
        "industry": "IT",
        "employee_count": 100,
        "headquarters": "Tokyo"
    }
    
    response = requests.post(f"{BASE_URL}/api/v2/company-profiles/", 
                            json=profile_data, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
else:
    print(f"Login failed: {login_response.text}")

print("\n" + "="*50 + "\n")

# Test seeker profile creation
print("Testing Seeker Profile Creation...")
login_response = requests.post(f"{BASE_URL}/api/v2/auth/login/", json={
    "email": "testseeker@example.com", 
    "password": "password123"
})

if login_response.status_code == 200:
    token = login_response.json().get("drf_token")
    headers = {"Authorization": f"Token {token}"}
    
    profile_data = {
        "first_name": "Test",
        "last_name": "Seeker",
        "first_name_kana": "テスト",
        "last_name_kana": "シーカー",
        "birthday": "1990-01-01",
        "prefecture": "東京都"
    }
    
    response = requests.post(f"{BASE_URL}/api/v2/seeker-profiles/",
                            json=profile_data, headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
else:
    print(f"Login failed: {login_response.text}")

print("\n" + "="*50 + "\n")

# Test search API
print("Testing Search API...")
login_response = requests.post(f"{BASE_URL}/api/v2/auth/login/", json={
    "email": "testcompany@example.com",
    "password": "password123"
})

if login_response.status_code == 200:
    token = login_response.json().get("drf_token")
    headers = {"Authorization": f"Token {token}"}
    
    response = requests.get(f"{BASE_URL}/api/v2/search/seekers/", 
                           params={"prefecture": "東京都"},
                           headers=headers)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Results: {len(response.json().get('results', []))}")
    else:
        print(f"Response: {response.text}")
