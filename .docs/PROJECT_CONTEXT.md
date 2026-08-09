# PlacementPrep - Complete Project Context

## Overview
PlacementPrep is a comprehensive AI-powered placement preparation platform that combines resume analysis, aptitude assessment, technical evaluation, and intelligent proctoring. Built with Django backend, FastAPI ML services, and React frontend.

---

## 🏗️ Project Architecture

### Three-Tier Architecture
```
┌─────────────────────────────────────────────┐
│         Frontend (React + Vite)             │ Port 5173
│  - Dashboard, Resume Upload, Tests          │
└────────────────┬────────────────────────────┘
                 │ HTTP/REST API
┌────────────────▼────────────────────────────┐
│      Django REST API (Backend)              │ Port 8000
│  - User Auth, Question Management           │
│  - Test Submission, Results Storage         │
│  - Resume Records, Recommendations          │
└────────────────┬────────────────────────────┘
                 │ HTTP/REST API
┌────────────────▼────────────────────────────┐
│   FastAPI ML Service                        │ Port 8001
│  - Resume Analysis & NLP Processing         │
│  - Face Detection & Proctoring              │
│  - Code Execution & Evaluation              │
│  - AI Recommendations (Gemini)              │
└─────────────────────────────────────────────┘
```

### Database: PostgreSQL
- User accounts and authentication
- Question banks (aptitude, technical)
- Test attempts and results
- Resume records and scores
- User performance history

---

## 📁 Folder Structure & Purpose

### Root Level
```
PlacePrep/
├── manage.py              # Django CLI
├── requirements.txt       # Python dependencies
├── docker-compose.yml     # Container orchestration
├── .env                  # Environment variables (API keys, DB credentials)
├── README.md             # Project documentation
└── .docs/                # Documentation folder
```

### `/api` - Django REST API (Port 8000)
**Purpose**: Main backend server handling authentication, data management, and business logic.

```
api/
├── models.py             # Database models
│   ├── User              # Extended user model with progress tracking
│   ├── Resume            # Resume metadata and scores
│   ├── AptitudeQuestion  # Aptitude test questions
│   ├── AptitudeTestAttempt # Test submission and results
│   ├── TechnicalQuestion # Technical assessment questions
│   ├── TechnicalAnswer   # User answers with evaluation
│   └── Recommendation    # Personalized recommendations
│
├── views.py              # REST API endpoints
│   ├── register_user()   # User registration with JWT
│   ├── AptitudeTestAttemptViewSet.create() # Submit test + calculate score
│   ├── ResumeViewSet     # Upload and analyze resume
│   └── DashboardAPI      # Aggregate user statistics
│
├── serializers.py        # Data serialization/validation
├── urls.py               # URL routing
├── services/
│   └── resume_service.py # Resume analysis post-processing
└── management/commands/
    ├── load_aptitude_questions.py  # Seed question database
    └── load_technical_questions.py # Load technical QA pairs
```

**Key Features**:
- JWT token-based authentication
- RESTful API with proper status codes and validation
- Role-based access control
- Comprehensive error handling

---

### `/ml` - Machine Learning Service (FastAPI, Port 8001)
**Purpose**: Handles all ML tasks, NLP processing, image analysis, and AI recommendations.

#### `/ml/api/server.py` - FastAPI Application
**Endpoints**:
```python
POST /api/resume/analyze      # Resume analysis pipeline
POST /api/technical/evaluate  # Technical answer scoring
POST /api/python/execute      # Code execution sandbox
POST /api/proctoring/check    # Face detection and monitoring
```

#### `/ml/scripts` - ML Pipeline Scripts

##### 1. **Resume Analysis Pipeline**
```
resume_upload → extract_text → extract_entities → predict_role → calculate_score → gemini_recommendations
```

**Components**:

a) `extract_text.py`
- Extracts text from PDF/DOCX files
- Handles encoding issues and null bytes
- Returns clean, structured text
- **Supported**: PDF (PyPDF2), DOCX (python-docx)

