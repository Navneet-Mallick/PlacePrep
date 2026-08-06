"""
Predict job role from resume text using the trained classifier.

Usage:
    python ml/scripts/predict_role.py "Your resume text here..."
"""

import sys
from pathlib import Path

import joblib

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "resume_role_classifier.joblib"


def predict(text: str) -> dict:
    pipeline = joblib.load(MODEL_PATH)
    role = pipeline.predict([text])[0]
    proba = pipeline.predict_proba([text])[0]
    confidence = float(proba.max())
    return {"predicted_role": role, "confidence": round(confidence, 4)}


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python ml/scripts/predict_role.py \"resume text\"")
        sys.exit(1)

    text = " ".join(sys.argv[1:])
    result = predict(text)
    print(result)


if __name__ == "__main__":
    main()
