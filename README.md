# PlacementPrep - ML-Based Resume Analysis & Aptitude Evaluation System

## 🎯 Overview

PlacementPrep is a unified platform for placement preparation combining:
- **Resume Analysis** with AI-powered insights
- **Aptitude Assessment** with ML-based level prediction
- **Technical Evaluation** using NLP similarity
- **Proctoring System** with computer vision
- **Performance Analytics** and personalized recommendations

---

## ✨ Key Features

### 1. Resume Analysis
- Upload PDF/DOCX resumes
- **NER** extraction (spaCy) - names, skills, education, certifications
- **Job role prediction** (TF-IDF + Logistic Regression)
- **Resume scoring** (0-100)
- AI recommendations (Gemini API)

### 2. Aptitude Assessment
- **565 questions** across 3 sections:
  - Quantitative Reasoning
  - Logical Reasoning
  - Technical/CSE
- **ML-based level prediction** (Random Forest)
- **Early exit** with partial scoring
- **Proctoring system**:
  - Tab switch detection (JavaScript)
  - Face detection (YOLO + OpenCV)
  - Violation tracking

### 3. Technical Assessment
- **200 questions** across 6 categories:
  - DSA, DBMS, OS, CN, Git, Web Development
- **Answer evaluation** (TF-IDF + Cosine Similarity)
- Automatic scoring and feedback

### 4. Analytics Dashboard
- Resume score visualization
- Aptitude level badges
- Technical performance metrics
- Progress tracking
- Weak area identification
- **Personalized recommendations**

---

## 🛠️ Tech Stack

### Backend
- **Django** 6.0.3 + Django REST Framework
- **PostgreSQL** database
- **JWT** authentication
- **CORS** enabled for frontend

### ML Pipeline
- **scikit-learn** - Logistic Regression, Random Forest, TF-IDF
- **spaCy** - Named Entity Recognition
- **ultralytics** - YOLO for face detection
- **OpenCV** - Computer vision processing
- **FastAPI** - ML API server

### Frontend
- **React** 18 + Vite
- **Tailwind CSS** - Modern styling
- **React Router** - Navigation
- **Axios** - API requests

---

## 📊 System Architecture

```
┌─────────────────┐
│  React Frontend │  (Port 5173)
│  + Tailwind CSS │
└────────┬────────┘
         │
         ↓
┌────────────────────────────────────┐
│     Django REST API (Port 8001)    │
│  - Authentication (JWT)            │
│  - Resume Management               │
│  - Test Management                 │
│  - Dashboard Stats                 │
│  - Recommendation Engine           │
└────────┬──────────────────┬────────┘
         │                  │
         ↓                  ↓
┌────────────────┐  ┌──────────────────┐
│   PostgreSQL   │  │  ML API (Port    │
│   Database     │  │  8000) FastAPI   │
│                │  │  - Resume        │
│  565 Aptitude  │  │    Analysis      │
│  200 Technical │  │  - NER           │
│  Questions     │  │  - Role Pred.    │
│                │  │  - Aptitude Pred.│
│  User Data     │  │  - Technical     │
│  Test Results  │  │    Evaluation    │
│  Recommendations│  │  - Proctoring   │
└────────────────┘  └──────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (configured)

### Installation

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Install frontend dependencies
cd frontend
npm install
cd ..

# 3. Check system status
python check_system.py
```

### Running the Application

**Option 1: Use Start Script (Recommended)**
```bash
start.bat
```

