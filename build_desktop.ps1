# ============================================================
#  VenQore Station - Windows Desktop Build Script (v2.0)
#  SaaS Cloud Edition - Hardware Bridge Only
#
#  No Laravel, No PHP, No MySQL.
#  Builds the pure Electron hardware bridge.
#
#  Usage: .\build_desktop.ps1
#  Output: amd-station\dist\VenQore Station Setup x.x.x.exe
#          amd-station\dist\VenQore Station x.x.x.exe  (portable)
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   VenQore Station - Cloud Edition Builder" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# --- Step 0: Pre-flight ------------------------------------
Write-Host "[0/4] Pre-flight checks..." -ForegroundColor Yellow

if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "  [ERROR] Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".\amd-station\main.js")) {
    Write-Host "  [ERROR] Run this script from the project root directory." -ForegroundColor Red
    exit 1
}

Write-Host "  [OK] Node.js: $(node --version)" -ForegroundColor Green
Write-Host "  [OK] amd-station directory found" -ForegroundColor Green

# --- Step 1: Install dependencies --------------------------
Write-Host ""
Write-Host "[1/4] Installing Electron dependencies..." -ForegroundColor Yellow

Push-Location ".\amd-station"

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] npm install failed." -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "  [OK] Dependencies installed." -ForegroundColor Green
Pop-Location

# --- Step 2: Convert icon -----------------------------------
Write-Host ""
Write-Host "[2/4] Converting icon..." -ForegroundColor Yellow

Push-Location ".\amd-station"

if (Test-Path "assets\icon.png") {
    node convert-icon.js 2>$null
    if (Test-Path "assets\icon.ico") {
        Write-Host "  [OK] Icon converted." -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Icon conversion may have failed. Continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [SKIP] No icon.png found. Using existing ICO if available." -ForegroundColor Yellow
}

Pop-Location

# --- Step 3: Verify required files -------------------------
Write-Host ""
Write-Host "[3/4] Verifying build files..." -ForegroundColor Yellow

$required = @(
    "amd-station\main.js",
    "amd-station\preload.js",
    "amd-station\shell.html",
    "amd-station\shell.css",
    "amd-station\shell-renderer.js",
    "amd-station\assets\icon.ico"
)

$allOK = $true
foreach ($f in $required) {
    if (Test-Path $f) {
        Write-Host "  [OK] $f" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $f" -ForegroundColor Red
        $allOK = $false
    }
}

if (-not $allOK) {
    Write-Host ""
    Write-Host "  [ERROR] Missing files. Cannot build." -ForegroundColor Red
    exit 1
}

# --- Step 4: Build installer --------------------------------
Write-Host ""
Write-Host "[4/4] Building Windows Installer (NSIS + Portable)..." -ForegroundColor Yellow
Write-Host "  This may take 3-5 minutes..." -ForegroundColor Gray

Push-Location ".\amd-station"
npm run build:win
$result = $LASTEXITCODE
Pop-Location

# --- Report -------------------------------------------------
Write-Host ""

if ($result -eq 0) {
    $distDir = ".\amd-station\dist"
    $files   = Get-ChildItem $distDir -Filter "*.exe" | Sort-Object LastWriteTime -Descending

    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "   SUCCESS! Installers Created:" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""

    foreach ($f in $files) {
        $mb = [math]::Round($f.Length / 1MB, 1)
        Write-Host "  $($f.Name)  ($mb MB)" -ForegroundColor White
        Write-Host "  → $($f.FullName)" -ForegroundColor Gray
        Write-Host ""
    }

    Write-Host "  DEPLOYMENT NOTES:" -ForegroundColor Cyan
    Write-Host "    - Upload the Setup .exe to your website download page" -ForegroundColor White
    Write-Host "    - The Portable .exe can be run without installation" -ForegroundColor White
    Write-Host "    - The app auto-updates via https://updates.venqore.com" -ForegroundColor White
    Write-Host "    - Users can work offline; transactions will auto-sync when connected" -ForegroundColor White
    Write-Host ""
    Write-Host "  WHAT'S NOT IN THE INSTALLER:" -ForegroundColor Cyan
    Write-Host "    [OK] No Laravel source code" -ForegroundColor Green
    Write-Host "    [OK] No PHP / MySQL" -ForegroundColor Green
    Write-Host "    [OK] No database files" -ForegroundColor Green
    Write-Host "    [OK] No API keys or secrets" -ForegroundColor Green
    Write-Host "    [OK] Cloud URL is compiled into binary (ASAR protected)" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "   BUILD FAILED. Check errors above." -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Common fixes:" -ForegroundColor Yellow
    Write-Host "    - Delete node_modules and retry: cd amd-station; rm -rf node_modules; npm install" -ForegroundColor White
    Write-Host "    - Make sure icon.ico exists in amd-station/assets/" -ForegroundColor White
    exit 1
}
