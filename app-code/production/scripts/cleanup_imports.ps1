# resources/js/cleanup_imports.ps1
# This script removes duplicate imports of format utils to fix the build error.

$target = "import { formatCurrency, getCurrencySymbol } from '@/Utils/format';"
$jsxRoot = "d:\AMD POS\resources\js"

$files = Get-ChildItem -Path $jsxRoot -Recurse -Filter "*.jsx"
foreach ($f in $files) {
    if (Test-Path $f.FullName) {
        $lines = Get-Content $f.FullName
        $newLines = @()
        $found = $false
        $modified = $false
        
        foreach ($line in $lines) {
            $trimmed = $line.Trim()
            if ($trimmed -eq $target) {
                if (-not $found) {
                    $newLines += $line
                    $found = $true
                } else {
                    $modified = $true
                }
            } else {
                $newLines += $line
            }
        }
        
        if ($modified) {
            $newLines | Set-Content $f.FullName
            Write-Host "Cleaned: $($f.FullName)"
        }
    }
}
