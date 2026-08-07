<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$accounts = \App\Models\BankAccount::orderBy('name')->get()->map(function($a) {
    return [
        'name' => $a->bank_name ?? $a->name,
        'v3_balance' => $a->v3Balance()
    ];
});

echo json_encode($accounts, JSON_PRETTY_PRINT);
