Get-ChildItem -Path 'd:\AMD POS\resources\js' -Recurse -Include *.jsx,*.js | ForEach-Object {
    $content = Get-Content $_.FullName
    $matches = $content | Where-Object { $_ -match 'import.*getCurrencySymbol.*from.*Utils/format' }
    if ($matches.Count -gt 1) {
        Write-Host "$($_.FullName) Count: $($matches.Count)"
    }
}
