# PlacementPrep — Complete Setup & Development Guide

> For: Prabin, Praful, Prashant  
> Last Updated: August 2026  
> Author: Navneet Mallick

---

## Quick Start (5 minutes)

### Prerequisites
- Python 3.11+ installed
- PostgreSQL installed and running
- Node.js 18+ installed
- Git

### Step 1: Clone and setup Python
```bash
git clone https://github.com/Navneet-Mallick/PlacePrep.git
cd PlacePrep
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
pip install -r ml/requirements.txt
python -m spacy download en_core_web_sm
```

### Step 2: Database
Create a PostgreSQL database named `placementprep`:
```sql
CREATE DATABASE placementprep;
```

### Step 3: Environment file
Create `.env` in project root:
```
SECRET_KEY=django-insecure-y+tbs_&lf$&zl3r1)#i^9ogfppylmniirj7hmc4#xrqh9+2t-n
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=postgresql
DB_NAME=placementprep
DB_USER=postgres
DB_PASSWORD=YOUR_PG_PASSWORD
DB_HOST=localhost
DB_PORT=5432
ML_API_URL=http://localhost:8001/api
GEMINI_API_KEY=YOUR_GEMINI_KEY
```
Get Gemini key from: https://aistudio.google.com/apikey

### Step 4: Database migration and seed data
```bash
python manage.py migrate
python manage.py load_aptitude_questions
python manage.py load_technical_questions
python manage.py createsuperuser  # Create admin account
```

### Step 5: Train ML models
```bash
python ml/scripts/train_resume_classifier.py
python ml/scripts/train_aptitude_classifier.py
```

### Step 6: Frontend
```bash
cd frontend
npm install
cd ..
```

### Step 7: Run (3 terminals)
```bash
# Terminal 1: Django API (port 8000)
python manage.py runserver

# Terminal 2: ML API (port 8001)
python ml/api/server.py

# Terminal 3: Frontend (port 5173)
cd frontend && npm run dev
```

### Step 8: Access
- Frontend: http://localhost:5173
- Django Admin: http://localhost:8000/admin/
- ML API Docs: http://localhost:8001/docs

---

## Project Architecture

```
User Browser (React, port 5173)
    ↕ REST API (Axios)
Django Backend (port 8000)          ← Auth, DB, scoring, question management
    ↕ HTTP
FastAPI ML Service (port 8001)      ← Resume NLP, proctoring, code execution
    ↕
PostgreSQL Database                 ← All persistent data
```

---

## Folder Structure

```
PlacePrep/
├── .env                        # Secrets (not in git)
├── manage.py                   # Django CLI
├── requirements.txt            # Python deps (Django side)
├── docker-compose.yml          # Docker (optional)
│
├── config/                     # Django project settings
│   ├── settings.py             # DB, auth, REST config
│   ├── urls.py                 # Root URL routing
│   └── wsgi.py / asgi.py
│
├── api/                        # Django app (backend logic)
│   ├── models.py               # Database models
│   ├── views.py                # API endpoints
│   ├── serializers.py          # Data validation
│   ├── urls.py                 # API routing
│   ├── admin.py                # Admin panel config
│   ├── services/
│   │   └── resume_service.py   # Resume post-processing
│   └── management/commands/    # Data loading scripts
│
├── ml/                         # Machine Learning service
│   ├── api/
│   │   ├── server.py           # FastAPI app (port 8001)
│   │   └── proctoring.py       # Face detection (DNN)
│   ├── scripts/
│   │   ├── analyze_resume.py   # Full resume pipeline
│   │   ├── extract_text.py     # PDF/DOCX → text
│   │   ├── extract_entities.py # spaCy NER
│   │   ├── predict_role.py     # Logistic Regression prediction
│   │   ├── evaluate_technical_answer.py  # Semantic scoring
│   │   ├── gemini_recommendations.py    # Gemini AI
│   │   ├── train_resume_classifier.py   # Model training
│   │   └── train_aptitude_classifier.py
│   ├── models/                 # Trained model files
│   │   ├── resume_role_classifier.joblib
│   │   ├── aptitude_level_classifier.joblib
│   │   ├── deploy.prototxt     # DNN face detector config
│   │   └── face_detector.caffemodel     # DNN weights (10MB)
│   └── requirements.txt        # ML-specific deps
│
├── frontend/                   # React app
│   ├── src/
│   │   ├── App.jsx             # Routes
│   │   ├── pages/              # All page components
│   │   ├── components/         # Layout, ProtectedRoute
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── services/api.js     # Axios config
│   │   ├── utils/              # proctoringRules.js
│   │   └── index.css           # Tailwind + custom CSS
│   ├── public/
│   │   ├── coding_problems.json  # Editable problem set
│   │   ├── manifest.json       # PWA manifest
│   │   └── sw.js               # Service worker
│   └── package.json
│
├── Datasets/                   # Training data (CSV files)
└── .docs/                      # Documentation
```

