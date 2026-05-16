$releaseDir = "VenQore_Release_Hosting"
$zipFile = "release_hosting_VenQore_v1.0.6.zip"

Write-Host "Preparing release..."

# Clean previous
if (Test-Path $releaseDir) { Remove-Item -Recurse -Force $releaseDir }
if (Test-Path $zipFile) { Remove-Item $zipFile }

New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

# List of items to copy
$folders = @("app", "bootstrap", "config", "database", "public", "resources", "routes", "storage", "vendor")
$files = @("artisan", "composer.json", "composer.lock", ".env.example", "package.json", "vite.config.js", "tailwind.config.js", "jsconfig.json", "INSTALL_GUIDE.txt", "index.php", ".htaccess")

# Copy Folders
foreach ($f in $folders) {
    Write-Host "Copying $f..."
    Copy-Item -Recurse -Path $f -Destination "$releaseDir\$f"
}

# Copy Files
foreach ($f in $files) {
    if (Test-Path $f) { 
        Copy-Item -Path $f -Destination $releaseDir 
    }
}

# Cleanup Specifics for Distribution
Write-Host "Cleaning up release files..."

# Remove lock file if exists
if (Test-Path "$releaseDir\storage\installed") { 
    Remove-Item -Force "$releaseDir\storage\installed" 
    Write-Host "Removed storage/installed lock file."
}

# Remove existing symlink in public/storage to let the installer handle it
if (Test-Path "$releaseDir\public\storage") {
    Remove-Item -Recurse -Force "$releaseDir\public\storage"
    Write-Host "Removed public/storage symlink."
}

# Remove hot file if exists
if (Test-Path "$releaseDir\public\hot") {
    Remove-Item -Force "$releaseDir\public\hot"
}

# Clear compiled Blade views (prevents stale @vite references from causing 500 crashes)
if (Test-Path "$releaseDir\storage\framework\views") {
    Get-ChildItem "$releaseDir\storage\framework\views" -File | Where-Object { $_.Name -ne '.gitignore' } | Remove-Item -Force
    Write-Host "Cleared compiled Blade views."
}

# Clear bootstrap cache (prevents stale config/routes)
if (Test-Path "$releaseDir\bootstrap\cache") {
    Get-ChildItem "$releaseDir\bootstrap\cache" -File -Filter "*.php" | Where-Object { $_.Name -ne '.gitignore' } | Remove-Item -Force
    Write-Host "Cleared bootstrap cache."
}

# Remove all logs to start fresh
if (Test-Path "$releaseDir\storage\logs") {
    Get-ChildItem "$releaseDir\storage\logs" -File | Where-Object { $_.Name -ne '.gitignore' } | Remove-Item -Force
    Write-Host "Cleared old log files."
}

# Clear temp imports
if (Test-Path "$releaseDir\storage\app\temp_imports") {
    Remove-Item -Recurse -Force "$releaseDir\storage\app\temp_imports"
    New-Item -ItemType Directory -Path "$releaseDir\storage\app\temp_imports" | Out-Null
    Write-Host "Cleared temp imports."
}

# Zipping with LINUX COMPATIBILITY (Node.js compress)
Write-Host "Zipping files into $zipFile... (Using Node.js Archiver)"
node .\create_zip.cjs $releaseDir $zipFile

# Cleanup Directory
Remove-Item -Recurse -Force $releaseDir

Write-Host "SUCCESS: $zipFile created."
