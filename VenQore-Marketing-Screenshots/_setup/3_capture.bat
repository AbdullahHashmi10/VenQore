@echo off
title VenQore screenshot capture
cd /d "%~dp0capture"
if not exist node_modules ( echo Installing playwright-core... & call npm install --no-audit --no-fund )
node capture.js %1
echo.
echo FINISHED - see ..\capture.log
timeout /t 8 >nul
