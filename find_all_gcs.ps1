Get-ChildItem -Path 'd:\AMD POS\resources\js' -Recurse -Include *.jsx,*.js | ForEach-Object {
    $content = Get-Content $_.FullName
    $match = $content | Where-Object { $_ -match 'getCurrencySymbol' }
    if ($match) {
        Write-Host "$($_.FullName)"
    }
}
