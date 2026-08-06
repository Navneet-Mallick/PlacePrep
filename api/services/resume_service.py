"""Resume analysis orchestration between Django and the ML API."""


def validate_ml_response(ml_result: dict) -> dict:
    """Validate that ML response has required fields."""
    required_fields = {
        "parsed_text": str,
        "predicted_role": str,
        "confidence": (int, float),
        "resume_score": (int, float),
        "entities": dict,
    }
    
    for field, expected_type in required_fields.items():
        if field not in ml_result:
            raise ValueError(f"ML API response missing required field: {field}")
        
        if not isinstance(ml_result[field], expected_type):
            raise ValueError(f"ML API field '{field}' has invalid type. Expected {expected_type}, got {type(ml_result[field])}")
    
    # Validate resume_score is in valid range
    if not (0 <= ml_result["resume_score"] <= 100):
        raise ValueError(f"resume_score must be between 0-100, got {ml_result['resume_score']}")
    
    # Validate confidence is in valid range
    if not (0 <= ml_result["confidence"] <= 1):
        raise ValueError(f"confidence must be between 0-1, got {ml_result['confidence']}")
    
    return ml_result


def normalize_ml_result(ml_result: dict) -> dict:
    """Map ML API response fields to Resume model field names."""
    if ml_result.get("error"):
        raise ValueError(ml_result["error"])

    # Validate response has required fields
    validate_ml_response(ml_result)

    return {
        "parsed_text": ml_result.get("parsed_text", ""),
        "predicted_role": ml_result.get("predicted_role", ""),
        "role_confidence": ml_result.get("confidence", 0),
        "resume_score": int(ml_result.get("resume_score", 0)),
        "extracted_entities": ml_result.get("entities", {}),
        "recommendations": ml_result.get("recommendations", {}),
    }
