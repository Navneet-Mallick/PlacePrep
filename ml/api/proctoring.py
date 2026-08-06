"""
Real-time proctoring using YOLO for face detection
"""
import cv2
import numpy as np
from ultralytics import YOLO
import base64
from io import BytesIO
from PIL import Image


class ProctoringSystem:
    def __init__(self):
        """Initialize YOLO model for face detection"""
        try:
            # Use YOLOv8n (nano) for fast inference
            self.model = YOLO('yolov8n.pt')
            self.model_loaded = True
        except Exception as e:
            print(f"Failed to load YOLO model: {e}")
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
        Analyze a single frame for proctoring violations
        
        Returns:
            dict with:
                - status: 'ok', 'warning', 'violation'
                - face_count: number of faces detected
                - message: descriptive message
                - confidence: detection confidence
        """
        if not self.model_loaded:
            return {
                'status': 'error',
                'message': 'Proctoring model not loaded',
                'face_count': 0,
                'confidence': 0
            }
        
        try:
            # Run YOLO detection
            results = self.model(frame, verbose=False)
            
            # Count persons detected
            person_count = 0
            max_confidence = 0
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    # Class 0 is 'person' in COCO dataset
                    if class_id == 0:
                        person_count += 1
                        max_confidence = max(max_confidence, confidence)
            
            # Analyze results
            if person_count == 0:
                return {
                    'status': 'violation',
                    'face_count': 0,
                    'message': 'No person detected in frame',
                    'confidence': 0,
                    'violation_type': 'no_face'
                }
            elif person_count == 1:
                return {
                    'status': 'ok',
                    'face_count': 1,
                    'message': 'Single person detected',
                    'confidence': max_confidence,
                    'violation_type': None
                }
            else:
                return {
                    'status': 'violation',
                    'face_count': person_count,
                    'message': f'Multiple persons detected ({person_count})',
                    'confidence': max_confidence,
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
