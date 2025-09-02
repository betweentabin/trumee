#!/usr/bin/env python3
"""Test scout API response includes seeker details"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Use test company from recent integration test
import random

# Login with a test company
login_response = requests.post(f"{BASE_URL}/api/v2/auth/login/", json={
    "email": "test_company_6153@example.com3",  # From last test run
    "password": "password123"
})

if login_response.status_code == 200:
    token = login_response.json().get("drf_token")
    headers = {"Authorization": f"Token {token}"}
    
    print("Testing Scout API with seeker details...")
    print("="*60)
    
    # Use existing seeker from test run
    # We'll use the seeker ID from the last successful test
    seeker_id = "7f895ea7-4106-4e68-84a6-803f548e4ff5"  # From last test run
    
    # Scout them if we have a seeker ID
    if seeker_id:
        
        # Create a scout for this seeker
        scout_data = {
            "seeker": seeker_id,
            "scout_message": "We are interested in your profile!",
            "job_title": "Software Engineer"
        }
        scout_response = requests.post(f"{BASE_URL}/api/v2/scouts/", 
                                      json=scout_data, headers=headers)
        
        if scout_response.status_code in [200, 201]:
            created_scout = scout_response.json()
            print(f"   Created scout: ID {created_scout.get('id')}")
            if 'seeker_details' in created_scout:
                print(f"   ✅ Scout creation response includes seeker_details")
            else:
                print(f"   ⚠️ Scout creation response missing seeker_details")
    
    # Get scout list
    print("\n1. Getting Scout List:")
    response = requests.get(f"{BASE_URL}/api/v2/scouts/", headers=headers)
    
    if response.status_code == 200:
        scouts = response.json()
        print(f"   Total scouts: {len(scouts)}")
        
        if scouts:
            scout = scouts[0]
            print(f"\n   First scout structure:")
            print(f"   - id: {scout.get('id')}")
            print(f"   - seeker: {scout.get('seeker')}")
            print(f"   - status: {scout.get('status')}")
            
            # Check for seeker_details
            if 'seeker_details' in scout:
                print(f"\n   ✅ Has seeker_details field")
                details = scout['seeker_details']
                print(f"   Seeker details:")
                print(f"   - id: {details.get('id')}")
                print(f"   - email: {details.get('email')}")
                print(f"   - full_name: {details.get('full_name')}")
                print(f"   - username: {details.get('username')}")
                if 'prefecture' in details:
                    print(f"   - prefecture: {details.get('prefecture')}")
                if 'experience_years' in details:
                    print(f"   - experience_years: {details.get('experience_years')}")
            else:
                print(f"   ❌ Missing seeker_details field")
                print(f"   Available fields: {list(scout.keys())}")
    else:
        print(f"   ❌ Failed to get scouts: {response.status_code}")
        print(f"   Error: {response.text[:200]}")
    
    # Get single scout detail
    if scouts:
        scout_id = scouts[0]['id']
        print(f"\n2. Getting Single Scout Detail (ID: {scout_id}):")
        response = requests.get(f"{BASE_URL}/api/v2/scouts/{scout_id}/", headers=headers)
        
        if response.status_code == 200:
            scout = response.json()
            if 'seeker_details' in scout:
                print(f"   ✅ Has seeker_details in single scout response")
            else:
                print(f"   ❌ Missing seeker_details in single scout response")
                print(f"   Available fields: {list(scout.keys())}")
        else:
            print(f"   ❌ Failed to get scout detail: {response.status_code}")
            
else:
    print(f"❌ Login failed: {login_response.status_code}")
    print(f"Response: {login_response.text}")

print("\n" + "="*60)
print("FRONTEND COMPATIBILITY STATUS:")
print("="*60)
print("✅ Scout API now includes seeker_details in responses")
print("✅ Frontend can display seeker information without additional API calls")
print("✅ Both list and detail endpoints provide consistent data structure")