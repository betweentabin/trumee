#!/usr/bin/env python3
"""
Script to test company page buttons and collect errors
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:3000"
API_URL = "http://localhost:8000"

# Company credentials
COMPANY_EMAIL = "hr@techcorp.jp"
COMPANY_PASSWORD = "company123"

def login_company():
    """Login as company and get token"""
    login_data = {
        "email": COMPANY_EMAIL,
        "password": COMPANY_PASSWORD,
        "role": "company"
    }
    
    response = requests.post(f"{API_URL}/api/v2/auth/login/", json=login_data)
    if response.status_code == 200:
        data = response.json()
        return data.get('token'), data.get('user')
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None, None

def test_company_endpoints(token):
    """Test various company endpoints"""
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        # Dashboard endpoints
        ("GET", "/api/v2/company/dashboard/", "Company Dashboard"),
        ("GET", "/api/v2/company/profile/", "Company Profile"),
        ("GET", "/api/v2/company/scouts/", "Scout List"),
        ("GET", "/api/v2/company/applications/", "Applications List"),
        
        # Search functionality
        ("GET", "/api/v2/company/search/seekers/", "Search Seekers"),
        
        # Scout actions
        ("POST", "/api/v2/company/scouts/create/", "Create Scout"),
        
        # Profile management
        ("GET", "/api/v2/company/payment-info/", "Payment Info"),
        ("PUT", "/api/v2/company/profile/update/", "Update Profile"),
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
    print("Company Page Button Error Testing")
    print("="*60)
    
    # Login
    print("\n1. Logging in as company...")
    token, user = login_company()
    
    if not token:
        print("Failed to login!")
        return
    
    print(f"✅ Logged in as: {user.get('email')}")
    
    # Test endpoints
    print("\n2. Testing company endpoints...")
    errors = test_company_endpoints(token)
    
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