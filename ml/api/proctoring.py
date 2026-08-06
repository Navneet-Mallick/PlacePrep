"""
Real-time proctoring using OpenCV Haar Cascades for face detection
Lightweight, fast, and no PyTorch dependency required
Stricter detection for mobile phones and foreign objects
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
    
    def detect_foreign_objects(self, frame, gray):
        """
        Detect foreign objects (mobile phones, books, etc.)
        Uses edge detection and contour analysis
        """
        try:
            # Edge detection
            edges = cv2.Canny(gray, 100, 200)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            foreign_objects = []
            
            for contour in contours:
                area = cv2.contourArea(contour)
                
                # Filter by area (phone/objects are typically medium-sized)
                if 2000 < area < 80000:
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    # Check aspect ratio (phones are typically elongated)
                    aspect_ratio = float(w) / h if h > 0 else 0
                    
                    # Mobile phones typically have aspect ratio 0.4-0.8 or 1.2-2.5
                    if (0.4 < aspect_ratio < 0.8) or (1.2 < aspect_ratio < 2.5):
                        foreign_objects.append({
                            'bbox': (x, y, w, h),
                            'area': area,
                            'aspect_ratio': aspect_ratio,
                            'confidence': 0.7  # Medium confidence for object detection
                        })
            
            return foreign_objects
        except Exception as e:
            print(f"Error detecting objects: {e}")
            return []
    
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
        Stricter detection for foreign objects
        
        Returns:
            dict with:
                - status: 'ok', 'warning', 'violation'
                - face_count: number of faces detected
                - message: descriptive message
                - confidence: detection confidence
                - foreign_objects: detected objects (mobile, books, etc.)
        """
        if not self.model_loaded:
            return {
                'status': 'error',
                'message': 'Proctoring model not loaded',
                'face_count': 0,
                'confidence': 0,
                'foreign_objects': []
            }
        
        try:
            # Convert to grayscale for Haar Cascade
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces with sensitive parameters
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.05,
                minNeighbors=4,
                minSize=(20, 20),
                maxSize=(400, 400)
            )
            
            face_count = len(faces)
            
            # Detect foreign objects (STRICT MODE)
            foreign_objects = self.detect_foreign_objects(frame, gray)
            
            # Analyze results with stricter rules
            if len(foreign_objects) > 0:
                # Foreign object detected - VIOLATION
                object_types = []
                for obj in foreign_objects:
                    ratio = obj['aspect_ratio']
                    if 0.4 < ratio < 0.8:
                        object_types.append('mobile phone')
                    elif 1.2 < ratio < 2.5:
                        object_types.append('book/document')
                    else:
                        object_types.append('foreign object')
                
                return {
                    'status': 'violation',
                    'face_count': face_count,
                    'message': f'🚨 STRICT VIOLATION: {", ".join(set(object_types))} detected in frame',
                    'confidence': 0.9,
                    'violation_type': 'foreign_object_detected',
                    'foreign_objects': foreign_objects,
                    'severity': 'high'  # High severity for foreign objects
                }
            
            # Check face count
            if face_count == 0:
                return {
                    'status': 'violation',
                    'face_count': 0,
                    'message': 'No face detected in frame',
                    'confidence': 0,
                    'violation_type': 'no_face',
                    'foreign_objects': [],
                    'severity': 'medium'
                }
            elif face_count == 1:
                return {
                    'status': 'ok',
                    'face_count': 1,
                    'message': 'Single face detected - OK',
                    'confidence': 1.0,
                    'violation_type': None,
                    'foreign_objects': [],
                    'severity': 'none'
                }
            else:
                return {
                    'status': 'violation',
                    'face_count': face_count,
                    'message': f'Multiple faces detected ({face_count})',
                    'confidence': 1.0,
                    'violation_type': 'multiple_faces',
                    'foreign_objects': [],
                    'severity': 'high'
                }
        
        except Exception as e:
            print(f"Error analyzing frame: {e}")
            return {
                'status': 'error',
                'message': f'Analysis error: {str(e)}',
                'face_count': 0,
                'confidence': 0,
                'foreign_objects': [],
                'severity': 'unknown'
            }
    
    def analyze_base64_image(self, base64_string):
        """Analyze base64 encoded image"""
        frame = self.decode_image(base64_string)
        if frame is None:
            return {
                'status': 'error',
                'message': 'Failed to decode image',
                'face_count': 0,
                'confidence': 0,
                'foreign_objects': []
            }
        
        return self.analyze_frame(frame)


# Global instance
proctoring_system = ProctoringSystem()


def check_proctoring(base64_image: str):
    """
    Check proctoring for a base64 encoded image
    STRICT MODE: Detects mobile phones, books, and foreign objects
    
    Args:
        base64_image: Base64 encoded image string
    
    Returns:
        dict with proctoring analysis results including:
            - face_count
            - status (ok/warning/violation)
            - violation_type
            - foreign_objects (detected items)
            - severity (none/medium/high)
    """
    return proctoring_system.analyze_base64_image(base64_image)
