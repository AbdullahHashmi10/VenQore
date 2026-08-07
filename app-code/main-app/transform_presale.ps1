# PowerShell script to transform CreateInvoice.jsx into CreatePreSale.jsx
$source = "d:\AMD POS\resources\js\Pages\Sales\CreateInvoice.jsx"
$destination = "d:\AMD POS\resources\js\Pages\Sales\CreatePreSale.jsx"

$content = Get-Content $source -Raw

# 1. Change component name
$content = $content -replace 'const CreateInvoice =', 'const CreatePreSale ='
$content = $content -replace 'export default CreateInvoice;', 'export default CreatePreSale;'

# 2. Change page titles
$content = $content -replace 'title=\{isEditMode \? "Edit Sale" : "Add Sale"\}', 'title={isEditMode ? "Edit Quotation" : "New Quotation"}'
$content = $content -replace 'title=\{isEditMode \? ``Edit Sale #\$\{editState\?\.invoiceNumber \|\| ``\}`` : "Add Sale"\}', 'title={isEditMode ? `Edit Quotation #${editState?.invoiceNumber || ``}` : "Create Pre-Sale"}'
$content = $content -replace '"Edit Sale"', '"Edit Quotation"'
$content = $content -replace '"Add Sale"', '"New Quotation"'
$content = $content -replace 'COMPLETE SALE', 'SAVE QUOTATION'
$content = $content -replace 'UPDATE SALE', 'UPDATE QUOTATION'
$content = $content -replace 'PRINT SALE', 'PRINT QUOTATION'

# 3. Change endpoint from sales.store to presales.store
$content = $content -replace "route\('sales\.store'\)", "route('presales.store')"
$content = $content -replace "route\('sales\.update'", "route('presales.update'"
$content = $content -replace "route\('sales\.index'\)", "route('presales.index')"
$content = $content -replace "route\('sales\.print'", "route('presales.print'"

# 4. Remove stock validation logic (lines ~736-759)
$stockValidationPattern = '(?s)\/\/ Stock Validation.*?for \(const item of validItems\).*?\}\s+\}'
$content = $content -replace $stockValidationPattern, '// Stock Validation REMOVED for Pre-Sales (allows negative stock)'

# 5. Remove payment section HTML (Amount Paid and Balance Due sections)
$content = $content -replace '(?s)\{\/\* Amount Paid Row \*\/\}.*?<\/div>', ''
$content = $content -replace '(?s)\{\/\* Balance Due Row \*\/\}.*?<\/div>', ''

# 6. Remove balanceDue calculation
$content = $content -replace 'const balanceDue = grandTotal - \(parseFloat\(currentInvoice\.amountPaid\) \|\| 0\);', '// balanceDue REMOVED for Pre-Sales'

# 7. Add Pre-Sale Mode Banner after opening div
$banner = @'
                {/* PRE-SALE MODE BANNER */}
                <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        ⚠️ Pre-Sale Mode — Stock validation DISABLED, no payment required
                    </span>
                </div>
'@

$content = $content -replace '(<div className=\{`h-full flex-1 flex flex-col bg-slate-50.*?`\}>)', "`$1`n$banner"

# 8. Write  to destination
$content | Out-File $destination -Encoding UTF8

Write-Host "✅ CreatePreSale.jsx created successfully!" -ForegroundColor Green
Write-Host "File saved to: $destination" -ForegroundColor Cyan
