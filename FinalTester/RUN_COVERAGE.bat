@echo off
REM ---------------------------------------------------------------------------
REM  FULL RUN WITH CODE COVERAGE
REM ---------------------------------------------------------------------------
REM  Thin wrapper. All logic lives in Scripts\run.bat so there is exactly one
REM  execution path to maintain and audit.
REM ---------------------------------------------------------------------------
title VenQore - FULL RUN WITH CODE COVERAGE
call "%~dp0Scripts\run.bat" "FULL RUN WITH CODE COVERAGE" "FinalTester/phpunit.xml" "" "--coverage --coverage-html FinalTester/reports/coverage"
exit /b %ERRORLEVEL%
