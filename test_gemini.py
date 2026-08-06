#!/usr/bin/env python
"""Test Gemini API connection"""
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment
PROJECT_ROOT = Path(__file__).resolve().parent
load_dotenv(PROJECT_ROOT / ".env")

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {bool(api_key)}")
if api_key:
    print(f"Key starts with: {api_key[:10]}...")
    print(f"Key length: {len(api_key)}")

try:
    from google import genai
    client = genai.Client(api_key=api_key)
    print("\n✓ Client created successfully")
    
    # Test simple generation
    response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
        contents="Say hello in one word"
    )
    print(f"✓ API Response: {response.text}")
    print("\n✅ Gemini API is working!")
    
except Exception as e:
    print(f"\n❌ Error: {type(e).__name__}: {e}")
    print("\nTroubleshooting:")
    print("1. Get a new API key from: https://aistudio.google.com/apikey")
    print("2. Update GEMINI_API_KEY in .env file")
    print("3. Restart the ML API server")
