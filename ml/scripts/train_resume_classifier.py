"""
Train TF-IDF + Logistic Regression resume role classifier.

Anti-overfitting measures:
- L2 regularization (C=0.5)
- Reduced max_features
- min_df/max_df filtering
- 25% test split with stratification
- Cross-validation scoring

Usage:
    python ml/scripts/train_resume_classifier.py
"""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split, cross_val_score
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
    print("=" * 60)
    print("RESUME ROLE CLASSIFIER TRAINING")
    print("=" * 60)
    
    df = pd.read_csv(DATA_PATH)
    df["text"] = df.apply(build_resume_text, axis=1)
    df = df[df["text"].str.strip().astype(bool)]
    
    print(f"Dataset size: {len(df)} samples")
    print(f"Roles: {df['role'].nunique()} unique classes")
    print(f"Class distribution:")
    for role, count in df['role'].value_counts().items():
        print(f"  {role}: {count}")

    X = df["text"]
    y = df["role"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    
    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    stop_words="english",
                    max_features=3000,
                    ngram_range=(1, 2),
                    min_df=2,
                    max_df=0.9,
                    sublinear_tf=True,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000,
                    class_weight="balanced",
                    C=0.5,  # Stronger regularization to prevent overfitting
                    solver='lbfgs',
                    random_state=42,
                ),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)
    
    # Evaluate
    train_score = pipeline.score(X_train, y_train)
    test_score = pipeline.score(X_test, y_test)
    y_pred = pipeline.predict(X_test)

    print("\n" + "=" * 60)
    print("MODEL PERFORMANCE")
    print("=" * 60)
    print(f"Training accuracy: {train_score:.4f}")
    print(f"Test accuracy:     {test_score:.4f}")
    print(f"Difference:        {abs(train_score - test_score):.4f}")
    
    # Cross-validation
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='accuracy')
    print(f"Cross-val accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    
    if abs(train_score - test_score) > 0.15:
        print("[WARNING] Large train-test gap - potential overfitting")
    else:
        print("[OK] Good generalization")
    
    print("\n" + "=" * 60)
    print("CLASSIFICATION REPORT")
    print("=" * 60)
    print(classification_report(y_test, y_pred))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nModel saved to: {MODEL_PATH}")
    print(f"Model size: {MODEL_PATH.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
