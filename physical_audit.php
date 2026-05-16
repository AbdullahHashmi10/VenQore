<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "PHYSICAL_TABLE_COLUMNS (bank_accounts):\n";
$banks = DB::table('bank_accounts')->get();
foreach ($banks as $bank) {
    echo "ID: {$bank->id} | NAME: {$bank->name} | TYPE: {$bank->account_type} | CURRENT_BAL_COL: " . ($bank->current_balance ?? 'NULL') . "\n";
}
