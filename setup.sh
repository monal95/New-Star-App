#!/bin/bash
# Smart Tailoring Management System - Installation Script (Unix/Linux/Mac)
# This script automates the setup process

set -e  # Exit on error

echo ""
echo "=========================================="
echo "Smart Tailoring Management System"
echo "Electron Desktop App - Setup Script"
echo "=========================================="
echo ""

# Check Node.js
echo "[1/6] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install from: https://nodejs.org/"
    exit 1
fi
echo "[OK] Node.js $(node --version) installed"
echo ""

# Install root dependencies
echo "[2/6] Installing root dependencies (Electron)..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install root dependencies!"
    exit 1
fi
echo "[OK] Root dependencies installed"
echo ""

# Install backend dependencies
echo "[3/6] Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install backend dependencies!"
    cd ..
    exit 1
fi
cd ..
echo "[OK] Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "[4/6] Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install frontend dependencies!"
    cd ..
    exit 1
fi
echo "[OK] Frontend dependencies installed"
echo ""

# Build frontend
echo "[5/6] Building React frontend for production..."
npm run build
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to build frontend!"
    cd ..
    exit 1
fi
echo "[OK] Frontend built successfully"
cd ..
echo ""

# Final checks
echo "[6/6] Verifying setup..."
if [ -f "main.js" ]; then
    echo "[OK] main.js found"
else
    echo "[WARNING] main.js not found"
fi
if [ -f "preload.js" ]; then
    echo "[OK] preload.js found"
else
    echo "[WARNING] preload.js not found"
fi
if [ -f "frontend/build/index.html" ]; then
    echo "[OK] frontend/build/index.html found"
else
    echo "[ERROR] frontend/build/index.html not found - rebuild frontend!"
    exit 1
fi
echo ""

echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Create backend/.env file:"
echo "   PORT=5000"
echo "   MONGODB_URI=mongodb://localhost:27017/tailoring_app"
echo "   NODE_ENV=production"
echo ""
echo "2. Ensure MongoDB is running:"
echo "   mongod"
echo ""
echo "3. Start the desktop app:"
echo "   npm start"
echo ""
echo "4. (Optional) Create Windows executable:"
echo "   npm run pack-all"
echo ""
