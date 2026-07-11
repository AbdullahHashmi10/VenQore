@echo off
setlocal enabledelayedexpansion
title VenQore — Routes Ledger-Truth Sweep (154 route checks)
color 0B

echo ============================================================
echo   VenQore POS - ROUTES LEDGER-TRUTH SWEEP
echo   Hits every GET route and validates the on-screen
echo   financial numbers against the double-entry ledger.
echo ============================================================
echo.

:: ── Move to the project root (folder this .bat lives in) ─────────────
cd /d "%~dp0"

:: ── Locate PHP (same convention as LAUNCH_SYSTEM.bat) ────────────────
set "PHP_BIN="
if exist "E:\Software\xampp\php\php.exe" set "PHP_BIN=E:\Software\xampp\php\php.exe"
if not defined PHP_BIN if exist "D:\Software\XAMPP\php\php.exe" set "PHP_BIN=D:\Software\XAMPP\php\php.exe"
if not defined PHP_BIN if exist "C:\xampp\php\php.exe" set "PHP_BIN=C:\xampp\php\php.exe"
if not defined PHP_BIN (
    where php >nul 2>&1 && set "PHP_BIN=php"
)
if not defined PHP_BIN (
    echo  [ERROR] Could not find php.exe.
    echo  Edit this file and set PHP_BIN to your PHP path.
    echo.
    pause
    exit /b 1
)

echo  Using PHP: %PHP_BIN%
echo.
echo  Running the sweep in STRICT mode.
echo  ^(STRICT = the run FAILS if ANY route's number does not match the ledger.^)
echo.
echo ------------------------------------------------------------
echo.

:: ── Run the 154-route sweep. --strict returns exit code 1 on any mismatch ──
"%PHP_BIN%" artisan audit:ledger-truth --strict
set "SWEEP_EXIT=%ERRORLEVEL%"

echo.
echo ------------------------------------------------------------
echo.

if "%SWEEP_EXIT%"=="0" (
    color 0A
    echo   RESULT:  [ PASS ]  All scanned routes reconcile to the ledger.
    echo            No mismatches found. Exit code %SWEEP_EXIT%.
) else (
    color 0C
    echo   RESULT:  [ FAIL ]  One or more routes did NOT match the ledger,
    echo            or the sweep could not complete. Exit code %SWEEP_EXIT%.
    echo.
    echo   Scroll up to the red / mismatch rows above to see which routes.
    echo   A full report is also written under storage/ ^(path shown above^).
)

echo.
echo ============================================================
echo   Sweep complete.
echo ============================================================
echo.
pause
endlocal
exit /b %SWEEP_EXIT%
