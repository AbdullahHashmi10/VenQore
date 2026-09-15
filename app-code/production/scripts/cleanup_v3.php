<?php
// Cleanup script — drop V3 tables if they exist
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

$tables = [
    'disassembly_bom_items',
    'disassembly_boms',
    'disaster_claims',
    'discount_limits',
    'product_price_tiers',
    'product_uom_conversions',
    'party_snapshots',
    'payment_allocations',
    'employees',
    'system_settings',
];

Schema::disableForeignKeyConstraints();
foreach ($tables as $table) {
    if (Schema::hasTable($table)) {
        Schema::drop($table);
        echo "Dropped: $table\n";
    } else {
        echo "Not found: $table\n";
    }
}

// Also remove the failed migration record if it exists
DB::table('migrations')
    ->where('migration', '2026_03_05_000001_v3_foundation_schema')
    ->delete();
echo "Cleaned migration record\n";

// Remove columns added to existing tables
if (Schema::hasColumn('journal_entries', 'idempotency_key')) {
    Schema::table('journal_entries', fn($t) => $t->dropColumn(['idempotency_key','approved_by','narration','is_reversed','reversed_by','reference_type']));
    echo "Rolled back journal_entries columns\n";
}
if (Schema::hasColumn('inventory_batches', 'batch_type')) {
    Schema::table('inventory_batches', fn($t) => $t->dropColumn(['batch_type','initial_qty','production_run_id']));
    echo "Rolled back inventory_batches columns\n";
}
if (Schema::hasColumn('products', 'price_includes_tax')) {
    Schema::table('products', fn($t) => $t->dropColumn(['price_includes_tax','is_manufactured','is_expiry_tracked']));
    echo "Rolled back products columns\n";
}
if (Schema::hasColumn('sales', 'source_order_id')) {
    Schema::table('sales', fn($t) => $t->dropColumn('source_order_id'));
    echo "Rolled back sales columns\n";
}
if (Schema::hasColumn('accounts', 'normal_balance')) {
    Schema::table('accounts', fn($t) => $t->dropColumn('normal_balance'));
    echo "Rolled back accounts.normal_balance\n";
}

Schema::enableForeignKeyConstraints();
echo "Done.\n";
