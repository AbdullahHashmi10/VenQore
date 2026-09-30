@echo off
setlocal
set PHP=E:\Software\Xampp\php\php.exe
cd /d "E:\AMD POS\AMD POS\app-code\main-app"

echo ============================================================
echo  VenQore Phase 1 approval workflow - test run
echo  This uses the isolated test database from phpunit.xml /
echo  .env.testing (amd_pos_test_current_0d33d5b0), never
echo  venqore_pos. Output is saved to phase1_test_output.txt.
echo ============================================================
echo.

echo [1/3] Migrating the ISOLATED TEST database (--env=testing)...
"%PHP%" artisan migrate:fresh --env=testing --force > phase1_test_output.txt 2>&1
if errorlevel 1 (
    echo Migration failed - see phase1_test_output.txt
    type phase1_test_output.txt
    goto :end
)

echo [2/3] Running Phase1ScenariosTest.php...
echo. >> phase1_test_output.txt
echo ===== Phase1ScenariosTest.php ===== >> phase1_test_output.txt
"%PHP%" artisan test tests/tests/Feature/V3/Scenarios/Phase1ScenariosTest.php >> phase1_test_output.txt 2>&1

echo [3/3] Running the security/hardening regression set...
echo. >> phase1_test_output.txt
echo ===== Security + Guardrails + Hardening ===== >> phase1_test_output.txt
"%PHP%" artisan test tests/tests/Feature/Security/PreLaunchSecurityTest.php tests/tests/Feature/Guardrails/PermissionBypassGuardTest.php >> phase1_test_output.txt 2>&1

echo.
echo Done. Full output is in:
echo   E:\AMD POS\AMD POS\app-code\main-app\phase1_test_output.txt
echo.
type phase1_test_output.txt

:end
endlocal
pause
