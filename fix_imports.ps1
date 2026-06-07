$path = 'd:\AMD POS\resources\js\Pages\SalesOrders\CreatePreSale.jsx'
$content = Get-Content $path
$target = "import { getCurrencySymbol } from '@/Utils/format';"
$newContent = $content | Where-Object { $_.Trim() -ne $target }
$finalContent = @($newContent[0], $target) + ($newContent | Select-Object -Skip 1)
$finalContent | Set-Content $path -Encoding UTF8