b) `extract_entities.py`
- **Technology**: spaCy NLP library
- **Model**: en_core_web_sm (small English model)
- **Extracts**:
  - Named Entities: Person, Organization, Location, Date
  - Custom patterns: Email, Phone, Skills
  - Using regex and pattern matching
- **Output**: Structured dictionary with entity categories

c) `predict_role.py`
- **Algorithm**: Logistic Regression (scikit-learn)
- **Model**: Pre-trained on resume dataset
- **Features**:
  - TF-IDF vectorization of resume text
  - Predicts job roles: Software Engineer, Data Scientist, etc.
- **Output**: Role prediction with confidence score

d) `analyze_resume.py`
- **Score Calculation**:
  ```
  Total Score = (Contact Info × 15) + (Skills × 30) + 
                (Education × 15) + (Experience × 20) + 
                (Certifications × 10) + (Organizations × 5) + (Name × 5)
  Maximum: 100 points
  ```
- Combines all components into final analysis
- Generates actionable suggestions
- Prepares data for Gemini recommendations

e) `gemini_recommendations.py`
- **AI Service**: Google Generative AI (Gemini 2.0-Flash)
- **Purpose**: Generate personalized career recommendations
- **Prompt Engineering**:
  - Extracts key profile information
  - Creates concise prompt with resume excerpt
  - Structures JSON response with recommendations
- **Features**:
  - Model fallback (tries multiple models)
  - Rate limit handling with exponential backoff
  - Graceful degradation if API quota exceeded
- **Response Structure**:
  ```json
  {
    "summary": "2-3 sentence profile overview",
    "role_fit": "Compatibility with predicted role",
    "missing_skills": ["skill1", "skill2"],
    "focus_areas": ["topic1", "topic2"],
    "next_steps": ["action1", "action2"],
    "estimated_readiness": "75%"
  }
  ```

##### 2. **Aptitude Test Scoring**
`train_aptitude_classifier.py`
- **Algorithm**: Random Forest Classifier
- **Purpose**: Predict aptitude level (Beginner/Intermediate/Advanced)
- **Features**:
  - Total score percentage
  - Accuracy percentage (correct/attempted)
  - Time taken for test
  - Section-wise scores (quantitative, logical, technical)
- **Output**: Aptitude level + confidence

##### 3. **Technical Answer Evaluation**
`evaluate_technical_answer.py`
- **Algorithm**: TF-IDF + Cosine Similarity
- **Process**:
  1. Vectorize user answer using TF-IDF
  2. Vectorize reference answer
  3. Calculate cosine similarity (0-1 scale)
  4. Convert to percentage score (0-100)
- **Advantages**: Language-independent, captures semantic meaning
- **Output**: Score + Similarity metrics

##### 4. **Proctoring System**
`proctoring.py`
- **Technology**: OpenCV with Haar Cascades
- **Face Detection**: 
  - Uses pre-trained Haar Cascade classifier
  - Detects faces in real-time video frames
  - Lightweight alternative to deep learning
- **Foreign Object Detection**:
  - Canny edge detection
  - Contour analysis
  - Aspect ratio matching for mobile phones/documents
  - **Severity Levels**: none/medium/high
- **Violations Tracked**:
  - No face detected
  - Multiple faces in frame
  - Mobile phone/foreign objects
  - Tab switches (frontend)
  - Window blur events (frontend)
- **Proctoring Score**:
  ```
  Score = 100 - (tab_switches × 3) - (violations × 5)
  Integrity Score = 70% × Proctoring + 30% × Test Score
  ```

---

### `/frontend` - React Application (Port 5173)
**Purpose**: User interface for all interactions.

