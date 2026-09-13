# ==============================================================================
# VenQore Production & Staging Release Publisher
#
# This script:
# 1. Compiles frontend assets (npm run build + ziggy:generate)
# 2. Extracts ONLY production runtime files (no docs, tests, markdown, or extra apps)
# 3. Places the Laravel app directly at the root of the branch
# 4. Pushes cleanly to the 'release' branch on GitHub
# ==============================================================================

param(
    [string]$Branch = "release",
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot
$appDir = Join-Path $repoRoot "app-code\main-app"
$distDir = Join-Path $repoRoot "_release_dist"

Write-Host "`n=== VenQore Release Builder ===" -ForegroundColor Cyan
Write-Host "Target Branch: $Branch" -ForegroundColor Yellow

# 1. Compile Frontend Assets (Vite)
if (-not $SkipBuild) {
    Write-Host "`n[1/4] Building Vite frontend assets..." -ForegroundColor Cyan
    Push-Location $appDir
    try {
        if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
            Write-Host "Error: 'npm' command not found in PATH." -ForegroundColor Red
            Pop-Location
            exit 1
        }
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Vite build failed with exit code $LASTEXITCODE"
        }
        php artisan ziggy:generate
    }
    finally {
        Pop-Location
    }
} else {
    Write-Host "`n[1/4] Skipping build as requested..." -ForegroundColor Yellow
}

# Verify public/build exists
$buildDir = Join-Path $appDir "public\build"
if (-not (Test-Path $buildDir)) {
    Write-Host "Error: '$buildDir' does not exist! Cannot release without compiled assets." -ForegroundColor Red
    exit 1
}

# 2. Prepare Clean Release Distribution
Write-Host "`n[2/4] Assembling clean runtime files (stripping all docs, tests, zips)..." -ForegroundColor Cyan

if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
}
New-Item -ItemType Directory -Path $distDir -Force | Out-Null

# List of runtime folders from app-code/main-app to copy
$foldersToCopy = @(
    "app",
    "bootstrap",
    "config",
    "database",
    "public",
    "resources",
    "routes"
)

foreach ($folder in $foldersToCopy) {
    $src = Join-Path $appDir $folder
    $dst = Join-Path $distDir $folder
    if (Test-Path $src) {
        Copy-Item -Recurse -Path $src -Destination $dst -Force
    }
}

# Copy specific root files
$filesToCopy = @(
    "artisan",
    "composer.json",
    "composer.lock",
    ".env.example",
    "index.php",
    ".htaccess"
)

foreach ($file in $filesToCopy) {
    $src = Join-Path $appDir $file
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $distDir -Force
    }
}

# Setup clean storage folders
$storageDirs = @(
    "storage\app\public",
    "storage\framework\cache\data",
    "storage\framework\sessions",
    "storage\framework\views",
    "storage\logs"
)

foreach ($sDir in $storageDirs) {
    $targetPath = Join-Path $distDir $sDir
    New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
    Set-Content -Path (Join-Path $targetPath ".gitignore") -Value "*`n!.gitignore"
}

# Create a clean .gitignore for the release branch (includes public/build!)
$releaseGitIgnore = @"
/vendor
/.env
.env.backup
.phpunit.result.cache
/public/storage
/public/hot
/storage/*.key
.idea
.vscode
*.log
"@
Set-Content -Path (Join-Path $distDir ".gitignore") -Value $releaseGitIgnore

# Cleanup unwanted files from release
$unwantedPatterns = @(
    "*.zip",
    "*.tgz",
    "*.sqlite*",
    "*.log",
    "*.err",
    "*.canvas",
    "Tester",
    "system_brain",
    "_to_delete*",
    "new landing page",
    "VYB Restore",
    "node_modules",
    "tests",
    ".gemini",
    ".claude",
    ".obsidian"
)

foreach ($pattern in $unwantedPatterns) {
    Get-ChildItem -Path $distDir -Filter $pattern -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue
    }
}

# 3. Create Clean Git Commit
Write-Host "`n[3/4] Creating standalone release commit for branch '$Branch'..." -ForegroundColor Cyan

$remoteUrl = (git config --get remote.origin.url)
if (-not $remoteUrl) {
    Write-Host "Error: Could not determine origin git remote URL." -ForegroundColor Red
    exit 1
}

Push-Location $distDir
try {
    git init -b $Branch
    git config user.name "VenQore Release Builder"
    git config user.email "deploy@venqore.com"
    git add -A
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    git commit -m "release: clean production build $timestamp"
    git remote add origin $remoteUrl

    # 4. Push to remote
    Write-Host "`n[4/4] Pushing clean build to GitHub origin/$Branch..." -ForegroundColor Cyan
    git push -f origin $Branch
}
finally {
    Pop-Location
    Remove-Item -Recurse -Force $distDir -ErrorAction SilentlyContinue
}

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "Release successfully published to branch: '$Branch'" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "`nOn your Hostinger server, you can now simply run:"
Write-Host "  git fetch origin $Branch" -ForegroundColor Yellow
Write-Host "  git reset --hard origin/$Branch" -ForegroundColor Yellow
Write-Host "  composer install --no-dev --optimize-autoloader" -ForegroundColor Yellow
Write-Host "  php artisan migrate --force" -ForegroundColor Yellow
Write-Host "  php artisan config:cache && php artisan view:cache" -ForegroundColor Yellow
Write-Host ""
