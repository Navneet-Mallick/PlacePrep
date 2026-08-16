"""
Proctoring using OpenCV DNN face detector (SSD + ResNet-10).

Much more accurate than Haar cascades:
- Handles tilted/rotated faces
- Works in poor lighting
- Glasses, partial occlusion OK
- ~20ms per frame on CPU

No PyTorch/YOLO required — uses cv2.dnn which ships with opencv-python.
"""

import base64
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# --- Config ----------------------------------------------------------------
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
PROTOTXT = MODEL_DIR / "deploy.prototxt"
CAFFEMODEL = MODEL_DIR / "face_detector.caffemodel"

CONFIDENCE_THRESHOLD = 0.5     # minimum detection confidence (0-1)
NO_FACE_GRACE = 3              # frames before no-face becomes a violation
MULTI_FACE_GRACE = 1           # frames before multi-face becomes a violation
CENTER_LIMIT = 0.55            # how far off-center (0=center, 1=edge)
LOOK_AWAY_GRACE = 3            # frames off-center before warning
# ---------------------------------------------------------------------------


class ProctoringSystem:
    def __init__(self):
        self.ready = False
        self.net = None
        self.use_dnn = False
        self.face_cascade = None
        self.no_face_streak = 0
        self.multi_face_streak = 0
        self.look_away_streak = 0
        self.prev_center = None

        # Try DNN first
        try:
            if PROTOTXT.exists() and CAFFEMODEL.exists():
                self.net = cv2.dnn.readNetFromCaffe(str(PROTOTXT), str(CAFFEMODEL))
                self.ready = True
                self.use_dnn = True
                print("[Proctoring] DNN face detector loaded (SSD + ResNet-10)")
                return
        except Exception as exc:
            print(f"[Proctoring] DNN load failed: {exc}")

        # Fallback to Haar
        try:
            path = cv2.data.haarcascades
            self.face_cascade = cv2.CascadeClassifier(path + 'haarcascade_frontalface_default.xml')
            if not self.face_cascade.empty():
                self.ready = True
                self.use_dnn = False
                print("[Proctoring] Haar Cascade loaded as fallback")
            else:
                print("[Proctoring] WARNING: No face detector available")
        except Exception as exc:
            print(f"[Proctoring] WARNING: All detectors failed: {exc}")
            self.ready = False

    def reset_state(self):
        self.no_face_streak = 0
        self.multi_face_streak = 0
        self.look_away_streak = 0
        self.prev_center = None

    # ---- Image handling ----

    def decode_image(self, b64_string):
        try:
            if ',' in b64_string:
                b64_string = b64_string.split(',', 1)[1]
            img = Image.open(BytesIO(base64.b64decode(b64_string)))
            arr = np.array(img)

            if arr.ndim == 3 and arr.shape[2] == 4:
                arr = cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR)
            elif arr.ndim == 3 and arr.shape[2] == 3:
                arr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
            elif arr.ndim == 2:
                arr = cv2.cvtColor(arr, cv2.COLOR_GRAY2BGR)
            return arr
        except Exception as exc:
            print(f"[Proctoring] decode error: {exc}")
            return None

    # ---- Detection ----

    def detect_faces_dnn(self, frame):
        """Detect faces using the DNN model. Returns list of (x, y, w, h, confidence)."""
        h, w = frame.shape[:2]
        blob = cv2.dnn.blobFromImage(
            cv2.resize(frame, (300, 300)),
            1.0, (300, 300), (104.0, 177.0, 123.0)
        )
        self.net.setInput(blob)
        detections = self.net.forward()

        faces = []
        for i in range(detections.shape[2]):
            conf = float(detections[0, 0, i, 2])
            if conf < CONFIDENCE_THRESHOLD:
                continue

            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            x1, y1, x2, y2 = box.astype(int)

            # Clamp to frame bounds
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            fw, fh = x2 - x1, y2 - y1
            if fw > 10 and fh > 10:
                faces.append((x1, y1, fw, fh, conf))

        return faces

    def detect_faces_haar(self, frame):
        """Fallback Haar detection."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        found = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )
        return [(x, y, w, h, 0.7) for (x, y, w, h) in found]

    def detect_faces(self, frame):
        if self.use_dnn:
            return self.detect_faces_dnn(frame)
        return self.detect_faces_haar(frame)

    # ---- Position analysis ----

    def check_position(self, face, frame_w, frame_h):
        x, y, w, h, _ = face
        cx, cy = x + w / 2, y + h / 2
        offset_x = abs(cx - frame_w / 2) / (frame_w / 2)
        offset_y = abs(cy - frame_h / 2) / (frame_h / 2)

        movement = 0.0
        if self.prev_center:
            px, py = self.prev_center
            movement = ((cx - px) ** 2 + (cy - py) ** 2) ** 0.5 / frame_w
        self.prev_center = (cx, cy)

        return {
            'offset_x': round(offset_x, 2),
            'offset_y': round(offset_y, 2),
            'face_ratio': round(w / frame_w, 2),
            'movement': round(movement, 3),
        }

    # ---- Main analysis ----

    def analyze_frame(self, frame):
        if not self.ready:
            return self._r('ok', 0, 'Proctoring system unavailable — monitoring via tab detection only', 'none')

        try:
            h, w = frame.shape[:2]
            faces = self.detect_faces(frame)
            count = len(faces)

            # --- Multiple faces ---
            if count > 1:
                self.no_face_streak = 0
                self.look_away_streak = 0
                self.multi_face_streak += 1

                if self.multi_face_streak <= MULTI_FACE_GRACE:
                    return self._r('warning', count,
                                   f'{count} faces detected — ensure you are alone', 'low',
                                   'possible_multiple_faces')
                return self._r('violation', count,
                               f'Multiple persons detected ({count})', 'high',
                               'multiple_faces')

            # --- No face ---
            if count == 0:
                self.multi_face_streak = 0
                self.look_away_streak = 0
                self.no_face_streak += 1

                if self.no_face_streak <= NO_FACE_GRACE:
                    return self._r('warning', 0,
                                   'Face not visible — please face the camera', 'low',
                                   'face_not_visible',
                                   {'consecutive_misses': self.no_face_streak})
                return self._r('violation', 0,
                               'No face detected — stay visible to the camera', 'medium',
                               'no_face',
                               {'consecutive_misses': self.no_face_streak})

            # --- Single face: check position ---
            self.no_face_streak = 0
            self.multi_face_streak = 0

            face = faces[0]
            pos = self.check_position(face, w, h)
            off_center = pos['offset_x'] > CENTER_LIMIT or pos['offset_y'] > CENTER_LIMIT

            if off_center:
                self.look_away_streak += 1
                if self.look_away_streak > LOOK_AWAY_GRACE:
                    return self._r('warning', 1,
                                   'Please stay centred in the frame', 'low',
                                   'looking_away', {'position': pos})
            else:
                self.look_away_streak = 0

            conf = face[4]
            return self._r('ok', 1, 'Monitoring active — all clear', 'none', None,
                           {'position': pos, 'confidence': round(conf, 2)})

        except Exception as exc:
            print(f"[Proctoring] analysis error: {exc}")
            return self._r('error', 0, f'Analysis error: {exc}', 'unknown')

    @staticmethod
    def _r(status, face_count, message, severity, violation_type=None, details=None):
        return {
            'status': status,
            'face_count': face_count,
            'message': message,
            'severity': severity,
            'violation_type': violation_type,
            'details': details or {},
        }

    def analyze_base64_image(self, b64_string):
        frame = self.decode_image(b64_string)
        if frame is None:
            return self._r('error', 0, 'Failed to decode image', 'unknown')
        return self.analyze_frame(frame)


# --- Singleton ---
proctoring_system = ProctoringSystem()


def check_proctoring(base64_image: str) -> dict:
    """Analyse one webcam frame for proctoring violations."""
    return proctoring_system.analyze_base64_image(base64_image)


def reset_proctoring_state() -> dict:
    """Clear streak counters (call when a new test starts)."""
    proctoring_system.reset_state()
    return {'status': 'ok', 'message': 'Proctoring state reset'}
