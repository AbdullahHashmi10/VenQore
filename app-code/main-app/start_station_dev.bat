@echo off
title VenQore Station - Local Dev Mode
cd /d "%~dp0"

echo ===================================================
echo     VenQore Station - Local Dev Launcher
echo ===================================================
echo.

if not exist "amd-station\node_modules" (
    echo [1/2] Installing station dependencies...
    cd amd-station
    call npm install
    cd ..
)

echo [2/2] Launching VenQore Station in Dev Mode...
cd amd-station
call npm run dev
pause
