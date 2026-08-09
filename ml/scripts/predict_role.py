"""
Predict job role from resume text using the trained classifier.

Usage:
    python ml/scripts/predict_role.py "Your resume text here..."
"""

import sys
from functools import lru_cache
from pathlib import Path

import joblib

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "resume_role_classifier.joblib"


@lru_cache(maxsize=1)
def _load_model():
    """Load model once and cache it"""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Run: python ml/scripts/train_resume_classifier.py"
        )
    return joblib.load(MODEL_PATH)


def predict(text: str) -> dict:
    """
    Predict the most likely job role from resume text.
    
    Returns:
        dict with 'predicted_role' and 'confidence'
    """
    if not text or len(text.strip()) < 20:
        return {"predicted_role": "Unknown", "confidence": 0.0}
    
    try:
        pipeline = _load_model()
        role = pipeline.predict([text])[0]
        proba = pipeline.predict_proba([text])[0]
        confidence = float(proba.max())
        return {"predicted_role": role, "confidence": round(confidence, 4)}
    except FileNotFoundError:
        return {"predicted_role": "Unknown", "confidence": 0.0}
    except Exception as e:
        print(f"[predict_role] Error: {e}", file=sys.stderr)
        return {"predicted_role": "Unknown", "confidence": 0.0}


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python ml/scripts/predict_role.py \"resume text\"")
        sys.exit(1)

    text = " ".join(sys.argv[1:])
    result = predict(text)
    print(result)


if __name__ == "__main__":
    main()
