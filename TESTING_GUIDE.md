# PlacementPrep - Complete Testing Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (already installed and configured)

---

## 📋 Step-by-Step Setup & Testing

### 1️⃣ Start Backend (Django API)

```bash
# Django server is already running on port 8001
# Check status:
curl http://localhost:8001/api/health/

# If not running, start it:
python manage.py runserver 8001
```

**Expected Output:** `{"status": "ok", "message": "Django API is running"}`

---

### 2️⃣ Start ML API (FastAPI)

```bash
# Open new terminal
cd ml/api
python server.py
```

**Expected Output:** 
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Test ML API:**
```bash
curl http://localhost:8000/api/health
```

---

### 3️⃣ Start Frontend (React + Vite)

```bash
# Open new terminal
cd frontend
npm install  # First time only
npm run dev
```

**Expected Output:** `Local: http://localhost:5173`

---

## 🧪 Complete Testing Flow

### Test 1: User Registration & Login

#### A. Register New User
1. Open browser: `http://localhost:5173`
2. Click **Sign Up**
3. Fill form:
   - Email: `testuser@test.com`
   - Password: `test123456`
   - First Name: `Test`
   - Last Name: `User`
4. Click **Register**

**Expected:** Redirect to login

#### B. Login
1. Email: `testuser@test.com`
2. Password: `test123456`
3. Click **Login**

**Expected:** Redirect to dashboard

---

### Test 2: Resume Analysis

#### Upload Resume
1. Navigate to **Resume** tab
2. Click **Upload Resume**
3. Select a PDF/DOCX resume file
4. Click **Analyze**

**What Happens:**
- Backend extracts text from file
- ML API performs NER (extracts skills, education, etc.)
- Logistic Regression predicts job role
- Gemini generates recommendations
- Resume score calculated

**Expected Output:**
- Predicted Role (e.g., "Backend Developer")
- Resume Score (0-100)
- Extracted Skills list
- Recommendations for improvement

**Test via API (Optional):**
```bash
curl -X POST http://localhost:8000/api/resume/analyze \
  -F "resume=@sample_resume.pdf"
```

---

### Test 3: Aptitude Test (with Proctoring)

#### A. Start Test
1. Navigate to **Aptitude** tab
2. Choose section:
   - 🔢 Quantitative
   - 🧩 Logical Reasoning
   - ⚙️ Technical

3. Click on a section

**Proctoring System Active:**
- Tab switching detection (JS-based)
- Camera monitoring (YOLO-based, optional)
- Violation tracking

#### B. Take Test
1. Answer questions (select A/B/C/D)
2. Navigate with **Previous/Next**
3. Click **Exit & Get Score** anytime (partial submission)
   - OR complete all questions and click **Submit Test**

**ML Processing:**
- Random Forest predicts aptitude level
- Features: score, accuracy, time, section scores
- Output: Beginner/Intermediate/Advanced

**Expected Results:**
- Total Score
- Accuracy %
- Aptitude Level (beginner/intermediate/advanced)
- Section-wise breakdown
- Proctoring score
- Tab switch count

---

### Test 4: Technical Assessment

#### A. Answer Technical Question
1. Navigate to **Technical** tab
2. Select category (DSA, DBMS, OS, CN, Git, Web)
3. Read question
4. Type your answer
5. Click **Submit**

**ML Processing:**
- TF-IDF vectorization
- Cosine similarity with reference answer
- Score calculation (0-100)

**Expected Output:**
- Score (0-100)
- Similarity score (0-1)
- Feedback message

**Test via API:**
```bash
curl -X POST http://localhost:8000/api/technical/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "user_answer": "Normalization removes redundancy",
    "reference_answer": "Normalization is the process of organizing data to reduce redundancy and improve data integrity"
  }'
```

---

### Test 5: Dashboard & Analytics

1. Navigate to **Dashboard**
2. View:
   - Resume score card
   - Aptitude level badge
   - Technical score average
   - Progress charts
   - Weak areas
   - Personalized recommendations

**Recommendations Engine:**
- Analyzes resume score (<70% → improve resume)
- Checks weak sections (<60% → practice more)
- Identifies weak categories
- Prioritizes recommendations

---

## 🔍 Advanced Testing

### Test Proctoring System

#### Tab Switch Detection (Already Active)
1. Start aptitude test
2. Press **Alt+Tab** to switch window
3. Return to test
4. See warning alert

**Expected:** "⚠️ WARNING: You switched tabs!"

#### CV-Based Face Detection (YOLO)
```bash
# Test proctoring endpoint
curl -X POST http://localhost:8000/api/proctoring/check \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_webcam_frame"}'
```

**Expected Response:**
```json
{
  "status": "ok",
  "face_count": 1,
  "message": "Single person detected",
  "confidence": 0.95,
  "violation_type": null
}
```

---

### Test ML Models

