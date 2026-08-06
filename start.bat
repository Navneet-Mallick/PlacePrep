@echo off
echo ================================================
echo  PlacementPrep - Starting All Services
echo ================================================
echo.

echo [1/3] Starting Django Backend (Port 8001)...
start "Django Backend" cmd /k "python manage.py runserver 8001"
timeout /t 3 /nobreak >nul

echo [2/3] Starting ML API (Port 8000)...
start "ML API" cmd /k "cd ml\api && python server.py"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend (Port 5173)...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ================================================
echo  All Services Started!
echo ================================================
echo.
echo Django Backend:  http://localhost:8001/api/health/
echo ML API:          http://localhost:8000/api/health
echo Frontend:        http://localhost:5173
echo Admin Panel:     http://localhost:8001/admin/
echo.
echo Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:5173
