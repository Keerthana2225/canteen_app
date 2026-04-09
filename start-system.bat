@echo off
title Canteen Feedback System
color 0A

echo.
echo  ============================================
echo   TSF Brakes India — Canteen Feedback System
echo   Offline Mode  ^|  SQLite  ^|  v2.0
echo  ============================================
echo.

:: ── Find local IP ──────────────────────────────
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4.*192\|IPv4.*172\|IPv4.*10\."') do (
    set LOCAL_IP=%%a
)
set LOCAL_IP=%LOCAL_IP: =%

echo  [INFO] Local IP detected: %LOCAL_IP%
echo  [INFO] Backend will start on: http://%LOCAL_IP%:8000
echo  [INFO] QR Feedback Form:      http://%LOCAL_IP%:8000/form
echo  [INFO] QR Code Image:         http://%LOCAL_IP%:8000/qr
echo  [INFO] API Docs:              http://%LOCAL_IP%:8000/docs
echo.
echo  [INFO] SQLite DB auto-created at: backend\feedback.db
echo         (No SQL Server required!)
echo.
echo  ── How users submit feedback ───────────────
echo   1. All devices connect to the SAME Wi-Fi
echo   2. Admin opens QR tab in the APK app
echo   3. Users scan the QR code with their phone
echo   4. Browser opens form — they rate and submit
echo  ────────────────────────────────────────────
echo.

:: ── Activate venv ──────────────────────────────
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo  [OK] Virtual environment activated
) else (
    echo  [WARN] No venv found — using system Python
)

:: ── Start FastAPI ───────────────────────────────
echo.
echo  [START] Launching FastAPI server...
echo  Press Ctrl+C to stop.
echo.
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
