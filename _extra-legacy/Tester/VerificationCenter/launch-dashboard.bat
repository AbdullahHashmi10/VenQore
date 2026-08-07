@echo off
REM ============================================================
REM  VenQore Verification Center — One Dashboard launcher
REM ============================================================
REM  Double-click this file to (1) regenerate the dashboard data
REM  and (2) serve this folder over HTTP so the dashboard can load
REM  dashboard-data.json (the file:// protocol blocks fetch()).
REM ============================================================

setlocal

REM --- Locate the project root (two levels up from this file) ---
set "VC_DIR=%~dp0"
pushd "%VC_DIR%\..\.."
set "PROJECT_ROOT=%CD%"
popd

echo.
echo === VenQore Verification Center ===
echo Project root: %PROJECT_ROOT%
echo.

REM --- Try to find PHP: PATH first, then the Local by Flywheel bundled PHP ---
set "PHP_BIN=php"
where php >nul 2>nul
if errorlevel 1 (
    set "PHP_BIN=C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe"
)

echo [1/2] Generating dashboard data...
pushd "%PROJECT_ROOT%"
"%PHP_BIN%" artisan verify:dashboard-data
popd
echo.

echo [2/2] Starting a local web server on http://localhost:8009
echo       The dashboard will be at:  http://localhost:8009/dashboard.html
echo       Press Ctrl+C in this window to stop the server.
echo.

REM --- Open the browser, then serve this folder ---
start "" "http://localhost:8009/dashboard.html"
"%PHP_BIN%" -S localhost:8009 -t "%VC_DIR%"

endlocal
