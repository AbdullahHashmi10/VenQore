Get-ChildItem -Path 'd:\AMD POS\resources\js' -Recurse -Include *.jsx,*.js | ForEach-Object {
    $content = Get-Content $_.FullName
    $matches = $content | Where-Object { $_ -match 'getCurrencySymbol' -and $_ -notmatch 'Utils/format' -and $_ -notmatch 'export (const|function) getCurrencySymbol' }
    if ($matches) {
        Write-Host "$($_.FullName) uses getCurrencySymbol without format import"
    }
}
