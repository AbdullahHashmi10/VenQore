<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    DB::transaction(function () {
        $ids = DB::table('journal_entries')
            ->where('reference_type', 'bank_account_opening')
            ->pluck('id');

        DB::table('journal_items')->whereIn('journal_entry_id', $ids)->delete();
        DB::table('journal_entries')->where('reference_type', 'bank_account_opening')->delete();
    });
    echo "WIPE SUCCESSFUL\n";
} catch (\Exception $e) {
    echo "WIPE FAILED: " . $e->getMessage() . "\n";
}
