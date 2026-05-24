# AMD POS Release Builder
# ========================

$zipName = "release_hosting_v1.1.2.zip"

Write-Host "Starting Release Build Process..." -ForegroundColor Cyan

# 1. Pre-Flight Checks
Write-Host "Running automated pre-flight checks..." -ForegroundColor Yellow
$preflightExitCode = 0
php artisan system:preflight
$preflightExitCode = $LASTEXITCODE

if ($preflightExitCode -ne 0) {
    Write-Host ""
    Write-Host "  [ ERROR ] Pre-flight verification failed!" -ForegroundColor Red
    Write-Host "  You cannot build a release package until all tests pass." -ForegroundColor Red
    exit 1
}
Write-Host ""

if (-not (Test-Path "vendor")) {
    Write-Host "Error: 'vendor' folder is missing! Run 'composer install --no-dev' first." -ForegroundColor Red
    exit
}

if (-not (Test-Path "public/build")) {
    Write-Host "Error: 'public/build' is missing! Run 'npm run build' first." -ForegroundColor Red
    exit
}

# 2. Clean Old Release
if (Test-Path $zipName) {
    Write-Host "Removing old $zipName..." -ForegroundColor Yellow
    Remove-Item $zipName -Force
}

# 3. Define Includes (The Golden List)
$includes = @(
    "app",
    "bootstrap",
    "config",
    "database",
    "public",
    "resources",
    "routes",
    "storage",
    "vendor",
    ".env",
    ".env.example",
    "artisan",
    "composer.json",
    "composer.lock",
    "package.json",
    "vite.config.js",
    "index.php"
)

# Only include files/folders that actually exist
$existingIncludes = $includes | Where-Object { Test-Path $_ }

# 4. Swap ENV to safe mode for release
Write-Host "Preparing Safe Mode .env..." -ForegroundColor Blue
$envSwapped = $false
if (Test-Path ".env") {
    Rename-Item -Path ".env" -NewName ".env.bak" -Force
    $envSwapped = $true
}
if (Test-Path "safe.env") {
    Copy-Item -Path "safe.env" -Destination ".env"
}

Write-Host "Compressing files... This may take a minute..." -ForegroundColor Magenta
try {
    Compress-Archive -Path $existingIncludes -DestinationPath $zipName -CompressionLevel Optimal -Force
    Write-Host ""
    Write-Host "SUCCESS! Release build complete." -ForegroundColor Green
}
catch {
    Write-Host "ERROR during compression: $_" -ForegroundColor Red
}
finally {
    # Always restore the real .env
    if (Test-Path ".env") {
        Remove-Item -Path ".env" -Force
    }
    if ($envSwapped -and (Test-Path ".env.bak")) {
        Rename-Item -Path ".env.bak" -NewName ".env" -Force
        Write-Host "Restored development .env" -ForegroundColor Blue
    }
}

# 5. Report result
if (Test-Path $zipName) {
    $size = (Get-Item $zipName).Length / 1MB
    $sizeFormatted = "{0:N2} MB" -f $size
    Write-Host "Created: $zipName ($sizeFormatted)" -ForegroundColor Green
    Write-Host "Location: $(Get-Location)\$zipName" -ForegroundColor Gray
}
else {
    Write-Host "ERROR: Zip file was not created. Check errors above." -ForegroundColor Red
}
