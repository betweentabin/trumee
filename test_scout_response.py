#\!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000"

# Create a new scout to test the response
print("Creating new scout and checking response format...")

# First login as company
login_response = requests.post(f"{BASE_URL}/api/v2/auth/login/", json={
    "email": "testcompany@example.com",
    "password": "password123"
})

if login_response.status_code == 200:
    token = login_response.json().get("drf_token")
    headers = {"Authorization": f"Token {token}"}
    
    # Create a scout
    scout_data = {
        "seeker": "2cfea82f-cc2e-456f-b3c1-c97826e16472",  # Test seeker ID
        "scout_message": "Test scout message",
        "job_title": "Software Engineer"
    }
    
    print("\n1. Creating Scout:")
    response = requests.post(f"{BASE_URL}/api/v2/scouts/", 
                            json=scout_data, headers=headers)
    
    if response.status_code in [200, 201]:
        data = response.json()
        print(f"   ✅ Scout created successfully")
        print(f"   Response structure: {list(data.keys())}")
        
        if 'seeker_details' in data:
            print(f"   ✅ Has seeker_details field")
            print(f"   Seeker details: {data['seeker_details']}")
        else:
            print(f"   ❌ Missing seeker_details field")
    else:
        print(f"   ❌ Failed: {response.status_code}")
        print(f"   Error: {response.text[:200]}")
    
    # Get scout list
    print("\n2. Getting Scout List:")
    response = requests.get(f"{BASE_URL}/api/v2/scouts/", headers=headers)
    
    if response.status_code == 200:
        scouts = response.json()
        print(f"   Total scouts: {len(scouts)}")
        
        if scouts:
            scout = scouts[0]
            print(f"   First scout structure: {list(scout.keys())}")
            
            # Check seeker field type
            seeker = scout.get('seeker')
            if seeker:
                if isinstance(seeker, str):
                    print(f"   ⚠️ Seeker is UUID string: {seeker}")
                elif isinstance(seeker, dict):
                    print(f"   ✅ Seeker is object")
                else:
                    print(f"   ❓ Seeker type: {type(seeker)}")
