Get-ChildItem -Path 'd:\AMD POS\resources\js' -Recurse -Include *.jsx,*.js | ForEach-Object {
    $path = $_.FullName
    $content = Get-Content $path -Raw
    if ($content -match 'formatCurrency\(,') {
        Write-Host "Fixing $path"
        $newContent = $content -replace 'formatCurrency\(,', 'formatCurrency(0,'
        $newContent | Set-Content $path -Encoding UTF8
    }
}
