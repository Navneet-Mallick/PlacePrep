#!/usr/bin/env python
"""
Comprehensive test suite for the resume analysis and aptitude assessment platform.
"""

import json
import sys
from pathlib import Path

# Add scripts to path
SCRIPTS_DIR = Path(__file__).resolve().parent / "ml" / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

from extract_entities import extract_entities
from extract_text import extract_text
from predict_role import predict as predict_role
from evaluate_technical_answer import score_answer
from analyze_resume import analyze_text as analyze_resume_text


def test_ner_extraction():
    """Test Named Entity Recognition and extraction"""
    print("\n" + "="*60)
    print("TEST 1: NER ENTITY EXTRACTION")
    print("="*60)
    
    sample_text = """
    John Doe
    Email: john.doe@gmail.com
    Phone: +91-9876543210
    
    EDUCATION
    B.Tech in Computer Science, Indian Institute of Technology Delhi, 2020
    M.Tech in Data Science, IIT Bombay, 2022
    
    SKILLS
    Python, Java, JavaScript, React, Django, PostgreSQL, AWS, Docker, Kubernetes, Git
    
    EXPERIENCE
    3+ years of experience in full-stack development at Google
    
    CERTIFICATIONS
    AWS Certified Solutions Architect Associate
    Google Cloud Professional Data Engineer
    """
    
    result = extract_entities(sample_text)
    
    print(f"✓ Person extracted: {result['person']}")
    print(f"✓ Email extracted: {result['email']}")
    print(f"✓ Phone extracted: {result['phone']}")
    print(f"✓ Organizations: {result['organizations']}")
    print(f"✓ Skills found ({len(result['skills'])}): {result['skills'][:8]}")
    print(f"✓ Education detected: {len(result['education'])} entries")
    print(f"✓ Certifications: {result['certifications']}")
    print(f"✓ Experience mentions: {result['experience']}")
    
    # Validate results
    assert result['person'], "Failed to extract person name"
    assert result['email'], "Failed to extract email"
    assert result['phone'], "Failed to extract phone"
    assert len(result['skills']) > 5, "Failed to extract enough skills"
    assert result['education'], "Failed to extract education"
    
    print("\n✓ NER TEST PASSED")
    return True


def test_resume_analysis():
    """Test complete resume analysis"""
    print("\n" + "="*60)
    print("TEST 2: COMPLETE RESUME ANALYSIS")
    print("="*60)
    
    sample_text = """
    Jane Smith
    jane.smith@example.com | +1-555-0123
    
    PROFESSIONAL SUMMARY
    Experienced backend developer with expertise in scalable systems
    
    TECHNICAL SKILLS
    Languages: Python, Go, Java
    Frameworks: Django, FastAPI, Spring Boot
    Databases: PostgreSQL, MongoDB, Redis
    Tools: Docker, Kubernetes, Terraform
    
    EDUCATION
    B.S. Computer Science, MIT, 2018
    
    WORK EXPERIENCE
    Senior Backend Engineer at TechCorp (2022-Present)
    - Led microservices architecture implementation
    - 5+ years of software development experience
    
    CERTIFICATIONS
    Kubernetes Application Developer
    AWS Solutions Architect
    """
    
    result = analyze_resume_text(sample_text, use_gemini=False)
    
    print(f"✓ Resume Score: {result['resume_score']}/100")
    print(f"✓ Predicted Role: {result['predicted_role']}")
    print(f"✓ Confidence: {result['confidence']:.2%}")
    print(f"✓ Skills extracted: {len(result['entities']['skills'])}")
    print(f"✓ Suggestions: {len(result['suggestions'])}")
    
    # Validate results
    assert result['resume_score'] > 50, "Resume score too low"
    assert result['predicted_role'], "Failed to predict role"
    assert result['confidence'] > 0, "No confidence score"
    assert result['entities']['skills'], "No skills extracted"
    
    print("\n✓ RESUME ANALYSIS TEST PASSED")
    return True


