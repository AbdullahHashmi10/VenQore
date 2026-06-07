@echo off
echo ---------------------------------------------------------------
echo      AMD POS - SERVER RESTART & OPTIMIZATION
echo ---------------------------------------------------------------
echo.
echo [1/3] Stopping existing server instances...
taskkill /F /IM php.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Configuring High-Performance Upstream...
:: Setting 2GB limits for backup restoration
set PHP_OPTS=-d upload_max_filesize=2048M -d post_max_size=2048M -d memory_limit=2048M -d max_execution_time=0 -d max_input_time=0

echo [3/3] Launching Optimized Server...
echo.
echo     UPLOAD LIMIT SET TO: UNLIMITED (2GB)
echo.
echo You can now return to the Installer and retry your backup upload.
echo.
php %PHP_OPTS% artisan serve --host=127.0.0.1 --port=8000
pause
