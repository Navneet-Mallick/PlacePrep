"""
End-to-end resume analysis: text extraction, NER, role prediction, and scoring.

Usage:
    python ml/scripts/analyze_resume.py path/to/resume.pdf
    python ml/scripts/analyze_resume.py --text "resume text here"
"""

import json
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from extract_entities import extract_entities
from extract_text import extract_text
from gemini_recommendations import generate_recommendations_safe
from predict_role import predict as predict_role

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def compute_resume_score(entities: dict) -> int:
    score = 0
    if entities["person"]:
        score += 10
    if entities["email"]:
        score += 10
    if entities["phone"]:
        score += 5
    if entities["skills"]:
        score += min(len(entities["skills"]) * 4, 30)
    if entities["education"]:
        score += 15
    if entities["certifications"]:
        score += 10
    if entities["experience"]:
        score += 15
    return min(score, 100)


def build_suggestions(entities: dict, resume_score: int) -> list[str]:
    suggestions = []
    if not entities["email"]:
        suggestions.append("Add a professional email address.")
    if not entities["phone"]:
        suggestions.append("Include a contact phone number.")
    if len(entities["skills"]) < 5:
        suggestions.append("List more relevant technical skills.")
    if not entities["education"]:
        suggestions.append("Add education details with degree and institution.")
    if not entities["experience"]:
        suggestions.append("Highlight internships, projects, or work experience.")
    if resume_score < 70:
        suggestions.append("Improve resume completeness before applying to placements.")
    if not suggestions:
        suggestions.append("Resume structure looks good. Tailor skills to your target role.")
    return suggestions


def analyze_text(text: str, use_gemini: bool = True) -> dict:
    entities = extract_entities(text)
    role_result = predict_role(text)
    resume_score = compute_resume_score(entities)

    result = {
        "parsed_text": text,
        "resume_score": resume_score,
        "predicted_role": role_result["predicted_role"],
        "confidence": role_result["confidence"],
        "entities": entities,
        "suggestions": build_suggestions(entities, resume_score),
    }

    if use_gemini:
        result["recommendations"] = generate_recommendations_safe(result, text)

    return result


def analyze_file(path: Path) -> dict:
    text = extract_text(path)
    result = analyze_text(text)
    result["parsed_text"] = text
    result["source_file"] = path.name
    result["text_length"] = len(text)
    return result


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python ml/scripts/analyze_resume.py path/to/resume.pdf")
        print('  python ml/scripts/analyze_resume.py --text "resume text"')
        sys.exit(1)

    if sys.argv[1] == "--text":
        if len(sys.argv) < 3:
            print("Missing text argument.")
            sys.exit(1)
        use_gemini = "--no-gemini" not in sys.argv
        text = " ".join(arg for arg in sys.argv[2:] if not arg.startswith("--"))
        result = analyze_text(text, use_gemini=use_gemini)
    else:
        path = Path(sys.argv[1])
        if not path.exists():
            print(f"File not found: {path}")
            sys.exit(1)
        result = analyze_file(path)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
