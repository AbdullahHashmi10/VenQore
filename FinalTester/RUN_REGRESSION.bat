@echo off
REM ---------------------------------------------------------------------------
REM  REGRESSION
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - REGRESSION
call "%~dp0Scripts\run.bat" "REGRESSION" "FinalTester/config/phpunit.categories.xml" "Regression" ""
exit /b %ERRORLEVEL%
