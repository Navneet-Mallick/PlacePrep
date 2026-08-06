# PlacementPrep - Complete Setup Guide

## Overview
PlacementPrep is a placement preparation platform with three main components:
- **Django Backend** (Port 8000): REST API for authentication, tests, resume analysis
- **ML API** (Port 8001): FastAPI service for resume analysis, NLP, and technical evaluation  
- **React Frontend** (Port 5173): User interface for tests and practice

## Prerequisites
- Python 3.9+ installed and in PATH
- Node.js 16+ and npm installed
- Git (for version control)

## Step-by-Step Setup

### Step 1: Create Virtual Environment (ONE TIME ONLY)
Run this command once to set up the Python virtual environment with all dependencies:

```bash
setup_venv.bat
```

This script will:
1. Create a virtual environment in the `venv/` folder
2. Install all Python dependencies from `requirements.txt` and `ml/requirements.txt`
3. Download the spaCy NLP model (`en_core_web_sm`)
4. Print completion instructions

**Expected Output:**
```
========================================
   Setup Complete!
========================================

Virtual environment is now activated.
```

> **Important**: This step must complete successfully before running the servers.

---

### Step 2: Start All Servers

After the virtual environment is set up, use this command to start all servers:

```bash
start_all_fixed.bat
```

This will:
1. Activate the virtual environment automatically
2. Start **Django** on port 8000 (in a new terminal)
3. Start **ML API** on port 8001 (in a new terminal)
4. Start **Frontend** on port 5173 (in a new terminal)

**Expected Output (4 terminals will open):**
```
Django API will run on: http://localhost:8000
ML API will run on:     http://localhost:8001
Frontend will run on:   http://localhost:5173
```

### Step 3: Verify All Services Are Running

Check that all three services are working:

1. **Django API**: Visit http://localhost:8000/api/health or check terminal for: `Starting development server at http://0.0.0.0:8000/`

2. **ML API**: Visit http://localhost:8001/api/health or check terminal for: `Uvicorn running on 0.0.0.0:8001`

3. **Frontend**: Visit http://localhost:5173 or check terminal for: `ready in XXX ms`

### Step 4: Access the Application

Open your browser and go to: **http://localhost:5173**

**Demo Credentials:**
- Email: `admin@localhost.com`
- Password: `admin123`

---

## Common Issues & Troubleshooting

### Issue 1: "Python not found" or "ModuleNotFoundError"
**Solution:**
1. Ensure Python 3.9+ is installed: `python --version`
2. Add Python to Windows PATH if needed
3. Delete `venv` folder and run `setup_venv.bat` again

### Issue 2: "Module 'spacy' not found" after venv setup
**Solution:**
1. The spaCy model should have downloaded during setup
2. If not, activate venv and run manually:
```bash
venv\Scripts\activate.bat
python -m spacy download en_core_web_sm
```

