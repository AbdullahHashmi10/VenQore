$misc = @(
    'audit.js', 'audit.php', 'count_active_types.php', 'count_brackets.cjs',
    'db_check.php', 'extract_docx.cjs', 'first()))', 'fix-terminals.php',
    'get_frontend_routes.cjs', 'inject_missing_slugs.cjs', 'update_expense.cjs',
    'update_expense.py', 'update_modal.cjs', 'update_modal.py', 'zip_fix.ps1'
)

foreach ($item in $misc) {
    if (Test-Path $item) {
        Move-Item -Path $item -Destination './scratch/' -Force
    }
}
Write-Host "Cleanup completed."
