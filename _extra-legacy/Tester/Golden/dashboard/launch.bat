@echo off
title VenQore Golden Verification Suite
color 0e

echo.
echo ============================================================
echo   VenQore Golden Verification Dashboard
echo   Financial Integrity Suite  -  Phases 1 to 11
echo ============================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Download from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Install ws if missing
if not exist "%~dp0node_modules\ws" (
    echo Installing dependencies...
    cd /d "%~dp0"
    call npm install ws --save
    echo Dependencies installed.
    echo.
)

:: Kill anything running on port 7822
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":7822"') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: Start the server in a minimized background window
cd /d "%~dp0"
echo Starting Golden Verification Server on port 7822...
start "" /min cmd /c "node server.js"

:: Wait 2 seconds for server to start
ping -n 3 127.0.0.1 >nul

:: Open browser
start "" "http://localhost:7822"

echo.
echo [OK] Dashboard is running at: http://localhost:7822
echo [OK] Browser opened automatically.
echo.
echo ============================================================
echo   Keep this window open while the dashboard is in use.
echo   Close this window to stop the server.
echo ============================================================
echo.
echo Press Ctrl+C to stop the server.
echo.
pause
