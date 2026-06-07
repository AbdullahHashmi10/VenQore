@echo off
echo Creating Filament Resources Pages...

php artisan make:filament-page ListInvoices --resource=InvoiceResource --type=ListRecords
php artisan make:filament-page CreateInvoice --resource=InvoiceResource --type=CreateRecord
php artisan make:filament-page EditInvoice --resource=InvoiceResource --type=EditRecord

php artisan make:filament-resource Category --simple
php artisan make:filament-resource Brand --simple
php artisan make:filament-resource Expense
php artisan make:filament-resource BankAccount --simple

echo Done!
pause
