# PlacementPrep

**ML-Based Resume Analysis and Aptitude Evaluation System**

A unified web platform for placement preparation that integrates resume analysis, aptitude assessment, technical evaluation, and code practice — all powered by machine learning.

## Features

- **Resume Analysis** — NER entity extraction, TF-IDF + Logistic Regression role prediction, Gemini AI recommendations
- **Aptitude Tests** — Quantitative, logical, technical MCQs with Random Forest level prediction
- **Technical Assessment** — Subjective answer scoring using TF-IDF cosine similarity with synonym-aware matching
- **Code Practice** — LeetCode-style problems with sandboxed Python execution
- **Proctoring** — DNN face detection, tab switch monitoring, auto-disqualification
- **Dashboard** — Performance history, progress tracking, personalized recommendations
- **Admin Panel** — Question management, user management, audit reports

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS, Vite |
| Backend | Django 5.2, Django REST Framework |
| ML Service | FastAPI, scikit-learn, spaCy, OpenCV DNN |
| Database | PostgreSQL |
| AI | Google Gemini API |
| Proctoring | OpenCV DNN (SSD + ResNet-10) |

## Quick Start

```bash
# Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python manage.py migrate
python manage.py createsuperuser

# Train ML models
python ml/scripts/train_resume_classifier.py
python ml/scripts/train_aptitude_classifier.py

# Load questions
python manage.py load_aptitude_questions
python manage.py load_technical_questions

# Run (3 terminals)
python manage.py runserver          # Port 8000
python ml/api/server.py             # Port 8001
cd frontend && npm install && npm run dev  # Port 5173
```

## Environment Variables (.env)

```
SECRET_KEY=your-secret-key
DB_NAME=placementprep
DB_USER=postgres
DB_PASSWORD=your-password
ML_API_URL=http://localhost:8001/api
GEMINI_API_KEY=your-gemini-key
```

## Team

| Name | Roll No |
|------|---------|
| Navneet Mallick | PUR080BCT049 |
| Prabin Sah | PUR080BCT054 |
| Praful Karn | PUR080BCT055 |
| Prashant Shah | PUR080BCT062 |

**Tribhuvan University, IOE, Purwanchal Campus — 2026**
