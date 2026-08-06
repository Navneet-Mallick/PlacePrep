# 🔧 PlacementPrep - Troubleshooting Guide

## Error: "Could not connect to analysis service"

This error means the **ML API server is NOT running**.

### Quick Fix

#### Option 1: Use Batch Script (Easiest)
```bash
# Double-click this file in Windows Explorer:
start_all.bat
```

#### Option 2: Use PowerShell Script
```powershell
# Right-click start_all.ps1 and select "Run with PowerShell"
# Or run in PowerShell:
powershell -ExecutionPolicy Bypass -File start_all.ps1
```

#### Option 3: Manual Start (3 Terminals)

**Terminal 1: Django Backend**
```bash
python manage.py runserver 8000
```
Expected output: `Starting development server at http://127.0.0.1:8000/`

**Terminal 2: ML API**
```bash
cd ml/api
python server.py
```
Expected output: `Uvicorn running on http://0.0.0.0:8001`

**Terminal 3: Frontend**
```bash
cd frontend
npm run dev
```
Expected output: `VITE v8.0.16  ready in ... ms`

---

## Verify All Services Are Running

### Check Django
```bash
curl http://localhost:8000/api/health/
```
Expected: `{"status": "ok"}`

### Check ML API
```bash
curl http://localhost:8001/api/health
```
Expected: `{"status": "ok", "message": "ML API is running"}`

### Check Frontend
Open http://localhost:5173 in your browser

---

## Common Issues & Solutions

### Issue 1: Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Repeat for ports 8001 and 5173
```

Or use PowerShell:
```powershell
# Kill all Python processes
Stop-Process -Name python -Force
```

---

### Issue 2: Module Not Found

**Error:** `ModuleNotFoundError: No module named 'X'`

**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt

# For ML API
cd ml
pip install -r requirements.txt
cd ..

# Download spaCy model
python -m spacy download en_core_web_sm
```

---

### Issue 3: Frontend Dependencies Missing

**Error:** `npm ERR! Cannot find module`

**Solution:**
```bash
cd frontend
npm install
npm run dev
```

---

### Issue 4: Database/Migration Errors

**Error:** `django.db.utils.OperationalError`

**Solution:**
```bash
# Apply migrations
python manage.py migrate

# Load test data
python manage.py load_aptitude_questions
python manage.py load_technical_questions
```

---

### Issue 5: ML Model Not Found

**Error:** `FileNotFoundError: [Errno 2] No such file or directory: '.../models/...'`

**Solution:**
```bash
# Train models
python ml/scripts/train_resume_classifier.py
python ml/scripts/train_aptitude_classifier.py
```

---

### Issue 6: Resume Upload Fails

**Error:** `Could not connect to analysis service`

**Solution:**
1. ✅ Ensure ML API is running (Terminal 2)
2. ✅ Check http://localhost:8001/api/health returns OK
3. ✅ Check frontend is calling correct URL (should be http://localhost:8001)
4. ✅ Check browser console for CORS errors (F12 → Console)

---

## Startup Checklist

Before using the application:

- [ ] Run `start_all.bat` or manual startup
- [ ] Wait 10 seconds for services to start
- [ ] Check all 3 services are running (health endpoints)
- [ ] Open http://localhost:5173 in browser
- [ ] Try to login with demo credentials:
  - Email: `admin@localhost.com`
  - Password: `admin123`
- [ ] Try uploading a resume
- [ ] Try taking an aptitude test
- [ ] Try technical assessment

---

## Debug Mode

### Enable Django Debug Mode
Edit `config/settings.py`:
```python
DEBUG = True  # Set to True for more detailed errors
```

### Check Logs
```bash
# Django logs appear in Terminal 1
# ML API logs appear in Terminal 2
# Frontend logs in browser console (F12)
```

---

## Performance Tips

1. **Use Chrome/Chromium** for best performance
2. **Close unnecessary programs** to free up CPU/RAM
3. **Use SSD** for faster file access
4. **Allocate 4GB+ RAM** for smooth operation

---

## Still Having Issues?

1. ✅ Run `python check_system.py` to diagnose system
2. ✅ Run `python check_technical.py` to verify data
3. ✅ Check all 3 ports: 8000, 8001, 5173
4. ✅ Check internet connection (for Gemini API)
5. ✅ Check file permissions
6. ✅ Reinstall dependencies: `pip install -r requirements.txt`

---

## Quick Reset

If everything is broken, try a complete reset:

```bash
# Stop all services (Ctrl+C in each terminal)

# Clean up
python manage.py flush --no-input
del db.sqlite3  (on Windows)

# Rebuild
python manage.py migrate
python manage.py load_aptitude_questions
python manage.py load_technical_questions

# Restart
start_all.bat
```

---

## Emergency Support

If nothing works:
1. Delete `db.sqlite3`
2. Delete `ml/models/*.joblib`
3. Run: `pip install -r requirements.txt`
4. Run: `python manage.py migrate`
5. Run: `start_all.bat`

This should reset everything to a working state!
