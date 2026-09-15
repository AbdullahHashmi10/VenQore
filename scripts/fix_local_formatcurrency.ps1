
# fix_local_formatcurrency.ps1
# Removes local inline `const formatCurrency = (val) => ...` definitions
# and ensures the canonical import from @/Utils/format is used instead.

$jsxRoot = "d:\AMD POS\resources\js"

# Regex to match the full inline formatCurrency one-liner definition
$inlinePattern = "const formatCurrency = \(val\) => [^\n]+\n?"

$importLine = "import { formatCurrency } from '@/Utils/format';"

$files = Get-ChildItem -Path $jsxRoot -Recurse -Filter "*.jsx"
$totalFixed = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content

    # Check if file has an inline formatCurrency definition
    if ($content -match "const formatCurrency = \(val\) =>") {
        # Remove the inline definition
        $content = [regex]::Replace($content, "    const formatCurrency = \(val\) => [^\r\n]+[\r\n]?", "")
        $content = [regex]::Replace($content, "const formatCurrency = \(val\) => [^\r\n]+[\r\n]?", "")

        # Ensure formatCurrency is imported from @/Utils/format
        if ($content -notmatch "import.*formatCurrency.*from '@/Utils/format'") {
            if ($content -match "import \{ getCurrencySymbol \} from '@/Utils/format'") {
                $content = $content -replace "import \{ getCurrencySymbol \} from '@/Utils/format'", "import { formatCurrency, getCurrencySymbol } from '@/Utils/format'"
            } elseif ($content -match "import \{([^}]+)\} from '@/Utils/format'") {
                $content = $content -replace "import \{([^}]+)\} from '@/Utils/format'", "import { formatCurrency, `$1 } from '@/Utils/format'"
            } else {
                # Add after first import line
                $content = $content -replace "(import [^\n]+\n)", "`$1$importLine`n"
            }
        }

        if ($content -ne $original) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "Fixed local formatCurrency in: $($file.Name)"
            $totalFixed++
        }
    }
}

Write-Host ""
Write-Host "Done. Fixed $totalFixed files."
