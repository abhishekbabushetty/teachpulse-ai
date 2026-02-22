# TeachPulse-AI Local Startup Script
# This script helps start all necessary services for local development.

Write-Host "Starting TeachPulse-AI Local Environment..." -ForegroundColor Cyan

# 1. Check for Python Environment
if (-not (Test-Path "backend\venv")) {
    Write-Host "Creating Python Virtual Environment in /backend..." -ForegroundColor Yellow
    cd backend
    python -m venv venv
    cd ..
}

# 2. Check for Node Modules
if (-not (Test-Path "frontend\student-app\node_modules")) {
    Write-Host "Installing Student App Dependencies..." -ForegroundColor Yellow
    cd frontend\student-app
    npm install
    cd ..\..
}

if (-not (Test-Path "frontend\teacher-dashboard\node_modules")) {
    Write-Host "Installing Teacher Dashboard Dependencies..." -ForegroundColor Yellow
    cd frontend\teacher-dashboard
    npm install
    cd ..\..
}

Write-Host "`nReady to launch!" -ForegroundColor Green
Write-Host "To run the system, open 3 separate terminals:"
Write-Host "Terminal 1 (Backend API):"
Write-Host "  cd backend"
Write-Host "  .\venv\Scripts\activate"
Write-Host "  .\venv\Scripts\python.exe -m pip install -r requirements.txt"
Write-Host "  .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
Write-Host ""
Write-Host "Terminal 2 (Celery Worker):"
Write-Host "  cd backend"
Write-Host "  .\venv\Scripts\activate"
Write-Host "  celery -A app.workers.celery_worker.celery_app worker --loglevel=info -B"
Write-Host ""
Write-Host "Terminal 3 (Frontends):"
Write-Host "  (In split tabs or separate windows)"
Write-Host "  cd frontend\student-app && npm run dev"
Write-Host "  cd frontend\teacher-dashboard && npm run dev"
Write-Host ""
Write-Host "Ensure Redis and PostgreSQL are running independently on localhost!" -ForegroundColor Red
