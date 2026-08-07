Get-ChildItem -Path 'd:\AMD POS\resources\js' -Recurse -Include *.jsx,*.js | ForEach-Object {
    $content = Get-Content $_.FullName
    for ($i = 0; $i -lt $content.Count - 1; $i++) {
        if ($content[$i].Trim() -eq 'import {' -and $content[$i+1].Trim() -match '^import \{') {
            Write-Host "$($_.FullName) at line $($i+1)"
        }
    }
}
