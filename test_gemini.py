#!/usr/bin/env python
"""
Test Gemini API integration for resume recommendations.
"""

import sys
from pathlib import Path

# Add scripts to path
SCRIPTS_DIR = Path(__file__).resolve().parent / "ml" / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

from gemini_recommendations import generate_recommendations_safe


def test_gemini_api():
    """Test Gemini API for generating recommendations"""
    print("\n" + "="*60)
    print("GEMINI API INTEGRATION TEST")
    print("="*60)
    
    # Sample resume analysis
    test_analysis = {
        'resume_score': 85,
        'predicted_role': 'Backend Developer',
        'confidence': 0.92,
        'entities': {
            'person': ['John Doe'],
            'email': ['john@example.com'],
            'phone': ['9876543210'],
            'skills': ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS'],
            'education': ['B.Tech Computer Science, 2020'],
            'certifications': [],
            'experience': ['2 years backend development']
        },
        'suggestions': ['Add more certifications', 'Include personal projects']
    }
    
    resume_text = """
    John Doe
    john@example.com | 9876543210
    
    B.Tech Computer Science, Indian Institute of Technology, 2020
    
    SKILLS: Python, Django, PostgreSQL, Docker, AWS, Git
    
    EXPERIENCE:
    Backend Developer at TechCorp (2022-Present)
    - Developed microservices using Django and PostgreSQL
    - Deployed applications using Docker and AWS
    
    CERTIFICATIONS:
    AWS Certified Developer Associate (2023)
    """
    
    print("\nTesting Gemini API for resume recommendations...")
    print(f"Resume Score: {test_analysis['resume_score']}")
    print(f"Predicted Role: {test_analysis['predicted_role']}")
    print(f"Confidence: {test_analysis['confidence']:.1%}\n")
    
    try:
        result = generate_recommendations_safe(test_analysis, resume_text)
        
        print("✓ GEMINI API RESPONSE:")
        print("-" * 60)
        
        if 'error' in result:
            print(f"⚠️  API Error: {result['error']}")
        else:
            print(f"\n📋 Summary:")
            print(f"   {result.get('summary', 'N/A')}")
            
            print(f"\n🎯 Role Fit:")
            print(f"   {result.get('predicted_role_fit', 'N/A')}")
            
            missing_skills = result.get('missing_skills', [])
            if missing_skills:
                print(f"\n📌 Missing Skills:")
                for skill in missing_skills[:5]:
                    print(f"   • {skill}")
            
            topics = result.get('recommended_topics', [])
            if topics:
                print(f"\n📚 Recommended Topics:")
                for topic in topics[:5]:
                    print(f"   • {topic}")
            
            improvements = result.get('resume_improvements', [])
            if improvements:
                print(f"\n✏️  Resume Improvements:")
                for improvement in improvements[:5]:
                    print(f"   • {improvement}")
            
            learning_path = result.get('learning_path', [])
            if learning_path:
                print(f"\n🛤️  Learning Path:")
                for step in learning_path[:5]:
                    print(f"   • {step}")
            
            focus = result.get('practice_focus', [])
            if focus:
                print(f"\n🎓 Practice Focus:")
                for item in focus[:5]:
                    print(f"   • {item}")
        
        print("\n" + "-" * 60)
        print("✓ GEMINI API TEST PASSED - RECOMMENDATIONS GENERATED")
        return True
        
    except Exception as e:
        print(f"\n✗ GEMINI API TEST FAILED")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_gemini_api()
    sys.exit(0 if success else 1)
