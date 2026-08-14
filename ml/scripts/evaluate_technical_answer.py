"""
Score a subjective technical answer using multiple similarity techniques.

Combines:
1. TF-IDF cosine similarity (word-level matching)
2. Semantic keyword matching (concept detection)
3. Length & completeness scoring
4. Synonym/paraphrase awareness

This approach handles cases where the user gives a correct answer
using different words than the reference.

Usage:
    python ml/scripts/evaluate_technical_answer.py "user answer" "reference answer"
"""

import re
import sys
from collections import Counter

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# Common technical synonyms and related terms
SYNONYM_GROUPS = [
    {"pointer", "reference", "address", "link"},
    {"function", "method", "procedure", "subroutine", "routine"},
    {"array", "list", "collection", "sequence"},
    {"variable", "identifier", "name", "symbol"},
    {"loop", "iteration", "repeat", "cycle", "iterate"},
    {"class", "object", "instance", "entity"},
    {"database", "db", "storage", "datastore"},
    {"query", "request", "fetch", "retrieve"},
    {"node", "element", "item", "entry"},
    {"tree", "hierarchy", "hierarchical"},
    {"graph", "network", "vertices", "edges"},
    {"stack", "lifo", "last in first out"},
    {"queue", "fifo", "first in first out"},
    {"hash", "hashing", "hash table", "hashmap", "dictionary", "dict"},
    {"sort", "sorting", "arrange", "order", "ordering"},
    {"search", "find", "lookup", "locate"},
    {"insert", "add", "push", "append", "enqueue"},
    {"delete", "remove", "pop", "dequeue", "erase"},
    {"O(n)", "linear", "linear time"},
    {"O(1)", "constant", "constant time"},
    {"O(log n)", "logarithmic"},
    {"O(n^2)", "quadratic"},
    {"allocate", "malloc", "memory allocation", "dynamic memory"},
    {"compile", "build", "compilation"},
    {"runtime", "execution time", "run time"},
    {"thread", "process", "concurrent", "parallel"},
    {"mutex", "lock", "semaphore", "synchronization"},
    {"deadlock", "circular wait", "resource contention"},
    {"cache", "caching", "memoization", "memorize"},
    {"recursion", "recursive", "self-referential"},
    {"inheritance", "extends", "subclass", "derived"},
    {"polymorphism", "overriding", "overloading", "dynamic dispatch"},
    {"encapsulation", "data hiding", "abstraction"},
    {"interface", "abstract class", "contract"},
    {"tcp", "transmission control protocol", "reliable transport"},
    {"udp", "user datagram protocol", "unreliable transport"},
    {"http", "hypertext transfer protocol", "web protocol"},
    {"sql", "structured query language", "relational query"},
    {"primary key", "pk", "unique identifier"},
    {"foreign key", "fk", "reference key"},
    {"normalization", "normal form", "reduce redundancy"},
    {"index", "indexing", "b-tree", "b+ tree"},
    {"transaction", "acid", "atomicity"},
    {"os", "operating system", "kernel"},
    {"process", "task", "program in execution"},
    {"virtual memory", "paging", "page table"},
    {"scheduling", "scheduler", "cpu scheduling"},
    {"file system", "filesystem", "fs"},
    {"authentication", "login", "verify identity", "sign in"},
    {"authorization", "permission", "access control"},
    {"encryption", "encrypt", "cipher", "cryptography"},
    {"password", "credential", "secret", "passphrase"},
    {"security", "secure", "protection", "safety"},
    {"device", "phone", "mobile", "hardware token", "otp"},
    {"verification", "verify", "confirm", "validate", "check"},
    {"two factor", "2fa", "multi factor", "mfa", "two step"},
    {"api", "application programming interface", "endpoint", "rest"},
    {"server", "backend", "host"},
    {"client", "frontend", "browser", "user interface"},
    {"protocol", "http", "https", "tcp", "udp"},
    {"network", "internet", "web", "connection"},
]


def expand_with_synonyms(text: str) -> str:
    """Expand text by adding synonyms for known technical terms"""
    lowered = text.lower()
    expanded_terms = []
    
    for group in SYNONYM_GROUPS:
        # Check if any term from this group appears in the text
        found = any(term in lowered for term in group)
        if found:
            # Add all related terms to boost matching
            expanded_terms.extend(group)
    
    if expanded_terms:
        return text + " " + " ".join(expanded_terms)
    return text


def extract_key_concepts(text: str) -> set:
    """Extract meaningful technical concepts from text"""
    # Remove common filler words aggressively
    stop_words = {
        'the', 'is', 'are', 'was', 'were', 'a', 'an', 'in', 'on', 'at', 'to',
        'for', 'of', 'with', 'by', 'from', 'as', 'that', 'it', 'this', 'and',
        'or', 'but', 'not', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
        'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
        'shall', 'can', 'if', 'then', 'else', 'when', 'where', 'which', 'who',
        'whom', 'what', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
        'most', 'other', 'some', 'such', 'no', 'nor', 'only', 'own', 'same',
        'so', 'than', 'too', 'very', 'just', 'because', 'also', 'used', 'using',
        'use', 'uses', 'called', 'known', 'example', 'like', 'etc', 'ie',
        'eg', 'basically', 'simply', 'means', 'way', 'type', 'types',
    }
    
    words = re.findall(r'[a-z][a-z0-9+#]+', text.lower())
    concepts = {w for w in words if w not in stop_words and len(w) > 2}
    
    # Also extract multi-word phrases (bigrams)
    words_list = text.lower().split()
    for i in range(len(words_list) - 1):
        bigram = f"{words_list[i]} {words_list[i+1]}"
        # Check if it's a known technical term
        for group in SYNONYM_GROUPS:
            if bigram in group:
                concepts.add(bigram)
    
    return concepts


