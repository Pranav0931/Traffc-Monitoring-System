@echo off
echo ========================================
echo AI Traffic Monitoring System - Startup
echo ========================================
echo.

echo Starting Backend Server...
cd /d "%~dp0backend"

:: Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found! Please install Python 3.9+
    pause
    exit /b 1
)

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
call venv\Scripts\activate

:: Install dependencies
echo Installing dependencies...
pip install -r requirements.txt -q

:: Start the backend
echo.
echo Starting Traffic Monitoring Backend...
echo Server will be available at: http://127.0.0.1:8000
echo WebSocket endpoint: ws://127.0.0.1:8000/ws/traffic
echo.
cd /d "%~dp0"
python -m uvicorn backend.main:app --reload

pause
