@echo off
:: ============================================================
::  VenQore — Triple-Run Pre-Build Gate
::
::  Runs the full Pest suite 3 times back-to-back.
::  If ANY single run fails → EXIT, do NOT build.
::
::  Usage: triple-run.bat
::  Call this BEFORE npm run build + bundle_for_update.ps1
::
::  Why 3 runs?
::  Catches flaky tests — tests that pass once but fail on
::  repeated runs due to DB state not cleaning up between
::  runs, race conditions, or non-deterministic seeds.
:: ============================================================

setlocal EnableDelayedExpansion

set TESTER_DIR=%~dp0Tester
set PASS_COUNT=0
set FAIL_RUN=0
set START_TIME=%TIME%

:: ── Locate PHP — mirrors LAUNCH_SYSTEM.bat resolution logic ──────────────
set "PHP_BIN=D:\Software\XAMPP\php\php.exe"
if not exist "%PHP_BIN%" (
    where php >nul 2>nul
    if %errorlevel% equ 0 (
        set "PHP_BIN=php"
    ) else (
        echo.
        echo   [ERROR] PHP not found at D:\Software\XAMPP\php\php.exe or in PATH.
        echo   Please update the PHP_BIN path in triple-run.bat.
        exit /b 1
    )
)

echo.
echo ============================================================
echo   VenQore ^| Triple-Run Pre-Build Gate
echo ============================================================
echo.
echo  This will run your full test suite 3 times.
echo  All 3 must pass before you are allowed to build.
echo.
echo  Tester directory: %TESTER_DIR%
echo  Started at: %START_TIME%
echo.
echo ============================================================
echo.

:: ── RUN 1 ──────────────────────────────────────────────────
echo [RUN 1/3] Starting first pass...
echo.

cd /d "%~dp0"
"%PHP_BIN%" vendor/bin/pest --configuration=Tester/phpunit.xml --colors=always
set RUN1_EXIT=%ERRORLEVEL%

if %RUN1_EXIT% neq 0 (
    echo.
    echo ============================================================
    echo   [FAIL] Run 1/3 FAILED ^(exit code %RUN1_EXIT%^)
    echo.
    echo   Build aborted. Fix the failing tests and try again.
    echo ============================================================
    echo.
    exit /b 1
)

set /a PASS_COUNT+=1
echo.
echo   [PASS] Run 1/3 passed.
echo.

:: ── RUN 2 ──────────────────────────────────────────────────
echo [RUN 2/3] Starting second pass...
echo.

"%PHP_BIN%" vendor/bin/pest --configuration=Tester/phpunit.xml --colors=always
set RUN2_EXIT=%ERRORLEVEL%

if %RUN2_EXIT% neq 0 (
    echo.
    echo ============================================================
    echo   [FAIL] Run 2/3 FAILED ^(exit code %RUN2_EXIT%^)
    echo.
    echo   This is a FLAKY TEST — it passed once but failed again.
    echo   This is the exact problem triple-run catches.
    echo   Fix the flaky test before building.
    echo ============================================================
    echo.
    exit /b 1
)

set /a PASS_COUNT+=1
echo.
echo   [PASS] Run 2/3 passed.
echo.

:: ── RUN 3 ──────────────────────────────────────────────────
echo [RUN 3/3] Starting third pass...
echo.

"%PHP_BIN%" vendor/bin/pest --configuration=Tester/phpunit.xml --colors=always
set RUN3_EXIT=%ERRORLEVEL%

if %RUN3_EXIT% neq 0 (
    echo.
    echo ============================================================
    echo   [FAIL] Run 3/3 FAILED ^(exit code %RUN3_EXIT%^)
    echo.
    echo   Intermittent failure on final pass. Still a flaky test.
    echo   Do NOT build until all 3 passes are green.
    echo ============================================================
    echo.
    exit /b 1
)

set /a PASS_COUNT+=1

:: ── ALL 3 PASSED ───────────────────────────────────────────
echo.
echo ============================================================
echo   [GATE PASSED] All 3/3 runs passed.
echo ============================================================
echo.
echo   Your suite is stable. No flaky tests detected.
echo   You are now CLEARED to build and package an update.
echo.
echo   Next steps:
echo     1. npm run build
echo     2. .\bundle_for_update.ps1 -Version "X.X.X"
echo.
echo   End time: %TIME%
echo ============================================================
echo.

exit /b 0
