@echo off
REM ---------------------------------------------------------------------------
REM  VENSYNQ / MARKETPLACE
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - VENSYNQ / MARKETPLACE
call "%~dp0Scripts\run.bat" "VENSYNQ / MARKETPLACE" "FinalTester/config/phpunit.categories.xml" "VenSynQ" ""
exit /b %ERRORLEVEL%