```
frontend/src/
├── pages/
│   ├── Dashboard.jsx        # User statistics and progress
│   ├── ResumeUpload.jsx     # Resume upload and analysis UI
│   ├── AptitudeTest.jsx     # Quantitative/Logical/Technical tests
│   │   ├── Camera integration for proctoring
│   │   ├── Real-time violation tracking
│   │   └── Professional scoring display
│   ├── TechnicalTest.jsx    # Subjective technical questions
│   └── CodePractice.jsx     # LeetCode-style coding problems
│       ├── Problem list (8 problems)
│       ├── Split view (description + editor)
│       └── Code execution
│
├── components/
│   ├── ProtectedRoute.jsx   # Authentication guard
│   └── Layout.jsx           # Navigation and theme
│
├── context/
│   └── AuthContext.jsx      # Global auth state
│
└── services/
    └── api.js               # Axios configuration
        ├── API_BASE_URL: http://localhost:8000/api
        └── ML_API_URL: http://localhost:8001/api
```

**Key Features**:
- **Authentication**: JWT tokens with refresh mechanism
- **Proctoring UI**: Real-time camera monitoring
- **Responsive Design**: Works on desktop/tablet
- **Error Handling**: User-friendly error messages
- **State Management**: React Context for auth and data

---

### `/Datasets` - Training Data
```
Datasets/
├── Aptitude/
│   ├── clean_general_aptitude_dataset.csv
│   ├── cse_dataset.csv
│   └── logical_reasoning_questions.csv
├── Subjective Question Dataset/
│   └── Software Questions.csv            # Technical QA pairs
└── Synthetic Nepali Resume Dataset/
    └── Resume_Dataset.csv                # Resume samples for training
```

**Usage**:
- Training ML models (role prediction, aptitude classification)
- Seeding question database
- Calibrating evaluation metrics

---

## 🧠 ML Concepts Used

### 1. **Natural Language Processing (NLP)**
- **Library**: spaCy
- **Tasks**:
  - Named Entity Recognition (NER)
  - Pattern matching
  - Text preprocessing
- **Application**: Resume entity extraction

### 2. **Vectorization**
- **TF-IDF** (Term Frequency-Inverse Document Frequency)
  - Converts text to numerical vectors
  - Weights important terms higher
  - Application: Technical answer evaluation

### 3. **Similarity Metrics**
- **Cosine Similarity**:
  - Measures angle between vectors
  - Range: 0 (different) to 1 (identical)
  - Application: Comparing user answer with reference

### 4. **Supervised Learning - Classification**
- **Logistic Regression** (Resume role prediction)
  - Binary/multiclass classification
  - Interpretable results
  - Fast training and inference

- **Random Forest** (Aptitude level prediction)
  - Ensemble learning (multiple decision trees)
  - Handles non-linear relationships
  - Robust to outliers

### 5. **Computer Vision**
- **Haar Cascades** (Face detection)
  - Cascade classifier: multiple stages of checks
  - Fast and lightweight
  - Good for real-time applications
  
- **Edge Detection** (Object detection)
  - Canny edge detector
  - Contour analysis
  - Aspect ratio matching

### 6. **Feature Engineering**
- Resume score components (skills, education, experience)
- Aptitude features (time taken, accuracy, section scores)
- Text features (word frequency, entity count)

### 7. **Large Language Models (LLMs)**
- **Gemini API** for AI recommendations
- **Prompt Engineering**: Carefully structured prompts
- **Rate Limiting**: Handling API quotas gracefully

---

## 🔄 Data Flow: User Journey

### Resume Upload & Analysis
```
1. User uploads resume (PDF/DOCX)
2. Frontend sends to Django API (/api/resumes/)
3. Django saves file, calls ML API
4. ML Pipeline:
   a. Extract text from file
   b. Parse entities (spaCy NER)
   c. Predict job role (Logistic Regression)
   d. Calculate resume score
   e. Generate Gemini recommendations
5. Results displayed in UI
```

### Taking an Aptitude Test
```
1. User selects section (Quantitative/Logical/Technical)
2. Frontend initializes camera for proctoring
3. Questions loaded from database
4. User answers questions
5. Proctoring runs every 5 seconds:
   a. Captures frame from camera
   b. Detects face (OpenCV)
   c. Checks for foreign objects
   d. Tracks violations
6. User submits test
7. Django calculates scores:
   a. Correct answers count
   b. Accuracy percentage
   c. Aptitude level (Random Forest)
   d. Proctoring integrity score
8. Results shown with detailed breakdown
```

