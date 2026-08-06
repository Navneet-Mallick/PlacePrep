"""
Train TF-IDF + Logistic Regression resume role classifier.

Usage (from project root):
    pip install -r ml/requirements.txt
    python ml/scripts/train_resume_classifier.py
"""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "Datasets" / "Synthetic Nepali Resume Dataset" / "Resume_Dataset.csv"
MODEL_DIR = PROJECT_ROOT / "ml" / "models"
MODEL_PATH = MODEL_DIR / "resume_role_classifier.joblib"


def build_resume_text(row: pd.Series) -> str:
    parts = [
        str(row.get("summary", "")),
        str(row.get("skills", "")),
        str(row.get("stack", "")),
        str(row.get("education", "")),
        str(row.get("certifications", "")),
    ]
    return " ".join(p for p in parts if p and p != "nan")


def main() -> None:
    df = pd.read_csv(DATA_PATH)
    df["text"] = df.apply(build_resume_text, axis=1)
    df = df[df["text"].str.strip().astype(bool)]

    X = df["text"]
    y = df["role"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    stop_words="english",
                    max_features=10000,
                    ngram_range=(1, 2),
                ),
            ),
            (
                "clf",
                LogisticRegression(max_iter=1000, class_weight="balanced"),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    print("Classification report:\n")
    print(classification_report(y_test, y_pred))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