**Option 2: Manual Start**
```bash
# Terminal 1: Django Backend
python manage.py runserver 8001

# Terminal 2: ML API
cd ml/api
python server.py

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001/api/health/
- **ML API**: http://localhost:8000/api/health
- **Admin Panel**: http://localhost:8001/admin/

### Default Credentials
- **Username**: admin
- **Password**: admin123

---

## 📚 Documentation

- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Complete testing instructions
- **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** - Project specifications
- **[.docs/README.md](.docs/README.md)** - Additional documentation

---

## 🗄️ Database

### PostgreSQL Configuration
- **Database**: placementprep
- **Host**: localhost
- **Port**: 5432
- **User**: postgres

### Data Loaded
- ✅ 565 Aptitude Questions (quantitative, logical, technical)
- ✅ 200 Technical Questions (DSA, DBMS, OS, CN, Git, Web)
- ✅ Trained ML Models (Resume Classifier, Aptitude Classifier)

---

## 🤖 ML Models

### 1. Resume Role Classifier
- **Algorithm**: TF-IDF + Logistic Regression
- **Features**: Resume text (skills, summary, education, certifications)
- **Output**: Predicted job role
- **Location**: `ml/models/resume_role_classifier.joblib`

### 2. Aptitude Level Predictor
- **Algorithm**: Random Forest Classifier
- **Features**: total_score, accuracy, time_taken, section_scores
- **Output**: beginner / intermediate / advanced
- **Accuracy**: 100% (on synthetic training data)
- **Location**: `ml/models/aptitude_level_classifier.joblib`

### 3. Technical Answer Evaluator
- **Algorithm**: TF-IDF + Cosine Similarity
- **Features**: User answer vs reference answer
- **Output**: Score (0-100) + similarity (0-1)

### 4. NER Extractor
- **Library**: spaCy (en_core_web_sm)
- **Extracts**: Names, emails, phones, organizations, skills, education, certifications

### 5. Proctoring System
- **Algorithm**: YOLOv8n (nano)
- **Detection**: Face count, multiple persons, no face
- **Additional**: Tab switch tracking (JS-based)

---

## 📁 Project Structure

```
Minor-Project-main/
├── api/                        # Django app
│   ├── models.py              # Database models
│   ├── views.py               # API endpoints
│   ├── serializers.py         # DRF serializers
│   ├── urls.py                # URL routing
│   └── management/commands/   # Custom commands
├── config/                    # Django settings
├── ml/                        # Machine Learning
│   ├── api/                   # FastAPI server
│   │   ├── server.py         # ML API
│   │   └── proctoring.py     # YOLO proctoring
│   ├── scripts/              # ML scripts
│   │   ├── train_resume_classifier.py
│   │   ├── train_aptitude_classifier.py
│   │   ├── extract_entities.py
│   │   ├── predict_role.py
│   │   └── predict_aptitude_level.py
│   └── models/               # Trained models
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   └── context/         # Auth context
│   └── public/
├── Datasets/                  # Training data
├── .env                      # Environment variables
├── start.bat                 # Quick start script
├── check_system.py           # System checker
├── TESTING_GUIDE.md          # Testing guide
└── README.md                 # This file
```

---

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Password hashing (Django's PBKDF2)
- ✅ CORS protection
- ✅ Environment variables for secrets
- ✅ File upload validation
- ✅ SQL injection prevention (Django ORM)
- ✅ Proctoring system (tab tracking + face detection)

---

## 🧪 Testing

### Run System Check
```bash
python check_system.py
```

### Test Individual Components

**Backend API:**
```bash
curl http://localhost:8001/api/health/
```

**ML API:**
```bash
curl http://localhost:8000/api/health
```

**Database:**
```bash
python manage.py shell
>>> from api.models import *
>>> AptitudeQuestion.objects.count()
565
```

**ML Models:**
```bash
cd ml/scripts
python predict_aptitude_level.py
python predict_role.py "Python developer with Django experience"
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login (returns JWT)
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/profile` - Get user profile

### Resume
- `POST /api/resumes/` - Upload & analyze resume
- `GET /api/resumes/` - List user resumes
- `GET /api/resumes/latest/` - Get latest resume
- `DELETE /api/resumes/{id}/` - Delete resume

### Aptitude
- `GET /api/aptitude/questions/` - List all questions
- `GET /api/aptitude/questions/by_section/?section=quantitative`
- `POST /api/aptitude/attempts/` - Submit test
- `GET /api/aptitude/attempts/history/` - Test history

### Technical
- `GET /api/technical/questions/` - List all questions
- `GET /api/technical/questions/by_category/?category=dsa`
- `POST /api/technical/answers/` - Submit answer
- `GET /api/technical/answers/history/` - Answer history

### Dashboard
- `GET /api/dashboard/stats/` - Complete dashboard data

### ML API (FastAPI)
- `POST /api/resume/analyze` - Resume analysis
- `POST /api/technical/evaluate` - Evaluate technical answer
- `POST /api/aptitude/predict-level` - Predict aptitude level
- `POST /api/proctoring/check` - Check proctoring frame

---

## 🎓 ML Training

### Train Resume Classifier
```bash
cd ml/scripts
python train_resume_classifier.py
```

### Train Aptitude Classifier
```bash
cd ml/scripts
python train_aptitude_classifier.py
```

---

## 🐛 Troubleshooting

See **[TESTING_GUIDE.md](TESTING_GUIDE.md)** for detailed troubleshooting.

Common issues:
1. **Port already in use**: Kill process or use different port
2. **Database connection failed**: Check .env DB_PASSWORD
3. **ML model not found**: Run training scripts
4. **CORS error**: Check CORS_ALLOWED_ORIGINS in settings.py

---

## 📈 Future Enhancements

- [ ] Verbal ability section for aptitude
- [ ] Real-time coding practice with Judge0
- [ ] Advanced analytics with charts
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Placement readiness score
- [ ] Interview preparation module

---

## 👥 Credits

**Project**: Minor Project - ML-Based Resume Analysis & Aptitude Evaluation System  
**Tech Stack**: Django + React + PostgreSQL + ML (scikit-learn, spaCy, YOLO)

---

## 📞 Support

For issues or questions:
1. Check [TESTING_GUIDE.md](TESTING_GUIDE.md)
2. Run `python check_system.py`
3. Check console logs (browser F12)
4. Review backend logs

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-08-06  
**Version**: 1.0.0

---

🚀 **Happy Testing!**
