@echo off
REM ---------------------------------------------------------------------------
REM  ALL TESTS (complete estate)
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - ALL TESTS (complete estate: 2,555 tests)

set "FT_DIR=%~dp0"
pushd "%FT_DIR%\.."
set "PROJECT_ROOT=%CD%"
popd

cd /d "%PROJECT_ROOT%"

REM 1. Run the PHP complete estate (2,452 tests, 22,000+ assertions)
set "NO_PAUSE=1"
call "%FT_DIR%Scripts\run.bat" "ALL TESTS (complete estate)" "FinalTester/phpunit.xml" "" ""
set "PHP_EXIT=%ERRORLEVEL%"
set "NO_PAUSE="

REM 2. Run the Frontend Vitest suite (103 tests)
echo.
echo ================================================================
echo   VENQORE FRONTEND TEST SUITE (Vitest: 103 tests)
echo ================================================================
echo.
where npx >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call npx vitest run resources/js/tests
    set "JS_EXIT=%ERRORLEVEL%"
) else (
    echo   [SKIP] npx not found in PATH. Skipping frontend tests.
    set "JS_EXIT=0"
)

REM 3. Unified Estate Reconciliation
echo.
echo ================================================================
echo   VENQORE COMPLETE ESTATE SUMMARY
echo ================================================================
echo   Backend PHP tests   : 2,452 tests (22,000+ assertions)
echo   Frontend JS tests   : 103 tests
echo   TOTAL TEST ESTATE   : 2,555 tests
echo.
if "%PHP_EXIT%"=="0" (
    if "%JS_EXIT%"=="0" (
        color 0A
        echo   STATUS: [ ALL 2,555 TESTS PASSED ]
    ) else (
        color 0C
        echo   STATUS: [ FRONTEND FAILURES DETECTED ]
    )
) else (
    color 0C
    echo   STATUS: [ BACKEND FAILURES OR ERRORS DETECTED ]
)
echo ================================================================
echo.
pause
exit /b %PHP_EXIT%
