# build_clean_release.ps1
# Builds a clean, deployable VenQore release zip from the local main-app folder,
# excluding dev tooling, scratch files, logs, old update zips, and duplicate
# project folders that are NOT loaded by the running Laravel app.
#
# Run this from PowerShell, from inside: E:\AMD POS\AMD POS\app-code\main-app

$ErrorActionPreference = "Stop"

$source = Get-Location
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$stageDir = "$env:TEMP\venqore_clean_release_$stamp"
$zipPath = "$env:TEMP\VenQore_Clean_Release_$stamp.zip"

Write-Host "Source: $source"
Write-Host "Staging to: $stageDir"

New-Item -ItemType Directory -Path $stageDir | Out-Null

# Top-level directories to exclude entirely (dev tooling, scratch, duplicate
# project copies, editor/AI metadata — none of these are in composer.json's
# autoload map, and none are referenced by public/index.php or .htaccess)
$excludeDirs = @(
    "_to_delete", ".claude", ".gemini", ".obsidian", ".vqscope", ".vite",
    "temp_extract", "temp_xlsx_extract", "scratch", "Tester", "tools",
    "VenQore", "VenQore_Design_System", "verification", "system_brain",
    "VYB Restore", "docs", "new landing page", "node_modules", "vendor",
    "storage"   # storage is server-specific runtime data; keep production's own
)

# File extensions to exclude anywhere in the tree
$excludeExtensions = @(
    "*.log", "*.tgz", "*.bak", "*.bak.*"
)

# Specific loose files at repo root to exclude
$excludeFiles = @(
    "AMD_POS_Update_v5.5.0.zip", "AMD_POS_Update_v5.5.1.zip",
    "AMD_POS_Update_v6.0.0.zip", "AMD_POS_Update_v6.0.1.zip",
    "venqore-v6-pages.zip", "composer.phar",
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
    ".phpunit.result.cache"
)

Write-Host "Copying with robocopy (excludes applied)..."

$xd = $excludeDirs | ForEach-Object { $_ }
$xf = $excludeExtensions

robocopy $source $stageDir /E /XD $xd /XF $xf /NFL /NDL /NJH /NJS /NP

# Remove specific loose files that robocopy's extension filter can't target precisely
foreach ($f in $excludeFiles) {
    $target = Join-Path $stageDir $f
    if (Test-Path $target) {
        Remove-Item $target -Force
        Write-Host "Removed: $f"
    }
}

Write-Host ""
Write-Host "Staged file count:"
(Get-ChildItem -Path $stageDir -Recurse -File | Measure-Object).Count

Write-Host ""
Write-Host "Creating zip: $zipPath"
Compress-Archive -Path "$stageDir\*" -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host ""
Write-Host "DONE."
Write-Host "Zip: $zipPath"
Write-Host "Staged folder (for inspection, not deleted): $stageDir"
