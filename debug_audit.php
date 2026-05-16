<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = [
    'products', 'sales', 'sale_items', 'parties', 'invoices', 'invoice_items',
    'expenses', 'stock_adjustments', 'stock_transfers', 'journal_entries',
    'journal_entry_lines', 'payments', 'purchase_orders', 'warehouses',
    'bank_accounts', 'tenant_users', 'categories', 'units', 'settings', 'inventory_batches'
];

echo "§3.1 Null Check:\n";
foreach($tables as $t) {
    if (Schema::hasTable($t)) {
        if (Schema::hasColumn($t, 'tenant_id')) {
            $count = DB::table($t)->whereNull('tenant_id')->count();
            if ($count > 0) echo "FAIL: $t has $count null rows\n";
            else echo "PASS: $t is clean\n";
        } else {
             echo "WARN: $t has no tenant_id column!\n";
        }
    } else {
        echo "SKIP: $t does not exist\n";
    }
}

echo "\n§3.4 Trait Check:\n";
$models = [
    'Product' => 'App\\Models\\Product',
    'Sale' => 'App\\Models\\Sale',
    'Party' => 'App\\Models\\Party',
    'Expense' => 'App\\Models\\Expense',
    'Invoice' => 'App\\Models\\Invoice',
    'Category' => 'App\\Models\\Category',
    'Warehouse' => 'App\\Models\\Warehouse',
    'JournalEntry' => 'App\\Models\\JournalEntry',
    'Account' => 'App\\Models\\Account',
    'Stock' => 'App\\Models\\Stock',
];

foreach($models as $name => $class) {
    if (class_exists($class)) {
        $uses = class_uses_recursive($class);
        if (in_array('App\\Traits\\HasTenant', $uses)) {
            echo "PASS: $name uses HasTenant\n";
        } else {
            echo "FAIL: $name MISSING HasTenant\n";
        }
    } else {
        echo "SKIP: $name class not found\n";
    }
}
