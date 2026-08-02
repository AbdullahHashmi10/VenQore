@echo off
REM ===========================================================================
REM  VENQORE TEST COMMAND CENTER  -  live dashboard
REM ===========================================================================
REM  Serves http://localhost:7830 with a live view of a running suite.
REM
REM  Port 7830 is deliberately different from the three legacy dashboards
REM  (7821 Tester\dashboard, 7822 Golden, 7823 VerificationCenter) so this can
REM  run alongside them without a port conflict while you migrate.
REM ===========================================================================

setlocal
title VenQore - Test Command Center
color 0B

set "FT_DIR=%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo   [ERROR] Node.js is not installed or not on PATH.
    echo   The dashboard needs it. Download: https://nodejs.org
    echo.
    echo   You do NOT need Node to run tests - use RUN_ALL_TESTS.bat instead.
    echo.
    pause
    exit /b 1
)

cd /d "%FT_DIR%dashboard"

if not exist "node_modules\ws" (
    echo.
    echo   First run - installing the one dependency ^(ws^)...
    echo.
    call npm install --no-audit --no-fund
    echo.
)

REM Free the port if a previous instance is still holding it.
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":7830"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo ================================================================
echo   VENQORE TEST COMMAND CENTER
echo ================================================================
echo.
echo   Dashboard : http://localhost:7830
echo.
echo   The progress bar is executed / expected, where expected comes
echo   from PHPUnit's own collector. It starts at 0, only moves
echo   forward, and cannot exceed 100 percent.
echo.
echo   Keep this window open. Ctrl+C to stop.
echo.
echo ================================================================
echo.

start "" "http://localhost:7830"
node server.js

endlocal
