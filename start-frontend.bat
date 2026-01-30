@echo off
echo ========================================
echo AI Traffic Monitoring System - Frontend
echo ========================================
echo.

echo Starting Frontend Development Server...
cd /d "%~dp0frontend"

:: Check for Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

:: Start the frontend
echo.
echo Starting Traffic Monitoring Dashboard...
echo Dashboard will be available at: http://localhost:3000
echo.
npm run dev

pause
