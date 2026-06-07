<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\BankAccount;
use App\Models\Account;
use Illuminate\Support\Facades\DB;

echo "1. VERIFYING BANK ACCOUNT BALANCES (V3 Unified):\n";
foreach (BankAccount::all() as $a) {
    echo "{$a->name}: Rs " . number_format($a->v3Balance(), 2) . "\n";
}

echo "\n2. VERIFYING CASH BALANCE (V3 GL Code 1000):\n";
$cashId = Account::where('code', '1000')->value('id');
$cashBal = (float) DB::table('journal_items')
    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
    ->where('journal_items.account_id', $cashId)
    ->where('journal_entries.is_reversed', 0)
    ->selectRaw('COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0) as balance')
    ->value('balance');
echo "Cash on Hand (Unified Ledger): Rs " . number_format($cashBal, 2) . "\n";

echo "\n3. TRIAL BALANCE CHECK:\n";
$res = DB::select("SELECT ABS(SUM(debit) - SUM(credit)) AS must_be_zero FROM journal_items ji JOIN journal_entries je ON ji.journal_entry_id = je.id WHERE je.is_reversed = 0;");
echo "Trial Variance: " . ($res[0]->must_be_zero ?? 'NULL') . "\n";
