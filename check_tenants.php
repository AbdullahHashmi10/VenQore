<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;

$tables = [
    'settings', 'accounts', 'brands', 'units', 'warehouses', 'categories', 
    'expense_categories', 'bank_accounts', 'parties', 'customers', 'suppliers', 
    'products', 'product_barcodes', 'product_uom_conversions', 'product_variants', 
    'inventory_batches', 'stocks', 'invoices', 'invoice_items', 'sales', 
    'sale_items', 'sale_item_batches', 'expenses', 'payments', 
    'journal_entries', 'journal_items', 'transactions', 'production_runs'
];

$clonerTables = ['settings', 'accounts', 'brands', 'units', 'warehouses', 'categories', 'expense_categories', 'bank_accounts', 'parties', 'customers', 'suppliers', 'products', 'product_barcodes', 'product_uom_conversions', 'product_variants', 'inventory_batches', 'stocks', 'invoices', 'invoice_items', 'sales', 'sale_items', 'sale_item_batches', 'expenses', 'payments', 'journal_entries', 'journal_items', 'transactions', 'production_runs'];
foreach($clonerTables as $tn) {
    if(!Schema::hasColumn($tn, 'tenant_id')) {
        echo "Table $tn is missing tenant_id column\n";
    }
}
