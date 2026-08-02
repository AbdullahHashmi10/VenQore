@echo off
REM ---------------------------------------------------------------------------
REM  REPORTS
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - REPORTS
call "%~dp0Scripts\run.bat" "REPORTS" "FinalTester/config/phpunit.categories.xml" "Reports" ""
exit /b %ERRORLEVEL%
