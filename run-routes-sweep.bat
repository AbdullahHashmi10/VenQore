@echo off
setlocal enabledelayedexpansion
title VenQore -- Routes Ledger-Truth Sweep (154 route checks)
color 0B

echo ============================================================
echo   VenQore POS - ROUTES LEDGER-TRUTH SWEEP
echo   Hits every GET route and validates on-screen financial
echo   numbers against the double-entry ledger.
echo   Expected coverage: ~154 routes
echo ============================================================
echo.

REM Move to the project root
cd /d "%~dp0"

REM Locate PHP
set "PHP_BIN="
if exist "E:\Software\xampp\php\php.exe"     set "PHP_BIN=E:\Software\xampp\php\php.exe"
if not defined PHP_BIN if exist "D:\Software\XAMPP\php\php.exe" set "PHP_BIN=D:\Software\XAMPP\php\php.exe"
if not defined PHP_BIN if exist "C:\xampp\php\php.exe"          set "PHP_BIN=C:\xampp\php\php.exe"
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

REM Parse optional flags passed to this .bat
set "EXTRA_FLAGS="
for %%A in (%*) do (
    if /I "%%A"=="/skip-seed"      set "EXTRA_FLAGS=!EXTRA_FLAGS! --skip-seed"
    if /I "%%A"=="/financial-only" set "EXTRA_FLAGS=!EXTRA_FLAGS! --financial"
)

echo  Flags forwarded to artisan: [%EXTRA_FLAGS%]
echo.
echo  Running the sweep in STRICT mode against the TEST database (amd_pos_test).
echo  STRICT = fails with exit code 1 if any ledger-derived number mismatches.
echo.
echo  NOTE: This sweep seeds a Golden Audit tenant on amd_pos_test.
echo        The GoldenAuditSeeder refuses to run on the production database.
echo.
echo  - Pass /skip-seed to reuse the existing tenant (faster re-runs).
echo  - Pass /financial-only to show only pages that carry financial props.
echo.
echo ------------------------------------------------------------
echo.

REM Force the testing environment
set "APP_ENV=testing"

REM Run the sweep with unlimited memory to avoid out-of-memory crashes
"%PHP_BIN%" -d memory_limit=-1 artisan audit:ledger-truth --strict --env=testing %EXTRA_FLAGS%
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
    echo   Scroll up to find the mismatch rows above.
    echo   A full report is also written to storage/discrepancy_report.md
)

echo.
echo ============================================================
echo   Sweep complete.
echo ============================================================
echo.
pause
endlocal
exit /b %SWEEP_EXIT%
