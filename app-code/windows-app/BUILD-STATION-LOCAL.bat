@echo off
cd /d "%~dp0"
echo Building VenQore Station Local 4.0.1 ... > build-local-4.0.1.log
call npm test >> build-local-4.0.1.log 2>&1
echo {"isLocalBuild":true,"defaultLocalUrl":"http://127.0.0.1:8000","disallowPublicOrigins":true,"edition":"local-testing"} > local-build.json
call npx electron-builder --config electron-builder-local.json >> build-local-4.0.1.log 2>&1
set BUILD_ERR=%ERRORLEVEL%
if exist local-build.json del local-build.json
call node tools\stage-local-release.cjs >> build-local-4.0.1.log 2>&1
echo BUILD_EXIT=%BUILD_ERR% >> build-local-4.0.1.log
echo FINISHED >> build-local-4.0.1.log
