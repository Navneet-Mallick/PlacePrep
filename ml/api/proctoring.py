"""
Proctoring System using OpenCV Haar Cascades

Detection capabilities:
1. Face detection (frontal + profile)
2. Eye detection (to verify attention)
3. Multiple persons detection
4. No person detection
5. Face position tracking (looking away)

No PyTorch/YOLO dependencies - lightweight and fast.
"""

import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image


class ProctoringSystem:
    def __init__(self):
        """Load multiple Haar Cascades for robust detection"""
        self.cascades_loaded = False
        
        try:
            cascade_path = cv2.data.haarcascades
            
            # Primary face detector (frontal)
            self.face_cascade = cv2.CascadeClassifier(
                cascade_path + 'haarcascade_frontalface_default.xml'
            )
            
            # Alternative face detector (more sensitive)
            self.face_cascade_alt = cv2.CascadeClassifier(
                cascade_path + 'haarcascade_frontalface_alt2.xml'
            )
            
            # Profile face detector (side view)
            self.profile_cascade = cv2.CascadeClassifier(
                cascade_path + 'haarcascade_profileface.xml'
            )
            
            # Eye detector (to verify attention/gaze)
            self.eye_cascade = cv2.CascadeClassifier(
                cascade_path + 'haarcascade_eye.xml'
            )
            
            # Upper body detector (detect multiple people even if face partially hidden)
            self.upper_body_cascade = cv2.CascadeClassifier(
                cascade_path + 'haarcascade_upperbody.xml'
            )
            
            # Validate all cascades loaded
            if self.face_cascade.empty() or self.face_cascade_alt.empty():
                print("[Proctoring] WARNING: Face cascade failed to load")
                self.cascades_loaded = False
            else:
                self.cascades_loaded = True
                print("[Proctoring] All Haar Cascades loaded successfully")
                
        except Exception as e:
            print(f"[Proctoring] ERROR loading cascades: {e}")
            self.cascades_loaded = False
        
        # State tracking for temporal analysis
        self.prev_face_position = None
        self.no_face_count = 0
        self.multi_face_count = 0
    
    def decode_image(self, base64_string):
        """Decode base64 image to numpy array"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            img_bytes = base64.b64decode(base64_string)
            img = Image.open(BytesIO(img_bytes))
            img_array = np.array(img)
            
            # Convert RGB to BGR for OpenCV
            if len(img_array.shape) == 3 and img_array.shape[2] == 4:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
            elif len(img_array.shape) == 3 and img_array.shape[2] == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            return img_array
        except Exception as e:
            print(f"[Proctoring] Image decode error: {e}")
            return None
    
    def detect_faces(self, gray):
        """
        Multi-cascade face detection for higher accuracy.
        Combines results from multiple detectors and deduplicates.
        """
        all_faces = []
        
        # Primary detector - balanced sensitivity
        faces1 = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        if len(faces1) > 0:
            all_faces.extend(faces1.tolist())
        
        # Alt detector - catches faces the primary misses
        faces2 = self.face_cascade_alt.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        if len(faces2) > 0:
            all_faces.extend(faces2.tolist())
        
        # Profile detector - catches side-turned faces
        profiles = self.profile_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(30, 30)
        )
        if len(profiles) > 0:
            all_faces.extend(profiles.tolist())
        
        # Also check flipped image for left-facing profiles
        flipped = cv2.flip(gray, 1)
        profiles_flipped = self.profile_cascade.detectMultiScale(
            flipped,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(30, 30)
        )
        if len(profiles_flipped) > 0:
            # Mirror x-coordinates back
            h, w = gray.shape
            for (x, y, fw, fh) in profiles_flipped:
                all_faces.append([w - x - fw, y, fw, fh])
        
        if not all_faces:
            return []
        
        # Deduplicate overlapping detections using Non-Maximum Suppression
        return self._non_max_suppression(all_faces)
    
    def _non_max_suppression(self, boxes, overlap_thresh=0.4):
        """Remove duplicate/overlapping detections"""
        if not boxes:
            return []
        
        boxes_array = np.array(boxes, dtype=np.float32)
        
        x1 = boxes_array[:, 0]
        y1 = boxes_array[:, 1]
        x2 = boxes_array[:, 0] + boxes_array[:, 2]
        y2 = boxes_array[:, 1] + boxes_array[:, 3]
        
        areas = (x2 - x1) * (y2 - y1)
        indices = np.argsort(areas)[::-1]
        
        keep = []
        while len(indices) > 0:
            i = indices[0]
            keep.append(i)
            
            xx1 = np.maximum(x1[i], x1[indices[1:]])
            yy1 = np.maximum(y1[i], y1[indices[1:]])
            xx2 = np.minimum(x2[i], x2[indices[1:]])
            yy2 = np.minimum(y2[i], y2[indices[1:]])
            
            w = np.maximum(0, xx2 - xx1)
            h = np.maximum(0, yy2 - yy1)
            overlap = (w * h) / areas[indices[1:]]
            
            # Remove overlapping boxes
            remaining = np.where(overlap < overlap_thresh)[0]
            indices = indices[remaining + 1]
        
        return [boxes[i] for i in keep]
    
    def detect_eyes_in_face(self, gray, face_rect):
        """Detect eyes within a face region to verify attention"""
        x, y, w, h = face_rect
        
        # Eyes are in the upper half of the face
        roi_gray = gray[y:y + h // 2, x:x + w]
        
        if roi_gray.size == 0:
            return 0
        
        eyes = self.eye_cascade.detectMultiScale(
            roi_gray,
            scaleFactor=1.1,
            minNeighbors=3,
            minSize=(15, 15)
        )
        
        return len(eyes)
    
    def check_face_position(self, face_rect, frame_width, frame_height):
        """
        Check if face is centered and of appropriate size.
        Returns position analysis.
        """
        x, y, w, h = face_rect
        
        face_center_x = x + w / 2
        face_center_y = y + h / 2
        
        frame_center_x = frame_width / 2
        frame_center_y = frame_height / 2
        
        # Normalized offset from center (0 = center, 1 = edge)
        offset_x = abs(face_center_x - frame_center_x) / frame_center_x
        offset_y = abs(face_center_y - frame_center_y) / frame_center_y
        
        # Face size relative to frame (expected ~15-60% of frame width)
        face_ratio = w / frame_width
        
        position_ok = offset_x < 0.5 and offset_y < 0.5
        size_ok = 0.1 < face_ratio < 0.7
        
        # Check for sudden movement (head turned away)
        movement = 0.0
        if self.prev_face_position is not None:
            prev_x, prev_y = self.prev_face_position
            movement = ((face_center_x - prev_x) ** 2 + (face_center_y - prev_y) ** 2) ** 0.5
            movement = movement / frame_width  # Normalize
        
        self.prev_face_position = (face_center_x, face_center_y)
        
        return {
            'centered': position_ok,
            'size_ok': size_ok,
            'offset_x': round(offset_x, 2),
            'offset_y': round(offset_y, 2),
            'face_ratio': round(face_ratio, 2),
            'movement': round(movement, 3)
        }
    
    def analyze_frame(self, frame):
        """
        Main proctoring analysis on a single frame.
        
        Returns dict with:
        - status: 'ok' | 'warning' | 'violation'
        - face_count: number of faces detected
        - message: human-readable description
        - details: additional analysis info
        - severity: 'none' | 'low' | 'medium' | 'high'
        """
        if not self.cascades_loaded:
            return {
                'status': 'error',
                'message': 'Proctoring system not initialized',
                'face_count': 0,
                'severity': 'unknown'
            }
        
        try:
            h, w = frame.shape[:2]
            
            # Convert to grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Histogram equalization for better detection in varying light
            gray = cv2.equalizeHist(gray)
            
            # Detect faces
            faces = self.detect_faces(gray)
            face_count = len(faces)
            
            # --- No face detected ---
            if face_count == 0:
                self.no_face_count += 1
                
                # Allow brief absences (1-2 frames)
                if self.no_face_count <= 2:
                    return {
                        'status': 'warning',
                        'face_count': 0,
                        'message': 'Face not clearly visible - please face the camera',
                        'severity': 'low',
                        'violation_type': 'face_not_visible',
                        'details': {
                            'consecutive_misses': self.no_face_count
                        }
                    }
                else:
                    return {
                        'status': 'violation',
                        'face_count': 0,
                        'message': 'No face detected - you must be visible to the camera',
                        'severity': 'medium',
                        'violation_type': 'no_face',
                        'details': {
                            'consecutive_misses': self.no_face_count
                        }
                    }
            
            # Reset no-face counter when face detected
            self.no_face_count = 0
            
            # --- Multiple faces detected ---
            if face_count > 1:
                self.multi_face_count += 1
                return {
                    'status': 'violation',
                    'face_count': face_count,
                    'message': f'Multiple persons detected ({face_count}) - only one person allowed',
                    'severity': 'high',
                    'violation_type': 'multiple_faces',
                    'details': {
                        'faces_detected': face_count,
                        'consecutive_multi': self.multi_face_count
                    }
                }
            
            # Reset multi-face counter
            self.multi_face_count = 0
            
            # --- Single face detected - analyze position and attention ---
            face_rect = faces[0]
            position = self.check_face_position(face_rect, w, h)
            
            # Check eyes (attention verification)
            eyes_detected = self.detect_eyes_in_face(gray, face_rect)
            
            # Determine if person is looking away
            looking_away = position['offset_x'] > 0.4 or position['offset_y'] > 0.4
            sudden_movement = position['movement'] > 0.15
            
            if looking_away:
                return {
                    'status': 'warning',
                    'face_count': 1,
                    'message': 'Please look at the screen - face is not centered',
                    'severity': 'low',
                    'violation_type': 'looking_away',
                    'details': {
                        'position': position,
                        'eyes_detected': eyes_detected
                    }
                }
            
            if sudden_movement:
                return {
                    'status': 'warning',
                    'face_count': 1,
                    'message': 'Excessive movement detected - please stay steady',
                    'severity': 'low',
                    'violation_type': 'excessive_movement',
                    'details': {
                        'position': position,
                        'movement': position['movement']
                    }
                }
            
            # Everything is fine
            return {
                'status': 'ok',
                'face_count': 1,
                'message': 'Monitoring active - all clear',
                'severity': 'none',
                'violation_type': None,
                'details': {
                    'position': position,
                    'eyes_detected': eyes_detected,
                    'attention': 'focused' if eyes_detected >= 1 else 'uncertain'
                }
            }
        
        except Exception as e:
            print(f"[Proctoring] Frame analysis error: {e}")
            return {
                'status': 'error',
                'message': f'Analysis error: {str(e)}',
                'face_count': 0,
                'severity': 'unknown'
            }
    
    def analyze_base64_image(self, base64_string):
        """Analyze a base64-encoded image frame"""
        frame = self.decode_image(base64_string)
        if frame is None:
            return {
                'status': 'error',
                'message': 'Failed to decode image',
                'face_count': 0,
                'severity': 'unknown'
            }
        
        return self.analyze_frame(frame)


# Global instance
proctoring_system = ProctoringSystem()


def check_proctoring(base64_image: str) -> dict:
    """
    Main entry point for proctoring checks.
    
    Args:
        base64_image: Base64 encoded webcam frame
    
    Returns:
        dict with:
            - status: 'ok' | 'warning' | 'violation' | 'error'
            - face_count: number of faces detected
            - message: description of what was detected
            - severity: 'none' | 'low' | 'medium' | 'high'
            - violation_type: type of violation (if any)
            - details: additional info (position, eyes, etc.)
    """
    return proctoring_system.analyze_base64_image(base64_image)
