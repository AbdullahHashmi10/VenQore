# setup_production_worktree.ps1
#
# ONE-TIME SETUP. Run this once from inside:
#   E:\AMD POS\AMD POS\app-code\main-app
#
# Creates E:\AMD POS\AMD POS\app-code\production\ as a git WORKTREE checked
# out to the production-clean branch. It shares main-app's .git history
# (no duplicate clone, no extra disk for a second .git folder) but has its
# own working files and its own current branch, so you can `cd` into it
# and `git add / commit / push` independently of whatever branch main-app
# itself is on.
#
# After this runs once, day-to-day workflow is just:
#   1. .\sync_production.ps1        (mirrors main-app -> production, applying excludes)
#   2. cd ..\production
#   3. git add -A
#   4. git commit -m "..."
#   5. git push origin production-clean
#
# Or just run sync_and_push.ps1 which does steps 1-5 for you.

$ErrorActionPreference = "Stop"

$mainApp = Get-Location
$appCode = Split-Path $mainApp -Parent
$prodDir = Join-Path $appCode "production"

Write-Host "main-app repo: $mainApp"
Write-Host "production worktree target: $prodDir"

if (Test-Path $prodDir) {
    Write-Host ""
    Write-Host "ERROR: $prodDir already exists." -ForegroundColor Red
    Write-Host "If it's a plain folder (not yet a worktree), rename or delete it first,"
    Write-Host "then re-run this script. If it's already a worktree, you don't need this script again."
    exit 1
}

Write-Host ""
Write-Host "Fetching latest refs from origin..."
git fetch origin

Write-Host ""
Write-Host "Creating worktree at $prodDir tracking origin/production-clean..."
git worktree add $prodDir production-clean

Write-Host ""
Write-Host "DONE. production\ is now a git worktree on branch production-clean."
Write-Host "Next: run sync_production.ps1 to populate it, then commit/push from inside it."
