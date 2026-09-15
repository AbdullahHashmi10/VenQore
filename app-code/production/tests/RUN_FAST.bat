@echo off
REM ---------------------------------------------------------------------------
REM  FAST LANE (unit + tools, no DB)
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - FAST LANE (unit + tools, no DB)
call "%~dp0Scripts\run.bat" "FAST LANE (unit + tools, no DB)" "FinalTester/config/phpunit.categories.xml" "Fast" ""
exit /b %ERRORLEVEL%
