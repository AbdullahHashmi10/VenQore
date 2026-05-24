@echo off
title VenQore Test Runner
color 0a

echo.
echo  ╔══════════════════════════════════════╗
echo  ║       VenQore Test Runner            ║
echo  ║       Starting up...                 ║
echo  ╚══════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Install ws package if not present
if not exist "%~dp0node_modules\ws" (
    echo  Installing dependencies...
    cd /d "%~dp0"
    call npm install ws --save 2>&1
    echo  Dependencies installed.
    echo.
)

:: Kill any previous instance on port 7821
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":7821"') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: Start the server (hidden window)
cd /d "%~dp0"
start "" /min node test-runner.js

:: Wait for server to be ready
echo  Starting server...
timeout /t 2 /nobreak >nul

:: Open browser
start "" "http://localhost:7821"

echo  ✓ VenQore Test Runner is running.
echo  ✓ Dashboard opened in your browser.
echo.
echo  Keep this window open while testing.
echo  Close it to stop the server.
echo.

:: Keep the window alive (server runs in background, this window shows status)
node -e "
const http = require('http');
let dots = 0;
setInterval(() => {
  process.stdout.write('\r  Running... ' + '.'.repeat((dots++ %% 4) + 1) + '   ');
}, 800);
process.on('SIGINT', () => { console.log('\n\n  Shutting down...'); process.exit(0); });
" 2>nul

pause
