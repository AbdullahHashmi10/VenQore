@echo off
REM ============================================================
REM  VenQore Verification Center Launcher
REM ============================================================

setlocal

set "PROJECT_ROOT=%~dp0"
set "VC_DIR=%PROJECT_ROOT%Tester\VerificationCenter"

echo.
echo === VenQore Verification Center ===
echo Project root: %PROJECT_ROOT%
echo.

REM --- Find PHP: PATH first, then look in XAMPP or other default paths ---
set "PHP_BIN=php"
where php >nul 2>nul
if errorlevel 1 (
    if exist "E:\Software\Xampp\php\php.exe" (
        set "PHP_BIN=E:\Software\Xampp\php\php.exe"
    ) else if exist "C:\xampp\php\php.exe" (
        set "PHP_BIN=C:\xampp\php\php.exe"
    ) else (
        echo [ERROR] php.exe not found on PATH or in default XAMPP paths.
        echo Please edit this .bat file and set the path to your php.exe.
        pause
        exit /b 1
    )
)

echo [1/2] Generating verification dashboard data...
"%PHP_BIN%" "%PROJECT_ROOT%artisan" verify:dashboard-data --env=testing
echo.

echo [2/2] Starting local web server on http://localhost:8009
echo       The dashboard is at:  http://localhost:8009/dashboard.html
echo       Press Ctrl+C in this window to stop the server.
echo.

REM --- Open browser, then start PHP server ---
start "" "http://localhost:8009/dashboard.html"
"%PHP_BIN%" -S localhost:8009 -t "%VC_DIR%"

endlocal
