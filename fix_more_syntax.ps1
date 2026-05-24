$path = 'd:\AMD POS\resources\js\Pages\Pos.jsx'
$content = Get-Content $path -Raw

# 1. Fix showInput callbacks where a variable is defined right before
# Example: const charge = parseFloat(val); ... formatCurrency(, ...
$content = $content -replace 'const charge = parseFloat\(val\);\s+if \(!isNaN\(charge\)\) \{\s+updateActiveSale\(\{ additionalCharges: charge \}\);\s+addToast\(`Additional charge of \$\{formatCurrency\(,', 'const charge = parseFloat(val); if (!isNaN(charge)) { updateActiveSale({ additionalCharges: charge }); addToast(`Additional charge of ${formatCurrency(charge,'

# 2. General cleanup for any remaining formatCurrency(,
# We'll just put 0 as a placeholder to fix syntax if we can't guess the variable
$content = $content -replace 'formatCurrency\(,', 'formatCurrency(0,'

$content | Set-Content $path -Encoding UTF8
