<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\V3\AccountingService;

$svc = app(AccountingService::class);
echo "CASH_BALANCE: " . $svc->getBalance('1000') . "\n";
echo "BANK_BALANCE: " . $svc->getBalance('1010') . "\n";
