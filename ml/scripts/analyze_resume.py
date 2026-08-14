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
    """
    Compute resume score based on entities found.
    More discriminating than simple presence checks —
    rewards depth (multiple skills, detailed experience).
    """
    score = 0
    
    # Contact info (15 points max)
    if entities.get("person"):
        score += 5
    if entities.get("email"):
        score += 5
    if entities.get("phone"):
        score += 5
    
    # Skills (25 points max) — diminishing returns
    skills_count = len(entities.get("skills", []))
    if skills_count >= 8:
        score += 25
    elif skills_count >= 5:
        score += 20
    elif skills_count >= 3:
        score += 15
    elif skills_count >= 1:
        score += 8
    
    # Education (15 points)
    education = entities.get("education", [])
    if len(education) >= 2:
        score += 15
    elif len(education) == 1:
        score += 12
    
    # Experience (25 points) — rewards detail
    experience = entities.get("experience", [])
    if len(experience) >= 3:
        score += 25
    elif len(experience) >= 2:
        score += 20
    elif len(experience) == 1:
        score += 12
    
    # Certifications (10 points)
    certs = entities.get("certifications", [])
    if len(certs) >= 2:
        score += 10
    elif len(certs) == 1:
        score += 7
    
    # Organizations (10 points)
    orgs = entities.get("organizations", [])
    if len(orgs) >= 3:
        score += 10
    elif len(orgs) >= 1:
        score += 5
    
    return min(score, 100)


def build_suggestions(entities: dict, resume_score: int) -> list:
    """Generate actionable suggestions based on resume analysis"""
    suggestions = []
    
    # Critical missing info
    if not entities.get("person"):
        suggestions.append("❌ Add your full name at the top of the resume")
    
    if not entities.get("email"):
        suggestions.append("❌ Include a professional email address")
    
    if not entities.get("phone"):
        suggestions.append("❌ Add a contact phone number")
    
    # Skills section
    skills_count = len(entities.get("skills", []))
    if skills_count < 3:
        suggestions.append("⚠️  List more technical skills (aim for at least 5-8)")
    elif skills_count < 8:
        suggestions.append("📝 Consider adding more relevant technical skills")
    
    # Education
    if not entities.get("education"):
        suggestions.append("📚 Add your education section with degree, institution, and year")
    
    # Experience
    if not entities.get("experience"):
        suggestions.append("💼 Add work experience, internships, or significant projects")
    
    # Certifications
    if not entities.get("certifications") and resume_score < 70:
        suggestions.append("🏆 Add professional certifications to boost credibility")
    
    # Organizations
    if not entities.get("organizations"):
        suggestions.append("🏢 Mention companies you've worked with or organizations")
    
    # Overall score feedback
    if resume_score < 50:
        suggestions.append("🔴 Resume is incomplete. Fill in major sections to improve score")
    elif resume_score < 70:
        suggestions.append("🟡 Resume could be more complete. Add missing information")
    elif resume_score < 85:
        suggestions.append("🟢 Good resume structure. Fine-tune for better ATS compatibility")
    else:
        suggestions.append("✅ Excellent resume structure! Ready for application")
    
    return suggestions


def analyze_text(text: str, use_gemini: bool = True) -> dict:
    """Analyze resume text and extract information"""
    try:
        # Clean text
        text = text.replace('\x00', '').strip()
        
        if not text or len(text) < 30:
            return {
                "error": "Resume text too short for analysis",
                "parsed_text": text,
                "resume_score": 0,
                "predicted_role": "Unknown",
                "confidence": 0.0,
                "entities": {},
                "suggestions": ["Please provide more detailed resume content"]
            }
        
        # Extract entities
        entities = extract_entities(text)
        
        # Predict role
        try:
            role_result = predict_role(text)
        except Exception as e:
            print(f"Warning: Role prediction failed - {e}", file=sys.stderr)
            role_result = {
                "predicted_role": "Unknown",
                "confidence": 0.0
            }
        
        # Compute score
        resume_score = compute_resume_score(entities)
        
        result = {
            "parsed_text": text[:5000],  # Limit stored text size
            "resume_score": resume_score,
            "predicted_role": role_result.get("predicted_role", "Unknown"),
            "confidence": role_result.get("confidence", 0.0),
            "entities": entities,
            "suggestions": build_suggestions(entities, resume_score),
        }
        
        # Add recommendations if Gemini is available
        if use_gemini:
            try:
                recommendations = generate_recommendations_safe(result, text)
                if recommendations:
                    result["recommendations"] = recommendations
            except Exception as e:
                print(f"Warning: Gemini recommendations failed - {e}", file=sys.stderr)
        
        return result
    
    except Exception as e:
        print(f"Analysis error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {
            "error": f"Analysis failed: {str(e)}",
            "parsed_text": text[:500] if text else "",
            "resume_score": 0,
            "predicted_role": "Unknown",
            "confidence": 0.0,
            "entities": {},
            "suggestions": ["An error occurred during analysis. Please try again."]
        }


def analyze_file(path: Path) -> dict:
    """Analyze resume file (PDF or DOCX)"""
    try:
        text = extract_text(path)
        
        if not text or len(text.strip()) < 30:
            return {
                "error": "Could not extract meaningful text from file. The file may be image-based or corrupted.",
                "source_file": path.name,
                "resume_score": 0,
                "predicted_role": "Unknown",
                "confidence": 0.0,
                "entities": {},
                "suggestions": [
                    "Ensure your resume file contains selectable text (not scanned images)",
                    "Try saving as DOCX format for better text extraction",
                    "Verify the file is not password-protected or corrupted"
                ]
            }
        
        result = analyze_text(text)
        result["source_file"] = path.name
        result["text_length"] = len(text)
        return result
    
    except Exception as e:
        print(f"File analysis error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {
            "error": f"Failed to read file: {str(e)}",
            "source_file": path.name,
            "resume_score": 0,
            "predicted_role": "Unknown",
            "confidence": 0.0,
            "entities": {},
            "suggestions": [f"Error processing file: {str(e)}"]
        }


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
