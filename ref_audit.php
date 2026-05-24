<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$refId = '019cc99f-0842-71bd-8f55-eb12447c0635'; // Sir Account
$items = DB::table('journal_items')
    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
    ->where('journal_entries.reference', $refId)
    ->select('journal_items.*', 'journal_entries.description')
    ->get();

echo "ALL_LEDGER_ITEMS_FOR_REF_$refId:\n";
foreach ($items as $item) {
    echo "ID: {$item->id} | ACCOUNT: {$item->account_id} | DEBIT: {$item->debit} | CREDIT: {$item->credit} | DESC: {$item->description}\n";
}
echo "NET_REF_SUM: " . $items->sum('debit') - $items->sum('credit') . "\n";
