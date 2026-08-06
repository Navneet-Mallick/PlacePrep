# PlacementPrep - Getting Started

Welcome to PlacementPrep! This guide will help you get the application up and running.

## What is PlacementPrep?

PlacementPrep is a comprehensive placement preparation platform with:
- **Aptitude Tests**: Quantitative, Logical Reasoning, Technical sections
- **Technical Questions**: 6 categories with 200+ questions (DSA, Web, Git, OS, DBMS, CN)
- **Resume Analysis**: AI-powered analysis with entity extraction and role prediction
- **Code Practice**: Python code execution and evaluation
- **Face Detection Proctoring**: Ensures academic integrity during tests

---

## System Requirements

- **Windows** (tested on Windows 10/11)
- **Python 3.9+** (download from [python.org](https://www.python.org))
- **Node.js 16+** (download from [nodejs.org](https://nodejs.org))
- **4GB RAM minimum** (8GB+ recommended)
- **Camera** (for proctoring features)

---

## Installation (First Time Only)

### 1. Download and Install Python
1. Download Python 3.9+ from https://www.python.org
2. **Important**: Check "Add Python to PATH" during installation
3. Verify: Open Command Prompt and run `python --version`

### 2. Download and Install Node.js
1. Download Node.js 16+ from https://nodejs.org
2. Use the LTS (Long-Term Support) version
3. Verify: Open Command Prompt and run `node --version` and `npm --version`

### 3. Clone or Download PlacementPrep
- Download the project and extract it
- Or clone if you have Git: `git clone <repository-url>`

---

## Setup Steps

### Step 1: First-Time Environment Setup (DO THIS ONCE)

Navigate to the PlacementPrep folder and run:

```bash
setup_venv.bat
```

This creates a virtual environment with all Python dependencies.

**Expected output:**
```
Setup Complete!

Virtual environment is ready.

Next, initialize everything by running:
  init_all.bat
```

### Step 2: Initialize Everything

Run:

```bash
init_all.bat
```

This will:
1. ✅ Activate the virtual environment
2. ✅ Train the resume classification model
3. ✅ Load aptitude questions into database
4. ✅ Load technical questions into database
5. ✅ Run database migrations

**Expected output:**
```
[1/5] Virtual environment already exists
[2/5] Activating virtual environment...
[3/5] Training models...
[4/5] Loading question data...
[5/5] Running database migrations...

Initialization Complete!
```

> **Note**: This step takes 2-5 minutes. Wait for completion.

### Step 3: Start the Application

Run:

```bash
start_all_fixed.bat
```

This opens 4 terminal windows:
1. **Django Backend** (Port 8000) - API server
2. **ML API** (Port 8001) - Analysis and ML models
3. **Frontend** (Port 5173) - Web interface
4. **Main terminal** - Status messages

**Wait 10-15 seconds** for all services to fully start.

### Step 4: Open the Application

Open your web browser and go to:

```
http://localhost:5173
```

### Step 5: Login

Use the demo credentials:
- **Email:** `admin@localhost.com`
- **Password:** `admin123`

---

## What's Running

| Service | Port | Purpose |
|---------|------|---------|
| **Frontend** | 5173 | React app (what you see) |
| **Django API** | 8000 | Authentication, tests, resume storage |
| **ML API** | 8001 | Resume analysis, face detection, code evaluation |

---

## First-Time Usage Guide

### 1. Take an Aptitude Test
1. Click **"Aptitude Test"** in the sidebar
2. Select a section (Quantitative, Logical, Technical)
3. Answer the questions (camera will detect your face)
4. Submit to see your score and detailed breakdown

### 2. Try Technical Questions
1. Click **"Technical Questions"** in the sidebar
2. Select a category (DSA, Web, Git, OS, DBMS, CN)
3. Choose your difficulty level
4. Submit answers to be evaluated by AI

### 3. Upload and Analyze Resume
1. Click **"Resume"** in the sidebar
2. Upload a PDF or DOCX file
3. View AI-powered analysis:
   - Extracted entities (skills, education, experience)
   - Resume score (0-100)
   - Predicted job role
   - Actionable suggestions

### 4. Practice Code
1. Click **"Code Practice"** in the sidebar
2. Write and test Python code
3. Get real-time feedback and error checking

---

## Troubleshooting

### Problem: "Python not found"
**Solution:**
1. Install Python 3.9+ from https://www.python.org
2. Make sure to check "Add Python to PATH"
3. Restart Command Prompt and verify: `python --version`

### Problem: "venv not found" error
**Solution:**
1. Run `setup_venv.bat` again
2. Wait for it to complete
3. Then run `init_all.bat`

### Problem: ModuleNotFoundError when running scripts
**Solution:**
1. The virtual environment might not be activated
2. Run `venv\Scripts\activate.bat` manually
3. Then run your command

### Problem: Port 8000/8001/5173 already in use
**Solution:**
1. Another app is using the port
2. Either close that app or restart your computer
3. Or change the port in the startup script

### Problem: Resume analysis shows "Unexpected Error"
**Solution:**
1. Check that ALL 3 terminals are running
2. Look for error messages in the ML API terminal (2nd window)
3. Verify the model was trained: `init_all.bat`
4. Make sure you uploaded a valid PDF or DOCX file

### Problem: Face detection not working
**Solution:**
1. Ensure you gave the browser camera permission
2. Check that your camera is working (test in another app)
3. Your face must be clearly visible for 5+ seconds

### Problem: Can't see technical questions or only 404 error
**Solution:**
1. Run `init_all.bat` to load questions into database
2. Make sure all servers are running
3. Try refreshing the page (Ctrl+R)

---

## Advanced Troubleshooting

### Check if Ports are Available
Open Command Prompt and run:
```bash
netstat -ano | findstr :8000
netstat -ano | findstr :8001
netstat -ano | findstr :5173
```

If you see output, that port is in use. Close the process or use a different port.

### Test Individual Services

**Test Django API:**
```bash
curl http://localhost:8000/api/health
```

**Test ML API:**
```bash
curl http://localhost:8001/api/health
```

### View Detailed Logs
Keep the terminal windows open while using the app. Error messages will appear in real-time.

### Reinstall Everything
If nothing works, start fresh:
1. Delete the `venv` folder
2. Delete `db.sqlite3`
3. Run `setup_venv.bat`
4. Run `init_all.bat`
5. Run `start_all_fixed.bat`

---

## Project Structure

```
PlacePrep/
├── QUICK_START.md              ← Simple 5-minute guide
├── SETUP_GUIDE.md              ← Detailed setup instructions
├── GETTING_STARTED.md          ← This file
│
├── setup_venv.bat              ← Step 1: Create environment
├── init_all.bat                ← Step 2: Initialize everything
├── start_all_fixed.bat         ← Step 3: Start servers
├── diagnose.bat                ← Diagnose issues
│
├── config/                     ← Django settings
├── api/                        ← REST API
├── ml/                         ← ML/NLP services
├── frontend/                   ← React app
├── Datasets/                   ← Question datasets
│
└── requirements.txt            ← Python dependencies
```

---

## Demo Features to Try

✅ **Face Detection**: Take an aptitude test and move away - violation alert appears

✅ **Resume Analysis**: Upload your resume to see AI-powered analysis

✅ **Technical Evaluation**: Answer a technical question, get immediate feedback

✅ **Code Execution**: Write Python code and run it in the sandbox

✅ **Proctoring Violations**: Open multiple tabs while taking a test - see violation alert

---

## Next Steps

1. **Explore the Dashboard**: View your test scores and performance analytics
2. **Practice More**: Take multiple tests to improve your score
3. **Analyze Resumes**: Upload sample resumes to see analysis in action
4. **Practice Coding**: Build confidence with coding challenges

---

## Support

### Common Questions

**Q: Do I need internet after setup?**
A: No, everything runs locally. No internet required after installation.

**Q: Can I share this with friends?**
A: Yes! They just need Python 3.9+, Node.js 16+, and can run the same setup steps.

**Q: How do I add my own questions?**
A: Update the CSV files in `Datasets/` and run `python manage.py load_technical_questions`

**Q: Can I deploy this online?**
A: Yes! See `TROUBLESHOOTING.md` or `README.md` for Docker deployment instructions.

**Q: How do I save my progress?**
A: Progress is automatically saved to `db.sqlite3`. Don't delete this file!

---

## Need More Help?

- Check `TROUBLESHOOTING.md` for detailed issue resolution
- Check `START_SERVERS.md` for server management
- Review terminal output for error messages
- Run `diagnose.bat` to check your system

---

**Enjoy using PlacementPrep! 🎓**

