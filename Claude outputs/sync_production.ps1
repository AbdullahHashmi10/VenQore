# sync_production.ps1
#
# Mirrors E:\AMD POS\AMD POS\app-code\main-app into a permanent, always-clean
# ..\production\ folder — excluding dev tooling, scratch files, logs, old
# update zips, and duplicate project folders that are NOT loaded by the
# running Laravel app (verified against composer.json's autoload map and
# router.php's actual role — see project notes).
#
# Unlike a one-off copy, this uses robocopy /MIR: every time you run this,
# production\ becomes an EXACT mirror of main-app\ minus the excludes —
# files deleted from main-app\ are also removed from production\, so
# production\ never drifts and never needs to be rebuilt from scratch.
#
# Run this from PowerShell, from inside: E:\AMD POS\AMD POS\app-code\main-app
#   .\sync_production.ps1
#
# Then production\ is always what gets zipped/pushed/deployed — nothing
# else ever needs to look at main-app\ directly for a release.

$ErrorActionPreference = "Stop"

$source = "E:\AMD POS\AMD POS\app-code\main-app"
$prodDir = "E:\AMD POS\AMD POS\app-code\production"

Write-Host "Source (working copy): $source"
Write-Host "Production mirror:     $prodDir"

if (-not (Test-Path $prodDir)) {
    New-Item -ItemType Directory -Path $prodDir | Out-Null
    Write-Host "Created production\ folder (first run)."
}

# Top-level directories to exclude entirely (dev tooling, scratch, duplicate
# project copies, editor/AI metadata — none of these are in composer.json's
# autoload map, and none are referenced by public/index.php or .htaccess)
$excludeDirs = @(
    "_to_delete", ".claude", ".gemini", ".obsidian", ".vqscope", ".vite",
    "temp_extract", "temp_xlsx_extract", "scratch", "Tester", "tools",
    "VenQore", "VenQore_Design_System", "verification", "system_brain",
    "VYB Restore", "docs", "new landing page", "node_modules", "vendor",
    "storage",   # storage is server-specific runtime data; keep production's own
    "production", "production-clean-repo"  # never touch these sibling output folders
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
    ".phpunit.result.cache",
    "build_clean_release.ps1", "sync_production.ps1"  # the build scripts themselves stay dev-only
)

Write-Host ""
Write-Host "Mirroring with robocopy /MIR (this DELETES from production\ anything"
Write-Host "no longer in main-app\, outside the excludes above)..."
Write-Host ""

# /MIR = mirror (adds, updates, AND deletes to match source exactly)
# /XD  = exclude directories
# /XF  = exclude files/patterns
robocopy $source $prodDir /MIR /XD $excludeDirs /XF $excludeExtensions /NFL /NDL /NJH /NJS /NP

# Remove specific loose files robocopy's pattern filter can't target precisely
# (robocopy /MIR would otherwise re-add these on the next sync if they still
# exist in main-app\, so we strip them from the mirror every run)
foreach ($f in $excludeFiles) {
    $target = Join-Path $prodDir $f
    if (Test-Path $target) {
        Remove-Item $target -Force
    }
}

Write-Host ""
Write-Host "Production mirror file count:"
(Get-ChildItem -Path $prodDir -Recurse -File | Measure-Object).Count

Write-Host ""
Write-Host "DONE. production\ is now in sync with main-app\ (minus dev/scratch/cruft)."
Write-Host "Location: $prodDir"
Write-Host ""
Write-Host "To deploy: zip production\, or git add/commit/push it directly if it's"
Write-Host "wired up as its own git worktree or branch checkout."
