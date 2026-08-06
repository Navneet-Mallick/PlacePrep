# PlacementPrep - Start All Services
# Run: powershell -ExecutionPolicy Bypass -File start_all.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PlacementPrep - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if required folders exist
if (-not (Test-Path "ml\api")) {
    Write-Host "ERROR: ml\api folder not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "ERROR: frontend folder not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root directory." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check ports before starting
Write-Host "Checking ports..." -ForegroundColor Yellow
if (Test-Port 8000) {
    Write-Host "⚠️  Port 8000 is already in use!" -ForegroundColor Yellow
}
if (Test-Port 8001) {
    Write-Host "⚠️  Port 8001 is already in use!" -ForegroundColor Yellow
}
if (Test-Port 5173) {
    Write-Host "⚠️  Port 5173 is already in use!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[1/3] Starting Django Backend on port 8000..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k python manage.py runserver 8000" -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host "[2/3] Starting ML API on port 8001..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd ml\api && python server.py" -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host "[3/3] Starting React Frontend on port 5173..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd frontend && npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All services started!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application here:" -ForegroundColor Yellow
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Django:    http://localhost:8000/api/health/" -ForegroundColor White
Write-Host "  ML API:    http://localhost:8001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "  Email:    admin@localhost.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""

# Wait and check if services are running
Write-Host "Verifying services..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$services_ok = $true

if (Test-Port 8000) {
    Write-Host "✅ Django Backend is running" -ForegroundColor Green
} else {
    Write-Host "❌ Django Backend failed to start" -ForegroundColor Red
    $services_ok = $false
}

if (Test-Port 8001) {
    Write-Host "✅ ML API is running" -ForegroundColor Green
} else {
    Write-Host "❌ ML API failed to start" -ForegroundColor Red
    $services_ok = $false
}

if (Test-Port 5173) {
    Write-Host "✅ Frontend is running" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend failed to start" -ForegroundColor Red
    $services_ok = $false
}

Write-Host ""
if ($services_ok) {
    Write-Host "All services are running! Open http://localhost:5173 in your browser." -ForegroundColor Green
} else {
    Write-Host "Some services failed to start. Check the error windows for details." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to close this window (services will continue running)"
