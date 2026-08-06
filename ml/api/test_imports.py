"""
Test if all ML API dependencies are working
"""
print("Testing imports...")

try:
    import cv2
    print("✅ OpenCV imported successfully")
    print(f"   Version: {cv2.__version__}")
except ImportError as e:
    print(f"❌ OpenCV import failed: {e}")

try:
    import numpy as np
    print("✅ NumPy imported successfully")
    print(f"   Version: {np.__version__}")
except ImportError as e:
    print(f"❌ NumPy import failed: {e}")

try:
    from PIL import Image
    print("✅ Pillow imported successfully")
except ImportError as e:
    print(f"❌ Pillow import failed: {e}")

try:
    import fastapi
    print("✅ FastAPI imported successfully")
    print(f"   Version: {fastapi.__version__}")
except ImportError as e:
    print(f"❌ FastAPI import failed: {e}")

try:
    import uvicorn
    print("✅ Uvicorn imported successfully")
except ImportError as e:
    print(f"❌ Uvicorn import failed: {e}")

try:
    import spacy
    print("✅ spaCy imported successfully")
    print(f"   Version: {spacy.__version__}")
    
    # Try loading the model
    nlp = spacy.load("en_core_web_sm")
    print("✅ spaCy model 'en_core_web_sm' loaded successfully")
except ImportError as e:
    print(f"❌ spaCy import failed: {e}")
except OSError as e:
    print(f"❌ spaCy model loading failed: {e}")
    print("   Run: python -m spacy download en_core_web_sm")

try:
    # Test Haar Cascade
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if not face_cascade.empty():
        print("✅ Haar Cascade face detection model loaded successfully")
    else:
        print("❌ Haar Cascade model failed to load")
except Exception as e:
    print(f"❌ Haar Cascade test failed: {e}")

print("\n" + "="*50)
print("Import test complete!")
print("="*50)
