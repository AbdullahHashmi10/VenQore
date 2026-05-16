<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Account;
use App\Models\JournalItem;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

echo "Diagnostic Report\n";
echo "=================\n";

echo "Sales Total (sales table): " . Sale::sum('net_sales') . "\n";
echo "Sales Count: " . Sale::count() . "\n";

echo "Accounts Overview:\n";
$accounts = Account::all();
foreach ($accounts as $acc) {
    echo "- [{$acc->code}] {$acc->name} ({$acc->type}): balance={$acc->balance}\n";
}

echo "\nJournal Items Count: " . JournalItem::count() . "\n";

echo "\nIncome accounts activity (sum of credit - debit):\n";
$incomeAccs = Account::where('type', 'income')->get();
foreach ($incomeAccs as $acc) {
    $credit = JournalItem::where('account_id', $acc->id)->sum('credit');
    $debit = JournalItem::where('account_id', $acc->id)->sum('debit');
    echo "- [{$acc->code}] {$acc->name}: In=" . ($credit - $debit) . "\n";
}

echo "\nAsset accounts activity (sum of debit - credit):\n";
$assetAccs = Account::where('code', '1200')->get();
foreach ($assetAccs as $acc) {
    $debit = JournalItem::where('account_id', $acc->id)->sum('debit');
    $credit = JournalItem::where('account_id', $acc->id)->sum('credit');
    echo "- [{$acc->code}] {$acc->name}: Balance=" . ($debit - $credit) . "\n";
}
