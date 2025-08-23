#!/usr/bin/env python
import os
import sys
import django

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'back.settings')
django.setup()

from core.models import User, Scout
from datetime import datetime

def create_test_scouts():
    """Create test scout data for company-seeker interactions"""
    
    # Get test users
    try:
        # Get company user
        company_user = User.objects.filter(role='company').first()
        if not company_user:
            print("No company user found. Please run create_simple_test_data.py first.")
            return
        
        # Get seeker users
        seekers = User.objects.filter(role='user')[:3]
        if not seekers:
            print("No seeker users found. Please run create_simple_test_data.py first.")
            return
        
        # Create scouts from company to seekers
        scouts_created = 0
        for seeker in seekers:
            scout, created = Scout.objects.get_or_create(
                company=company_user,
                seeker=seeker,
                defaults={
                    'scout_message': f"We are interested in your profile and would like to discuss potential opportunities with you. Your experience would be a great fit for our team.",
                    'status': 'pending',
                    'scouted_at': datetime.now()
                }
            )
            if created:
                scouts_created += 1
                print(f"Created scout from {company_user.full_name} to {seeker.full_name}")
            else:
                print(f"Scout already exists from {company_user.full_name} to {seeker.full_name}")
        
        print(f"\nTotal scouts created: {scouts_created}")
        print(f"Total scouts in database: {Scout.objects.count()}")
        
    except Exception as e:
        print(f"Error creating scouts: {e}")

if __name__ == "__main__":
    create_test_scouts()