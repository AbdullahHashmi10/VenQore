@echo off
REM ---------------------------------------------------------------------------
REM  FULL RUN (alias of RUN_ALL_TESTS)
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - FULL RUN (alias of RUN_ALL_TESTS)
call "%~dp0Scripts\run.bat" "FULL RUN (alias of RUN_ALL_TESTS)" "FinalTester/phpunit.xml" "" ""
exit /b %ERRORLEVEL%
