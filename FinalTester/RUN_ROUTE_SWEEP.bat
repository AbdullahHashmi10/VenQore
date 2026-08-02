@echo off
REM ===========================================================================
REM  VENQORE - ROUTE SWEEP  (two phases)
REM ===========================================================================
REM  PHASE 1  Static integrity  (seconds, no database, no HTTP)
REM             - Ziggy file vs Laravel registry, in BOTH directions
REM             - every Inertia::render target exists on disk
REM             - every route action resolves to real controller code
REM             - namespace census: no area of the app is silently unswept
REM
REM  PHASE 2  Live ledger-truth HTTP sweep  (minutes, seeds the test database)
REM             - hits every store.* GET route
REM             - validates on-screen financial numbers against journal_items
REM
REM  Phase 1 runs first on purpose: it is fast and it catches the class of
REM  error that would make phase 2 fail confusingly (a broken route, a missing
REM  page component). If phase 1 is red, fix that before reading phase 2.
REM ===========================================================================

setlocal enabledelayedexpansion
title VenQore - Route Sweep
color 0B

set "FT_DIR=%~dp0"
pushd "%FT_DIR%.."
set "PROJECT_ROOT=%CD%"
popd

set "PHP_BIN="
where php >nul 2>&1 && set "PHP_BIN=php"
if not defined PHP_BIN if exist "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" set "PHP_BIN=C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe"
if not defined PHP_BIN if exist "E:\Software\xampp\php\php.exe" set "PHP_BIN=E:\Software\xampp\php\php.exe"
if not defined PHP_BIN if exist "C:\xampp\php\php.exe" set "PHP_BIN=C:\xampp\php\php.exe"

if not defined PHP_BIN (
    color 0C
    echo   [ERROR] php.exe not found. Add PHP to PATH or edit this file.
    pause
    exit /b 1
)

cd /d "%PROJECT_ROOT%"

"%PHP_BIN%" "%FT_DIR%Scripts\sync.php" --quiet

cls
echo ================================================================
echo   VENQORE TESTING SYSTEM  -  ROUTE SWEEP
echo ================================================================
echo.
echo   PHASE 1 : static route + page integrity   ^(fast^)
echo   PHASE 2 : live ledger-truth HTTP sweep    ^(slow, seeds DB^)
echo.
echo ================================================================
echo.
echo   PHASE 1  Static integrity
echo   ----------------------------------------------------------
echo.

"%PHP_BIN%" -d memory_limit=-1 vendor\bin\pest ^
    --configuration "FinalTester/phpunit.xml" ^
    --testsuite Routes ^
    --log-junit "%FT_DIR%reports\junit-routes.xml" ^
    --no-coverage

set "P1=%ERRORLEVEL%"

echo.
if "%P1%"=="0" (
    echo   PHASE 1 : [ PASS ]  routes, Ziggy and page components are consistent.
) else (
    color 0C
    echo   PHASE 1 : [ FAIL ]  exit code %P1%
    echo.
    echo   Read the failure above before continuing. The most common cause is
    echo   a route added to routes\web.php without running:
    echo.
    echo       php artisan ziggy:generate
    echo.
    echo   Phase 2 will still run, but its results may be misleading while
    echo   phase 1 is red.
    echo.
)

echo.
echo   Route coverage census written to:
echo     FinalTester\reports\route-coverage.json
echo.
echo ================================================================
echo.
echo   PHASE 2  Live ledger-truth HTTP sweep
echo   ----------------------------------------------------------
echo.
echo   Hits every store.* GET route and reconciles every financial
echo   number on the page against the double-entry ledger.
echo.
echo   NOTE: this seeds a Golden Audit tenant on amd_pos_test.
echo         GoldenAuditSeeder refuses to run against venqore_pos.
echo.
echo   Flags you can pass to this .bat:
echo     /skip-seed       reuse the existing tenant ^(much faster^)
echo     /financial-only  only show pages carrying financial props
echo     /no-phase2       stop after phase 1
echo.

set "EXTRA_FLAGS="
set "SKIP_P2="
for %%A in (%*) do (
    if /I "%%A"=="/skip-seed"      set "EXTRA_FLAGS=!EXTRA_FLAGS! --skip-seed"
    if /I "%%A"=="/financial-only" set "EXTRA_FLAGS=!EXTRA_FLAGS! --financial"
    if /I "%%A"=="/no-phase2"      set "SKIP_P2=1"
)

if defined SKIP_P2 (
    echo   /no-phase2 given - stopping after phase 1.
    echo.
    pause
    exit /b %P1%
)

set "APP_ENV=testing"
"%PHP_BIN%" -d memory_limit=-1 artisan audit:ledger-truth --strict --env=testing %EXTRA_FLAGS%
set "P2=%ERRORLEVEL%"

echo.
echo ================================================================
echo   ROUTE SWEEP COMPLETE
echo ================================================================
echo.

if "%P1%"=="0" ( echo   PHASE 1  static integrity      : [ PASS ] ) else ( echo   PHASE 1  static integrity      : [ FAIL ] exit %P1% )
if "%P2%"=="0" ( echo   PHASE 2  ledger-truth sweep    : [ PASS ] ) else ( echo   PHASE 2  ledger-truth sweep    : [ FAIL ] exit %P2% )

echo.
if not "%P2%"=="0" echo   Mismatch report: storage\discrepancy_report.md
echo   Coverage census: FinalTester\reports\route-coverage.json
echo.

set /a TOTAL=%P1%+%P2%
if "%TOTAL%"=="0" ( color 0A ) else ( color 0C )

pause
endlocal
exit /b %TOTAL%
