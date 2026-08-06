#!/usr/bin/env python
"""Test OpenCV installation and face detection"""
import sys

print("Testing OpenCV installation...")
print("=" * 50)

# Test 1: Import NumPy
try:
    import numpy as np
    print(f"✓ NumPy version: {np.__version__}")
except Exception as e:
    print(f"✗ NumPy import failed: {e}")
    sys.exit(1)

# Test 2: Import OpenCV
try:
    import cv2
    print(f"✓ OpenCV version: {cv2.__version__}")
except Exception as e:
    print(f"✗ OpenCV import failed: {e}")
    sys.exit(1)

# Test 3: Access CascadeClassifier
try:
    cascade = cv2.CascadeClassifier
    print(f"✓ CascadeClassifier accessible: {cascade}")
except AttributeError as e:
    print(f"✗ CascadeClassifier not found: {e}")
    print("\nTrying workaround...")
    sys.exit(1)

# Test 4: Load Haar Cascade
try:
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    if face_cascade.empty():
        print("✗ Cascade file loaded but is empty")
    else:
        print("✓ Haar Cascade loaded successfully")
        print(f"  Path: {cv2.data.haarcascades}")
except Exception as e:
    print(f"✗ Failed to load Haar Cascade: {e}")
    sys.exit(1)

# Test 5: Create test image
try:
    test_img = np.zeros((100, 100, 3), dtype=np.uint8)
    gray = cv2.cvtColor(test_img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray)
    print(f"✓ Face detection test passed (found {len(faces)} faces in empty image)")
except Exception as e:
    print(f"✗ Face detection test failed: {e}")
    sys.exit(1)

print("\n" + "=" * 50)
print("✅ All tests passed! OpenCV is working correctly.")
print("\nIf ML API still fails, try:")
print("1. Restart the terminal")
print("2. Deactivate and reactivate venv")
print("3. Run: pip install --force-reinstall opencv-python")
