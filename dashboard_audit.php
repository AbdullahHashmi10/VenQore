<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\DashboardController;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

$admin = User::first();
Auth::login($admin);

$controller = app(DashboardController::class);
$response = $controller->index();
$data = $response->toResponse(request())->getData();

echo "DASHBOARD CASH DATA BALANCE: " . ($data->cashData->balance ?? 'N/A') . "\n";
echo "DASHBOARD BANK ACCOUNTS (V3 Unified):\n";
$sumBank = 0;
foreach ($data->bankAccounts as $ba) {
    echo "{$ba->name}: Rs " . number_format($ba->current_balance, 2) . "\n";
    $sumBank += $ba->current_balance;
}
echo "TOTAL BANK: " . $sumBank . "\n";

echo "\nDASHBOARD CASH ACCOUNTS (V3 Unified):\n";
$sumCash = 0;
foreach ($data->cashAccounts as $ca) {
    echo "{$ca->name}: Rs " . number_format($ca->current_balance, 2) . "\n";
    $sumCash += $ca->current_balance;
}
echo "TOTAL CASH ACCOUNTS: " . $sumCash . "\n";

echo "\nGRAND TOTAL (Expected): " . ($sumBank + ($data->cashData->balance ?? 0)) . "\n";
