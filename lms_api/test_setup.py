#!/usr/bin/env python
"""
Quick test script to verify backend setup
Run this in the lms_api directory: python test_setup.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lms_api.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from main.models import OTP
from main.otp_service import generate_otp, send_otp_email, verify_otp

print("✅ Backend Setup Test")
print("=" * 50)

# Test 1: Check OTP Model
print("\n1. Testing OTP Model...")
try:
    otp_count = OTP.objects.count()
    print(f"   ✅ OTP Model exists ({otp_count} records)")
except Exception as e:
    print(f"   ❌ Error with OTP Model: {e}")

# Test 2: Check OTP Service - Generate
print("\n2. Testing OTP Generation...")
try:
    code = generate_otp()
    if len(code) == 6 and code.isdigit():
        print(f"   ✅ OTP Generated: {code}")
    else:
        print(f"   ❌ Invalid OTP format: {code}")
except Exception as e:
    print(f"   ❌ Error generating OTP: {e}")

# Test 3: Check Email Configuration
print("\n3. Testing Email Configuration...")
try:
    backend = settings.EMAIL_BACKEND
    from_email = settings.DEFAULT_FROM_EMAIL
    print(f"   ✅ Email Backend: {backend}")
    print(f"   ✅ From Email: {from_email}")
except Exception as e:
    print(f"   ❌ Error with email config: {e}")

# Test 4: Test OTP Email Send (without actually sending in test mode)
print("\n4. Testing OTP Email Service...")
try:
    result = send_otp_email("+923001234567", "test@example.com")
    if result['success']:
        print(f"   ✅ OTP Email Service: {result['message']}")
    else:
        print(f"   ⚠️  OTP Email Service: {result['message']}")
except Exception as e:
    print(f"   ❌ Error with OTP email service: {e}")

# Test 5: Check Imports
print("\n5. Testing Imports...")
try:
    from main.views import OTPViewSet
    print("   ✅ OTPViewSet imported successfully")
except Exception as e:
    print(f"   ❌ Error importing OTPViewSet: {e}")

try:
    from main.serializers import OTPSerializer
    print("   ✅ OTPSerializer imported successfully")
except Exception as e:
    print(f"   ❌ Error importing OTPSerializer: {e}")

print("\n" + "=" * 50)
print("✅ Backend setup test complete!")
print("\nYou can now run: python manage.py runserver")
