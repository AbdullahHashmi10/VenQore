@echo off
echo Starting AMD POS System...

:: navigate to current directory
cd /d "%~dp0"

:: Detect PHP location
set "PHP_BIN=php"
if exist "E:\Software\xampp\php\php.exe" (
    set "PHP_BIN=E:\Software\xampp\php\php.exe"
) else if exist "D:\Software\xampp\php\php.exe" (
    set "PHP_BIN=D:\Software\xampp\php\php.exe"
) else if exist "C:\xampp\php\php.exe" (
    set "PHP_BIN=C:\xampp\php\php.exe"
) else if exist "E:\xampp\php\php.exe" (
    set "PHP_BIN=E:\xampp\php\php.exe"
) else if exist "D:\xampp\php\php.exe" (
    set "PHP_BIN=D:\xampp\php\php.exe"
)

:: Start Laravel Server (Backend)
echo Starting Backend (PHP Artisan Serve using %PHP_BIN%)...
start "AMD POS - Backend" "%PHP_BIN%" artisan serve

:: Start Vite Server (Frontend)
echo Starting Frontend (Vite)...
start "AMD POS - Frontend" npm run dev

echo.
echo Application is starting up!
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
echo You can minimize these windows, but do not close them.
pause