---

## ML Techniques Used

| Technique | Where | Why |
|-----------|-------|-----|
| spaCy NER | Resume entity extraction | Identifies names, skills, education, experience |
| TF-IDF | Resume classification + technical scoring | Converts text to numerical vectors |
| Logistic Regression | Resume role prediction | Fast, interpretable multiclass classifier |
| Cosine Similarity | Technical answer scoring | Measures text similarity |
| Synonym Groups | Technical answer scoring | Handles paraphrasing |
| Random Forest | Aptitude level prediction | Non-linear classification from test features |
| DNN (SSD+ResNet-10) | Face detection proctoring | Accurate CPU-based face detection |
| Gemini API | Resume recommendations | Generates personalized career advice |

---

## Key API Endpoints

### Django (port 8000)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register/ | Create account |
| POST | /api/auth/login/ | Login (returns JWT) |
| POST | /api/resumes/ | Upload + analyze resume |
| GET | /api/aptitude/questions/by_section/?section=X | Get questions |
| POST | /api/aptitude/attempts/ | Submit test |
| POST | /api/technical/answers/ | Submit technical answer |
| GET | /api/dashboard/stats/ | Get user stats |

### FastAPI ML (port 8001)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/resume/analyze | Analyze resume file |
| POST | /api/technical/evaluate | Score technical answer |
| POST | /api/python/execute | Run Python code |
| POST | /api/proctoring/check | Analyze webcam frame |
| POST | /api/proctoring/reset | Reset proctoring state |
| POST | /api/aptitude/predict-level | Predict aptitude level |

---

## Database Models

| Model | Key Fields |
|-------|------------|
| User | username, email, password (Django built-in) |
| Resume | user, file, resume_score, predicted_role, extracted_entities, recommendations |
| AptitudeQuestion | section, question_text, options (JSON), correct_option, difficulty |
| AptitudeTestAttempt | user, total_score, section_scores, aptitude_level, tab_switches, proctoring_score, is_disqualified |
| TechnicalQuestion | category, difficulty, question_text, reference_answer |
| TechnicalAnswer | user, question, user_answer, score, similarity_score, feedback |
| Recommendation | user, category, recommendation_text, priority |

---

## How Each Feature Works

### Resume Analysis
1. User uploads PDF/DOCX
2. Frontend sends to Django `/api/resumes/`
3. Django forwards file to FastAPI `/api/resume/analyze`
4. FastAPI: extract text → spaCy NER → TF-IDF → Logistic Regression → Gemini recommendations
5. Django saves results to database
6. Frontend displays score, role, entities, recommendations, JSON

### Aptitude Test
1. User selects section (quantitative/logical/technical)
2. Camera starts + proctoring every 5s
3. Questions loaded from DB
4. User answers MCQs (options A/B/C/D)
5. On submit: Django scores against correct_option, calls ML API for level prediction
6. Proctoring score calculated, disqualification checked