### Issue 3: Port Already in Use (Address already in use)
**Solution:**
Check which process is using the port and kill it, or use a different port:
```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue 4: Resume Analysis Returns "Unexpected Error"
**Solution:**
1. Ensure ML API terminal is showing: `Uvicorn running on 0.0.0.0:8001`
2. Check ML API terminal for actual error messages
3. Verify all three servers are running
4. Check virtual environment is activated

### Issue 5: "npm: command not found"
**Solution:**
1. Ensure Node.js is installed: `node --version`
2. Add Node.js to PATH if needed
3. Restart terminal and try again

---

## What Each Server Does

### Django Backend (Port 8000)
- **Purpose**: REST API for authentication, aptitude tests, technical questions, resume data storage
- **Key Endpoints**:
  - `/api/token/` - User authentication (login)
  - `/api/aptitude/` - Aptitude tests
  - `/api/technical/` - Technical questions and answers
  - `/api/resumes/` - Resume storage
- **Database**: SQLite (db.sqlite3) - local development only

### ML API (Port 8001)
- **Purpose**: Intelligent resume analysis, NLP entity extraction, technical answer evaluation
- **Key Endpoints**:
  - `/api/resume/analyze` - Analyze resume (extract entities, score, role prediction)
  - `/api/technical/evaluate` - Evaluate technical answers
  - `/api/python/execute` - Execute Python code safely
  - `/api/proctoring/check` - Face detection for proctored tests
- **Framework**: FastAPI with Uvicorn
- **Dependencies**: spaCy NLP, scikit-learn, PyPDF2, python-docx

### React Frontend (Port 5173)
- **Purpose**: User interface for tests, practice, resume analysis
- **Key Pages**:
  - Login / Register
  - Dashboard
  - Aptitude Test
  - Technical Questions
  - Code Practice
  - Resume Analysis
- **Framework**: React + Vite + Tailwind CSS

---

## File Structure Overview

```
PlacePrep/
├── manage.py                    # Django management script
├── requirements.txt             # Python dependencies (Django + ML)
├── setup_venv.bat              # Creates virtual environment (RUN FIRST)
├── start_all_fixed.bat         # Starts all servers (RUN AFTER SETUP)
│
├── config/                     # Django settings
│   ├── settings.py             # Main Django configuration
│   ├── urls.py                 # URL routing
│
├── api/                        # Django REST API
│   ├── models.py               # Database models
│   ├── views.py                # API endpoints
│   ├── serializers.py          # Data serializers
│   ├── urls.py                 # API URL routing
│   └── services/
│       └── resume_service.py   # Resume analysis orchestration
│
├── ml/                         # Machine Learning services
│   ├── api/
│   │   └── server.py           # FastAPI server (Port 8001)
│   ├── scripts/
│   │   ├── analyze_resume.py   # Main resume analysis logic
│   │   ├── extract_text.py     # PDF/DOCX text extraction
│   │   ├── extract_entities.py # NER and entity extraction
│   │   └── predict_role.py     # Role prediction model
│   └── requirements.txt        # ML-specific dependencies
│
├── frontend/                   # React application
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite configuration
│   └── src/
│       ├── pages/              # React pages
│       ├── components/         # React components
│       ├── services/           # API client
│       └── context/            # Auth context
│
└── Datasets/                   # Training datasets
    ├── Aptitude/              # Aptitude questions CSV files
    ├── Subjective Question Dataset/  # Technical questions
    └── Synthetic Nepali Resume Dataset/  # Resume samples
```

---

## Development Workflow

### To make code changes:
1. **Backend changes** (Django): Edit files in `api/` or `config/`, Django auto-reloads
2. **ML changes**: Edit files in `ml/`, restart ML API terminal
3. **Frontend changes**: Edit files in `frontend/src/`, Vite hot-reloads automatically
4. **Model/Database changes**: Run migrations:
   ```bash
   python manage.py migrate
   ```

### To load initial data:
```bash
python manage.py load_aptitude_questions
python manage.py load_technical_questions
```

### To create a superuser (admin):
```bash
python manage.py createsuperuser
```

---

## Testing the Application

1. **Login** with demo credentials:
   - Email: `admin@localhost.com`
   - Password: `admin123`

2. **Test Aptitude Section**:
   - Click "Aptitude Test" in sidebar
   - Answer the questions
   - Submit to see score

3. **Test Technical Section**:
   - Click "Technical Questions" in sidebar
   - Select a category and answer questions
   - Submit answers to be evaluated

4. **Test Resume Analysis**:
   - Click "Resume" in sidebar
   - Upload a PDF or DOCX file
   - View analysis results with score, role prediction, suggestions

5. **Test Face Detection**:
   - Start an Aptitude Test
   - Camera will activate automatically
   - Face must be in frame for test to proceed

---

## Next Steps (Optional)

### Deploy to Production:
See `Docker setup` section in README.md for Docker deployment instructions.

### Add your own questions:
- Update CSV files in `Datasets/` folder
- Run: `python manage.py load_technical_questions`

### Customize the UI:
- Edit React components in `frontend/src/pages/`
- Styling is in `frontend/src/index.css` (Tailwind CSS)

---

## Support & Troubleshooting

**All 3 servers running but resume analysis still fails?**
1. Check ML API terminal for error messages
2. Verify `ML_API_URL` in `config/settings.py` is set to `http://localhost:8001/api`
3. Try uploading a simple text file instead of PDF

**Need to reset everything?**
1. Delete `venv` folder
2. Delete `db.sqlite3`
3. Run `setup_venv.bat` again
4. Run `start_all_fixed.bat`

**Questions?**
Check logs in each terminal window for detailed error messages.

