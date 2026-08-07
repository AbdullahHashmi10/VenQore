@echo off
REM ---------------------------------------------------------------------------
REM  GUARDRAILS
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - GUARDRAILS
call "%~dp0Scripts\run.bat" "GUARDRAILS" "FinalTester/config/phpunit.categories.xml" "Guardrails" ""
exit /b %ERRORLEVEL%
