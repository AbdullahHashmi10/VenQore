# sync_and_push.ps1
#
# Everyday deploy-prep script. Run from anywhere (uses absolute paths).
#
# 1. Mirrors main-app -> app-code\production (via sync_production.ps1's logic)
# 2. Mirrors app-code\production -> app-code\production-clean-repo (EXCLUDING .git,
#    so the repo folder's own .git is always safe from robocopy /MIR)
# 3. Commits whatever changed inside production-clean-repo
# 4. Pushes production-clean to GitHub
#
# Requires setup_production_worktree.ps1 to have been run once already.

$ErrorActionPreference = "Stop"

$repoRoot = "E:\AMD POS\AMD POS"
$appCode = Join-Path $repoRoot "app-code"
$mainApp = Join-Path $appCode "main-app"
$prodMirror = Join-Path $appCode "production"
$prodRepo = Join-Path $appCode "production-clean-repo"

if (-not (Test-Path $prodRepo)) {
    Write-Host "ERROR: $prodRepo does not exist yet. Run setup_production_worktree.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "=== Step 1: Sync main-app to production (mirror folder) ==="
& "$mainApp\sync_production.ps1"

Write-Host ""
Write-Host "=== Step 2: Sync production (mirror) to production-clean-repo (git repo) ==="
Write-Host "Excluding .git so the repo's own history is never touched by the mirror..."
robocopy $prodMirror $prodRepo /MIR /XD ".git" /NFL /NDL /NJH /NJS /NP

Write-Host ""
Write-Host "=== Step 3: Review changes ==="
Set-Location $prodRepo
git status --short

$changes = git status --porcelain
if ([string]::IsNullOrWhiteSpace($changes)) {
    Write-Host ""
    Write-Host "No changes to commit. production-clean-repo already matches the last push." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
$msg = Read-Host "Commit message (or press Enter for a default timestamped message)"
if ([string]::IsNullOrWhiteSpace($msg)) {
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $msg = "Sync production release - $stamp"
}

Write-Host ""
Write-Host "=== Step 4: Commit ==="
git add -A
git commit -m $msg

Write-Host ""
Write-Host "=== Step 5: Push to origin/production-clean ==="
git push origin production-clean

Write-Host ""
Write-Host "DONE. production-clean is up to date on GitHub." -ForegroundColor Green
