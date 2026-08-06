"""
Real-time proctoring using OpenCV Haar Cascades for face detection
Lightweight, fast, and no PyTorch dependency required
"""
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image


class ProctoringSystem:
    def __init__(self):
        """Initialize Haar Cascade for face detection"""
        try:
            # Load pre-trained Haar Cascade classifier for face detection
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            self.model_loaded = True if not self.face_cascade.empty() else False
            if self.model_loaded:
                print("✅ Face detection model loaded successfully")
            else:
                print("❌ Failed to load Haar Cascade model")
        except Exception as e:
            print(f"❌ Failed to load face detection model: {e}")
            self.model_loaded = False
    
    def decode_image(self, base64_string):
        """Decode base64 image to numpy array"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            img_bytes = base64.b64decode(base64_string)
            img = Image.open(BytesIO(img_bytes))
            
            # Convert to numpy array
            img_array = np.array(img)
            
            # Convert RGB to BGR for OpenCV
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            return img_array
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None
    
    def analyze_frame(self, frame):
        """
        Analyze a single frame for proctoring violations using Haar Cascade
        
        Returns:
            dict with:
                - status: 'ok', 'warning', 'violation'
                - face_count: number of faces detected
                - message: descriptive message
                - confidence: detection confidence (1.0 for Haar Cascade)
        """
        if not self.model_loaded:
            return {
                'status': 'error',
                'message': 'Proctoring model not loaded',
                'face_count': 0,
                'confidence': 0
            }
        
        try:
            # Convert to grayscale for Haar Cascade
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            # Parameters: scaleFactor, minNeighbors, minSize
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            
            face_count = len(faces)
            
            # Analyze results
            if face_count == 0:
                return {
                    'status': 'violation',
                    'face_count': 0,
                    'message': 'No face detected in frame',
                    'confidence': 0,
                    'violation_type': 'no_face'
                }
            elif face_count == 1:
                return {
                    'status': 'ok',
                    'face_count': 1,
                    'message': 'Single face detected',
                    'confidence': 1.0,
                    'violation_type': None
                }
            else:
                return {
                    'status': 'violation',
                    'face_count': face_count,
                    'message': f'Multiple faces detected ({face_count})',
                    'confidence': 1.0,
                    'violation_type': 'multiple_faces'
                }
        
        except Exception as e:
            print(f"Error analyzing frame: {e}")
            return {
                'status': 'error',
                'message': f'Analysis error: {str(e)}',
                'face_count': 0,
                'confidence': 0
            }
    
    def analyze_base64_image(self, base64_string):
        """Analyze base64 encoded image"""
        frame = self.decode_image(base64_string)
        if frame is None:
            return {
                'status': 'error',
                'message': 'Failed to decode image',
                'face_count': 0,
                'confidence': 0
            }
        
        return self.analyze_frame(frame)


# Global instance
proctoring_system = ProctoringSystem()


def check_proctoring(base64_image: str):
    """
    Check proctoring for a base64 encoded image
    
    Args:
        base64_image: Base64 encoded image string
    
    Returns:
        dict with proctoring analysis results
    """
    return proctoring_system.analyze_base64_image(base64_image)
