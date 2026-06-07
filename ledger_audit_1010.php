<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$id = DB::table('accounts')->where('code', '1010')->value('id');
$items = DB::table('journal_items')
    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
    ->where('journal_items.account_id', $id)
    ->select('journal_items.*', 'journal_entries.reference', 'journal_entries.description')
    ->get();

echo "BANK_LEDGER_AUDIT (Code 1010):\n";
foreach ($items as $item) {
    echo "ID: {$item->id} | REF: " . ($item->reference ?? 'NULL') . " | DEBIT: {$item->debit} | CREDIT: {$item->credit} | DESC: {$item->description}\n";
}
echo "TOTAL_DEBIT: " . $items->sum('debit') . "\n";
echo "TOTAL_CREDIT: " . $items->sum('credit') . "\n";
echo "NET_BALANCE: " . ($items->sum('debit') - $items->sum('credit')) . "\n";
