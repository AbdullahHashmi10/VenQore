@echo off
setlocal
title AMD POS Launcher
color 0A

echo ===================================================
echo      AMD POINT OF SALE - SYSTEM LAUNCHER
echo ===================================================
echo.

REM --- CONFIGURATION ---
set "TARGET_PHP=D:\Software\XAMPP\php\php.exe"
set "PORT=8000"
set "HOST=127.0.0.1"

REM --- STEP 1: FIND PHP ---
echo [1/4] Checking System Core...
if exist "%TARGET_PHP%" (
    set "PHP_BIN=%TARGET_PHP%"
    echo    - Core Found: %TARGET_PHP%
) else (
    echo    - Custom path not found. searching system...
    where php >nul 2>nul
    if %errorlevel% equ 0 (
        set "PHP_BIN=php"
    ) else (
        echo    ERROR: PHP not found at %TARGET_PHP% or in defaults.
        echo    Please install XAMPP or fix the path.
        pause
        exit /b
    )
)

REM --- STEP 2: DEPENDENCIES ---
if not exist "node_modules" (
    echo [2/4] Installing First-Time Dependencies (One-time only)...
    call npm install
)

REM --- STEP 3: KILL OLD PROCESSES ---
echo [3/4] Clearing previous sessions...
taskkill /F /IM php.exe /FI "WINDOWTITLE eq AMD_BACKEND*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq AMD_FRONTEND*" >nul 2>nul

REM --- STEP 4: START SERVICES (WITH QUOTES FIX) ---
echo [4/4] Starting Services...

REM Start Backend
echo    - Starting Backend (Port %PORT%)...
REM Using explicit call with title and quotes around exe path
start /min "AMD_BACKEND" "%PHP_BIN%" artisan serve --host=%HOST% --port=%PORT%

REM Start Frontend
echo    - Starting Frontend...
start /min "AMD_FRONTEND" cmd /c "npm run dev"

echo.
echo ===================================================
echo     SYSTEM IS LIVE. OPENING BROWSER...
echo ===================================================
echo.

REM Wait a moment for server to spin up
timeout /t 5 >nul

REM Open Browser
start http://%HOST%:%PORT%

REM Keep window open but minimized
if "%1"=="min" goto :EOF
/min
