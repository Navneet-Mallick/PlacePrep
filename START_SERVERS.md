# 🚀 How to Start All Servers

## Prerequisites Check
```bash
# 1. Check if dependencies are installed
python check_system.py

# 2. Verify database has data
python check_technical.py
```

## Starting the Application (3 Servers Required)

### Method 1: Using Separate Terminals (Recommended for Development)

**Terminal 1: Django Backend (Port 8000)**
```bash
python manage.py runserver 8000
```
✅ Access: http://localhost:8000/api/health/

**Terminal 2: ML API (Port 8001)**
```bash
cd ml/api
python server.py
```
✅ Access: http://localhost:8001/api/health

**Terminal 3: React Frontend (Port 5173)**
```bash
cd frontend
npm run dev
```
✅ Access: http://localhost:5173

---

## Method 2: Using Start Script (Windows)

Create `start_all.bat`:
```batch
@echo off
echo Starting PlacementPrep...

start "Django Backend" cmd /k "python manage.py runserver 8000"
timeout /t 3
start "ML API" cmd /k "cd ml\api && python server.py"
timeout /t 3
start "Frontend" cmd /k "cd frontend && npm run dev"

echo All servers started!
echo.
echo Django:   http://localhost:8000
echo ML API:   http://localhost:8001  
echo Frontend: http://localhost:5173
pause
```

Then run: `start_all.bat`

---

## Verification

### 1. Django Backend Health Check
```bash
curl http://localhost:8000/api/health/
```
Expected: `{"status": "ok"}`

### 2. ML API Health Check
```bash
curl http://localhost:8001/api/health
```
Expected: `{"status": "ok", "message": "ML API is running"}`

### 3. Test Technical Questions API
```bash
curl http://localhost:8000/api/technical/questions/by_category/?category=dsa
```
Expected: JSON array with questions

### 4. Test Resume Analysis
```bash
curl -X POST http://localhost:8001/api/resume/analyze \
  -H "Content-Type: multipart/form-data" \
  -F "text=Python developer with Django experience"
```

---

## Common Issues

### Issue: Port Already in Use
**Solution:**
```bash
# Find process on port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Issue: ModuleNotFoundError
**Solution:**
```bash
pip install -r requirements.txt
cd frontend && npm install
```

### Issue: No Questions Available
**Solution:**
```bash
python manage.py load_aptitude_questions
python manage.py load_technical_questions
```

### Issue: spaCy Model Not Found
**Solution:**
```bash
python -m spacy download en_core_web_sm
```

---

## Quick Test Checklist

- [ ] Django backend running on port 8000
- [ ] ML API running on port 8001
- [ ] Frontend running on port 5173
- [ ] Can login with demo credentials
- [ ] Technical questions load
- [ ] Resume upload works
- [ ] Aptitude test works

---

## Stopping All Servers

Press `Ctrl+C` in each terminal window, or close the terminal windows.

---

## Production Deployment

For production, use:
```bash
docker-compose up --build
```

This starts all services in containers.
