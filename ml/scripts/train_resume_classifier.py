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
        X, y, test_size=0.25, random_state=42, stratify=y  # Increased test size for better validation
    )

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    stop_words="english",
                    max_features=5000,  # Reduced from 10000
                    ngram_range=(1, 2),
                    min_df=2,  # Minimum document frequency
                    max_df=0.95,  # Maximum document frequency
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000, 
                    class_weight="balanced",
                    C=1.0,  # Regularization parameter
                    penalty='l2',  # L2 regularization
                    solver='lbfgs',
                    random_state=42
                ),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)
    
    # Evaluate on training and test sets to check for overfitting
    train_score = pipeline.score(X_train, y_train)
    test_score = pipeline.score(X_test, y_test)
    y_pred = pipeline.predict(X_test)

    print("="*60)
    print("MODEL PERFORMANCE")
    print("="*60)
    print(f"Training accuracy: {train_score:.4f}")
    print(f"Test accuracy: {test_score:.4f}")
    print(f"Difference: {abs(train_score - test_score):.4f}")
    
    if abs(train_score - test_score) > 0.1:
        print("⚠️  Warning: Large gap between train and test accuracy suggests overfitting")
    else:
        print("✓ Good generalization - low overfitting")
    
    print("\n" + "="*60)
    print("CLASSIFICATION REPORT")
    print("="*60)
    print(classification_report(y_test, y_pred))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
