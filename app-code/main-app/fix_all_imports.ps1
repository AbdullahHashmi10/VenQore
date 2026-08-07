$targetPattern = 'import.*getCurrencySymbol.*from.*@/Utils/format'

Get-ChildItem -Path 'd:\AMD POS\resources\js' -Recurse -Include *.jsx,*.js | ForEach-Object {
    $path = $_.FullName
    $content = Get-Content $path
    
    # Check if we have multiple imports of getCurrencySymbol from format
    $importLines = $content | Where-Object { $_ -match $targetPattern }
    
    if ($importLines.Count -gt 1) {
        Write-Host "Fixing $path ($($importLines.Count) found)"
        
        $alreadyImported = $false
        $newContent = New-Object System.Collections.Generic.List[string]
        
        foreach ($line in $content) {
            if ($line -match $targetPattern) {
                if (-not $alreadyImported) {
                    $alreadyImported = $true
                    $newContent.Add($line)
                } else {
                    # Skip duplicate
                }
            } else {
                $newContent.Add($line)
            }
        }
        
        $newContent | Set-Content $path -Encoding UTF8
    }
}
