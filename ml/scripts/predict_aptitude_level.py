"""
Predict aptitude level using Random Forest classifier.

Usage:
    from predict_aptitude_level import predict_aptitude_level
    
    result = predict_aptitude_level(
        total_score=75,
        accuracy_percent=80.5,
        time_taken=1200,
        quant_score=70,
        logical_score=80,
        technical_score=75
    )
"""

from pathlib import Path
import joblib
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / "ml" / "models" / "aptitude_level_classifier.joblib"


def predict_aptitude_level(
    total_score: int,
    accuracy_percent: float,
    time_taken: int,
    quant_score: int,
    logical_score: int,
    technical_score: int
) -> dict:
    """
    Predict aptitude level using Random Forest classifier.
    
    Args:
        total_score: Overall test score (0-100)
        accuracy_percent: Accuracy percentage (0-100)
        time_taken: Time taken in seconds
        quant_score: Quantitative section score (0-100)
        logical_score: Logical section score (0-100)
        technical_score: Technical section score (0-100)
    
    Returns:
        dict with:
            - level: 'beginner', 'intermediate', or 'advanced'
            - confidence: confidence score (0-1)
            - probabilities: dict of all class probabilities
    """
    
    # Check if model exists
    if not MODEL_PATH.exists():
        # Fallback to simple threshold logic
        if total_score >= 80:
            return {
                'level': 'advanced',
                'confidence': 0.85,
                'probabilities': {'beginner': 0.05, 'intermediate': 0.10, 'advanced': 0.85},
                'method': 'threshold_fallback'
            }
        elif total_score >= 60:
            return {
                'level': 'intermediate',
                'confidence': 0.75,
                'probabilities': {'beginner': 0.10, 'intermediate': 0.75, 'advanced': 0.15},
                'method': 'threshold_fallback'
            }
        else:
            return {
                'level': 'beginner',
                'confidence': 0.80,
                'probabilities': {'beginner': 0.80, 'intermediate': 0.15, 'advanced': 0.05},
                'method': 'threshold_fallback'
            }
    
    # Load model
    model = joblib.load(MODEL_PATH)
    
    # Prepare features
    features = np.array([[
        total_score,
        accuracy_percent,
        time_taken,
        quant_score,
        logical_score,
        technical_score
    ]])
    
    # Predict
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    
    # Map to labels
    labels = ['beginner', 'intermediate', 'advanced']
    predicted_level = labels[int(prediction)]
    confidence = float(probabilities[int(prediction)])
    
    prob_dict = {
        label: float(prob) 
        for label, prob in zip(labels, probabilities)
    }
    
    return {
        'level': predicted_level,
        'confidence': round(confidence, 4),
        'probabilities': prob_dict,
        'method': 'random_forest'
    }


if __name__ == "__main__":
    # Test cases
    test_cases = [
        (35, 45, 2400, 30, 40, 35),  # Beginner
        (68, 72, 1800, 65, 70, 68),  # Intermediate
        (88, 92, 900, 85, 90, 88),   # Advanced
    ]
    
    for total, acc, time, q, l, t in test_cases:
        result = predict_aptitude_level(total, acc, time, q, l, t)
        print(f"\nScore: {total}, Accuracy: {acc}%, Time: {time}s")
        print(f"Predicted Level: {result['level']} (confidence: {result['confidence']:.2%})")
        print(f"Probabilities: {result['probabilities']}")
