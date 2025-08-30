#!/usr/bin/env python3
"""
Script to test job seeker page buttons and collect errors
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:3000"
API_URL = "http://localhost:8000"

# Seeker credentials
SEEKER_EMAIL = "tanaka@example.com"
SEEKER_PASSWORD = "user123"

def login_seeker():
    """Login as seeker and get token"""
    login_data = {
        "email": SEEKER_EMAIL,
        "password": SEEKER_PASSWORD,
        "role": "user"
    }
    
    response = requests.post(f"{API_URL}/api/v2/auth/login/", json=login_data)
    if response.status_code == 200:
        data = response.json()
        return data.get('token'), data.get('user')
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None, None

def test_seeker_endpoints(token):
    """Test various seeker endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        # Profile management
        ("GET", "/api/v2/profile/me/", "User Profile"),
        ("GET", "/api/v2/seeker/profile/", "Seeker Profile"),
        ("PUT", "/api/v2/seeker/profile/update/", "Update Profile"),
        
        # Resume management
        ("GET", "/api/v2/seeker/resumes/", "Resume List"),
        ("POST", "/api/v2/seeker/resumes/create/", "Create Resume"),
        ("GET", "/api/v2/seeker/experiences/", "Experience List"),
        ("POST", "/api/v2/seeker/experiences/create/", "Add Experience"),
        ("GET", "/api/v2/seeker/education/", "Education List"),
        ("POST", "/api/v2/seeker/education/create/", "Add Education"),
        
        # Applications and scouts
        ("GET", "/api/v2/seeker/applications/", "My Applications"),
        ("GET", "/api/v2/seeker/scouts/", "Received Scouts"),
        ("POST", "/api/v2/seeker/applications/create/", "Apply to Job"),
        
        # Dashboard
        ("GET", "/api/v2/dashboard/stats/", "Dashboard Stats"),
        
        # Search
        ("GET", "/api/v2/search/jobs/", "Search Jobs"),
        
        # Settings
        ("GET", "/api/v2/seeker/settings/", "Account Settings"),
        ("POST", "/api/v2/seeker/settings/password/", "Change Password"),
    ]
    
    errors = []
    
    for method, endpoint, description in endpoints:
        url = f"{API_URL}{endpoint}"
        print(f"\nTesting: {description} - {endpoint}")
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers)
            elif method == "POST":
                # For POST, send minimal data
                response = requests.post(url, headers=headers, json={})
            elif method == "PUT":
                response = requests.put(url, headers=headers, json={})
            
            if response.status_code >= 400:
                error_info = {
                    "endpoint": endpoint,
                    "method": method,
                    "description": description,
                    "status_code": response.status_code,
                    "error": response.text[:500] if response.text else "No error message"
                }
                errors.append(error_info)
                print(f"  ❌ Error {response.status_code}")
            else:
                print(f"  ✅ Success {response.status_code}")
                
        except Exception as e:
            error_info = {
                "endpoint": endpoint,
                "method": method,
                "description": description,
                "error": str(e)
            }
            errors.append(error_info)
            print(f"  ❌ Exception: {str(e)}")
    
    return errors

def main():
    print("="*60)
    print("Job Seeker Page Button Error Testing")
    print("="*60)
    
    # Login
    print("\n1. Logging in as job seeker...")
    token, user = login_seeker()
    
    if not token:
        print("Failed to login!")
        return
    
    print(f"✅ Logged in as: {user.get('email')}")
    
    # Test endpoints
    print("\n2. Testing seeker endpoints...")
    errors = test_seeker_endpoints(token)
    
    # Summary
    print("\n" + "="*60)
    print(f"SUMMARY: Found {len(errors)} errors")
    print("="*60)
    
    if errors:
        print("\nDetailed Errors:")
        for i, error in enumerate(errors, 1):
            print(f"\n{i}. {error['description']} ({error['method']} {error['endpoint']})")
            print(f"   Status: {error.get('status_code', 'N/A')}")
            print(f"   Error: {error['error'][:200]}")

if __name__ == "__main__":
    main()