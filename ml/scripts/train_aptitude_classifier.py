"""
Train Random Forest classifier for aptitude level prediction.

Features:
- total_score
- accuracy_percent
- time_taken
- section_scores (quantitative, logical, technical)

Labels: beginner, intermediate, advanced

Usage:
    python ml/scripts/train_aptitude_classifier.py
"""

from pathlib import Path
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = PROJECT_ROOT / "ml" / "models"
MODEL_PATH = MODEL_DIR / "aptitude_level_classifier.joblib"


def generate_synthetic_training_data(n_samples=1000):
    """Generate synthetic training data based on aptitude patterns"""
    np.random.seed(42)
    
    data = []
    
    # Beginner: Low scores, low accuracy, high time
    for _ in range(int(n_samples * 0.35)):
        total_score = np.random.randint(0, 60)
        accuracy = np.random.uniform(0.3, 0.6) * 100
        time_taken = np.random.randint(1800, 3600)  # 30-60 min
        quant = np.random.randint(20, 60)
        logical = np.random.randint(25, 65)
        technical = np.random.randint(15, 55)
        
        data.append([total_score, accuracy, time_taken, quant, logical, technical, 0])  # 0 = beginner
    
    # Intermediate: Medium scores, medium accuracy, medium time
    for _ in range(int(n_samples * 0.45)):
        total_score = np.random.randint(55, 80)
        accuracy = np.random.uniform(0.55, 0.8) * 100
        time_taken = np.random.randint(1200, 2400)  # 20-40 min
        quant = np.random.randint(50, 80)
        logical = np.random.randint(55, 85)
        technical = np.random.randint(45, 75)
        
        data.append([total_score, accuracy, time_taken, quant, logical, technical, 1])  # 1 = intermediate
    
    # Advanced: High scores, high accuracy, low time
    for _ in range(int(n_samples * 0.20)):
        total_score = np.random.randint(75, 100)
        accuracy = np.random.uniform(0.75, 1.0) * 100
        time_taken = np.random.randint(600, 1800)  # 10-30 min
        quant = np.random.randint(70, 100)
        logical = np.random.randint(75, 100)
        technical = np.random.randint(65, 100)
        
        data.append([total_score, accuracy, time_taken, quant, logical, technical, 2])  # 2 = advanced
    
    data = np.array(data)
    np.random.shuffle(data)
    
    X = data[:, :-1]
    y = data[:, -1]
    
    return X, y


def train_model():
    """Train Random Forest classifier"""
    print("Generating synthetic training data...")
    X, y = generate_synthetic_training_data(n_samples=2000)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    
    # Train Random Forest with better hyperparameters to prevent overfitting
    print("\nTraining Random Forest classifier...")
    rf_classifier = RandomForestClassifier(
        n_estimators=100,  # Number of trees
        max_depth=8,  # Reduced from 10 to prevent overfitting
        min_samples_split=10,  # Increased from 5 (more conservative splits)
        min_samples_leaf=4,  # Increased from 2 (larger leaf nodes)
        max_features='sqrt',  # Use sqrt of features at each split
        random_state=42,
        class_weight='balanced',
        bootstrap=True,  # Use bootstrap samples
        oob_score=True,  # Out-of-bag score for validation
        n_jobs=-1  # Use all CPU cores
    )
    
    rf_classifier.fit(X_train, y_train)
    
    # Evaluate with overfitting check
    train_score = rf_classifier.score(X_train, y_train)
    test_score = rf_classifier.score(X_test, y_test)
    oob_score = rf_classifier.oob_score_
    
    print("\n" + "="*60)
    print("MODEL PERFORMANCE")
    print("="*60)
    print(f"Training accuracy: {train_score:.4f}")
    print(f"Test accuracy: {test_score:.4f}")
    print(f"Out-of-bag score: {oob_score:.4f}")
    print(f"Train-Test difference: {abs(train_score - test_score):.4f}")
    
    # Check for overfitting
    if abs(train_score - test_score) > 0.1:
        print("[WARNING] Potential overfitting detected (train-test gap > 0.1)")
    elif abs(train_score - oob_score) > 0.1:
        print("[WARNING] Potential overfitting detected (train-oob gap > 0.1)")
    else:
        print("[OK] Good generalization - low overfitting risk")
    
    print("="*60)
    
    # Cross-validation
    cv_scores = cross_val_score(rf_classifier, X_train, y_train, cv=5)
    print(f"Cross-validation score: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    
    # Predictions
    y_pred = rf_classifier.predict(X_test)
    
    # Classification report
    labels = ['beginner', 'intermediate', 'advanced']
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=labels))
    
    # Confusion matrix
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Feature importance
    feature_names = ['total_score', 'accuracy', 'time_taken', 'quant_score', 'logical_score', 'technical_score']
    importances = rf_classifier.feature_importances_
    
    print("\nFeature Importances:")
    for name, importance in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True):
        print(f"  {name}: {importance:.4f}")
    
    # Save model
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(rf_classifier, MODEL_PATH)
    print(f"\nModel saved to: {MODEL_PATH}")
    
    return rf_classifier


def test_prediction(model):
    """Test model with sample inputs"""
    print("\n" + "="*50)
    print("Testing model with sample data...")
    print("="*50)
    
    test_cases = [
        {
            'name': 'Beginner',
            'features': [35, 45, 2400, 30, 40, 35],  # low scores, high time
            'expected': 'beginner'
        },
        {
            'name': 'Intermediate',
            'features': [68, 72, 1800, 65, 70, 68],  # medium scores, medium time
            'expected': 'intermediate'
        },
        {
            'name': 'Advanced',
            'features': [88, 92, 900, 85, 90, 88],  # high scores, low time
            'expected': 'advanced'
        },
    ]
    
    labels = ['beginner', 'intermediate', 'advanced']
    
    for case in test_cases:
        features = np.array([case['features']])
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        
        print(f"\n{case['name']} Test Case:")
        print(f"  Features: total={case['features'][0]}, acc={case['features'][1]:.1f}%, time={case['features'][2]}s")
        print(f"  Predicted: {labels[int(prediction)]}")
        print(f"  Expected: {case['expected']}")
        print(f"  Probabilities:")
        for label, prob in zip(labels, probabilities):
            print(f"    {label}: {prob:.2%}")


def main():
    model = train_model()
    test_prediction(model)
    print("\nTraining complete!")


if __name__ == "__main__":
    main()
