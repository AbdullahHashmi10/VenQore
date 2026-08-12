@echo off
REM Run the Reckoner test suite
REM Usage: RUN_RECKONER.bat
REM
REM Runs all tests in tests/tests/Unit/Reckoner/ using PHPUnit.
REM These are pure unit tests — no database required for most, only
REM ReckonerGateTest needs the Laravel container (no DB reads).

set PHP=E:\Software\Xampp\php\php.exe
set PHPUNIT=vendor\phpunit\phpunit\phpunit

echo Running Reckoner unit tests...
echo.

"%PHP%" %PHPUNIT% --testsuite Reckoner --configuration phpunit.xml.dist --colors=always 2>&1

echo.
echo Done. See above for results.
pause
