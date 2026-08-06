# PlacementPrep - Complete Team Guide

**Everything you need to run, test, and continue developing the project.**

---

## 📋 Quick Navigation

- **New?** → Start with [Installation](#installation) (10 min)
- **Ready?** → Go to [Running](#running-the-project) (2 min)
- **Testing?** → Check [Testing](#testing-guide) (5-30 min)
- **Coding?** → See [Contributing](#how-to-contribute)
- **Stuck?** → Look at [Troubleshooting](#troubleshooting)

---

## Project Overview

**PlacementPrep** helps students prepare for placements through:
- 📄 **Resume Analysis**: NER extraction, role prediction, AI recommendations
- 📊 **Aptitude Tests**: 565+ questions across 3 sections
- 💻 **Technical Assessment**: AI-based subjective answer evaluation
- 📈 **Dashboard**: Performance tracking and analytics

**Tech Stack:**
```
Frontend:   React 18 + Vite + Tailwind CSS
Backend:    Django REST Framework
ML:         FastAPI + spaCy + scikit-learn
Database:   SQLite (dev) / PostgreSQL (prod)
AI:         Google Gemini API
```

---

## Installation

### Prerequisites

- **Python 3.10+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))

### Step-by-Step Setup (10 minutes)

**1. Clone Repository**
```bash
git clone <repository-url>
cd "Minor Project"
```

**2. Backend Setup**
```bash
# Create virtual environment
python -m venv venv

# Activate environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Python packages
pip install -r requirements.txt
pip install -r ml/requirements.txt

# Download NER model
python -m spacy download en_core_web_sm
```

**3. Database Initialization**
```bash
python manage.py migrate
```

**4. Frontend Setup**
```bash
cd frontend
npm install
cd ..
```

**5. Verify Installation**
```bash
python test_platform.py
```

Expected output:
```
✓ ALL TESTS PASSED - PLATFORM IS FUNCTIONAL
```

---

## Running the Project

### Start All Servers

**Open 3 separate terminals and run:**

**Terminal 1 - Backend API (Port 8001)**
```bash
python manage.py runserver 8001
```
Expected: `Starting development server at http://127.0.0.1:8001/`

**Terminal 2 - ML API (Port 8000)**
```bash
python ml/api/server.py
```
Expected: `Uvicorn running on http://0.0.0.0:8000`

**Terminal 3 - Frontend (Port 5173)**
```bash
cd frontend
npm run dev
```
Expected: `http://localhost:5173/` is ready

### Access Platform

| Component | URL |
|-----------|-----|
| **Frontend App** | http://localhost:5173 |
| **API Health** | http://localhost:8001/api/health/ |
| **ML Health** | http://localhost:8000/api/health |
| **Admin Panel** | http://localhost:8001/admin |

### Demo Credentials
```
Email:    admin@localhost.com
Password: admin123
```

---

## Testing Guide

### Run Automated Tests (5 minutes)

```bash
# Test 1: Platform Functionality
python test_platform.py
# Expected: 5/5 tests passed

# Test 2: Authentication
python test_auth.py
# Expected: 5/5 tests passed

# Test 3: Gemini API (optional, slower)
python test_gemini.py
# Expected: Recommendations generated
```

### Manual Feature Testing

#### ✅ Authentication (5 min)

1. **Register New Account**
   - Go to http://localhost:5173/register
   - Fill in email, username, password
   - Click "Sign Up"
   - Expected: Success message

2. **Login**
   - Use demo credentials above
   - Expected: Redirected to dashboard

3. **Check Profile**
   - Click username in navbar
   - Expected: Profile page shows email

#### ✅ Resume Upload (10 min)

1. **Navigate to Resume Analysis**
   - Click "Resume Analysis" in navbar
   - Upload any PDF or DOCX resume
   - Click "Analyze Resume"

2. **Verify Results**
   - [ ] Resume Score displays (0-100)
   - [ ] Predicted Role shows
   - [ ] Confidence percentage appears
   - [ ] Skills extracted correctly
   - [ ] AI recommendations visible

3. **Check JSON Output**
   - Click "View Full Analysis JSON"
   - Verify all fields present

#### ✅ Aptitude Test (10 min)

1. **Start Test**
   - Click "Aptitude Test" in navbar
   - Select any section (Quantitative/Logical/Technical)
   - Questions should load

2. **Answer & Submit**
   - Select answers for at least 5 questions
   - Click "Submit Test"
   - View results:
     - [ ] Total Score displays
     - [ ] Accuracy percentage shows
     - [ ] Aptitude Level visible (Beginner/Intermediate/Advanced)
     - [ ] Time Taken recorded
     - [ ] Section breakdown shows

#### ✅ Technical Assessment (10 min)

1. **Start Assessment**
   - Click "Technical Assessment" in navbar
   - Select a category (e.g., DSA)
   - Question should display

2. **Answer Question**
   - Write an answer in text box
   - Click "Submit Answer"
   - Verify:
     - [ ] Score (0-100) shows
     - [ ] Similarity % displays
     - [ ] Feedback provided

#### ✅ Dashboard (5 min)

1. **View Dashboard**
   - Click "Dashboard" in navbar
   - Verify:
     - [ ] Resume score card (if uploaded)
     - [ ] Aptitude score card (if tested)
     - [ ] Technical average shown
     - [ ] Recent activity displays

---

## Project Structure

```
Minor Project/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── pages/              # React pages
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ResumeUpload.jsx
│   │   │   ├── AptitudeTest.jsx
│   │   │   ├── TechnicalTest.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   └── api.js          # API client
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── api/                         # Django REST Framework
│   ├── models.py               # Database models
│   ├── views.py                # API endpoints
│   ├── serializers.py          # Data serializers
│   ├── urls.py                 # URL routing
│   └── admin.py
│
├── ml/                          # Machine Learning
│   ├── api/
│   │   └── server.py           # FastAPI server
│   ├── scripts/
│   │   ├── analyze_resume.py
│   │   ├── extract_text.py     # PDF/DOCX parsing
│   │   ├── extract_entities.py # NER extraction
│   │   ├── predict_role.py     # Role classifier
│   │   ├── evaluate_technical_answer.py
│   │   ├── gemini_recommendations.py
│   │   └── load_aptitude_questions.py
│   ├── models/
│   │   └── resume_role_classifier.joblib
│   ├── data/
│   │   └── aptitude_questions.json
│   └── requirements.txt
│
├── config/                      # Django config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── Datasets/                    # Training data
│   ├── Aptitude/
│   ├── Subjective Question Dataset/
│   └── Synthetic Nepali Resume Dataset/
│
├── test_platform.py            # Platform tests
├── test_auth.py                # Auth tests
├── test_gemini.py              # Gemini API test
├── .env                        # Environment variables
├── manage.py
├── db.sqlite3                  # SQLite database
└── TEAM_TESTING.md             # This file
```

---

## Feature Modules

### 1. Resume Analysis

**Files:** `ml/scripts/analyze_resume.py`, `ml/api/server.py`

**What it does:**
- Extracts text from PDF/DOCX
- Uses spaCy NER for entity extraction
- Predicts job role using ML classifier
- Generates resume score (0-100)
- Gets AI recommendations

**API Endpoint:**
```
POST /api/resume/analyze
Input:  Resume file (PDF/DOCX)
Output: {
  "resume_score": 85,
  "predicted_role": "Backend Developer",
  "confidence": 0.92,
  "entities": { "skills": [...], "education": [...] },
  "recommendations": { "missing_skills": [...] }
}
```

### 2. Aptitude Assessment

**Files:** `frontend/src/pages/AptitudeTest.jsx`, `api/views.py`

**Sections:**
- 📊 Quantitative Reasoning
- 🧩 Logical Reasoning
- ⚙️ Technical Fundamentals

**Features:**
- 565+ multiple-choice questions
- Real-time scoring
- Aptitude level classification
- Section-wise analytics

**API Endpoints:**
```
GET  /api/aptitude/questions/by_section/?section=quantitative
POST /api/aptitude/attempts/          # Submit test
GET  /api/aptitude/attempts/history/  # Get past attempts
```

### 3. Technical Assessment

**Files:** `frontend/src/pages/TechnicalTest.jsx`, `ml/scripts/evaluate_technical_answer.py`

**Categories:**
- 🌳 Data Structures & Algorithms
- 🗄️ Database Management Systems
- ⚙️ Operating Systems
- 🌐 Computer Networks
- 📦 Version Control (Git)
- 🌐 Web Development

**Scoring:** TF-IDF + Cosine Similarity

**API Endpoints:**
```
GET  /api/technical/questions/by_category/?category=dsa
POST /api/technical/answers/          # Submit answer
GET  /api/technical/answers/history/  # Answer history
```

### 4. Dashboard

**Files:** `frontend/src/pages/Dashboard.jsx`

**Displays:**
- Resume analysis summary
- Latest test scores
- Performance trends
- Weak areas
- Recommendations

**API Endpoint:**
```
GET /api/dashboard/stats/
```

---

## How to Contribute

### Workflow

1. **Pick a Task**
   - Check issues on GitHub or ask teammates
   - Discuss what you're working on

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write code following guidelines (see below)
   - Test your changes
   - Keep commits clean and focused

4. **Commit & Push**
   ```bash
   git commit -m "Add: Brief description of changes"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Clear description of changes
   - Link to any issues
   - Wait for review

### Code Style

**Python (Backend/ML)**
```python
# Use type hints
def analyze_resume(file_path: Path) -> dict:
    """Clear docstring explaining what it does."""
    # Implementation
    return result

# PEP 8 formatting
my_var = "value"
my_function(arg1, arg2)
```

**JavaScript (Frontend)**
```jsx
// Functional components with hooks
function MyComponent() {
  const [state, setState] = useState(null)
  
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  )
}
```

### Adding New Features

**Example: New Assessment Type**

1. **Create Django Model** (`api/models.py`)
   ```python
   class NewAssessment(models.Model):
       user = models.ForeignKey(User, on_delete=models.CASCADE)
       score = models.IntegerField()
   ```

2. **Create Serializer** (`api/serializers.py`)
   ```python
   class NewAssessmentSerializer(serializers.ModelSerializer):
       class Meta:
           model = NewAssessment
           fields = ['score']
   ```

3. **Create ViewSet** (`api/views.py`)
   ```python
   class NewAssessmentViewSet(viewsets.ModelViewSet):
       serializer_class = NewAssessmentSerializer
       permission_classes = [IsAuthenticated]
   ```

4. **Add URL** (`api/urls.py`)
   ```python
   router.register(r'assessments', NewAssessmentViewSet)
   ```

5. **Create Frontend Page** (`frontend/src/pages/NewAssessment.jsx`)
   ```jsx
   export default function NewAssessment() {
       // Component code
   }
   ```

6. **Write Tests** (`test_new_feature.py`)
   ```python
   def test_new_assessment():
       # Test code
   ```

---

## Troubleshooting

### Common Issues & Solutions

#### ❌ Port Already in Use

**Problem:** "Address already in use" error

**Solution:**
```bash
# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :8001
kill -9 <PID>
```

#### ❌ Module Not Found

**Problem:** `ImportError: No module named 'X'`

**Solution:**
```bash
# Activate virtual environment
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Reinstall
pip install -r requirements.txt
pip install -r ml/requirements.txt
```

#### ❌ spaCy Model Error

**Problem:** `OSError: [E050] Can't find model 'en_core_web_sm'`

**Solution:**
```bash
python -m spacy download en_core_web_sm
```

#### ❌ Database Errors

**Problem:** `ProgrammingError` or migration issues

**Solution:**
```bash
# Reset database (WARNING: loses all data)
rm db.sqlite3
python manage.py migrate

# Or create fresh superuser
python manage.py createsuperuser
```

#### ❌ Frontend Not Loading

**Problem:** Blank page or cannot find module

**Solution:**
```bash
cd frontend
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### ❌ ML API Connection Error

**Problem:** "Could not reach the ML API"

**Solution:**
```bash
# Check if running on port 8000
python ml/api/server.py

# Test health endpoint
curl http://localhost:8000/api/health
```

#### ❌ Gemini API Not Working

**Problem:** "GEMINI_API_KEY is not set" or quota exceeded

**Solution:**
```bash
# 1. Check .env file has key
cat .env | grep GEMINI_API_KEY

# 2. Verify key is valid at https://aistudio.google.com/

# 3. Check API quota/limits
```

---

## API Reference

### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "username",
  "password": "password"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
Response: {
  "access": "jwt-token",
  "refresh": "refresh-token",
  "user": { "id": 1, "email": "..." }
}

# Get Profile
GET /api/auth/profile/
Headers: Authorization: Bearer <access_token>
```

### Resume

```bash
# Upload & Analyze
POST /api/resumes/
Content-Type: multipart/form-data
File: resume.pdf

# Get All
GET /api/resumes/

# Get Latest
GET /api/resumes/latest/
```

### Aptitude

```bash
# List Questions
GET /api/aptitude/questions/by_section/?section=quantitative

# Submit Test
POST /api/aptitude/attempts/
{
  "answers": { "question_id": "option" },
  "time_taken": 600
}

# Get History
GET /api/aptitude/attempts/history/
```

### Technical

```bash
# List Questions
GET /api/technical/questions/by_category/?category=dsa

# Submit Answer
POST /api/technical/answers/
{
  "question_id": 1,
  "answer": "Your answer text"
}

# Get History
GET /api/technical/answers/history/
```

### Dashboard

```bash
# Get Statistics
GET /api/dashboard/stats/
Response: {
  "resume_score": 85,
  "aptitude_level": "intermediate",
  "technical_score": 72.5,
  "weak_areas": ["DSA", "DBMS"],
  "recommendations": [...]
}
```

---

## Environment Variables

Create `.env` file in project root:

```env
# Google Gemini API Key (get from https://aistudio.google.com/)
GEMINI_API_KEY=your_api_key_here

# Django Configuration
DEBUG=True
SECRET_KEY=django-insecure-placement-prep-secret-key-2024
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (development)
DB_ENGINE=sqlite

# Database (production - uncomment to use PostgreSQL)
# DB_ENGINE=postgresql
# DB_NAME=placementprep_db
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432

# JWT
JWT_ALGORITHM=HS256

# ML API
ML_API_URL=http://localhost:8000/api
```

---

## Performance Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Resume Analysis | < 5s | ~3-4s |
| Role Prediction | < 500ms | ~200ms |
| Aptitude Question Load | < 1s | ~300ms |
| Technical Answer Submit | < 3s | ~2s |
| Dashboard Load | < 2s | ~1s |
| NER Extraction | < 1s | ~500ms |

---

## Next Steps to Continue Development

### High Priority
- [ ] Load aptitude questions into database
- [ ] Implement Random Forest aptitude level classifier
- [ ] Add PostgreSQL support for production
- [ ] Deploy to cloud (Heroku, AWS, or similar)
- [ ] Add email notifications

### Medium Priority
- [ ] Add more assessment categories
- [ ] Implement interview preparation module
- [ ] Add code editor for DSA practice
- [ ] Create mobile app version
- [ ] Add peer comparison analytics

### Low Priority
- [ ] Advanced ML models for better predictions
- [ ] Real-time collaboration features
- [ ] Video recording for interviews
- [ ] Payment integration for premium features

---

## Quick Reference Commands

```bash
# Activate environment
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Run servers
python manage.py runserver 8001
python ml/api/server.py
cd frontend && npm run dev

# Database
python manage.py migrate
python manage.py makemigrations
python manage.py createsuperuser

# Frontend
npm install
npm run dev
npm run build

# Testing
python test_platform.py
python test_auth.py
python test_gemini.py

# ML Model
python -m spacy download en_core_web_sm

# Git
git checkout -b feature/name
git commit -m "Add: description"
git push origin feature/name
```

---

## Team Communication

**Important:** Before starting work:
1. Let team know what you're working on
2. Ask questions in group chat
3. Review existing PRs/issues
4. Test before pushing
5. Document changes clearly

---

## Support

**Questions?** → Ask in team chat  
**Bug?** → Create issue with details  
**Stuck?** → Check this guide or ask teammates  

---

**Happy coding! 🚀**
