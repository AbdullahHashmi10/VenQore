@echo off
REM ---------------------------------------------------------------------------
REM  SECURITY
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - SECURITY
call "%~dp0Scripts\run.bat" "SECURITY" "FinalTester/config/phpunit.categories.xml" "Security" ""
exit /b %ERRORLEVEL%
