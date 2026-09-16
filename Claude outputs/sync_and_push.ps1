# sync_and_push.ps1
#
# Consolidated, fully self-contained deploy-prep script.
# Run from anywhere in PowerShell:
#   .\sync_and_push.ps1
#
# Workflow:
# 1. Verifies/auto-clones production-clean-repo if missing.
# 2. Ensures production mirror directory is ignored in root .gitignore.
# 3. Verifies frontend build assets (public/build) exist.
# 4. Mirrors app-code\main-app -> app-code\production (excluding dev tooling, scratch, vendor, storage, etc.).
# 5. Mirrors app-code\production -> app-code\production-clean-repo (excluding .git).
# 6. Ensures deploy_production.sh is present in production-clean-repo.
# 7. Shows git status, commits, and pushes to origin/production-clean.

param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

$repoRoot    = "E:\AMD POS\AMD POS"
$appCode     = Join-Path $repoRoot "app-code"
$mainApp     = Join-Path $appCode "main-app"
$prodMirror  = Join-Path $appCode "production"
$prodRepo    = Join-Path $appCode "production-clean-repo"
$gitignore   = Join-Path $repoRoot ".gitignore"
$remoteUrl   = "https://github.com/AbdullahHashmi10/VenQore.git"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  VenQore Production Sync & Push Pipeline" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Source (working app): $mainApp"
Write-Host "Clean mirror:         $prodMirror"
Write-Host "Clean Git Repo:       $prodRepo"
Write-Host ""

# ── 1. Ensure production\ is in root .gitignore ──────────────
if (Test-Path $gitignore) {
    $ignoreContent = Get-Content $gitignore -Raw
    if ($ignoreContent -notmatch [regex]::Escape("app-code/production/")) {
        Add-Content -Path $gitignore -Value "`n# Production mirror folder (auto-generated, never tracked in root repo)`napp-code/production/"
        Write-Host "[OK] Added app-code/production/ to root .gitignore." -ForegroundColor Green
    }
}

