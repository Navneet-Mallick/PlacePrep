@echo off
echo Starting PlacementPrep...
echo.

:: Start Django Backend
start "Django API" cmd /k "cd /d %~dp0 && .\venv\Scripts\python.exe manage.py runserver"

:: Start ML Service
start "ML Service" cmd /k "cd /d %~dp0 && .\venv\Scripts\python.exe ml/api/server.py"

:: Start Frontend
start "Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo All services starting...
echo.
echo   Frontend:  http://localhost:5173
echo   Django:    http://localhost:8000
echo   ML API:    http://localhost:8001
echo   Admin:     http://localhost:8000/admin
echo.
pause
