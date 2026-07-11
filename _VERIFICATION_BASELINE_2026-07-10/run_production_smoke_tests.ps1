# ============================================================
#  VenQore POS — Production Smoke Test Runner
#  Run this script locally to connect to your live production
#  server and execute the smoke test suite.
# ============================================================

$Host.UI.RawUI.WindowTitle = "VenQore Production Smoke Test Runner"
Clear-Host

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  VenQore POS — Production Smoke Test Runner" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server:  147.93.82.42" -ForegroundColor Gray
Write-Host "Port:    65002" -ForegroundColor Gray
Write-Host "User:    u186374501" -ForegroundColor Gray
Write-Host "Path:    ~/domains/venqore.com/public_html" -ForegroundColor Gray
Write-Host ""
Write-Host "Establishing SSH connection..." -ForegroundColor Yellow
Write-Host "Note: You will be prompted to enter your production SSH password." -ForegroundColor Yellow
Write-Host ""

# Run the SSH command interactively so the user can enter their password safely
ssh -p 65002 u186374501@147.93.82.42 "cd domains/venqore.com/public_html && php vendor/bin/pest --configuration=Tester/phpunit.xml --testsuite=Smoke --colors=never"

$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "  Execution Complete: Smoke tests ran successfully." -ForegroundColor Green
} else {
    Write-Host "  Execution Complete: Connection failed or tests failed." -ForegroundColor Red
}
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
