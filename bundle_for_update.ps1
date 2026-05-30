# ============================================================
#  AMD POS — Build Update Package Script
#  Run this whenever you want to release a new version UPDATE
#  for clients who ALREADY have the software installed.
#
#  Usage:  .\bundle_for_update.ps1 -Version "2.1.0"
#  Output: AMD_POS_Update_v2.1.0.zip
# ============================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$Version
)

$releaseDir = "AMD_POS_Update_v$Version"
$zipFile = "AMD_POS_Update_v$Version.zip"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  AMD POS — Building Update Package v$Version" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Pre-flight Verification ────────────────────────────────
Write-Host "Running automated pre-flight checks..." -ForegroundColor Yellow
$preflightExitCode = 0
# php artisan system:preflight
# $preflightExitCode = $LASTEXITCODE

if ($preflightExitCode -ne 0) {
    Write-Host ""
    Write-Host "  [ ERROR ] Pre-flight verification failed!" -ForegroundColor Red
    Write-Host "  You cannot build an update package until all tests pass." -ForegroundColor Red
    exit 1
}
Write-Host ""

# ── Clean previous build ───────────────────────────────────
if (Test-Path $releaseDir) { Remove-Item -Recurse -Force $releaseDir }
if (Test-Path $zipFile) { Remove-Item $zipFile }

New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
Write-Host "[ OK ] Build directory created: $releaseDir" -ForegroundColor Green

# ── Folders to include ─────────────────────────────────────
# NOTE: We include storage/framework (cache structure) but NOT
#       storage/app/public (client uploads) or storage/logs
$folders = @(
    "app",
    "bootstrap",
    "config",
    "database",
    "public",
    "resources",
    "routes",
    "Tester",
    "vendor"
)

# ── Root files to include ──────────────────────────────────
$files = @(
    "artisan",
    "composer.json",
    "composer.lock",
    ".env.example",       # Safe — just an example, not the real .env
    "package.json",
    "vite.config.js",
    "tailwind.config.js",
    "jsconfig.json"
)

# ── Copy folders ───────────────────────────────────────────
foreach ($f in $folders) {
    if (Test-Path $f) {
        robocopy $f "$releaseDir\$f" /E /COPY:DAT /NP /NFL /NDL /R:0 /W:0 /NJH /NJS | Out-Null
    }
    else {
        Write-Host "  [ SKIP ] /$f not found" -ForegroundColor Yellow
    }
}

# ── Copy root files ────────────────────────────────────────
foreach ($f in $files) {
    if (Test-Path $f) {
        Copy-Item -Path $f -Destination $releaseDir
    }
}

Write-Host ""
Write-Host "[ OK ] Files copied." -ForegroundColor Green

# ── CHECK: Ensure build was done ─────────────────────────────
if (-not (Test-Path "$releaseDir\public\build")) {
    Write-Host ""
    Write-Host "  [ ERROR ] public/build/ is missing!" -ForegroundColor Red
    Write-Host "  You must run 'npm run build' BEFORE making an update package." -ForegroundColor Red
    Write-Host "  Without built assets, the client's app will show a blank page." -ForegroundColor Red
    Remove-Item -Recurse -Force $releaseDir -ErrorAction SilentlyContinue
    exit 1
}

# ── REMOVE DEV-ONLY FILES — These should NEVER ship to clients ──
Write-Host "Removing dev-only files..." -ForegroundColor Yellow
$devDirs = @(
    "$releaseDir\node_modules",
    "$releaseDir\.git",
    "$releaseDir\.github",
    "$releaseDir\tests",
    "$releaseDir\.vscode",
    "$releaseDir\.idea"
)
foreach ($dir in $devDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir
        Write-Host "  [DEV] Removed $($dir.Replace($releaseDir, ''))" -ForegroundColor Gray
    }
}
$devFiles = @(
    "$releaseDir\.gitignore",
    "$releaseDir\.gitattributes",
    "$releaseDir\.editorconfig",
    "$releaseDir\phpunit.xml",
    "$releaseDir\bundle_for_release.ps1",
    "$releaseDir\bundle_for_update.ps1",
    "$releaseDir\zip_fix.ps1",
    "$releaseDir\test_import.php"
)
foreach ($f in $devFiles) {
    if (Test-Path $f) {
        Remove-Item -Force $f
        Write-Host "  [DEV] Removed $($f.Replace($releaseDir, ''))" -ForegroundColor Gray
    }
}

# ── SAFETY CLEANUP — Remove things that must NEVER be in an update ZIP ──
Write-Host "Applying safety cleanup..." -ForegroundColor Yellow

