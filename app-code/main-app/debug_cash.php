<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\BankAccount;

$cashAccount = BankAccount::where('account_type', 'cash')->first();
if ($cashAccount) {
    echo "CASH ACCOUNT ID: " . $cashAccount->id . "\n";
    $entries = DB::table('journal_entries')
        ->join('journal_items', 'journal_entries.id', '=', 'journal_items.journal_entry_id')
        ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
        ->where('journal_entries.reference', $cashAccount->id)
        ->select('journal_entries.reference_type', 'journal_entries.reference', 'accounts.code', 'journal_items.debit', 'journal_items.credit')
        ->get();
    echo "ENTRIES LINKED TO THIS ID:\n";
    echo json_encode($entries, JSON_PRETTY_PRINT) . "\n";
    
    echo "\nENTRIES WITH ACCOUNT 1000 REGARDLESS OF LINK:\n";
    $entries1000 = DB::table('journal_entries')
        ->join('journal_items', 'journal_entries.id', '=', 'journal_items.journal_entry_id')
        ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
        ->where('accounts.code', '1000')
        ->select('journal_entries.reference_type', 'journal_entries.reference', 'accounts.code', 'journal_items.debit', 'journal_items.credit')
        ->get();
    echo json_encode($entries1000, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "NO CASH BANK ACCOUNT FOUND\n";
}
