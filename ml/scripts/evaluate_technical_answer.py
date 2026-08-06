"""
Score a subjective technical answer using TF-IDF + cosine similarity.

Usage:
    python ml/scripts/evaluate_technical_answer.py "user answer" "reference answer"
"""

import sys

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def score_answer(user_answer: str, reference_answer: str) -> dict:
    """
    Score a user's technical answer against a reference answer.
    
    Returns a score from 0-100 based on semantic similarity and content overlap.
    """
    # Remove extra whitespace
    user_answer = " ".join(user_answer.split())
    reference_answer = " ".join(reference_answer.split())
    
    # If answer is very short, penalize it
    if len(user_answer) < 10:
        return {"score": 10, "similarity": 0.1}
    
    # Use TF-IDF vectorization
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            lowercase=True,
            ngram_range=(1, 2),  # Use both unigrams and bigrams
            max_features=100
        )
        matrix = vectorizer.fit_transform([user_answer, reference_answer])
        similarity = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
    except Exception:
        # Fallback if vectorizer fails
        similarity = 0.0
    
    # Calculate keyword overlap
    user_words = set(user_answer.lower().split())
    ref_words = set(reference_answer.lower().split())
    common_words = user_words & ref_words
    
    # Filter out common stop words
    stop_words = {'the', 'is', 'are', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 
                  'to', 'for', 'of', 'with', 'by', 'from', 'as', 'that', 'it', 'this'}
    meaningful_common = {w for w in common_words if w not in stop_words and len(w) > 2}
    
    # Calculate keyword match score
    if ref_words:
        keyword_score = len(meaningful_common) / len(ref_words)
    else:
        keyword_score = 0
    
    # Combine similarity and keyword scores
    combined_score = (similarity * 0.7) + (keyword_score * 0.3)
    
    # Convert to 0-100 scale with adjusted thresholds
    if combined_score >= 0.8:
        final_score = 90 + int((combined_score - 0.8) * 500)  # 90-100
    elif combined_score >= 0.6:
        final_score = 70 + int((combined_score - 0.6) * 100)  # 70-90
    elif combined_score >= 0.4:
        final_score = 50 + int((combined_score - 0.4) * 100)  # 50-70
    elif combined_score >= 0.2:
        final_score = 30 + int((combined_score - 0.2) * 100)  # 30-50
    else:
        final_score = int(combined_score * 100)  # 0-30
    
    final_score = min(100, max(0, final_score))
    
    return {
        "score": final_score,
        "similarity": round(float(combined_score), 4),
        "raw_tfidf_similarity": round(float(similarity), 4),
        "keyword_overlap": round(float(keyword_score), 4),
    }


def main() -> None:
    if len(sys.argv) < 3:
        print('Usage: python ml/scripts/evaluate_technical_answer.py "user answer" "reference answer"')
        sys.exit(1)

    user_answer = sys.argv[1]
    reference = sys.argv[2]
    result = score_answer(user_answer, reference)
    
    import json
    print(json.dumps(result))


if __name__ == "__main__":
    main()
