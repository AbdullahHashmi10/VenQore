# sync_and_push.ps1
#
# Everyday deploy-prep script. Run from inside: E:\AMD POS\AMD POS\app-code\main-app
#
# 1. Mirrors main-app -> production\ (via sync_production.ps1's logic)
# 2. Commits whatever changed in production\
# 3. Pushes production-clean to GitHub
#
# Requires setup_production_worktree.ps1 to have been run once already.

$ErrorActionPreference = "Stop"

$mainApp = Get-Location
$appCode = Split-Path $mainApp -Parent
$prodDir = Join-Path $appCode "production"

if (-not (Test-Path $prodDir)) {
    Write-Host "ERROR: $prodDir does not exist yet. Run setup_production_worktree.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "=== Step 1: Sync main-app to production ==="
& "$mainApp\sync_production.ps1"

Write-Host ""
Write-Host "=== Step 2: Review changes ==="
Set-Location $prodDir
git status --short

$changes = git status --porcelain
if ([string]::IsNullOrWhiteSpace($changes)) {
    Write-Host ""
    Write-Host "No changes to commit. production folder already matches the last push." -ForegroundColor Yellow
    Set-Location $mainApp
    exit 0
}

Write-Host ""
$msg = Read-Host "Commit message (or press Enter for a default timestamped message)"
if ([string]::IsNullOrWhiteSpace($msg)) {
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $msg = "Sync production release - $stamp"
}

Write-Host ""
Write-Host "=== Step 3: Commit ==="
git add -A
git commit -m $msg

Write-Host ""
Write-Host "=== Step 4: Push to origin/production-clean ==="
git push origin production-clean

Write-Host ""
Write-Host "DONE. production-clean is up to date on GitHub." -ForegroundColor Green

Set-Location $mainApp
