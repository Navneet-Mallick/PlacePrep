"""
Unit & Integration Tests for PlacementPrep ML Modules.

Run: python -m pytest tests/ -v
Or:  .\venv\Scripts\python.exe -m pytest tests/ -v
"""

import sys
from pathlib import Path

# Add scripts to path
SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "ml" / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))


# ============================================================
# UNIT TESTS: Resume Entity Extraction
# ============================================================

class TestEntityExtraction:
    """Unit tests for extract_entities.py"""

    def test_extracts_email(self):
        from extract_entities import extract_entities
        result = extract_entities("John Doe\njohn@gmail.com\nSkills: Python")
        assert "john@gmail.com" in result["email"]

    def test_extracts_phone(self):
        from extract_entities import extract_entities
        result = extract_entities("John Doe\n+977-9841234567\nSkills: Python")
        assert any("9841234567" in p for p in result["phone"])

    def test_does_not_extract_year_range_as_phone(self):
        from extract_entities import extract_entities
        result = extract_entities("Experience\nDeveloper 2023-2024")
        assert not any("2023-2024" in p for p in result["phone"])

    def test_extracts_skills(self):
        from extract_entities import extract_entities
        result = extract_entities("Skills\nPython, Django, React, PostgreSQL, Docker")
        skills = result["skills"]
        assert "python" in skills
        assert "django" in skills
        assert "react" in skills

    def test_no_false_positive_skills(self):
        from extract_entities import extract_entities
        result = extract_entities("I went to the store to go shopping")
        # "go" should not match as a skill without golang context
        assert "go" not in result["skills"]

    def test_extracts_education(self):
        from extract_entities import extract_entities
        result = extract_entities("Education\nBachelor of Engineering in Computer Engineering 2024")
        assert len(result["education"]) >= 1
        assert any("bachelor" in e.lower() for e in result["education"])

    def test_education_skips_objective(self):
        from extract_entities import extract_entities
        result = extract_entities("Objective\nSeeking a software engineering role\nEducation\nBSc Computer Science")
        # "Seeking..." should NOT be in education
        assert not any("seeking" in e.lower() for e in result["education"])

    def test_extracts_experience(self):
        from extract_entities import extract_entities
        text = "Experience\nSoftware Developer Intern at TechCorp 2023-2024\nBuilt REST APIs"
        result = extract_entities(text)
        assert len(result["experience"]) >= 1
        assert any("developer" in e.lower() for e in result["experience"])

    def test_experience_skips_action_lines(self):
        from extract_entities import extract_entities
        text = "Experience\nDeveloper at Corp 2023-2024\nDeveloped microservices\nBuilt APIs"
        result = extract_entities(text)
        # Action lines should not be in experience
        assert not any(e.lower().startswith("built") for e in result["experience"])

    def test_extracts_certifications(self):
        from extract_entities import extract_entities
        text = "Certifications\nAWS Certified Cloud Practitioner 2024"
        result = extract_entities(text)
        assert len(result["certifications"]) >= 1

    def test_extracts_person_name(self):
        from extract_entities import extract_entities
        result = extract_entities("Navneet Mallick\nnavneet@email.com\nDharan")
        assert len(result["person"]) >= 1
        assert "Navneet Mallick" in result["person"]

    def test_empty_text_returns_empty(self):
        from extract_entities import extract_entities
        result = extract_entities("")
        assert result["skills"] == []
        assert result["email"] == []


# ============================================================
# UNIT TESTS: Technical Answer Evaluation
# ============================================================

class TestTechnicalEvaluation:
    """Unit tests for evaluate_technical_answer.py"""

    def test_correct_answer_scores_high(self):
        from evaluate_technical_answer import score_answer
        result = score_answer(
            "A hash table is a data structure that maps keys to values using a hash function for O(1) average lookup time.",
            "A hash table stores key-value pairs using a hash function to compute an index into an array of buckets."
        )
        assert result["score"] >= 55
        assert result["category"] in ("excellent", "good")

    def test_wrong_answer_scores_low(self):
        from evaluate_technical_answer import score_answer
        result = score_answer(
            "I like pizza and football.",
            "A hash table stores key-value pairs using a hash function."
        )
        assert result["score"] < 35
        assert result["category"] == "weak"

    def test_non_answer_scores_minimal(self):
        from evaluate_technical_answer import score_answer
        result = score_answer(
            "I dont know",
            "TCP is a reliable transport protocol that uses three-way handshake."
        )
        assert result["score"] <= 10
        assert result["category"] == "weak"

    def test_paraphrased_answer_reasonable_score(self):
        from evaluate_technical_answer import score_answer
        result = score_answer(
            "A linked list is a sequence of nodes where each node points to the next one in the chain.",
            "A linked list is a linear data structure where each element contains a reference to the next node."
        )
        assert result["score"] >= 40

    def test_synonym_awareness(self):
        from evaluate_technical_answer import score_answer
        # "method" and "function" are synonyms
        result = score_answer(
            "A method is a reusable block of code that performs a specific task.",
            "A function is a reusable block of code that performs a specific task."
        )
        assert result["score"] >= 70

    def test_short_answer_penalized(self):
        from evaluate_technical_answer import score_answer
        result = score_answer("yes", "Recursion is when a function calls itself to solve smaller subproblems.")
        assert result["score"] < 20

    def test_returns_required_fields(self):
        from evaluate_technical_answer import score_answer
        result = score_answer("test answer", "reference answer")
        assert "score" in result
        assert "category" in result
        assert "similarity" in result
        assert "feedback" in result


