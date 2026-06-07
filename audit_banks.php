<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$id = DB::table('accounts')->where('code', '1010')->value('id');
echo "ACCOUNT_ID_1010: $id\n";
echo "JOURNAL_ITEMS_WITH_REFERENCES:\n";
$items = DB::table('journal_items')
    ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
    ->where('journal_items.account_id', $id)
    ->select('journal_entries.reference', 'journal_entries.reference_type', 'journal_items.debit', 'journal_items.credit')
    ->get();

foreach ($items as $item) {
    echo "REF: " . ($item->reference ?? 'NULL') . " | TYPE: " . ($item->reference_type ?? 'NULL') . " | DEBIT: {$item->debit} | CREDIT: {$item->credit}\n";
}

echo "\nBANK_ACCOUNTS:\n";
$banks = DB::table('bank_accounts')->get();
foreach ($banks as $bank) {
    echo "ID: {$bank->id} | NAME: {$bank->name} | TYPE: {$bank->account_type} | OB: {$bank->opening_balance}\n";
}
