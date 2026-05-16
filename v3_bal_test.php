<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\BankAccount;

$banks = BankAccount::all();
echo "V3_BALANCE_PER_BANK:\n";
foreach ($banks as $bank) {
    echo "ID: {$bank->id} | NAME: {$bank->name} | TYPE: {$bank->account_type} | V3_BAL: " . $bank->v3Balance() . "\n";
}
echo "BANK_SUM: " . $banks->where('account_type', '!=', 'cash')->map(fn($b) => $b->v3Balance())->sum() . "\n";
