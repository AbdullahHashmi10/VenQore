Get-ChildItem -Path 'd:\AMD POS\resources\js' -Recurse -Include *.jsx,*.js | ForEach-Object {
    $content = Get-Content $_.FullName
    $hasFormat = $content | Where-Object { $_ -match 'from.*Utils/format' }
    $hasUseCurrency = $content | Where-Object { $_ -match 'from.*Utils/useCurrency' }
    
    if ($hasFormat -and $hasUseCurrency) {
        Write-Host "$($_.FullName) has BOTH imports"
    }
}
