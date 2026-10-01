# Source/build tooling only. Never copy this helper into the deployed app.
$script:ReleaseExcludedPaths = @(
    'public/v6/_ds', 'public/v6/support.js',
    'public/animated', 'public/_ds', 'public/index.html', 'public/support.js',
    'public/images/icons/README.md', 'public/images/logo_original_backup.png',
    'public/venqore_dashboard_mockup_1776055918038.png',
    'resources/js/tests', 'resources/design-reference',
    'public/uploads', 'Tester', 'tests', 'extras', 'docs',
    'node_modules', '.git', '.claude', '.vscode',
    '.editorconfig', '.eslintrc.json', '.gitattributes', '.gitignore',
    '.mcp.json', '.oxlintrc.json', 'components.json', 'DESIGN-RULES.md',
    'jsconfig.json', 'jsrepo.config.json', 'jsrepo.config.ts',
    'phpunit.xml.dist', 'postcss.config.cjs', 'tailwind.config.js',
    'vite.config.js', 'vite.pos.config.js', 'race1.err', 'race2.err'
)

function Get-ReleaseExcludedItems {
    param([Parameter(Mandatory)][string]$Root)
    foreach ($relative in $script:ReleaseExcludedPaths) {
        $path = Join-Path $Root $relative
        if (Test-Path -LiteralPath $path) { Get-Item -LiteralPath $path -Force }
    }
    $legacyPages = Join-Path $Root 'public/v6'
    if (Test-Path -LiteralPath $legacyPages) {
        Get-ChildItem -LiteralPath $legacyPages -File -Filter '*.html'
    }

    # Composer distributions sometimes contain their own test suites and a
    # Windows-only hidden-input helper. Neither is required by the Linux web
    # runtime, and neither belongs in an updater payload.
    $vendor = Join-Path $Root 'vendor'
    if (Test-Path -LiteralPath $vendor) {
        Get-ChildItem -LiteralPath $vendor -Recurse -Directory -Force |
            Where-Object { $_.Name -in @('test', 'tests', 'Tester') }

        $hiddenInput = Join-Path $vendor 'symfony/console/Resources/bin/hiddeninput.exe'
        if (Test-Path -LiteralPath $hiddenInput -PathType Leaf) {
            Get-Item -LiteralPath $hiddenInput -Force
        }
    }
}

function Remove-ReleaseExcludedItems {
    param([Parameter(Mandatory)][string]$Root)
    $resolvedRoot = (Resolve-Path -LiteralPath $Root).Path.TrimEnd([char[]]@(92, 47))
    foreach ($item in @(Get-ReleaseExcludedItems -Root $resolvedRoot)) {
        $resolvedTarget = [IO.Path]::GetFullPath($item.FullName)
        if (!$resolvedTarget.StartsWith($resolvedRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Refusing release cleanup outside staging: $resolvedTarget"
        }
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            throw "Refusing to traverse a linked release cleanup path: $resolvedTarget"
        }
        Remove-Item -LiteralPath $resolvedTarget -Recurse -Force
    }
}

function Assert-ReleasePackageBoundary {
    param([Parameter(Mandatory)][string]$Root)
    $unexpected = @(Get-ReleaseExcludedItems -Root $Root)
    if ($unexpected.Count) {
        throw "Non-runtime files in release: $($unexpected.FullName -join ', ')"
    }
    # These assets are loaded directly by current React marketing pages.
    foreach ($relative in @('public/v6/assets/logo.png', 'public/v6/assets/venqore.js',
        'public/v6/assets/venqore-forms.js', 'public/v6/assets/venqore-landing.js',
        'public/v6/assets/fluid.js', 'public/v6/assets/demos.js',
        'public/v6/assets/venqore.css', 'public/v6/assets/venqore-landing.css')) {
        if (!(Test-Path -LiteralPath (Join-Path $Root $relative) -PathType Leaf)) {
            throw "Required marketing runtime asset missing: $relative"
        }
    }
}
