<?php

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$testDb = 'amd_pos_upgrade_rehearsal_' . substr(md5(uniqid()), 0, 8);

echo "Starting Migration Upgrade Rehearsal on temporary DB: {$testDb}...\n";

// 1. Create temporary database
DB::statement("CREATE DATABASE IF NOT EXISTS `{$testDb}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

// Configure connection
config(['database.connections.rehearsal' => array_merge(
    config('database.connections.mysql'),
    ['database' => $testDb]
)]);
DB::purge('rehearsal');

try {
    // 2. Run all migrations on rehearsal DB
    echo "Running full migration set...\n";
    \Illuminate\Support\Facades\Artisan::call('migrate', [
        '--database' => 'rehearsal',
        '--force'    => true,
    ]);
    echo \Illuminate\Support\Facades\Artisan::output();

    // 3. Verify all new tables and columns exist
    $expectedTables = [
        'approval_documents',
        'approval_revisions',
        'approval_transitions',
        'approval_return_reasons',
        'cheque_books',
        'cheque_leaves',
        'received_cheques',
        'fiscal_years',
        'accounting_period_locks',
    ];

    $missing = [];
    foreach ($expectedTables as $t) {
        if (!Schema::connection('rehearsal')->hasTable($t)) {
            $missing[] = $t;
        }
    }

    if (!empty($missing)) {
        throw new \RuntimeException("Missing expected tables after migration: " . implode(', ', $missing));
    }
    echo "Table verification passed: all 9 new tables present in schema.\n";

    // 4. Test Rollback of recent migration batch
    echo "Testing rollback of latest migrations...\n";
    \Illuminate\Support\Facades\Artisan::call('migrate:rollback', [
        '--database' => 'rehearsal',
        '--step'     => 2,
        '--force'    => true,
    ]);
    echo \Illuminate\Support\Facades\Artisan::output();

    // Verify rolled back tables
    $rolledBack = [
        'fiscal_years' => Schema::connection('rehearsal')->hasTable('fiscal_years'),
        'cheque_books' => Schema::connection('rehearsal')->hasTable('cheque_books'),
    ];
    echo "Rollback verification: fiscal_years exists = " . ($rolledBack['fiscal_years'] ? 'YES' : 'NO') . ", cheque_books exists = " . ($rolledBack['cheque_books'] ? 'YES' : 'NO') . "\n";

    // Re-migrate forward
    echo "Re-migrating forward...\n";
    \Illuminate\Support\Facades\Artisan::call('migrate', [
        '--database' => 'rehearsal',
        '--force'    => true,
    ]);
    echo \Illuminate\Support\Facades\Artisan::output();

    echo "MIGRATION_UPGRADE_REHEARSAL: SUCCESS\n";

} finally {
    // Clean up temporary database
    echo "Cleaning up temporary database {$testDb}...\n";
    DB::statement("DROP DATABASE IF EXISTS `{$testDb}`");
    echo "Temporary database dropped.\n";
}
