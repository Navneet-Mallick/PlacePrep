"""Resume analysis orchestration between Django and the ML API."""


def normalize_ml_result(ml_result: dict) -> dict:
    """
    Map ML API response fields to Resume model field names.
    Handles edge cases and missing fields gracefully.
    """
    # Check for explicit error
    if ml_result.get("error"):
        raise ValueError(ml_result["error"])

    # Extract with safe defaults (don't crash on missing fields)
    parsed_text = ml_result.get("parsed_text", "")
    predicted_role = ml_result.get("predicted_role", "Unknown")
    confidence = ml_result.get("confidence", 0.0)
    resume_score = ml_result.get("resume_score", 0)
    entities = ml_result.get("entities", {})
    recommendations = ml_result.get("recommendations", {})
    suggestions = ml_result.get("suggestions", [])

    # Clamp values to valid ranges
    confidence = max(0.0, min(1.0, float(confidence)))
    resume_score = max(0, min(100, int(resume_score)))

    # Ensure entities is a dict
    if not isinstance(entities, dict):
        entities = {}

    return {
        "parsed_text": str(parsed_text) if parsed_text else "",
        "predicted_role": str(predicted_role) if predicted_role else "Unknown",
        "role_confidence": confidence,
        "resume_score": resume_score,
        "extracted_entities": entities,
        "recommendations": recommendations if isinstance(recommendations, dict) else {},
        "suggestions": suggestions if isinstance(suggestions, list) else [],
    }
