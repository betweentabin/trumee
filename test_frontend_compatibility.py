#\!/usr/bin/env python3
"""
Test frontend-backend compatibility after API fixes
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# Start server first
print("Testing Frontend-Backend Compatibility...")
print("="*60)

# Login as company
login_response = requests.post(f"{BASE_URL}/api/v2/auth/login/", json={
    "email": "testcompany@example.com",
    "password": "password123"
})

if login_response.status_code == 200:
    token = login_response.json().get("drf_token")
    headers = {"Authorization": f"Token {token}"}
    
    # Test scout list response format
    print("\n1. Testing Scout List Response Format:")
    response = requests.get(f"{BASE_URL}/api/v2/scouts/", headers=headers)
    
    if response.status_code == 200:
        scouts = response.json()
        print(f"   Scouts returned: {len(scouts)}")
        
        if scouts:
            scout = scouts[0]
            print(f"   Scout structure:")
            print(f"   - id: {scout.get('id')}")
            print(f"   - seeker: {type(scout.get('seeker')).__name__}")
            print(f"   - seeker_details: {'✅ Present' if 'seeker_details' in scout else '❌ Missing'}")
            print(f"   - company: {scout.get('company')}")
            print(f"   - status: {scout.get('status')}")
            
            # Check if seeker is UUID or object
            seeker_value = scout.get('seeker')
            if isinstance(seeker_value, str):
                print(f"   ⚠️ Seeker is UUID string: {seeker_value}")
            elif isinstance(seeker_value, dict):
                print(f"   ✅ Seeker is object with fields: {list(seeker_value.keys())}")
    
    # Test profile response
    print("\n2. Testing Profile Response Format:")
    response = requests.get(f"{BASE_URL}/api/v2/profile/me/", headers=headers)
    
    if response.status_code == 200:
        profile = response.json()
        print(f"   Profile fields: {list(profile.keys())}")
        print(f"   Has company_profile: {'✅' if 'company_profile' in profile else '❌'}")
    
    # Test search response
    print("\n3. Testing Search Response Format:")
    response = requests.get(f"{BASE_URL}/api/v2/search/seekers/", 
                           params={"prefecture": "東京都"},
                           headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   Response structure: {list(data.keys())}")
        print(f"   Results count: {data.get('count', 0)}")
        print(f"   Has 'results' key: {'✅' if 'results' in data else '❌'}")
        
        if 'results' in data and data['results']:
            result = data['results'][0]
            print(f"   Result structure: {list(result.keys())}")
    elif response.status_code == 500:
        print(f"   ❌ Search API still has errors")
        
# Test seeker endpoints
print("\n4. Testing Seeker Endpoints:")
login_response = requests.post(f"{BASE_URL}/api/v2/auth/login/", json={
    "email": "testseeker@example.com",
    "password": "password123"
})

if login_response.status_code == 200:
    token = login_response.json().get("drf_token")
    headers = {"Authorization": f"Token {token}"}
    
    # Test dashboard stats
    response = requests.get(f"{BASE_URL}/api/v2/dashboard/stats/", headers=headers)
    if response.status_code == 200:
        stats = response.json()
        print(f"   Dashboard stats fields: {list(stats.keys())}")
        print(f"   Has resumes_count: {'✅' if 'resumes_count' in stats else '❌'}")
        print(f"   Has scouts_received_count: {'✅' if 'scouts_received_count' in stats else '❌'}")

print("\n" + "="*60)
print("COMPATIBILITY CHECK SUMMARY")
print("="*60)

# Check critical fields for frontend
critical_checks = {
    "Scout includes seeker details": False,
    "Profile includes role-specific data": False,
    "Search returns 'results' array": False,
    "Dashboard stats match expected format": False
}

print("\nCritical Compatibility Checks:")
for check, status in critical_checks.items():
    print(f"  {'✅' if status else '❌'} {check}")
