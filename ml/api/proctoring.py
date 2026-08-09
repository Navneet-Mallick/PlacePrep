"""
Proctoring using OpenCV Haar Cascades.

Design goals:
- Low false positives: brief head turns / blinks / lighting dips must not fire.
- Only escalate to a violation when a condition persists across frames.
- No PyTorch / YOLO — Haar cascades only.

State machine (per condition):
  frame 1..N  -> warning (grace period)
  frame > N   -> violation
Any clear frame resets all counters.
"""

import base64
from io import BytesIO

import cv2
import numpy as np
from PIL import Image

# --- Tuning ---------------------------------------------------------------
NO_FACE_GRACE_FRAMES = 3      # ~15s at a 5s poll before it becomes a violation
MULTI_FACE_GRACE_FRAMES = 1   # a second person only needs 2 consecutive frames
LOOK_AWAY_GRACE_FRAMES = 3    # tolerate glancing away
CENTER_OFFSET_LIMIT = 0.62    # how far off-center a face may sit (0=center,1=edge)
MIN_FACE_RATIO = 0.06         # face width vs frame width — reject tiny artifacts
MAX_FACE_RATIO = 0.85
NMS_OVERLAP = 0.35
# -------------------------------------------------------------------------


class ProctoringSystem:
    def __init__(self):
        self.ready = False
        try:
            path = cv2.data.haarcascades
            self.face_default = cv2.CascadeClassifier(path + 'haarcascade_frontalface_default.xml')
            self.face_alt2 = cv2.CascadeClassifier(path + 'haarcascade_frontalface_alt2.xml')
            self.profile = cv2.CascadeClassifier(path + 'haarcascade_profileface.xml')
            self.eyes = cv2.CascadeClassifier(path + 'haarcascade_eye.xml')

            if self.face_default.empty() or self.face_alt2.empty():
                print('[Proctoring] ERROR: face cascades failed to load')
            else:
                self.ready = True
                print('[Proctoring] All Haar Cascades loaded successfully')
        except Exception as exc:
            print(f'[Proctoring] ERROR loading cascades: {exc}')

        self.reset_state()

    def reset_state(self):
        self.no_face_streak = 0
        self.multi_face_streak = 0
        self.look_away_streak = 0
        self.prev_center = None

    # ---------------- image handling ----------------

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
            print(f'[Proctoring] decode error: {exc}')
            return None

    def preprocess(self, frame):
        """Grayscale + CLAHE so detection survives poor/uneven lighting."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        return clahe.apply(gray)

    # ---------------- detection ----------------

    def detect_faces(self, gray):
        h, w = gray.shape
        min_side = max(int(w * MIN_FACE_RATIO), 24)
        max_side = int(w * MAX_FACE_RATIO)
        boxes = []

        for cascade, neighbors in ((self.face_default, 6), (self.face_alt2, 5)):
            found = cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=neighbors,
                minSize=(min_side, min_side), maxSize=(max_side, max_side),
                flags=cv2.CASCADE_SCALE_IMAGE,
            )
            boxes.extend(np.array(found).tolist() if len(found) else [])

        # Profile faces (both directions) catch head turns instead of reporting "no face"
        for flip in (False, True):
            src = cv2.flip(gray, 1) if flip else gray
            found = self.profile.detectMultiScale(
                src, scaleFactor=1.1, minNeighbors=6,
                minSize=(min_side, min_side), maxSize=(max_side, max_side),
            )
            for (x, y, fw, fh) in (np.array(found).tolist() if len(found) else []):
                boxes.append([w - x - fw, y, fw, fh] if flip else [x, y, fw, fh])

        return self._nms(boxes)

    def _nms(self, boxes):
        """Merge duplicate detections so one face is never counted twice."""
        if not boxes:
            return []

        arr = np.asarray(boxes, dtype=np.float32)
        x1, y1 = arr[:, 0], arr[:, 1]
        x2, y2 = arr[:, 0] + arr[:, 2], arr[:, 1] + arr[:, 3]
        areas = (x2 - x1) * (y2 - y1)
        order = np.argsort(areas)[::-1]

        keep = []
        while order.size:
            i = order[0]
            keep.append(int(i))
            if order.size == 1:
                break

            rest = order[1:]
            xx1 = np.maximum(x1[i], x1[rest])
            yy1 = np.maximum(y1[i], y1[rest])
            xx2 = np.minimum(x2[i], x2[rest])
            yy2 = np.minimum(y2[i], y2[rest])
            inter = np.maximum(0, xx2 - xx1) * np.maximum(0, yy2 - yy1)
            union = areas[i] + areas[rest] - inter
            iou = np.where(union > 0, inter / union, 0)
            order = rest[iou < NMS_OVERLAP]

        return [boxes[i] for i in keep]

    def count_eyes(self, gray, face):
        x, y, w, h = face
        roi = gray[y:y + int(h * 0.6), x:x + w]
        if roi.size == 0:
            return 0
        found = self.eyes.detectMultiScale(roi, scaleFactor=1.1, minNeighbors=6, minSize=(14, 14))
        return len(found)

    def position_of(self, face, frame_w, frame_h):
        x, y, w, h = face
        cx, cy = x + w / 2, y + h / 2
        offset_x = abs(cx - frame_w / 2) / (frame_w / 2)
        offset_y = abs(cy - frame_h / 2) / (frame_h / 2)

        movement = 0.0
        if self.prev_center is not None:
            px, py = self.prev_center
            movement = ((cx - px) ** 2 + (cy - py) ** 2) ** 0.5 / frame_w
        self.prev_center = (cx, cy)

        return {
            'offset_x': round(float(offset_x), 2),
            'offset_y': round(float(offset_y), 2),
            'face_ratio': round(float(w / frame_w), 2),
            'movement': round(float(movement), 3),
        }

    # ---------------- analysis ----------------

    def analyze_frame(self, frame):
        if not self.ready:
            return self._result('error', 0, 'Proctoring system not initialised', 'unknown')

        try:
            h, w = frame.shape[:2]
            gray = self.preprocess(frame)
            faces = self.detect_faces(gray)
            count = len(faces)

            # --- more than one person ---
            if count > 1:
                self.no_face_streak = 0
                self.look_away_streak = 0
                self.multi_face_streak += 1

                if self.multi_face_streak <= MULTI_FACE_GRACE_FRAMES:
                    return self._result(
                        'warning', count,
                        f'{count} faces detected — make sure you are alone',
                        'low', 'possible_multiple_faces',
                    )
                return self._result(
                    'violation', count,
                    f'Multiple persons detected ({count}) — only one person is allowed',
                    'high', 'multiple_faces',
                )

            # --- nobody visible ---
            if count == 0:
                self.multi_face_streak = 0
                self.look_away_streak = 0
                self.no_face_streak += 1

                if self.no_face_streak <= NO_FACE_GRACE_FRAMES:
                    return self._result(
                        'warning', 0,
                        'Face not clearly visible — please face the camera',
                        'low', 'face_not_visible',
                        {'consecutive_misses': self.no_face_streak},
                    )
                return self._result(
                    'violation', 0,
                    'No face detected — you must stay visible to the camera',
                    'medium', 'no_face',
                    {'consecutive_misses': self.no_face_streak},
                )

            # --- exactly one face ---
            self.no_face_streak = 0
            self.multi_face_streak = 0

            face = faces[0]
            pos = self.position_of(face, w, h)
            eyes = self.count_eyes(gray, face)
            off_center = pos['offset_x'] > CENTER_OFFSET_LIMIT or pos['offset_y'] > CENTER_OFFSET_LIMIT

            if off_center:
                self.look_away_streak += 1
                if self.look_away_streak > LOOK_AWAY_GRACE_FRAMES:
                    return self._result(
                        'warning', 1,
                        'Please stay centred in the camera frame',
                        'low', 'looking_away',
                        {'position': pos, 'eyes_detected': eyes},
                    )
            else:
                self.look_away_streak = 0

            return self._result(
                'ok', 1, 'Monitoring active — all clear', 'none', None,
                {
                    'position': pos,
                    'eyes_detected': eyes,
                    'attention': 'focused' if eyes >= 1 else 'uncertain',
                },
            )

        except Exception as exc:
            print(f'[Proctoring] frame analysis error: {exc}')
            return self._result('error', 0, f'Analysis error: {exc}', 'unknown')

    @staticmethod
    def _result(status, face_count, message, severity, violation_type=None, details=None):
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
            return self._result('error', 0, 'Failed to decode image', 'unknown')
        return self.analyze_frame(frame)


proctoring_system = ProctoringSystem()


def check_proctoring(base64_image: str) -> dict:
    """
    Analyse one webcam frame.

    Returns:
        status          'ok' | 'warning' | 'violation' | 'error'
        face_count      number of distinct faces detected
        message         human-readable description
        severity        'none' | 'low' | 'medium' | 'high'
        violation_type  machine-readable reason, or None when clear
        details         position / eye / streak diagnostics
    """
    return proctoring_system.analyze_base64_image(base64_image)


def reset_proctoring_state() -> dict:
    """Clear streak counters — call when a new test starts."""
    proctoring_system.reset_state()
    return {'status': 'ok', 'message': 'Proctoring state reset'}
