#!/usr/bin/env python
"""Verify all dependencies and configuration"""
import sys
import os
from pathlib import Path

errors = []
warnings = []

print("=" * 60)
print("PlacementPrep - Setup Verification")
print("=" * 60)

# Check Python packages
packages = {
    'django': 'Django',
    'rest_framework': 'Django REST Framework',
    'fastapi': 'FastAPI',
    'uvicorn': 'Uvicorn',
    'spacy': 'spaCy',
    'cv2': 'OpenCV',
    'numpy': 'NumPy',
    'pandas': 'Pandas',
    'sklearn': 'scikit-learn',
    'PIL': 'Pillow',
    'google.genai': 'Google GenAI'
}

for module, name in packages.items():
    try:
        __import__(module)
        print(f"✓ {name}")
    except ImportError:
        errors.append(f"Missing: {name} (pip install)")
        print(f"✗ {name}")

# Check spaCy model
try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    print("✓ spaCy model (en_core_web_sm)")
except:
    errors.append("Missing spaCy model")
    print("✗ spaCy model (run: python -m spacy download en_core_web_sm)")

# Check OpenCV
try:
    import cv2
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    if not cascade.empty():
        print("✓ OpenCV Haar Cascade")
    else:
        warnings.append("OpenCV cascade loaded but empty")
        print("⚠ OpenCV Haar Cascade")
except:
    errors.append("OpenCV face detection broken")
    print("✗ OpenCV Haar Cascade")

# Check .env
env_path = Path('.env')
if env_path.exists():
    print("✓ .env file")
    from dotenv import load_dotenv
    load_dotenv()
    
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key and len(gemini_key) > 30 and not gemini_key.startswith('your_'):
        print("✓ Gemini API key configured")
    else:
        warnings.append("Gemini API key invalid or placeholder")
        print("⚠ Gemini API key (get from: https://aistudio.google.com/apikey)")
else:
    errors.append(".env file missing")
    print("✗ .env file")

# Check database
db_path = Path('db.sqlite3')
if db_path.exists():
    print("✓ Database exists")
else:
    warnings.append("Database not created")
    print("⚠ Database (run: python manage.py migrate)")

# Check ML model
model_path = Path('ml/models/resume_role_classifier.joblib')
if model_path.exists():
    print("✓ Resume classifier model")
else:
    warnings.append("ML model not trained")
    print("⚠ Resume classifier (run: python ml/scripts/train_resume_classifier.py)")

# Summary
print("\n" + "=" * 60)
if errors:
    print(f"❌ {len(errors)} Error(s):")
    for e in errors:
        print(f"   - {e}")
if warnings:
    print(f"⚠️  {len(warnings)} Warning(s):")
    for w in warnings:
        print(f"   - {w}")

if not errors and not warnings:
    print("✅ All checks passed! Ready to run.")
    print("\nStart servers:")
    print("  Terminal 1: python manage.py runserver 0.0.0.0:8000")
    print("  Terminal 2: python ml/api/server.py")
    print("  Terminal 3: cd frontend && npm run dev")
elif not errors:
    print("✓ System is functional with minor warnings.")
else:
    print(f"\n❌ Fix {len(errors)} error(s) before running.")
    sys.exit(1)