def test_technical_evaluation():
    """Test technical answer evaluation using TF-IDF"""
    print("\n" + "="*60)
    print("TEST 3: TECHNICAL ANSWER EVALUATION")
    print("="*60)
    
    reference = """
    A database index is a data structure that improves the speed of data 
    retrieval operations on a table. It creates a sorted copy of selected 
    columns and stores pointers to the original table rows. Common index 
    types include B-tree and hash indexes.
    """
    
    test_cases = [
        # (user_answer, should_score_above_zero)
        ("A database index improves data retrieval speed using sorted data structures and pointers to table rows", True),
        ("Database indexing improves query performance", True),
        ("Indexes are used in databases to make queries faster", True),
        (reference, True),  # Perfect/near-perfect match
    ]
    
    for user_answer, should_score in test_cases:
        result = score_answer(user_answer, reference)
        score = result['score']
        
        print(f"Answer: '{user_answer[:50]}...'")
        print(f"  Score: {score}/100")
        
        if should_score:
            assert score > 0, f"Score should be positive, got {score}"
            assert score <= 100, f"Score should be <= 100, got {score}"
    
    print("\n✓ TECHNICAL EVALUATION TEST PASSED")
    return True


def test_role_prediction():
    """Test job role prediction"""
    print("\n" + "="*60)
    print("TEST 4: JOB ROLE PREDICTION")
    print("="*60)
    
    test_resumes = [
        ("Python Django FastAPI microservices", "Backend Developer"),
        ("React Vue JavaScript CSS HTML", "Frontend Developer"),
        ("AWS EC2 Docker Kubernetes", "DevOps Engineer"),
        ("Data analysis pandas scikit-learn", "Data Scientist"),
    ]
    
    for resume_text, expected_role_hint in test_resumes:
        result = predict_role(resume_text)
        role = result['predicted_role']
        confidence = result['confidence']
        
        print(f"Resume excerpt: '{resume_text}'")
        print(f"  Predicted: {role} ({confidence:.1%} confidence)")
        assert confidence > 0, "No confidence score"
    
    print("\n✓ ROLE PREDICTION TEST PASSED")
    return True


def test_platform_integration():
    """Test full platform integration"""
    print("\n" + "="*60)
    print("TEST 5: PLATFORM INTEGRATION")
    print("="*60)
    
    # Simulate a complete user workflow
    print("Simulating user workflow...")
    
    # Step 1: Upload resume
    print("  1. Resume uploaded")
    resume_text = """
    Alice Johnson
    alice@email.com | 555-1234
    
    B.Tech Information Technology, 2020
    Python, Java, SQL, JavaScript
    2 years at software company
    AWS Certified Developer
    """
    
    # Step 2: Analyze resume
    print("  2. Analyzing resume...")
    analysis = analyze_resume_text(resume_text, use_gemini=False)
    print(f"     - Score: {analysis['resume_score']}/100")
    print(f"     - Role: {analysis['predicted_role']}")
    print(f"     - Skills: {len(analysis['entities']['skills'])} found")
    
    # Step 3: Evaluate technical answer (better phrasing)
    print("  3. Evaluating technical answer...")
    reference = "SQL is a language for managing relational databases with structured query operations"
    user_answer = "SQL is used to manage databases and perform query operations"
    tech_result = score_answer(user_answer, reference)
    print(f"     - Score: {tech_result['score']}/100")
    
    # Step 4: Validate all components
    assert analysis['resume_score'] > 0, "Resume analysis failed"
    assert tech_result['score'] > 20, "Technical evaluation failed"
    
    print("\n✓ PLATFORM INTEGRATION TEST PASSED")
    return True


def main():
    """Run all tests"""
    print("\n" + "█"*60)
    print("PLACEMENTPREP - PLATFORM FUNCTIONALITY TEST")
    print("█"*60)
    
    tests = [
        ("NER Extraction", test_ner_extraction),
        ("Resume Analysis", test_resume_analysis),
        ("Technical Evaluation", test_technical_evaluation),
        ("Role Prediction", test_role_prediction),
        ("Platform Integration", test_platform_integration),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            test_func()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"\n✗ {test_name} FAILED: {str(e)}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "█"*60)
    print(f"TEST RESULTS: {passed} passed, {failed} failed")
    print("█"*60)
    
    if failed == 0:
        print("\n✓ ALL TESTS PASSED - PLATFORM IS FUNCTIONAL")
        return 0
    else:
        print(f"\n✗ {failed} TESTS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
