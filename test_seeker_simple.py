#\!/usr/bin/env python3
"""
Simple test for seeker pages - checks if pages load correctly
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
results = {"timestamp": datetime.now().isoformat(), "tests": []}

def test_endpoint(name, method, url, **kwargs):
    """Test a single endpoint"""
    try:
        response = requests.request(method, url, **kwargs)
        results["tests"].append({
            "name": name,
            "url": url,
            "status": response.status_code,
            "success": response.status_code in [200, 201],
            "error": None
        })
        print(f"{'✅' if response.status_code in [200, 201] else '❌'} {name}: {response.status_code}")
        return response
    except Exception as e:
        results["tests"].append({
            "name": name,
            "url": url,
            "status": None,
            "success": False,
            "error": str(e)
        })
        print(f"⚠️ {name}: {str(e)}")
        return None

print("="*60)
print("SEEKER ENDPOINTS TEST")
print("="*60)

# Test login
print("\n🔐 Testing Authentication...")
login_response = test_endpoint(
    "Seeker Login",
    "POST",
    f"{BASE_URL}/api/v2/auth/login/",
    json={"email": "testseeker@example.com", "password": "password123"}
)

if login_response and login_response.status_code == 200:
    data = login_response.json()
    token = data.get("drf_token") or data.get("token")
    headers = {"Authorization": f"Token {token}"}
    
    print("\n👤 Testing Seeker Endpoints...")
    
    # Test seeker-specific endpoints
    test_endpoint("Seeker Profile", "GET", f"{BASE_URL}/api/v2/seeker/profile/", headers=headers)
    test_endpoint("Seeker Resumes", "GET", f"{BASE_URL}/api/v2/seeker/resumes/", headers=headers)
    test_endpoint("Seeker Scouts", "GET", f"{BASE_URL}/api/v2/seeker/scouts/", headers=headers)
    test_endpoint("Seeker Applications", "GET", f"{BASE_URL}/api/v2/seeker/applications/", headers=headers)
    test_endpoint("Seeker Saved Jobs", "GET", f"{BASE_URL}/api/v2/seeker/saved-jobs/", headers=headers)
    test_endpoint("Seeker Messages", "GET", f"{BASE_URL}/api/v2/seeker/messages/", headers=headers)
    
    # Test generic endpoints
    test_endpoint("User Profile", "GET", f"{BASE_URL}/api/v2/profile/me/", headers=headers)
    test_endpoint("Dashboard Stats", "GET", f"{BASE_URL}/api/v2/dashboard/stats/", headers=headers)
    test_endpoint("Resume List", "GET", f"{BASE_URL}/api/v2/resumes/", headers=headers)
    test_endpoint("User Settings", "GET", f"{BASE_URL}/api/v2/user/settings/", headers=headers)

# Summary
print("\n" + "="*60)
print("SUMMARY")
print("="*60)

passed = sum(1 for t in results["tests"] if t["success"])
failed = sum(1 for t in results["tests"] if not t["success"])

print(f"✅ Passed: {passed}")
print(f"❌ Failed: {failed}")
print(f"Success Rate: {(passed / (passed + failed) * 100):.1f}%")

# Save results
with open("seeker_endpoints_test.json", "w") as f:
    json.dump(results, f, indent=2)
print("\nResults saved to seeker_endpoints_test.json")
