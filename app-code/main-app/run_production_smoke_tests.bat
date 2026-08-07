@echo off
title VenQore Production Smoke Test Runner
color 0B

echo ========================================================
echo   VenQore POS — Production Smoke Test Runner
echo ========================================================
echo.
echo Server:  147.93.82.42
echo Port:    65002
echo User:    u186374501
echo Path:    ~/domains/venqore.com/public_html
echo.
echo Establishing SSH connection...
echo Note: You will be prompted to enter your production SSH password.
echo.

ssh -p 65002 u186374501@147.93.82.42 "cd domains/venqore.com/public_html && php vendor/bin/pest --configuration=Tester/phpunit.xml --testsuite=Smoke --colors=never"

echo.
echo ========================================================
echo   Execution Complete.
echo ========================================================
echo.
pause
