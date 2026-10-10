@echo off
title VenQore DEMO server :8001 (venqore_demo)
set "APP=%~dp0..\..\app-code\main-app"
set "PHP_BIN="
for %%P in ("E:\Software\xampp\php\php.exe" "D:\Software\XAMPP\php\php.exe" "C:\xampp\php\php.exe") do if exist %%P if not defined PHP_BIN set "PHP_BIN=%%~P"
cd /d "%APP%"
set "DB_DATABASE=venqore_demo"
set "APP_URL=http://127.0.0.1:8001"
set "SESSION_COOKIE=venqore_demo_session"
set "PHP_CLI_SERVER_WORKERS=4"
"%PHP_BIN%" "%~dp0prepare_login.php" "%APP%"
"%PHP_BIN%" artisan serve --host=127.0.0.1 --port=8001
