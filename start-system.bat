@echo off
title Canteen Feedback System - Startup
echo ===================================================
echo     STARTING CANTEEN FEEDBACK SYSTEM
echo ===================================================
echo.

:: 1. Start FastAPI Backend in a new window
echo [1/3] Starting FastAPI Backend on Port 8000...
cd "%~dp0backend"
start "FastAPI Backend" cmd /k "..\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: 2. Start Admin Dashboard in a new window
echo [2/3] Starting Admin Dashboard on Port 3000...
cd "%~dp0admin-dashboard"
start "Admin Dashboard" cmd /k "npm start"

:: 3. Start Expo Mobile App in a new window
echo [3/3] Starting Expo Mobile app on Port 8081...
cd "%~dp0mobile-app"
start "Expo Mobile App" cmd /k "npx expo start --localhost --android"

echo.
echo ===================================================
echo ALL DONE! 
echo Three new windows have opened for each service.
echo ===================================================
pause
