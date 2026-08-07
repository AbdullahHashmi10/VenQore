<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Account;
use App\Models\JournalItem;
use Illuminate\Support\Facades\DB;

$usedAccounts = DB::table('journal_items')
    ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
    ->select('accounts.code', 'accounts.name', DB::raw('count(*) as count'), DB::raw('sum(debit) as total_debit'), DB::raw('sum(credit) as total_credit'))
    ->groupBy('accounts.code', 'accounts.name')
    ->get();

echo "Accounts with Journal Activity:\n";
foreach ($usedAccounts as $row) {
    echo "- [{$row->code}] {$row->name}: Count={$row->count}, Dr={$row->total_debit}, Cr={$row->total_credit}\n";
}