def concept_overlap_score(user_answer: str, reference_answer: str) -> float:
    """
    Calculate concept overlap considering synonyms.
    More lenient than pure word matching.
    """
    user_concepts = extract_key_concepts(user_answer)
    ref_concepts = extract_key_concepts(reference_answer)
    
    if not ref_concepts:
        return 0.0
    
    # Direct matches
    direct_matches = user_concepts & ref_concepts
    
    # Synonym matches - check if user used a synonym of a reference concept
    synonym_matches = set()
    for user_concept in user_concepts:
        for group in SYNONYM_GROUPS:
            if user_concept in group:
                # Check if any reference concept is in the same synonym group
                for ref_concept in ref_concepts:
                    if ref_concept in group:
                        synonym_matches.add(ref_concept)
                        break
    
    total_matches = len(direct_matches | synonym_matches)
    
    # Score based on what fraction of reference concepts are covered
    coverage = total_matches / len(ref_concepts)
    
    return min(1.0, coverage)


def score_answer(user_answer: str, reference_answer: str) -> dict:
    """
    Score a technical answer using multiple similarity measures.
    
    Handles paraphrasing and different wordings for the same concept.
    
    Returns:
        dict with score (0-100) and detailed metrics
    """
    # Clean inputs
    user_answer = " ".join(user_answer.split()).strip()
    reference_answer = " ".join(reference_answer.split()).strip()
    
    # Edge cases
    if not user_answer or len(user_answer) < 5:
        return {"score": 5, "similarity": 0.05, "category": "weak", "feedback": "Answer is too short."}
    
    if not reference_answer:
        return {"score": 50, "similarity": 0.5, "category": "fair", "feedback": "No reference answer available."}
    
    # Detect non-answers
    non_answer = ['i dont know', 'i do not know', 'no idea', 'not sure',
                  'i have no', 'cannot answer', 'dont remember', 'no answer',
                  'i am not sure', 'skip', 'pass']
    lower_answer = user_answer.lower()
    if any(p in lower_answer for p in non_answer) and len(user_answer.split()) < 15:
        return {"score": 5, "similarity": 0.05, "category": "weak",
                "feedback": "Please provide a substantive answer explaining the concept."}
    
    # 1. TF-IDF Cosine Similarity (with synonym expansion)
    expanded_user = expand_with_synonyms(user_answer)
    expanded_ref = expand_with_synonyms(reference_answer)
    
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            lowercase=True,
            ngram_range=(1, 2),
            max_features=200,
            sublinear_tf=True,
        )
        matrix = vectorizer.fit_transform([expanded_user, expanded_ref])
        tfidf_similarity = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
    except Exception:
        tfidf_similarity = 0.0
    
    # 2. Concept overlap (synonym-aware)
    concept_score = concept_overlap_score(user_answer, reference_answer)
    
    # 3. Length ratio scoring (penalize very short answers)
    user_len = len(user_answer.split())
    ref_len = len(reference_answer.split())
    
    if ref_len > 0:
        length_ratio = min(user_len / ref_len, 1.5)  # Cap at 1.5x
        length_score = min(1.0, length_ratio / 0.4) if length_ratio < 0.4 else 1.0
    else:
        length_score = 1.0
    
    # 4. Combined scoring with weights
    # When user answer is much longer than reference, boost the score
    # because they're likely providing more detail (not less)
    length_bonus = 0.0
    if user_len > ref_len * 1.5:
        # User wrote significantly more — likely a detailed correct answer
        length_bonus = 0.1
    
    combined = (
        concept_score * 0.55 +      # 55% - Concept/meaning match (most important)
        tfidf_similarity * 0.30 +   # 30% - Word-level similarity
        length_score * 0.15          # 15% - Completeness
    ) + length_bonus
    
    # Clamp
    combined = min(1.0, combined)
    
    # Convert to 0-100 with generous scaling
    # Key insight: if the user covers 40%+ of reference concepts, it's likely correct
    if combined >= 0.6:
        final_score = 80 + int((combined - 0.6) * 50)
    elif combined >= 0.4:
        final_score = 55 + int((combined - 0.4) * 125)
    elif combined >= 0.25:
        final_score = 35 + int((combined - 0.25) * 133)
    elif combined >= 0.15:
        final_score = 20 + int((combined - 0.15) * 150)
    else:
        final_score = int(combined * 133)
    
    final_score = max(0, min(100, final_score))
    
    # Categorize the answer
    if final_score >= 75:
        category = 'excellent'
        feedback = 'Excellent answer — you clearly understand the concept and explained it well.'
    elif final_score >= 55:
        category = 'good'
        feedback = 'Good answer — you covered the main ideas. Minor improvements possible.'
    elif final_score >= 35:
        category = 'fair'
        feedback = 'Fair attempt — you touched on the topic but missed some key points from the reference.'
    else:
        category = 'weak'
        feedback = 'Weak answer — review the reference answer and focus on the core concepts.'
    
    return {
        "score": final_score,
        "category": category,
        "similarity": round(combined, 4),
        "tfidf_score": round(tfidf_similarity, 4),
        "concept_score": round(concept_score, 4),
        "feedback": feedback,
    }


def main() -> None:
    if len(sys.argv) < 3:
        print('Usage: python evaluate_technical_answer.py "user answer" "reference answer"')
        sys.exit(1)

    user_answer = sys.argv[1]
    reference = sys.argv[2]
    result = score_answer(user_answer, reference)
    
    import json
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
