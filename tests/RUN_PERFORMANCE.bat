@echo off
REM ---------------------------------------------------------------------------
REM  PERFORMANCE
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - PERFORMANCE
call "%~dp0Scripts\run.bat" "PERFORMANCE" "FinalTester/config/phpunit.categories.xml" "Performance" ""
exit /b %ERRORLEVEL%