### Technical Assessment (Subjective)
```
1. User selects technical category
2. Question displayed with hint
3. User types answer
4. Frontend sends to ML API
5. TF-IDF vectorization of both answers
6. Cosine similarity calculation
7. Score (0-100) returned
8. Feedback generated based on score
```

### Code Practice
```
1. User selects problem from list
2. Problem description shown (left side)
3. Code editor shown (right side)
4. User writes Python code
5. Submits for execution
6. FastAPI executes in sandbox (5s timeout)
7. Output displayed (stdout/stderr)
```

---

## 🔐 Authentication & Security

### JWT Authentication
- User registers with email/password
- Password hashed (PBKDF2)
- JWT token issued on login
- Token refresh mechanism
- Protected endpoints check token validity

### API Security
- CORS configured for frontend domain
- Input validation on all endpoints
- Rate limiting on sensitive endpoints (planned)
- SQL injection prevention (Django ORM)
- XSS protection (React escaping)

### Environment Variables
- `.env` file contains sensitive data
- Never committed to Git
- `.env.example` provided as template
- Loaded via `python-dotenv`

---

## 🚀 Deployment Architecture

### Docker Containerization
- **Dockerfile**: Django + Gunicorn
- **Dockerfile.ml**: FastAPI service
- **docker-compose.yml**: Orchestrates all services

### Services
```yaml
services:
  web:              # Django on port 8000
  ml-api:           # FastAPI on port 8001
  frontend:         # React dev server on 5173
  db:               # PostgreSQL on port 5432
```

### Environment Setup
1. Python 3.11+
2. PostgreSQL database
3. Virtual environment with dependencies
4. Environment variables configured
5. Media folder for uploaded resumes

---

## 📊 Database Schema

### User Model
```python
- id (PK)
- username, email, password
- first_name, last_name
- created_at, updated_at
- performance_metrics (JSON)
```

### Resume Model
```python
- id (PK)
- user (FK)
- file (PDF/DOCX)
- resume_score (0-100)
- predicted_role (string)
- entities (JSON)
- gemini_recommendations (JSON)
- uploaded_at
```

### AptitudeQuestion Model
```python
- id (PK)
- section (Quantitative/Logical/Technical)
- question_text
- options (JSON)
- correct_answer
- difficulty
```

### AptitudeTestAttempt Model
```python
- id (PK)
- user (FK)
- section
- answers (JSON)
- total_score, accuracy
- aptitude_level
- proctoring_violations (JSON)
- proctoring_score
- submitted_at
```

---

## 🛠️ Tech Stack Summary

### Backend
- **Framework**: Django + Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: Django REST JWT
- **ORM**: Django ORM

### ML Service
- **Framework**: FastAPI
- **NLP**: spaCy
- **ML**: scikit-learn (Logistic Regression, Random Forest)
- **Vectorization**: TF-IDF
- **Computer Vision**: OpenCV (Haar Cascades)
- **LLM**: Google Generative AI (Gemini)
- **Async**: Python async/await

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **State**: React Context
- **Styling**: Tailwind CSS
- **UI**: Custom components

### Infrastructure
- **Containers**: Docker & Docker Compose
- **Server**: Gunicorn (Django), Uvicorn (FastAPI)
- **Reverse Proxy**: Nginx (optional)

---

## 📈 Key Metrics & Scoring

### Resume Score (0-100)
- Name/Email: 15 points
- Skills: 30 points (3 points each)
- Education: 15 points
- Experience: 20 points
- Certifications: 10 points
- Organizations: 5 points

### Aptitude Test Score
- **Total Score**: Correct / Total × 100
- **Accuracy**: Correct / Answered × 100
- **Section Scores**: Per-section percentages
- **Aptitude Level**: ML prediction (Advanced/Intermediate/Beginner)
- **Proctoring Score**: 100 - (violations × penalties)
- **Integrity Score**: 70% × Proctoring + 30% × Test Score

