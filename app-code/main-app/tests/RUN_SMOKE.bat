@echo off
REM ---------------------------------------------------------------------------
REM  SMOKE
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - SMOKE
call "%~dp0Scripts\run.bat" "SMOKE" "FinalTester/config/phpunit.categories.xml" "Smoke" ""
exit /b %ERRORLEVEL%
