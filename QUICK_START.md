# PlacementPrep - Quick Start (5 Minutes)

## First Time Setup (Do This Once)

### Step 1: Open Terminal
Navigate to the PlacementPrep folder and open a terminal/command prompt here.

### Step 2: Run Setup Script
```bash
setup_venv.bat
```
This will download all dependencies (~2-3 minutes). Wait for it to complete.

---

## Every Time You Want to Run the App

### Step 1: Start All Servers
```bash
start_all_fixed.bat
```
This will open **4 new terminal windows**:
1. Django API (port 8000)
2. ML API (port 8001)  
3. Frontend (port 5173)
4. Main terminal (for messages)

### Step 2: Wait for Startup
Wait ~10 seconds for all services to start.

### Step 3: Open Browser
Go to: **http://localhost:5173**

### Step 4: Login
- Email: `admin@localhost.com`
- Password: `admin123`

---

## Troubleshooting

### Problem: "venv not found"
→ Run `setup_venv.bat` first

### Problem: "Port already in use"
→ Either close other apps, or wait a moment and try again

### Problem: Resume analysis shows error
→ Make sure all 4 terminals are running and show no errors

### Problem: Can't upload resume
→ Check ML API terminal (2nd window) for error messages

---

## What's Running

| Service | Port | URL | What It Does |
|---------|------|-----|-------------|
| **Frontend** | 5173 | http://localhost:5173 | The app UI you see |
| **Django API** | 8000 | http://localhost:8000 | Authentication, tests, resume storage |
| **ML API** | 8001 | http://localhost:8001 | Resume analysis, face detection, technical evaluation |

---

## To Stop the Servers

Close each terminal window or press Ctrl+C in each one.

---

## Next Steps

1. **Take Aptitude Test** → Click "Aptitude Test" in sidebar
2. **Try Technical Questions** → Click "Technical" in sidebar  
3. **Upload Resume** → Click "Resume" in sidebar

**Demo Features:**
- ✅ Face detection during tests (camera required)
- ✅ Resume analysis (extracts skills, education, experience)
- ✅ Technical answer evaluation
- ✅ Python code execution
- ✅ Proctoring with violation detection

---

For detailed setup and troubleshooting, see **SETUP_GUIDE.md**
