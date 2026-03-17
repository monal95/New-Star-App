@echo off
REM Smart Tailoring Management System - Quick Start
REM Windows Batch Script

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo Smart Tailoring Management System
echo Electron Desktop App - Quick Start
echo ==========================================
echo.

REM Check if Node.js is installed
node --version > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed: 
node --version
echo.

REM Check if MongoDB is running
echo Checking MongoDB status...
echo.

REM Step 1: Install Dependencies
echo [1/5] Installing root dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install root dependencies!
    pause
    exit /b 1
)
echo [OK] Root dependencies installed
echo.

REM Step 2: Check and install backend dependencies
echo [2/5] Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies!
    cd ..
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
cd ..
echo.

REM Step 3: Check and install frontend dependencies
echo [3/5] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies!
    cd ..
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

REM Step 4: Build frontend
echo [4/5] Building React frontend for production...
call npm run build
if errorlevel 1 (
    echo [ERROR] Failed to build frontend!
    cd ..
    pause
    exit /b 1
)
echo [OK] Frontend built successfully
echo Build location: frontend/build/
cd ..
echo.

REM Step 5: Ready to start
echo [5/5] Setup complete!
echo.
echo ==========================================
echo Next Steps:
echo ==========================================
echo.
echo 1. Ensure MongoDB is running:
echo    - Start MongoDB service or run: mongod
echo.
echo 2. Create backend/.env file (if not exists) with:
echo    PORT=5000
echo    MONGODB_URI=mongodb://localhost:27017/tailoring_app
echo    NODE_ENV=production
echo.
echo 3. Start the desktop app:
echo    npm start
echo.
echo To package as .exe:
echo    npm run pack
echo.
echo ==========================================
pause
