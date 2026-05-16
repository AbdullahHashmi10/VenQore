@echo off
echo Starting AMD POS System...

:: navigate to current directory
cd /d "%~dp0"

:: Start Laravel Server (Backend)
echo Starting Backend (PHP Artisan Serve)...
start "AMD POS - Backend" "D:\software\xampp\php\php.exe" artisan serve

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
