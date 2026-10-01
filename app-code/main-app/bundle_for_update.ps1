# ============================================================
#  AMD POS / VenQore — Clean Production Update Package Builder
#  Produces a staged, verified update ZIP with clean production
#  dependencies and fresh frontend asset compilation.
#
#  Usage:  .\bundle_for_update.ps1 -Version "6.0.7" [-AllowDirty] [-Force]
#  Output: AMD_POS_Update_v6.0.7.zip
# ============================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$Version,
    [switch]$Force,
    [switch]$AllowDirty
)

$ErrorActionPreference = "Stop"

# ── Validate Semantic Version ──────────────────────────────
if ($Version -notmatch '^\d+\.\d+\.\d+(-[\w.]+)?$') {
    Write-Error "Invalid semantic version: '$Version'. Must match X.Y.Z or X.Y.Z-prerelease."
    exit 1
}

$appDir = $PSScriptRoot
. (Join-Path $appDir 'release-package-boundary.ps1')
$releaseBase = "AMD_POS_Update_v$Version"
$finalZip = Join-Path $appDir "$releaseBase.zip"
$tempZip  = Join-Path $appDir "$releaseBase.zip.tmp"

# ── Pre-flight: Check Existing Artifact & Release Policy ───
if ((Test-Path $finalZip) -and !$Force) {
    throw "Release package '$finalZip' already exists! Per RELEASE_AND_DEPLOYMENT_POLICY.md, prior packages must not be silently overwritten. Choose a new version (e.g. 6.0.7) or specify -Force."
}

# ── Pre-flight: Inspect Git Working Tree ───────────────────
$gitStatus = @()
$headCommit = "unknown"
try {
    $gitStatus = @(& git status --porcelain 2>$null)
    $headCommit = (& git rev-parse HEAD 2>$null).Trim()
} catch {}

