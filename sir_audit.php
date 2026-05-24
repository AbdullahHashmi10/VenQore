<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$sirId = '019cc99f-0842-71bd-8f55-eb12447c0635';
$items = DB::table('journal_items')
    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
    ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
    ->where('journal_entries.reference', $sirId)
    ->where('journal_entries.is_reversed', 0)
    ->select('accounts.code', 'journal_items.debit', 'journal_items.credit', 'journal_entries.description')
    ->get();

echo "SIR_ACCOUNT_LEDGER_ITEMS:\n";
foreach ($items as $item) {
    echo "CODE: {$item->code} | DEBIT: {$item->debit} | CREDIT: {$item->credit} | DESC: {$item->description}\n";
}
echo "TOTAL: " . $items->sum('debit') - $items->sum('credit') . "\n";