# ── 2. Ensure production-clean-repo exists (auto-clone if needed) ──
if (-not (Test-Path $prodRepo)) {
    Write-Host "[SETUP] $prodRepo does not exist yet. Cloning production-clean branch..." -ForegroundColor Yellow
    Push-Location $appCode
    try {
        git clone --branch production-clean --single-branch $remoteUrl production-clean-repo
        Write-Host "[OK] Successfully cloned production-clean branch into $prodRepo" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

# ── 3. Check that public/build exists in main-app ────────────
if (-not (Test-Path (Join-Path $mainApp "public\build\manifest.json"))) {
    Write-Host ""
    Write-Host "[WARNING] public\build\manifest.json was not found in main-app!" -ForegroundColor Red
    Write-Host "Make sure you run 'npm run build' inside $mainApp before pushing to production." -ForegroundColor Red
    $continue = Read-Host "Do you want to continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Aborted. Please run 'npm run build' and retry." -ForegroundColor Yellow
        exit 1
    }
}

# ── 4. Ensure mirror folder exists ───────────────────────────
if (-not (Test-Path $prodMirror)) {
    New-Item -ItemType Directory -Path $prodMirror | Out-Null
    Write-Host "[OK] Created $prodMirror folder." -ForegroundColor Green
}

# ── 5. Exclude lists for clean production mirror ────────────
$excludeDirs = @(
    "_to_delete", ".claude", ".gemini", ".obsidian", ".vqscope", ".vite",
    "temp_extract", "temp_xlsx_extract", "scratch", "Tester", "tools",
    "VenQore", "VenQore_Design_System", "verification", "system_brain",
    "VYB Restore", "docs", "new landing page", "node_modules", "vendor",
    "storage",   # storage is server-specific runtime data; keep production's own
    "production", "production-clean-repo"
)

$excludeExtensions = @(
    "*.log", "*.tgz", "*.bak", "*.bak.*"
)

$excludeFiles = @(
    "AMD_POS_Update_*.zip", "venqore-v6-pages.zip", "composer.phar",
    "bb6ad85.jsx", "ebay_logo.svg", "infection.json5",
    "venqore_financial_command_center.tsx", "VenQore_Mobile_Dashboard_Design.html",
    "Untitled.canvas", "restore.vyb", "test_multiturn.php",
    "after.json", "before.json", "route_list.json", "routes.json",
    "routes_utf8.json", "scratch_jsx_pages.json", "statstrips.json",
    "step4_after.txt", "step4_before.txt", "post-fix-run.txt",
    "plan_limits_before_step4.sql", "tests_hidden",
    "build_desktop.ps1", "build_release.ps1", "bundle_for_release.ps1",
    "bundle_for_update.ps1", "run_production_smoke_tests.ps1",
    "run_production_smoke_tests.bat", "run-routes-sweep.bat",
    "run-test-center.bat", "start_app.bat", "start_installer.bat",
    "start_station_dev.bat", "start-station.ps1", "transform_presale.ps1",
    "triple-run.bat", "LAUNCH_SYSTEM.bat", "create-resources.bat",
    "create_zip.cjs", "build_all_templates.py", "gen_article.py",
    "template_builder_base.py", "vqscope.mjs", "router.php",
    "DESIGN-RULES.v2.0.superseded.md", "V6_RESTORATION_PLAN.md",
    ".env", ".env.ci", ".env.example", ".env.production.example", ".env.testing",
    ".phpunit.result.cache",
    "build_clean_release.ps1", "sync_production.ps1", "setup_production_worktree.ps1",
    "setup_production_repo.ps1", "sync_and_push.ps1"
)

Write-Host ""
Write-Host "=== Step 1: Mirroring main-app -> production mirror ===" -ForegroundColor Yellow
robocopy $mainApp $prodMirror /MIR /XD $excludeDirs /XF $excludeExtensions /NFL /NDL /NJH /NJS /NP

# Strip loose files that robocopy filters might miss
foreach ($f in $excludeFiles) {
    if ($f.Contains("*")) {
        Get-ChildItem -Path $prodMirror -Filter $f -File -ErrorAction SilentlyContinue | Remove-Item -Force
    } else {
        $target = Join-Path $prodMirror $f
        if (Test-Path $target) {
            Remove-Item $target -Force
        }
    }
}

# Copy AMD_POS_VERSION.txt into mirror root if present at workspace root
$rootVersionFile = Join-Path $repoRoot "AMD_POS_VERSION.txt"
if (Test-Path $rootVersionFile) {
    Copy-Item -Path $rootVersionFile -Destination (Join-Path $prodMirror "AMD_POS_VERSION.txt") -Force
}

Write-Host "[OK] main-app mirrored to production\ successfully." -ForegroundColor Green

Write-Host ""
Write-Host "=== Step 2: Syncing production mirror -> production-clean-repo ===" -ForegroundColor Yellow
Write-Host "Excluding .git so repo history is preserved..." -ForegroundColor Gray
robocopy $prodMirror $prodRepo /MIR /XD ".git" /NFL /NDL /NJH /NJS /NP

# Ensure deploy_production.sh is present in production-clean-repo root
$currentDir = Split-Path -Parent $PSCommandPath
if ([string]::IsNullOrWhiteSpace($currentDir)) {
    $currentDir = Get-Location
}
$deployShSource = Join-Path $currentDir "deploy_production.sh"
if (-not (Test-Path $deployShSource)) {
    $deployShSource = "E:\AMD POS\AMD POS\Claude outputs\deploy_production.sh"
}
if (Test-Path $deployShSource) {
    Copy-Item -Path $deployShSource -Destination (Join-Path $prodRepo "deploy_production.sh") -Force
}

Write-Host "[OK] production-clean-repo is in sync with production mirror." -ForegroundColor Green

Write-Host ""
Write-Host "=== Step 3: Reviewing Git changes in production-clean-repo ===" -ForegroundColor Yellow
Push-Location $prodRepo
try {
    git status --short

    $changes = git status --porcelain
    if ([string]::IsNullOrWhiteSpace($changes)) {
        Write-Host ""
        Write-Host "[OK] No changes to commit. production-clean-repo already matches origin/production-clean." -ForegroundColor Green
        return
    }

    Write-Host ""
    if ([string]::IsNullOrWhiteSpace($Message)) {
        $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $Message = "Sync production release - $stamp"
    }

    Write-Host "=== Step 4: Committing changes ===" -ForegroundColor Yellow
    git add -A
    git commit -m $Message

    Write-Host ""
    Write-Host "=== Step 5: Pushing to origin/production-clean ===" -ForegroundColor Yellow
    git push origin production-clean

    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Green
    Write-Host "  SUCCESS: production-clean is up to date on GitHub!" -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Green
} finally {
    Pop-Location
}
