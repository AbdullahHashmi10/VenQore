@echo off
REM ---------------------------------------------------------------------------
REM  INVENTORY / MANUFACTURING
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - INVENTORY / MANUFACTURING
call "%~dp0Scripts\run.bat" "INVENTORY / MANUFACTURING" "FinalTester/config/phpunit.categories.xml" "Inventory" ""
exit /b %ERRORLEVEL%
