@echo off
REM ---------------------------------------------------------------------------
REM  FINANCIAL ENGINE
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - FINANCIAL ENGINE
call "%~dp0Scripts\run.bat" "FINANCIAL ENGINE" "FinalTester/config/phpunit.categories.xml" "Financial" ""
exit /b %ERRORLEVEL%
