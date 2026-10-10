@echo off
setlocal
title VenQore Demo Setup v2
set "APP=%~dp0..\..\app-code\main-app"
set "LOG=%~dp0setup.log"
set "PHP_BIN="
for %%P in ("E:\Software\xampp\php\php.exe" "D:\Software\XAMPP\php\php.exe" "C:\xampp\php\php.exe") do if exist %%P if not defined PHP_BIN set "PHP_BIN=%%~P"
if not defined PHP_BIN (where php >nul 2>nul && set "PHP_BIN=php")
for %%I in ("%PHP_BIN%") do set "XDIR=%%~dpI.."
set "MYSQL=%XDIR%\mysql\bin\mysql.exe"
echo PHP=%PHP_BIN% > "%LOG%"
"%MYSQL%" -uroot -e "DROP DATABASE IF EXISTS venqore_demo; CREATE DATABASE venqore_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >> "%LOG%" 2>&1
cd /d "%APP%"
set "DB_DATABASE=venqore_demo"
echo ---- migrate ---- >> "%LOG%"
"%PHP_BIN%" artisan migrate --force >> "%LOG%" 2>&1
echo ---- seed ---- >> "%LOG%"
"%PHP_BIN%" "%~dp0seed_demo.php" "%APP%" >> "%LOG%" 2>&1
echo ---- done ---- >> "%LOG%"
echo DONE
timeout /t 5 >nul