### Technical Answer Score
- **Base**: Cosine similarity of TF-IDF vectors × 100
- **Feedback**: Tier-based on score (Excellent/Good/Fair/Needs Work)

---

## 🎯 Project Features

### ✅ Completed
1. **Resume Analysis**: Upload, extract, analyze, score
2. **Aptitude Tests**: Quantitative, Logical, Technical
3. **Technical Assessment**: Subjective questions with NLP evaluation
4. **Code Practice**: LeetCode-style with 8 problems
5. **Proctoring**: Face detection + foreign object detection
6. **AI Recommendations**: Gemini-powered personalized advice
7. **User Dashboard**: Statistics and performance tracking
8. **Authentication**: Secure JWT-based auth

### 🚀 Future Enhancements
1. Mock interviews with AI evaluation
2. Real-time leaderboard
3. Mobile app (React Native)
4. Advanced analytics (skill gap analysis)
5. Company-specific prep modules
6. Video tutorials integration

---

## 🔧 Getting Started

### Prerequisites
```bash
Python 3.11+
PostgreSQL 12+
Node.js 16+
pip and npm
```

### Setup
```bash
# Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r ml/requirements.txt

# Database
python manage.py migrate

# ML Service
python ml/api/server.py

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Variables
```
SECRET_KEY=your-django-secret-key
DB_NAME=placementprep
DB_USER=postgres
DB_PASSWORD=your-db-password
GEMINI_API_KEY=your-gemini-api-key
ML_API_URL=http://localhost:8001/api
```

---

## 📚 Project Structure at a Glance

```
PlacePrep/
├── Backend (Django)
│   ├── api/                    # Models, Views, Serializers
│   ├── config/                 # Settings, URLs, WSGI
│   └── manage.py
├── ML Service (FastAPI)
│   ├── api/
│   │   ├── server.py          # FastAPI app
│   │   └── proctoring.py      # Proctoring logic
│   └── scripts/
│       ├── analyze_resume.py  # Resume pipeline
│       ├── extract_*.py       # NLP components
│       └── train_*.py         # ML model training
├── Frontend (React)
│   ├── src/pages/            # Views
│   ├── src/services/         # API clients
│   └── src/components/       # Reusable UI
├── Datasets/                 # Training data
├── docker-compose.yml        # Container orchestration
└── requirements.txt          # Dependencies
```

---

## 🎓 Learning Outcomes

By studying this codebase, you'll learn:

1. **Full-stack development**: Django, FastAPI, React
2. **ML pipeline design**: From data extraction to model inference
3. **NLP concepts**: Entity extraction, vectorization, similarity
4. **Computer vision**: Face detection, image processing
5. **API design**: RESTful architecture, error handling
6. **Authentication**: JWT tokens, secure password handling
7. **Database design**: Schema design, relationships, migrations
8. **DevOps basics**: Docker, environment configuration
9. **Async programming**: FastAPI async patterns
10. **Testing strategies**: Unit tests, integration tests

---

## 📝 Notes for Developers

- **Gemini API**: Requires API key from https://aistudio.google.com/apikey
- **PostgreSQL**: Ensure server is running before starting Django
- **Virtual Environment**: Always activate before running Python commands
- **Hot Reload**: Frontend has hot reload; backend requires restart
- **Proctoring**: Requires webcam access; browser permission needed
- **File Upload**: Resumes stored in `media/resumes/` directory
- **Migrations**: Run `python manage.py migrate` after model changes

---

## 🤝 Contributing

1. Create a new branch for features
2. Test thoroughly before committing
3. Write clear commit messages
4. Update documentation if needed
5. Follow existing code style

---

## 📄 License

This project is built for educational purposes in placement preparation.

---

**Last Updated**: August 2026
**Version**: 1.0 Production Ready
**Maintainer**: Navneet Mallick
