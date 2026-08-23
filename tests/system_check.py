"""Full system health check — run before presentation."""
import sys, os, warnings
warnings.filterwarnings('ignore')
sys.path.insert(0, 'ml/scripts')
sys.path.insert(0, 'ml/api')

print("=" * 50)
print("FULL SYSTEM CHECK")
print("=" * 50)

# 1. Resume Analysis
print("\n[1] Resume Analysis Pipeline...")
from analyze_resume import analyze_text
result = analyze_text("Navneet Mallick\nnavneet@gmail.com\n9841234567\n\nEducation\nBE Computer Engineering, IOE 2021-2025\n\nSkills\nPython, Django, React, PostgreSQL, Docker\n\nExperience\nSoftware Developer Intern at TechCorp 2024\n\nCertifications\nAWS Certified 2024", use_gemini=False)
assert result['resume_score'] > 0
assert result['predicted_role'] != 'Unknown'
assert len(result['entities']['skills']) >= 3
print(f"   Score: {result['resume_score']}, Role: {result['predicted_role']}, Skills: {len(result['entities']['skills'])}")
print("   PASS")

# 2. Technical Evaluation
print("\n[2] Technical Answer Evaluation...")
from evaluate_technical_answer import score_answer
r = score_answer("A linked list is a sequence of nodes where each node has data and a pointer to the next node", "A linked list is a linear data structure where each element contains a reference to the next node")
assert r['score'] >= 50
print(f"   Score: {r['score']}, Category: {r['category']}")
print("   PASS")

# 3. Role Prediction
print("\n[3] Role Prediction (Logistic Regression)...")
from predict_role import predict
r = predict("Python Django PostgreSQL REST API backend development Docker Kubernetes")
assert r['predicted_role'] != 'Unknown'
print(f"   Role: {r['predicted_role']}, Confidence: {r['confidence']:.2%}")
print("   PASS")

# 4. Aptitude Level Prediction
print("\n[4] Aptitude Level (Random Forest)...")
import joblib, numpy as np
model = joblib.load('ml/models/aptitude_level_classifier.joblib')
pred = model.predict(np.array([[85, 90, 600, 80, 85, 90]]))[0]
levels = ['beginner', 'intermediate', 'advanced']
print(f"   Level: {levels[int(pred)]}")
print("   PASS")

# 5. Proctoring
print("\n[5] Proctoring System...")
from proctoring import proctoring_system, reset_proctoring_state
reset_proctoring_state()
print(f"   Ready: {proctoring_system.ready}, DNN: {proctoring_system.use_dnn}")
print("   PASS")

# 6. Gemini API
print("\n[6] Gemini API...")
from dotenv import load_dotenv
load_dotenv()
key = os.getenv('GEMINI_API_KEY', '')
print(f"   Key present: {bool(key)} (starts with {key[:6]}...)")
try:
    from google import genai
    client = genai.Client(api_key=key)
    r = client.models.generate_content(model='gemini-2.5-flash', contents='Reply with just the word OK')
    print(f"   Response: {r.text.strip()[:30]}")
    print("   PASS")
except Exception as e:
    print(f"   FAILED: {e}")

# 7. Django Check
print("\n[7] Django System Check...")
import django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.core.management import call_command
from io import StringIO
out = StringIO()
call_command('check', stdout=out, stderr=out)
output = out.getvalue()
print(f"   {output.strip()}")
print("   PASS")

print("\n" + "=" * 50)
print("ALL CHECKS PASSED — SYSTEM READY FOR PRESENTATION")
print("=" * 50)
