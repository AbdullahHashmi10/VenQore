<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\DB;

try {
    DB::statement('SET FOREIGN_KEY_CHECKS = 0;');

    $tables = [
        'inventory_batches',
        'sale_item_batches',
        'purchase_items',
        'sale_items',
        'sales',
        'invoices',
        'payments',
        'expenses',
        'fund_transactions',
        'journal_items',
        'journal_entries',
        'audit_logs'
    ];

    foreach ($tables as $table) {
        DB::statement('TRUNCATE TABLE ' . $table . ';');
        echo "Truncated $table\n";
    }

    DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
    
    // Also reset stock values on products and balances on parties/bank_accounts just to be safe
    DB::table('products')->update(['stock_quantity' => 0]);
    DB::table('parties')->update(['current_balance' => 0]);
    DB::table('bank_accounts')->update(['current_balance' => 0]);
    
    echo "Done resolving lingering references! Database wiped clean.\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
}