#### 1. Random Forest (Aptitude Level)
```bash
cd ml/scripts
python predict_aptitude_level.py
```

**Sample Output:**
```
Score: 88, Accuracy: 92%, Time: 900s
Predicted Level: advanced (confidence: 100.00%)
```

#### 2. Logistic Regression (Resume Role)
```bash
cd ml/scripts
python predict_role.py "Python developer with Django experience and ML knowledge"
```

**Expected:** `{"predicted_role": "Backend Developer", "confidence": 0.89}`

#### 3. TF-IDF Similarity (Technical Evaluation)
```bash
cd ml/scripts
python evaluate_technical_answer.py "User answer here" "Reference answer here"
```

---

## 📊 Database Verification

### Check PostgreSQL Data

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from api.models import *

# Check users
User.objects.count()

# Check questions
AptitudeQuestion.objects.count()  # Should be 565
TechnicalQuestion.objects.count()  # Should be 200

# Check test attempts
AptitudeTestAttempt.objects.all()

# Check recommendations
Recommendation.objects.all()
```

---

## 🔐 Admin Panel Testing

1. Open: `http://localhost:8001/admin/`
2. Login:
   - Username: `admin`
   - Password: `admin123`

3. Navigate through:
   - Users
   - Aptitude Questions (565 entries)
   - Technical Questions (200 entries)
   - Resume records
   - Test Attempts
   - Recommendations

---

## 🐛 Troubleshooting

### Issue: Django not connecting to PostgreSQL
```bash
# Check .env file
DB_ENGINE=postgresql
DB_NAME=placementprep
DB_PASSWORD=knapsack  # Your actual password

# Test connection
python manage.py check
```

### Issue: ML API not responding
```bash
# Check if FastAPI is running
curl http://localhost:8000/api/health

# Restart ML API
cd ml/api
python server.py
```

### Issue: Frontend can't connect to backend
```bash
# Check CORS settings in config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Check frontend .env.local
VITE_API_URL=http://localhost:8001/api
```

### Issue: YOLO model not loading
```bash
# Install ultralytics
pip install ultralytics

# Download YOLOv8 model
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

---

## 📝 API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/profile` - Get profile

### Resume
- `POST /api/resumes/` - Upload & analyze
- `GET /api/resumes/` - List resumes
- `GET /api/resumes/latest/` - Get latest

### Aptitude
- `GET /api/aptitude/questions/` - List questions
- `GET /api/aptitude/questions/by_section/?section=quantitative`
- `POST /api/aptitude/attempts/` - Submit test
- `GET /api/aptitude/attempts/history/` - Test history

### Technical
- `GET /api/technical/questions/` - List questions
- `GET /api/technical/questions/by_category/?category=dsa`
- `POST /api/technical/answers/` - Submit answer
- `GET /api/technical/answers/history/` - Answer history

### Dashboard
- `GET /api/dashboard/stats/` - Dashboard statistics

### ML API
- `POST /api/resume/analyze` - Resume analysis
- `POST /api/technical/evaluate` - Evaluate answer
- `POST /api/aptitude/predict-level` - Predict aptitude level
- `POST /api/proctoring/check` - Check proctoring

---

## ✅ Success Criteria

### Backend
- ✅ All migrations applied
- ✅ 565 aptitude questions loaded
- ✅ 200 technical questions loaded
- ✅ Superuser created
- ✅ API responding on port 8001

### ML
- ✅ Resume classifier trained (Logistic Regression)
- ✅ Aptitude classifier trained (Random Forest)
- ✅ NER working (spaCy)
- ✅ Technical evaluator working (TF-IDF)
- ✅ Proctoring system ready (YOLO)

### Frontend
- ✅ Login/Register working
- ✅ Resume upload working
- ✅ Aptitude test working
- ✅ Technical test working
- ✅ Dashboard displaying data

---

## 🎯 Testing Checklist

- [ ] Register new user
- [ ] Login successfully
- [ ] Upload resume and see analysis
- [ ] Take quantitative aptitude test
- [ ] Take logical aptitude test
- [ ] Take technical aptitude test
- [ ] Answer technical questions
- [ ] View dashboard with all stats
- [ ] See personalized recommendations
- [ ] Test early exit from aptitude test
- [ ] Verify tab switch detection
- [ ] Check proctoring score
- [ ] Access admin panel
- [ ] Change password
- [ ] Logout and login again

---

## 📞 Support

If issues persist:
1. Check all 3 servers are running (Django, FastAPI, React)
2. Verify PostgreSQL is running
3. Check .env file configuration
4. Review console errors in browser (F12)
5. Check backend logs

**System Status:**
- Django: http://localhost:8001/api/health/
- ML API: http://localhost:8000/api/health
- Frontend: http://localhost:5173
- Admin: http://localhost:8001/admin/

---

**All systems operational! 🚀 Happy Testing!**
