#!/usr/bin/env python
"""
Register a test user via API
"""

import urllib.request
import urllib.parse
import json

print("="*60)
print("REGISTERING TEST USER VIA API")
print("="*60)

url = "http://localhost:8001/api/auth/register/"
email = "hello@123"
password = "hello"
username = "hello123"

data = {
    "email": email,
    "username": username,
    "password": password
}

json_data = json.dumps(data).encode('utf-8')

try:
    req = urllib.request.Request(
        url,
        data=json_data,
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req, timeout=5) as response:
        result = json.loads(response.read().decode())
        print(f"\n✓ User registered successfully!")
        print(f"\nCREDENTIALS:")
        print(f"  Email:    {email}")
        print(f"  Password: {password}")
        print(f"\n✓ Login at: http://localhost:5173")
        
except Exception as e:
    print(f"\n⚠ Could not register via API: {str(e)}")
    print("\nAlternative: Register manually in the app")
    print(f"  - Go to http://localhost:5173/register")
    print(f"  - Enter email: {email}")
    print(f"  - Enter password: {password}")
    print(f"  - Enter username: {username}")
    print(f"  - Click Sign Up")

print("="*60)
