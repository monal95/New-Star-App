@echo off
REM Smart Tailoring Management System - Troubleshooting
REM Windows Batch Script

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo System Diagnostics & Troubleshooting
echo ==========================================
echo.

REM Check Node.js
echo [1] Checking Node.js...
node --version
npm --version
echo.

REM Check if ports are available
echo [2] Checking if port 5000 (Backend) is available...
netstat -ano | findstr :5000
if errorlevel 1 (
    echo Port 5000: AVAILABLE
) else (
    echo Port 5000: IN USE - Backend may fail to start!
)
echo.

REM Check MongoDB
echo [3] Checking MongoDB connection...
cd backend
node -e "const { MongoClient } = require('mongodb'); const client = new MongoClient('mongodb://localhost:27017'); client.connect().then(() => { console.log('MongoDB: CONNECTED'); client.close(); }).catch(err => { console.log('MongoDB: FAILED -', err.message); });"
cd ..
timeout /t 2 /nobreak
echo.

REM Check file structure
echo [4] Checking project structure...
if exist main.js (echo   ✓ main.js found) else (echo   ✗ main.js MISSING)
if exist preload.js (echo   ✓ preload.js found) else (echo   ✗ preload.js MISSING)
if exist package.json (echo   ✓ Root package.json found) else (echo   ✗ Root package.json MISSING)
if exist backend\server.js (echo   ✓ backend/server.js found) else (echo   ✗ backend/server.js MISSING)
if exist backend\.env (echo   ✓ backend/.env found) else (echo   ✗ backend/.env MISSING - create from backend/.env.example)
if exist frontend\build\index.html (echo   ✓ frontend/build/index.html found) else (echo   ✗ frontend/build/index.html MISSING - run: cd frontend ^&^& npm run build)
echo.

REM Check dependencies
echo [5] Checking dependencies...
if exist node_modules\electron (echo   ✓ electron installed) else (echo   ✗ electron MISSING - run: npm install)
if exist backend\node_modules\express (echo   ✓ express installed) else (echo   ✗ express MISSING - run: cd backend ^&^& npm install)
if exist frontend\node_modules\react (echo   ✓ react installed) else (echo   ✗ react MISSING - run: cd frontend ^&^& npm install)
echo.

echo ==========================================
echo Recommendations:
echo ==========================================
echo.
echo 1. If backend/.env is missing:
echo    Copy and customize: backend\.env.example to backend\.env
echo.
echo 2. If frontend/build is missing:
echo    Run: cd frontend ^&^ npm run build
echo.
echo 3. If MongoDB is not running:
echo    Start MongoDB service or run: mongod
echo.
echo 4. If Electron won't start:
echo    Delete node_modules and run: npm install
echo.
pause