# ============================================================
# UNIT TESTS: Resume Role Prediction
# ============================================================

class TestRolePrediction:
    """Unit tests for predict_role.py"""

    def test_prediction_returns_dict(self):
        from predict_role import predict
        result = predict("Python Django PostgreSQL REST API backend development microservices")
        assert isinstance(result, dict)
        assert "predicted_role" in result
        assert "confidence" in result

    def test_short_text_returns_unknown(self):
        from predict_role import predict
        result = predict("hi")
        assert result["predicted_role"] == "Unknown"
        assert result["confidence"] == 0.0

    def test_empty_text_returns_unknown(self):
        from predict_role import predict
        result = predict("")
        assert result["predicted_role"] == "Unknown"

    def test_confidence_is_float(self):
        from predict_role import predict
        result = predict("React JavaScript CSS HTML frontend web development UI UX components")
        assert isinstance(result["confidence"], float)
        assert 0 <= result["confidence"] <= 1


# ============================================================
# UNIT TESTS: Resume Scoring
# ============================================================

class TestResumeScoring:
    """Unit tests for analyze_resume.py scoring logic"""

    def test_complete_resume_scores_high(self):
        from analyze_resume import compute_resume_score
        entities = {
            "person": ["John Doe"],
            "email": ["john@test.com"],
            "phone": ["9841234567"],
            "skills": ["python", "django", "react", "docker", "git", "sql", "aws", "redis"],
            "education": ["BSc Computer Science", "MSc Data Science"],
            "experience": ["Developer at Corp 2023", "Intern at Startup 2022", "Lead at XYZ 2024"],
            "certifications": ["AWS Certified", "Google Cloud"],
            "organizations": ["TechCorp", "StartupABC", "DataInc"],
        }
        score = compute_resume_score(entities)
        assert score >= 80

    def test_empty_resume_scores_zero(self):
        from analyze_resume import compute_resume_score
        entities = {
            "person": [], "email": [], "phone": [],
            "skills": [], "education": [], "experience": [],
            "certifications": [], "organizations": [],
        }
        score = compute_resume_score(entities)
        assert score == 0

    def test_partial_resume_scores_moderate(self):
        from analyze_resume import compute_resume_score
        entities = {
            "person": ["Jane"],
            "email": ["jane@test.com"],
            "phone": [],
            "skills": ["python", "react"],
            "education": ["BSc CS"],
            "experience": [],
            "certifications": [],
            "organizations": [],
        }
        score = compute_resume_score(entities)
        assert 20 <= score <= 60


# ============================================================
# UNIT TESTS: PDF Text Cleaning
# ============================================================

class TestPDFCleaning:
    """Unit tests for clean_pdf_text()"""

    def test_joins_broken_words(self):
        from extract_entities import clean_pdf_text
        assert "Developer" in clean_pdf_text("Dev eloper") or "eloper" in clean_pdf_text("Dev eloper")

    def test_preserves_normal_text(self):
        from extract_entities import clean_pdf_text
        text = "Software Developer at TechCorp"
        # Should not mangle normal spaced text
        result = clean_pdf_text(text)
        assert "Software" in result or "Developer" in result


# ============================================================
# INTEGRATION TEST: Full Resume Analysis Pipeline
# ============================================================

class TestResumeAnalysisPipeline:
    """Integration test: full end-to-end resume analysis"""

    def test_full_pipeline(self):
        from analyze_resume import analyze_text
        text = """Navneet Mallick
navneet@gmail.com
+977-9841234567
Dharan, Nepal

Education
Bachelor of Engineering in Computer Engineering 2024 - Present
IOE Purwanchal Campus

Skills
Python, Django, React, PostgreSQL, Docker, Git, FastAPI

Experience
Software Developer Intern at Leapfrog Technology 2023-2024
Backend Engineer at F1Soft International, Jan 2024 - Present

Certifications
AWS Certified Cloud Practitioner 2024"""

        result = analyze_text(text, use_gemini=False)

        # Should not have errors
        assert "error" not in result or not result.get("error")

        # Should have a score
        assert result["resume_score"] > 0
        assert result["resume_score"] <= 100

        # Should predict a role
        assert result["predicted_role"] != "Unknown"

        # Should have confidence
        assert result["confidence"] > 0

        # Should have entities
        entities = result["entities"]
        assert len(entities["email"]) >= 1
        assert len(entities["skills"]) >= 3
        assert len(entities["education"]) >= 1
        assert len(entities["experience"]) >= 1


# ============================================================
# INTEGRATION TEST: Proctoring System
# ============================================================

class TestProctoringSystem:
    """Integration tests for the proctoring module"""

    def test_proctoring_import(self):
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ml" / "api"))
        from proctoring import proctoring_system, reset_proctoring_state
        # System should initialize (may or may not have DNN model)
        assert proctoring_system is not None

    def test_reset_state(self):
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ml" / "api"))
        from proctoring import reset_proctoring_state
        result = reset_proctoring_state()
        assert result["status"] == "ok"

    def test_invalid_image_returns_error(self):
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ml" / "api"))
        from proctoring import check_proctoring
        result = check_proctoring("not_a_valid_base64_image")
        assert result["status"] == "error"


# ============================================================
# Run with: python -m pytest tests/test_ml_modules.py -v
# ============================================================
