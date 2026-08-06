# PlacementPrep - Quick Run Guide

## Setup (One Time)

```bash
# Install dependencies
pip install -r requirements.txt
pip install -r ml/requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Train ML model
python ml/scripts/train_resume_classifier.py

# Setup database
python manage.py migrate
python manage.py load_aptitude_questions
python manage.py load_technical_questions

# Frontend setup
cd frontend
npm install
cd ..
```

## Update .env

Get real Gemini API key from: https://aistudio.google.com/apikey

Replace in `.env`:
```
GEMINI_API_KEY=AIzaSyD_your_real_key_here
```

## Run Servers (3 Terminals)

**Terminal 1 - Django:**
```bash
venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - ML API:**
```bash
venv\Scripts\activate
python ml/api/server.py
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

## Access

Open: http://localhost:5173

Login:
- Email: `admin@localhost.com`
- Password: `admin123`

## Test

```bash
python test_opencv.py
python test_gemini.py
```
