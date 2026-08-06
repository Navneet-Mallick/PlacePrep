#!/usr/bin/env python
"""
Create test user for PlacementPrep
"""

import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

# Create user
email = "hello@123"
password = "hello"
username = "hello123"

try:
    # Check if user already exists
    user = User.objects.get(email=email)
    print(f"✓ User already exists: {email}")
    
    # Update password if needed
    user.set_password(password)
    user.save()
    print(f"✓ Password updated")
    
except User.DoesNotExist:
    # Create new user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name="Test",
        last_name="User"
    )
    print(f"✓ User created successfully!")
    print(f"  Email: {email}")
    print(f"  Password: {password}")
    print(f"  Username: {username}")

print("\n" + "="*50)
print("LOGIN CREDENTIALS")
print("="*50)
print(f"Email:    {email}")
print(f"Password: {password}")
print("="*50)
print("\nYou can now login at: http://localhost:5173")
