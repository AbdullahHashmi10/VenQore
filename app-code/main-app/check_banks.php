<?php
$banks = \App\Models\BankAccount::whereNot('account_type', 'cash')->get();
foreach ($banks as $bank) {
    echo "Bank: {$bank->name} ({$bank->id})\n";
    $entries = \Illuminate\Support\Facades\DB::table('journal_entries')
        ->where('reference', $bank->id)
        ->get();
    echo "- Entries by reference: " . count($entries) . "\n";
    
    // Check if there are any journal items for 1010 with this bank's reference
    $items = \Illuminate\Support\Facades\DB::table('journal_items')
        ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
        ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
        ->where('accounts.code', '1010')
        ->where('journal_entries.reference', $bank->id)
        ->get();
    echo "- Journal Items for 1010: " . count($items) . "\n";
}