### Technical Assessment
1. User selects category (DSA/DBMS/OS/CN/Git/Web)
2. Subjective questions shown
3. User types answer → sends to ML API
4. ML API: TF-IDF + cosine similarity + synonym matching → score 0-100
5. Feedback generated based on score tier

### Code Practice
1. Problems loaded from `/public/coding_problems.json`
2. User writes Python code in editor
3. Code sent to FastAPI `/api/python/execute`
4. Executed in subprocess with 5s timeout
5. Output returned to frontend

### Proctoring
1. Webcam frame captured every 5 seconds
2. Sent as base64 JPEG to FastAPI `/api/proctoring/check`
3. DNN face detector (or Haar fallback) analyses frame
4. State machine: grace period for brief absences, escalates to violation after N consecutive misses
5. Frontend tracks violations; auto-disqualifies at 6 tab switches or 8 violations

---

## Admin Panel

Access: http://localhost:8000/admin/  
Login: username `admin`, password `admin123`

What admin can do:
- **Users**: Create, edit, deactivate, delete users
- **Aptitude Questions**: Add/edit/delete MCQs, bulk change difficulty
- **Technical Questions**: Add/edit/delete subjective Qs with reference answers
- **Test Attempts**: View all submissions, void/disqualify attempts
- **Resumes**: View all uploaded resumes with scores
- **Recommendations**: Manage personalized suggestions

---

## Adding New Questions

### Aptitude (database):
Go to admin panel → Aptitude Questions → Add. Fill section, question, options (JSON array), correct option.

Or bulk load from CSV:
```bash
python manage.py load_aptitude_questions
```

### Technical (database):
Admin panel → Technical Questions → Add. Fill category, difficulty, question, reference answer.

### Coding Problems (JSON file):
Edit `frontend/public/coding_problems.json` — no code changes needed. Add new objects with id, title, difficulty, description, starter, expected, hint.

---

## Running Tests

```bash
# Django system check
python manage.py check

# Django unit tests
python manage.py test

# ML pipeline test
python -c "import sys; sys.path.insert(0,'ml/scripts'); from analyze_resume import analyze_text; r = analyze_text('Python developer BTech CSE', use_gemini=False); print(r['resume_score'], r['predicted_role'])"

# Proctoring test
python -c "import sys; sys.path.insert(0,'ml/api'); from proctoring import proctoring_system; print('Ready:', proctoring_system.ready)"
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Activate venv: `venv\Scripts\activate` |
| Database connection refused | Start PostgreSQL service |
| ML API not responding | Run `python ml/api/server.py` in separate terminal |
| Gemini quota exhausted | Wait 24hrs or upgrade API plan |
| Face detection falling back to Haar | Memory issue — restart ML service |
| Frontend won't start | Run `npm install` in frontend/ first |
| Login not working | Check you're using email (not username) on frontend |

---

## Git Workflow

```bash
git pull origin main          # Get latest
git checkout -b feature/name  # New branch
# ... make changes ...
git add -A
git commit -m "Description"
git push -u origin feature/name
# Create PR on GitHub
```

---

## Team Members

| Name | Roll No | Role |
|------|---------|------|
| Navneet Mallick | PUR080BCT049 | Full-stack development, ML pipeline, proctoring |
| Prabin Sah | PUR080BCT054 | Backend, database, testing |
| Praful Karn | PUR080BCT055 | Frontend, UI/UX, responsive design |
| Prashant Shah | PUR080BCT062 | ML models, documentation, deployment |

---

## Tech Stack Summary

- **Frontend**: React 18, Tailwind CSS v4, Vite, Axios
- **Backend**: Django 6, Django REST Framework, JWT auth
- **ML Service**: FastAPI, scikit-learn, spaCy, OpenCV DNN
- **Database**: PostgreSQL
- **AI**: Google Gemini API
- **Proctoring**: OpenCV DNN face detector (SSD + ResNet-10)
- **Deployment**: Docker, Gunicorn, Nginx (optional)
