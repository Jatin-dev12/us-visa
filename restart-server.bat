@echo off
echo ========================================
echo   Restarting Visa Bot Server
echo ========================================
echo.

echo Step 1: Killing any process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Found process: %%a
    taskkill /F /PID %%a 2>nul
)
echo.

echo Step 2: Waiting 2 seconds...
timeout /t 2 /nobreak >nul
echo.

echo Step 3: Starting server...
echo.
echo ========================================
echo   Server starting...
echo   Open: http://localhost:3000
echo   Press Ctrl+C to stop
echo ========================================
echo.

node server.js
