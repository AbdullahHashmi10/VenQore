<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\FinanceController;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

// Mock logged-in user for CLI execution
$admin = User::first();
Auth::login($admin);

$controller = app(FinanceController::class);

echo "UPDATING Abdullah Account (Jazzcash) to 10000...\n";
$req1 = new Request();
$req1->replace([
    'name' => 'Abdullah Account',
    'bank_name' => 'Jazzcash',
    'opening_balance' => 10000,
    'account_number' => '03331234567',
    'account_type' => 'checking'
]);
$controller->updateBankAccount($req1, '019cc99f-5ac0-71bb-9013-d4f63403b6bc');

echo "UPDATING Sir Account (Alfalah) to 60000...\n";
$req2 = new Request();
$req2->replace([
    'name' => 'Sir Account',
    'bank_name' => 'Alfalah',
    'opening_balance' => 60000,
    'account_number' => '123456789',
    'account_type' => 'checking'
]);
$controller->updateBankAccount($req2, '019cc99f-0842-71bd-8f55-eb12447c0635');

echo "ALL UPDATES COMPLETE.\n";
