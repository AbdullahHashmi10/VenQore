@echo off
REM ---------------------------------------------------------------------------
REM  POS TERMINAL
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - POS TERMINAL
call "%~dp0Scripts\run.bat" "POS TERMINAL" "FinalTester/config/phpunit.categories.xml" "POS" ""
exit /b %ERRORLEVEL%