$isDirty = ($gitStatus.Count -gt 0)
if ($isDirty -and !$AllowDirty) {
    throw "Working tree has $($gitStatus.Count) uncommitted change(s). Release policy requires a clean commit or explicit -AllowDirty flag. Uncommitted files:`n$($gitStatus -join "`n")"
}

# Ensure PHP and Composer are in PATH
if (!(Get-Command php -ErrorAction SilentlyContinue)) {
    if (Test-Path "E:\Software\Xampp\php\php.exe") {
        $env:PATH = "E:\Software\Xampp\php;" + $env:PATH
        Write-Host "[INIT] Added E:\Software\Xampp\php to PATH." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AMD POS / VenQore — Building Update Package v$Version" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Source directory: $appDir" -ForegroundColor Gray
Write-Host "Source commit:    $headCommit" -ForegroundColor Gray
Write-Host "Working tree:     $(if ($isDirty) { 'DIRTY (' + $gitStatus.Count + ' modified)' } else { 'CLEAN' })" -ForegroundColor Gray

# ── 1. Create Isolated Staging Directory ───────────────────
$buildGuid = [guid]::NewGuid().ToString("N").Substring(0, 8)
$stageDir = Join-Path $env:TEMP "venqore_build_${Version}_${buildGuid}"

if (Test-Path $stageDir) { Remove-Item -Recurse -Force $stageDir }
if (Test-Path $tempZip) { Remove-Item -Force $tempZip }

New-Item -ItemType Directory -Force -Path $stageDir | Out-Null
Write-Host "[ OK ] Isolated staging directory: $stageDir" -ForegroundColor Green

try {
    # ── 2. Copy Source Folders (EXCLUDING vendor and public/build) ─────
    $folders = @(
        "app",
        "bootstrap",
        "config",
        "database",
        "public",
        "resources",
        "routes"
    )

    foreach ($f in $folders) {
        $srcPath = Join-Path $appDir $f
        $dstPath = Join-Path $stageDir $f
        if (Test-Path $srcPath) {
            # Robocopy: exclude vendor, cache, node_modules; exclude public/build specifically
            $excludeDirs = @("cache", "node_modules")
            if ($f -eq "public") {
                $excludeDirs += (Join-Path $srcPath "build")
            }
            robocopy $srcPath $dstPath /E /COPY:DAT /NP /NFL /NDL /R:0 /W:0 /NJH /NJS /XD $excludeDirs | Out-Null
            if ($LASTEXITCODE -ge 8) {
                throw "Robocopy failed copying directory '$f' with exit code $LASTEXITCODE."
            }
        } else {
            Write-Host "  [ SKIP ] Source folder not found: $f" -ForegroundColor Yellow
        }
    }

    # ── 3. Copy Whitelisted Root Files ─────────────────────────
    $rootFiles = @(
        "artisan",
        "composer.json",
        "composer.lock",
        ".env.example",
        "package.json",
        "package-lock.json",
        "vite.config.js",
        # Vite can emit CSS while silently leaving @tailwind directives intact
        # if this PostCSS config is absent from the isolated staging root.
        # Copy it for the build; release-package-boundary.ps1 excludes it from
        # the final runtime package.
        "postcss.config.cjs",
        "tailwind.config.js",
        "jsconfig.json"
    )

    foreach ($rf in $rootFiles) {
        $rfPath = Join-Path $appDir $rf
        if (Test-Path $rfPath) {
            Copy-Item -Path $rfPath -Destination (Join-Path $stageDir $rf) -Force
        } else {
            if ($rf -eq "composer.json" -or $rf -eq "composer.lock" -or $rf -eq "artisan" -or $rf -eq "package.json" -or $rf -eq "postcss.config.cjs") {
                throw "Required root file '$rf' is missing!"
            }
        }
    }

    # Copy scripts directory needed for frontend build checks
    $scriptsDir = Join-Path $appDir "scripts"
    if (Test-Path $scriptsDir) {
        robocopy $scriptsDir (Join-Path $stageDir "scripts") /E /COPY:DAT /NP /NFL /NDL /R:0 /W:0 /NJH /NJS | Out-Null
    }

    # Ensure bootstrap/cache exists and is writable
    New-Item -ItemType Directory -Force -Path (Join-Path $stageDir "bootstrap\cache") | Out-Null
    Set-Content -Path (Join-Path $stageDir "bootstrap\cache\.gitignore") -Value "*`n!.gitignore`n" -Encoding utf8

    Write-Host "[ OK ] Source files staged into isolated build workspace." -ForegroundColor Green

    # ── 4. Install Clean Production Composer Dependencies ──────
    Write-Host "[BUILD] Installing production Composer dependencies in staging..." -ForegroundColor Yellow
    Push-Location $stageDir
    try {
        composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader --no-scripts --ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix
        if ($LASTEXITCODE -ne 0) {
            throw "composer install --no-dev failed with exit code $LASTEXITCODE."
        }

        # Run package discovery inside staging — FATAL on failure
        Write-Host "[BUILD] Running artisan package:discover in staging..." -ForegroundColor Gray
        php artisan package:discover --ansi
        if ($LASTEXITCODE -ne 0) {
            throw "php artisan package:discover failed with exit code $LASTEXITCODE in staging."
        }

        # Generate Ziggy route manifest BEFORE frontend compilation — FATAL on failure
        Write-Host "[BUILD] Generating Ziggy routes for frontend compilation..." -ForegroundColor Gray
        php artisan ziggy:generate
        if ($LASTEXITCODE -ne 0) {
            throw "php artisan ziggy:generate failed with exit code $LASTEXITCODE in staging."
        }
    }
    finally {
        Pop-Location
    }
    Write-Host "[ OK ] Production Composer dependencies and route manifests generated." -ForegroundColor Green

    # ── 5. Clean Frontend Compilation from Source ──────────────
    Write-Host "[BUILD] Compiling frontend assets in staging from source (npm run build)..." -ForegroundColor Yellow
    $nodeModulesSrc = Join-Path $appDir "node_modules"
    $nodeModulesDst = Join-Path $stageDir "node_modules"

    if (!(Test-Path $nodeModulesSrc)) {
        throw "node_modules not found in $appDir. Run 'npm ci' before building release."
    }

    # Create directory junction to node_modules so staging compiles with locked modules
    New-Item -ItemType Junction -Path $nodeModulesDst -Target $nodeModulesSrc | Out-Null

    try {
        Push-Location $stageDir
        cmd.exe /c "npm run build"
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build failed in staging with exit code $LASTEXITCODE."
        }
    }
    finally {
        Pop-Location
        if (Test-Path $nodeModulesDst) {
            [System.IO.Directory]::Delete($nodeModulesDst)
        }
    }
    Write-Host "[ OK ] Frontend assets built cleanly in staging." -ForegroundColor Green

    # ── 6. Verify Frontend Built Assets in Staging ─────────────
    $manifestPath = Join-Path $stageDir "public\build\manifest.json"
    $viteManifestPath = Join-Path $stageDir "public\build\.vite\manifest.json"

    if (!(Test-Path $manifestPath) -and !(Test-Path $viteManifestPath)) {
        throw "public/build/manifest.json is missing in staging! Frontend compilation was incomplete."
    }

    $activeManifest = if (Test-Path $manifestPath) { $manifestPath } else { $viteManifestPath }
    $manifestObj = Get-Content -Raw $activeManifest | ConvertFrom-Json
    $manifestMissing = 0
    $manifestCount = 0
    foreach ($prop in $manifestObj.psobject.Properties) {
        $manifestCount++
        $entry = $prop.Value
        $filesToCheck = @()
        if ($entry.file) { $filesToCheck += $entry.file }
        if ($entry.css) { $filesToCheck += $entry.css }
        if ($entry.assets) { $filesToCheck += $entry.assets }
        foreach ($af in $filesToCheck) {
            $expectedAsset = Join-Path $stageDir "public\build\$af"
            if (!(Test-Path $expectedAsset)) {
                Write-Host "  [ERROR] Manifest references missing asset: $af" -ForegroundColor Red
                $manifestMissing++
            }
        }
    }
    if ($manifestMissing -gt 0) {
        throw "Frontend manifest verification failed: $manifestMissing asset(s) missing from public/build."
    }
    Write-Host "[ OK ] Frontend assets verified against build manifest ($manifestCount entries)." -ForegroundColor Green

    # ── 7. Safety Cleanup: Exclude Secrets & Runtime State ─────
    Write-Host "[CLEAN] Applying release sanitization..." -ForegroundColor Yellow
    Remove-ReleaseExcludedItems -Root $stageDir
    Assert-ReleasePackageBoundary -Root $stageDir

    # Remove any stray .env files
    Get-ChildItem -Path $stageDir -Filter ".env*" -File | Where-Object { $_.Name -ne ".env.example" } | Remove-Item -Force

    # Remove workstation & dev files
    $devPatterns = @(
        "phpunit.xml", "*.log", "*.sqlite*", "public\hot", "public\storage",
        "bundle_for_update.ps1", "bundle_for_release.ps1", "build_clean_release.ps1",
        "sync_production.ps1", "sync_and_push.ps1", "setup_production_repo.ps1",
        "*.bat", "scripts"
    )
    foreach ($pat in $devPatterns) {
        $target = Join-Path $stageDir $pat
        if (Test-Path $target) {
            Remove-Item -Recurse -Force $target -ErrorAction SilentlyContinue
        }
    }

    # Clean bootstrap/cache php files (keep .gitignore)
    $bCache = Join-Path $stageDir "bootstrap\cache"
    if (Test-Path $bCache) {
        Get-ChildItem -Path $bCache -File -Filter "*.php" | Where-Object { $_.Name -ne ".gitignore" } | Remove-Item -Force
    }

    # Clean runtime storage paths
    $storageScaffolding = @(
        "storage\app\public",
        "storage\app\chunks",
        "storage\app\update_package",
        "storage\framework\cache",
        "storage\framework\sessions",
        "storage\framework\views",
        "storage\logs"
    )
    foreach ($scaff in $storageScaffolding) {
        $targetScaff = Join-Path $stageDir $scaff
        if (Test-Path $targetScaff) {
            Get-ChildItem -Path $targetScaff -File | Remove-Item -Force -ErrorAction SilentlyContinue
        }
    }

    # Production uses MySQL. Never put local SQLite databases or journals in
    # an update package; the previous root-only *.sqlite* cleanup missed files
    # nested under database/.
    $databaseDir = Join-Path $stageDir "database"
    if (Test-Path $databaseDir) {
        Get-ChildItem -LiteralPath $databaseDir -Recurse -File -Filter "*.sqlite*" |
            Remove-Item -Force
    }

    # Windows installers are downloadable product assets, not application
    # runtime. Keep them at their original source path and publish their
    # inventory in release-manifest.json so clean installs can copy them to
    # public/downloads separately. Normal updater extraction is an overlay and
    # therefore leaves any existing download in place.
    $externalAssets = @()
    $downloadDir = Join-Path $appDir "public\downloads"
    if (Test-Path $downloadDir) {
        $installerFiles = @(Get-ChildItem -LiteralPath $downloadDir -Recurse -File -Filter "*.exe")
        foreach ($installer in $installerFiles) {
            $relativePath = $installer.FullName.Substring($appDir.Length).TrimStart([char[]]@(92, 47)) -replace '\\', '/'
            $externalAssets += [ordered]@{
                path       = $relativePath
                bytes      = $installer.Length
                sha256     = (Get-FileHash -LiteralPath $installer.FullName -Algorithm SHA256).Hash
            }
            $stagedInstaller = Join-Path $stageDir $relativePath.Replace('/', '\')
            if (Test-Path -LiteralPath $stagedInstaller) {
                Remove-Item -LiteralPath $stagedInstaller -Force
            }
        }
    }

    # Ensure update.lock and installed flag are absent from update package
    Remove-Item (Join-Path $stageDir "storage\update.lock") -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $stageDir "storage\installed") -Force -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $stageDir "storage\app_version.txt") -Force -ErrorAction SilentlyContinue

    # ── 8. Generate Release Manifest & Version Marker ──────────
    $migrations = @()
    $migDir = Join-Path $stageDir "database\migrations"
    if (Test-Path $migDir) {
        $migrations = @(Get-ChildItem -Path $migDir -Filter "*.php" | Select-Object -ExpandProperty Name)
    }

    $composerLockHash = (Get-FileHash (Join-Path $stageDir "composer.lock") -Algorithm SHA256).Hash
    $packageLockHash = if (Test-Path (Join-Path $stageDir "package-lock.json")) {
        (Get-FileHash (Join-Path $stageDir "package-lock.json") -Algorithm SHA256).Hash
    } else { "none" }

    $releaseManifest = [ordered]@{
        name                = "VenQore POS"
        version             = $Version
        released_at         = (Get-Date -Format 'o')
        source_revision     = $headCommit
        working_tree_dirty  = $isDirty
        dirty_file_count    = $gitStatus.Count
        dirty_files         = if ($isDirty) { @($gitStatus | Select-Object -First 50) } else { @() }
        php_min_version     = "8.2.0"
        composer_lock_hash  = $composerLockHash
        package_lock_hash   = $packageLockHash
        migration_count     = $migrations.Count
        migrations          = $migrations
        database_engine     = "mysql"
        external_assets     = $externalAssets
    }
    $releaseManifestJson = $releaseManifest | ConvertTo-Json -Depth 6
    Set-Content -Path (Join-Path $stageDir "release-manifest.json") -Value $releaseManifestJson -Encoding utf8

    # Backward compatibility version marker
    $versionContent = @"
AMD_POS_VERSION=$Version
RELEASED=$(Get-Date -Format 'yyyy-MM-dd')
TYPE=update_package
"@
    Set-Content -Path (Join-Path $stageDir "AMD_POS_VERSION.txt") -Value $versionContent -Encoding utf8

    Write-Host "[ OK ] Release metadata and manifest generated." -ForegroundColor Green

    # ── 9. Package Into Candidate Archive ──────────────────────
    Write-Host "[ZIP] Packaging candidate release into $tempZip..." -ForegroundColor Yellow
    [System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null
    [System.IO.Compression.ZipFile]::CreateFromDirectory($stageDir, $tempZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)
    Write-Host "[ OK ] Candidate archive created." -ForegroundColor Green

    $candidateBytes = (Get-Item -LiteralPath $tempZip).Length
    if ($candidateBytes -gt 120000000) {
        throw "Candidate ZIP is $candidateBytes bytes, above the hard 120,000,000-byte upload limit. Reduce the package; it will not be published."
    }
    Write-Host "[ PASS ] Candidate ZIP is within the 120,000,000-byte upload limit ($candidateBytes bytes)." -ForegroundColor Green

    # ── 10. Gated Pre-Publication Validation ───────────────────
    Write-Host "[VERIFY] Running pre-publication validation gate on candidate ZIP..." -ForegroundColor Yellow
    $valDir = Join-Path $env:TEMP "venqore_val_${Version}_${buildGuid}"
    if (Test-Path $valDir) { Remove-Item -Recurse -Force $valDir }
    New-Item -ItemType Directory -Force -Path $valDir | Out-Null

    try {
        # Extract candidate ZIP into isolated validation workspace
        [System.IO.Compression.ZipFile]::ExtractToDirectory($tempZip, $valDir)
        Assert-ReleasePackageBoundary -Root $valDir

        # 10.1 Test isolated Composer autoload boot in fresh PHP process
        Write-Host "  -> Testing isolated Composer autoload boot in fresh PHP process..." -ForegroundColor Gray
        $testScript = Join-Path $valDir "_val_boot.php"
        $testScriptContent = @'
<?php
error_reporting(E_ALL);
ini_set('display_errors', '0');
set_error_handler(static function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});
try {
    require __DIR__ . '/vendor/autoload.php';
    echo "AUTOLOAD_PASS";
    exit(0);
} catch (Throwable $e) {
    echo "AUTOLOAD_FAIL: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine();
    exit(1);
}
'@
        Set-Content -Path $testScript -Value $testScriptContent -Encoding utf8
        $phpOut = & php $testScript
        $phpCode = $LASTEXITCODE
        Remove-Item $testScript -Force -ErrorAction SilentlyContinue

        if ($phpCode -ne 0 -or $phpOut -notmatch "AUTOLOAD_PASS") {
            throw "Candidate package FAILED Composer autoload validation: $phpOut"
        }
        Write-Host "  [ PASS ] Packaged Composer autoloader boots cleanly in isolated process." -ForegroundColor Green

        # Vite can still succeed when Tailwind's PostCSS plugin was omitted:
        # its output then contains literal @tailwind directives and the UI is
        # shipped without utility CSS (including sizing constraints on logos).
        $valManifestPath = Join-Path $valDir "public\build\manifest.json"
        if (!(Test-Path $valManifestPath)) {
            $valManifestPath = Join-Path $valDir "public\build\.vite\manifest.json"
        }
        $valManifest = Get-Content -Raw $valManifestPath | ConvertFrom-Json
        $cssManifestEntry = $valManifest.PSObject.Properties['resources/css/app.css']
        if (!$cssManifestEntry -or !$cssManifestEntry.Value.file) {
            throw "Candidate package has no resources/css/app.css entry in its Vite manifest."
        }
        $compiledCssPath = Join-Path $valDir ("public\build\" + $cssManifestEntry.Value.file.Replace('/', '\'))
        if (!(Test-Path -LiteralPath $compiledCssPath)) {
            throw "Candidate package is missing compiled app CSS: $($cssManifestEntry.Value.file)"
        }
        if ((Get-Content -Raw -LiteralPath $compiledCssPath) -match '@tailwind\s+(base|components|utilities)') {
            throw "Candidate CSS still contains unprocessed @tailwind directives. PostCSS/Tailwind did not run; do not publish this package."
        }
        Write-Host "  [ PASS ] Compiled app CSS contains no unprocessed Tailwind directives." -ForegroundColor Green

        # 10.2 Verify all eager autoload files exist
        $autoloadFilesPath = Join-Path $valDir "vendor\composer\autoload_files.php"
        if (Test-Path $autoloadFilesPath) {
            $autoloadText = Get-Content -Raw $autoloadFilesPath
            $autoloadPaths = @([regex]::Matches($autoloadText, '\$vendorDir\s*\.\s*''([^'']+)''') | ForEach-Object {
                Join-Path $valDir ("vendor" + $_.Groups[1].Value)
            })
            $missingFiles = @($autoloadPaths | Where-Object { !(Test-Path $_) })
            if ($missingFiles.Count -gt 0) {
                throw "Candidate package has $($missingFiles.Count) missing eager autoload files: $($missingFiles -join ', ')"
            }
            Write-Host "  [ PASS ] All $($autoloadPaths.Count) eager autoload files verified present." -ForegroundColor Green
        }

        # 10.3 Verify installed metadata does not have dev flag
        $installedPath = Join-Path $valDir "vendor\composer\installed.json"
        if (Test-Path $installedPath) {
            $installedRaw = Get-Content -Raw $installedPath
            if ($installedRaw -match '"dev":\s*true') {
                throw "Candidate package installed.json still has dev: true!"
            }
            Write-Host "  [ PASS ] Composer installed metadata verified production (dev: false)." -ForegroundColor Green
        }

        # 10.4 Verify no .env or storage locks
        if (Test-Path (Join-Path $valDir ".env")) {
            throw "Security violation: .env file found in candidate ZIP!"
        }
        if (Test-Path (Join-Path $valDir "public\hot")) {
            throw "Dev artifact violation: public/hot found in candidate ZIP!"
        }
        if (Test-Path (Join-Path $valDir "storage\update.lock")) {
            throw "Runtime violation: storage/update.lock found in candidate ZIP!"
        }
        $zipHandle = [System.IO.Compression.ZipFile]::OpenRead($tempZip)
        try {
            $sqliteEntries = @($zipHandle.Entries | Where-Object { $_.FullName -match '(?i)\.sqlite[^/\\]*$' })
            if ($sqliteEntries.Count -gt 0) {
                throw "Database artifact violation: SQLite file(s) found in candidate ZIP: $($sqliteEntries.FullName -join ', ')"
            }
            $installerEntries = @($zipHandle.Entries | Where-Object { $_.FullName -match '(?i)^public[\\/]downloads[\\/].*\.exe$' })
            if ($installerEntries.Count -gt 0) {
                throw "Package boundary violation: separately distributed installer(s) found in candidate ZIP: $($installerEntries.FullName -join ', ')"
            }
        }
        finally {
            $zipHandle.Dispose()
        }
        Write-Host "  [ PASS ] Clean package boundary confirmed (no .env, hot file, or locks)." -ForegroundColor Green
    }
    finally {
        if (Test-Path $valDir) {
            Remove-Item -Recurse -Force $valDir -ErrorAction SilentlyContinue
        }
    }

    # ── 11. Publish Final Verified Release Artifact ───────────
    if (Test-Path $finalZip) {
        if ($Force) {
            Remove-Item -Force $finalZip
        } else {
            throw "Cannot overwrite existing $finalZip without -Force."
        }
    }
    Move-Item -Path $tempZip -Destination $finalZip -Force

    $finalHash = (Get-FileHash -LiteralPath $finalZip -Algorithm SHA256).Hash
    $finalSizeMB = [math]::Round((Get-Item -LiteralPath $finalZip).Length / 1MB, 2)

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  BUILD SUCCESS: $releaseBase.zip" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  Version:       $Version" -ForegroundColor White
    Write-Host "  Size:          $finalSizeMB MB" -ForegroundColor White
    Write-Host "  SHA-256:       $finalHash" -ForegroundColor White
    Write-Host "  Location:      $finalZip" -ForegroundColor White
    Write-Host "  Classification: ARTIFACT VALIDATED FOR STAGING" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
}
finally {
    if (Test-Path $stageDir) {
        Remove-Item -Recurse -Force $stageDir -ErrorAction SilentlyContinue
    }
}
