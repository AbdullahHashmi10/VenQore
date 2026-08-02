@echo off
REM ---------------------------------------------------------------------------
REM  ACCOUNTING / LEDGER
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - ACCOUNTING / LEDGER
call "%~dp0Scripts\run.bat" "ACCOUNTING / LEDGER" "FinalTester/config/phpunit.categories.xml" "Ledger" ""
exit /b %ERRORLEVEL%
