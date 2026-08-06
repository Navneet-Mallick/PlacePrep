@echo off
REM PlacementPrep - Start All Services
REM This script starts Django, ML API, and Frontend in separate windows

echo.
echo ========================================
echo   PlacementPrep - Starting All Services
echo ========================================
echo.

REM Check if required folders exist
if not exist "ml\api" (
    echo ERROR: ml\api folder not found!
    echo Make sure you're running this from the project root directory.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: frontend folder not found!
    echo Make sure you're running this from the project root directory.
    pause
    exit /b 1
)

echo [1/3] Starting Django Backend on port 8000...
start "PlacementPrep - Django Backend" cmd /k "title PlacementPrep - Django Backend && python manage.py runserver 8000"
timeout /t 3 /nobreak

echo [2/3] Starting ML API on port 8001...
start "PlacementPrep - ML API" cmd /k "title PlacementPrep - ML API && cd ml\api && python server.py"
timeout /t 3 /nobreak

echo [3/3] Starting React Frontend on port 5173...
start "PlacementPrep - Frontend" cmd /k "title PlacementPrep - Frontend && cd frontend && npm run dev"
timeout /t 3 /nobreak

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo Access the application here:
echo   Frontend:  http://localhost:5173
echo   Django:    http://localhost:8000
echo   ML API:    http://localhost:8001
echo.
echo Close this window or press Ctrl+C to stop seeing this message.
echo (The services will continue running in their own windows)
echo.
pause
