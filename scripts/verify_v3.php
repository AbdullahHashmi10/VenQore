<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

echo "\n=== CHECK 2: V3 Migration — Table Verification ===\n";
$tables = [
    'payment_allocations',
    'party_snapshots',
    'product_uom_conversions',
    'product_price_tiers',
    'discount_limits',
    'disaster_claims',
    'employees',
    'disassembly_boms',
    'disassembly_bom_items',
    'system_settings',
];

$allGood = true;
foreach ($tables as $table) {
    if (Schema::hasTable($table)) {
        echo "  OK:      $table\n";
    } else {
        echo "  MISSING: $table\n";
        $allGood = false;
    }
}

echo "\n=== CHECK 2: Column Additions ===\n";
$columns = [
    'journal_entries'   => ['idempotency_key', 'approved_by', 'narration', 'is_reversed', 'reversed_by', 'reference_type'],
    'inventory_batches' => ['batch_type', 'initial_qty', 'production_run_id'],
    'products'          => ['price_includes_tax', 'is_manufactured', 'is_expiry_tracked'],
    'sales'             => ['source_order_id'],
    'accounts'          => ['normal_balance'],
];
foreach ($columns as $tbl => $cols) {
    foreach ($cols as $col) {
        if (Schema::hasColumn($tbl, $col)) {
            echo "  OK:      $tbl.$col\n";
        } else {
            echo "  MISSING: $tbl.$col\n";
            $allGood = false;
        }
    }
}

echo "\n=== CHECK 2: Seeded Data ===\n";
$dlCount = DB::table('discount_limits')->count();
$ssCount = DB::table('system_settings')->count();
$acCount = DB::table('accounts')->count();
echo "  discount_limits rows: $dlCount (expected: 3)\n";
echo "  system_settings rows: $ssCount (expected: 3)\n";
echo "  accounts total rows:  $acCount\n";

if ($dlCount != 3) { echo "  FAIL: discount_limits should have 3 rows\n"; $allGood = false; }
if ($ssCount != 3) { echo "  FAIL: system_settings should have 3 rows\n"; $allGood = false; }

// Spot-check key V3 account codes exist
$v3Codes = ['1150', '2100', '2300', '2400', '6300', '6700', '6800', '6900', '6950', '6960', '7000'];
echo "\n=== CHECK 2: V3 Account Codes ===\n";
foreach ($v3Codes as $code) {
    $exists = DB::table('accounts')->where('code', $code)->exists();
    echo "  " . ($exists ? "OK:   " : "MISS: ") . "account code $code\n";
    if (!$exists) $allGood = false;
}

echo "\n" . ($allGood ? "CHECK 2: PASS\n" : "CHECK 2: FAIL — see above\n");
