@echo off
REM ===========================================================================
REM  FinalTester\Scripts\run.bat  -  the single execution path
REM ===========================================================================
REM  Every RUN_*.bat in FinalTester\ is a thin wrapper around this file, so
REM  there is exactly ONE place where the run sequence is defined. If you need
REM  to change how tests are launched, change it here and every launcher
REM  inherits it.
REM
REM  USAGE
REM    run.bat "<Display name>" "<config path>" ["<testsuite>"] ["<extra args>"]
REM
REM  SEQUENCE
REM    1. Locate php.exe
REM    2. Sync FinalTester\tests from the source suites  (never stale)
REM    3. Discover the EXPECTED test count via pest --list-tests-xml
REM    4. Print the header, including the expected count, BEFORE running
REM    5. Run the suite with --log-junit
REM    6. Reconcile executed vs expected and print the results block
REM ===========================================================================

setlocal enabledelayedexpansion

set "DISPLAY=%~1"
set "CFG=%~2"
if not "%CFG%"=="" set "CFG=%CFG:FinalTester=tests%"
set "SUITE=%~3"
set "EXTRA=%~4"
if not "%EXTRA%"=="" set "EXTRA=%EXTRA:FinalTester=tests%"

set "FT_DIR=%~dp0.."
pushd "%FT_DIR%\.."
set "PROJECT_ROOT=%CD%"
popd

REM ---------------------------------------------------------------------
REM 1. Locate PHP
REM ---------------------------------------------------------------------
set "PHP_BIN="
where php >nul 2>&1 && set "PHP_BIN=php"

if not defined PHP_BIN if exist "C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe" set "PHP_BIN=C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe"
if not defined PHP_BIN if exist "E:\Software\xampp\php\php.exe" set "PHP_BIN=E:\Software\xampp\php\php.exe"
if not defined PHP_BIN if exist "D:\Software\XAMPP\php\php.exe" set "PHP_BIN=D:\Software\XAMPP\php\php.exe"
if not defined PHP_BIN if exist "C:\xampp\php\php.exe" set "PHP_BIN=C:\xampp\php\php.exe"

if not defined PHP_BIN (
    color 0C
    echo.
    echo   [ERROR] Could not find php.exe.
    echo.
    echo   Fix: either add PHP to your PATH, or edit this file
    echo        ^(FinalTester\Scripts\run.bat^) and set PHP_BIN directly.
    echo.
    pause
    exit /b 1
)

cd /d "%PROJECT_ROOT%"

REM ---------------------------------------------------------------------
REM 1b. Preflight - refuse to run against a broken environment.
REM     A red build must mean "the product is broken", never "the test
REM     database was stale". Pass /force to skip this check.
REM ---------------------------------------------------------------------
set "PREFLIGHT_MODE="
echo %* | find /I "/force" >nul && set "PREFLIGHT_MODE=--warn"

"%PHP_BIN%" "%FT_DIR%\Scripts\preflight.php" %PREFLIGHT_MODE%
if errorlevel 1 (
    color 0E
    echo.
    echo   Stopped before running any tests.
    echo   Fix the problems above, or pass /force to run anyway.
    echo.
    pause
    exit /b 2
)

REM ---------------------------------------------------------------------
REM 2. Sync - FinalTester\tests is a materialised view, never a fork
REM ---------------------------------------------------------------------
"%PHP_BIN%" "%FT_DIR%\Scripts\sync.php" --quiet

REM ---------------------------------------------------------------------
REM 3. Discover the expected count (no tests are executed by this step)
REM ---------------------------------------------------------------------
echo.
echo   Counting tests...

set "EXPECTED=unknown"
set "SUITE_ARG="
if not "%SUITE%"=="" set "SUITE_ARG=--testsuite=%SUITE%"

for /f "usebackq tokens=* delims=" %%L in (`"%PHP_BIN%" "%FT_DIR%\Scripts\expected.php" "--config=%CFG%" %SUITE_ARG% 2^>nul`) do (
    set "LASTLINE=%%L"
)
if defined LASTLINE set "EXPECTED=%LASTLINE%"

REM ---------------------------------------------------------------------
REM 4. Header
REM ---------------------------------------------------------------------
cls
color 0B
echo ================================================================
echo   VENQORE TESTING SYSTEM
echo ================================================================
echo.
echo   Suite            : %DISPLAY%
echo   Config           : %CFG%
if not "%SUITE%"=="" echo   Testsuite        : %SUITE%
echo   Database         : amd_pos_test  ^(MySQL^)
echo.
echo   EXPECTED TESTS   : %EXPECTED%
echo.
echo   Every one of these should execute. If the executed count at the
echo   end is lower, tests were silently skipped - that is a defect in
echo   the test infrastructure, not a pass.
echo.
echo ================================================================
echo.
echo   Running...
echo.

REM ---------------------------------------------------------------------
REM 5. Execute
REM ---------------------------------------------------------------------
if not exist "%FT_DIR%\reports" mkdir "%FT_DIR%\reports"
if exist "%FT_DIR%\reports\junit.xml" del /q "%FT_DIR%\reports\junit.xml"

set "SUITE_RUN="
if not "%SUITE%"=="" set "SUITE_RUN=--testsuite %SUITE%"

REM  --test-directory is REQUIRED. Pest does not derive it from --configuration;
REM  it defaults to "tests", which is the stale legacy folder. Without this flag
REM  Pest loads tests\Pest.php instead of FinalTester\tests\Pest.php and every
REM  Pest closure-style test runs with no base class and no booted Laravel app.

"%PHP_BIN%" -d memory_limit=-1 vendor\bin\pest ^
    --configuration "%CFG%" ^
    --test-directory=tests/tests ^
    %SUITE_RUN% ^
    --log-junit "%FT_DIR%\reports\junit.xml" ^
    --no-coverage ^
    %EXTRA%

set "RUN_EXIT=%ERRORLEVEL%"

REM ---------------------------------------------------------------------
REM 6. Reconcile and report
REM ---------------------------------------------------------------------
"%PHP_BIN%" "%FT_DIR%\Scripts\report.php" "%FT_DIR%\reports\junit.xml" %RUN_EXIT%

if "%RUN_EXIT%"=="0" (
    color 0A
    echo   RESULT: [ PASS ]  exit code %RUN_EXIT%
) else (
    color 0C
    echo   RESULT: [ FAIL ]  exit code %RUN_EXIT%
    echo.
    echo   Project rule: when a test fails, fix the APPLICATION CODE.
    echo   Only change the test if the test itself is provably wrong.
)

echo.
echo   Reports : FinalTester\reports\summary.json
echo   Full log: FinalTester\logs\ ^(dashboard runs^) or scroll up
echo.
pause
endlocal
exit /b %RUN_EXIT%
