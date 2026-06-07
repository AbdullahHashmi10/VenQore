
# fix_currency.ps1
# Replaces all inline window.amdSettings?.currency_symbol patterns with
# getCurrencySymbol() from @/Utils/format, and ensures the import is present.

$jsxRoot = "d:\AMD POS\resources\js"

# Pattern variants to replace
$patterns = @(
    @{ Old = "window.amdSettings?.currency_symbol || 'Rs'";  New = "getCurrencySymbol()" },
    @{ Old = 'window.amdSettings?.currency_symbol || "Rs"';  New = "getCurrencySymbol()" },
    @{ Old = "window.amdSettings?.currency_symbol || ''";    New = "getCurrencySymbol()" },
    @{ Old = 'window.amdSettings?.currency_symbol || ""';    New = "getCurrencySymbol()" },
    @{ Old = "window.amdSettings?.currency_symbol";          New = "getCurrencySymbol()" }
)

$importLine   = "import { getCurrencySymbol } from '@/Utils/format';"
$importLineAlt = "import { getCurrencySymbol, formatCurrency } from '@/Utils/format';"
$formatOnlyImport = "import { formatCurrency } from '@/Utils/format';"

$files = Get-ChildItem -Path $jsxRoot -Recurse -Filter "*.jsx"
$totalFixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content
    $changed = $false

    foreach ($p in $patterns) {
        if ($content.Contains($p.Old)) {
            $content = $content.Replace($p.Old, $p.New)
            $changed = $true
        }
    }

    if ($changed) {
        # Fix import: if getCurrencySymbol already imported, skip
        if ($content -notmatch "getCurrencySymbol") {
            # Nothing needed - it was replaced but getCurrencySymbol disappeared?
            # This shouldn't happen
        }

        # Ensure getCurrencySymbol is imported
        if ($content -notmatch "import.*getCurrencySymbol.*from") {
            # If formatCurrency already imported from @/Utils/format, merge
            if ($content -match "import \{ formatCurrency \} from '@/Utils/format'") {
                $content = $content -replace "import \{ formatCurrency \} from '@/Utils/format'", "import { formatCurrency, getCurrencySymbol } from '@/Utils/format'"
            } elseif ($content -match "import \{ formatCurrency, ([^}]+)\} from '@/Utils/format'") {
                $content = $content -replace "import \{ formatCurrency, ([^}]+)\} from '@/Utils/format'", "import { formatCurrency, getCurrencySymbol, `$1} from '@/Utils/format'"
            } elseif ($content -match "import \{([^}]+)\} from '@/Utils/format'") {
                $content = $content -replace "import \{([^}]+)\} from '@/Utils/format'", "import {`$1, getCurrencySymbol } from '@/Utils/format'"
            } else {
                # Add new import after the first import line
                $content = $content -replace "(import .+;[\r\n]+)", "`$1$importLine`n"
            }
        }

        if ($content -ne $original) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "Fixed: $($file.FullName.Replace('d:\AMD POS\resources\js\', ''))"
            $totalFixed++
        }
    }
}

Write-Host ""
Write-Host "Done. Fixed $totalFixed files."