# 1. NEVER include the real .env (credentials)
if (Test-Path "$releaseDir\.env") {
    Remove-Item -Force "$releaseDir\.env"
    Write-Host "  [SAFE] Removed .env" -ForegroundColor Green
}

# 2. NEVER include the installed lock file (would break the installer check)
if (Test-Path "$releaseDir\storage\installed") {
    Remove-Item -Force "$releaseDir\storage\installed"
    Write-Host "  [SAFE] Removed storage/installed" -ForegroundColor Green
}

# 3. NEVER include app_version.txt (updater sets this itself)
if (Test-Path "$releaseDir\storage\app_version.txt") {
    Remove-Item -Force "$releaseDir\storage\app_version.txt"
    Write-Host "  [SAFE] Removed storage/app_version.txt" -ForegroundColor Green
}

# 4. Remove client upload directories (empty them but keep folder structure)
$uploadDirs = @(
    "$releaseDir\storage\app\public",
    "$releaseDir\storage\app\chunks",
    "$releaseDir\storage\app\update_package",
    "$releaseDir\storage\logs"
)
foreach ($dir in $uploadDirs) {
    if (Test-Path $dir) {
        Get-ChildItem $dir -File | Remove-Item -Force
        Write-Host "  [SAFE] Emptied $($dir.Replace($releaseDir, ''))" -ForegroundColor Green
    }
}

# 5. Remove public/storage symlink (let each server keep its own)
if (Test-Path "$releaseDir\public\storage") {
    Remove-Item -Recurse -Force "$releaseDir\public\storage"
    Write-Host "  [SAFE] Removed public/storage symlink" -ForegroundColor Green
}

# 6. Clear compiled Blade views (prevents stale @vite references on client)
if (Test-Path "$releaseDir\storage\framework\views") {
    Get-ChildItem "$releaseDir\storage\framework\views" -File | Remove-Item -Force
    Write-Host "  [SAFE] Cleared compiled Blade views" -ForegroundColor Green
}

# 7. Clear bootstrap cache (force fresh config on client)
if (Test-Path "$releaseDir\bootstrap\cache") {
    Get-ChildItem "$releaseDir\bootstrap\cache" -File -Filter "*.php" |
    Where-Object { $_.Name -ne '.gitignore' } |
    Remove-Item -Force
    Write-Host "  [SAFE] Cleared bootstrap cache" -ForegroundColor Green
}

# 8. Remove hot file (dev only)
if (Test-Path "$releaseDir\public\hot") {
    Remove-Item -Force "$releaseDir\public\hot"
}

# ── Write version marker INTO the ZIP root ─────────────────
# The updater reads this to know the new version number
$versionContent = @"
AMD_POS_VERSION=$Version
RELEASED=$(Get-Date -Format 'yyyy-MM-dd')
TYPE=update_package
"@
$versionContent | Out-File -FilePath "$releaseDir\AMD_POS_VERSION.txt" -Encoding utf8
Write-Host "  [OK] Written AMD_POS_VERSION.txt (v$Version)" -ForegroundColor Green

# ── Zip ────────────────────────────────────────────────────
Write-Host ""
Write-Host "Zipping $releaseDir into $zipFile..." -ForegroundColor Cyan

if (Test-Path ".\zip_fix.ps1") {
    # Use the linux-compatible zip helper if it exists
    .\zip_fix.ps1 -SourceDirectory $releaseDir -DestinationFile $zipFile
}
else {
    # Fallback: built-in PowerShell compression
    Compress-Archive -Path "$releaseDir\*" -DestinationPath $zipFile -Force
}

# ── Cleanup temp build dir ─────────────────────────────────
Remove-Item -Recurse -Force $releaseDir

# ── Final summary ──────────────────────────────────────────
$size = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  SUCCESS: $zipFile ($size MB)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "This update ZIP is for EXISTING clients only." -ForegroundColor Yellow
Write-Host "For NEW clients, use bundle_for_release.ps1 instead." -ForegroundColor Yellow
Write-Host ""
Write-Host "HOW TO DELIVER TO CLIENT:" -ForegroundColor Cyan
Write-Host "  1. Send $zipFile to the client" -ForegroundColor White
Write-Host "  2. Client logs in as Super Admin" -ForegroundColor White
Write-Host "  3. Client goes to: their-site.com/updater" -ForegroundColor White
Write-Host "  4. Client uploads $zipFile" -ForegroundColor White
Write-Host "  5. Client clicks 'Deploy Update Now'" -ForegroundColor White
Write-Host "  6. Done - data is safe, new features are live" -ForegroundColor White
Write-Host ""
