@echo off
REM ---------------------------------------------------------------------------
REM  ALL TESTS (complete estate)
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - ALL TESTS (complete estate)
call "%~dp0Scripts\run.bat" "ALL TESTS (complete estate)" "FinalTester/phpunit.xml" "" ""
exit /b %ERRORLEVEL%
