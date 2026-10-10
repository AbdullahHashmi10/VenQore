@echo off
title VenQore capture worker (leave open)
cd /d "%~dp0capture"
if not exist node_modules ( call npm install --no-audit --no-fund )
node worker.js
pause
