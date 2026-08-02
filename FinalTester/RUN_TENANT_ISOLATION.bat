@echo off
REM ---------------------------------------------------------------------------
REM  TENANT ISOLATION
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - TENANT ISOLATION
call "%~dp0Scripts\run.bat" "TENANT ISOLATION" "FinalTester/config/phpunit.categories.xml" "TenantIsolation" ""
exit /b %ERRORLEVEL%
