@echo off
cd /d "%~dp0"
echo Building VenQore Station 4.0.2 ... > build-4.0.2.log
call npm test >> build-4.0.2.log 2>&1
call npm run build:win >> build-4.0.2.log 2>&1
call node tools\stage-release-unsigned.cjs >> build-4.0.2.log 2>&1
echo BUILD_EXIT=%ERRORLEVEL% >> build-4.0.2.log
echo FINISHED >> build-4.0.2.log
