<?php
use Illuminate\Support\Facades\DB;

echo "--- Query 1: Party Metadata ---\n";
// Using explicit table names to avoid any ambiguity
$results1 = DB::table('parties')
    ->whereIn('name', ['Supplier 9', 'Supplier 11', 'Customer 10'])
    ->orderBy('name')
    ->get(['name', 'type', 'opening_balance', 'opening_balance_type', 'current_balance']);

echo "Name | Type | OB | OB Type | Current Balance\n";
foreach ($results1 as $row) {
    echo "{$row->name} | {$row->type} | {$row->opening_balance} | {$row->opening_balance_type} | {$row->current_balance}\n";
}

echo "\n--- Query 2: Journal Entries ---\n";
$query2 = "SELECT 
    parties.name,
    journal_entries.description as descr,
    accounts.code,
    journal_items.debit,
    journal_items.credit
FROM parties
JOIN journal_entries ON journal_entries.party_id = parties.id
JOIN journal_items ON journal_items.journal_entry_id = journal_entries.id
JOIN accounts ON journal_items.account_id = accounts.id
WHERE parties.name IN ('Supplier 9', 'Supplier 11', 'Customer 10')
ORDER BY parties.name, accounts.code";

$results2 = DB::select($query2);
echo "Name | Description | Code | Debit | Credit\n";
foreach ($results2 as $row) {
    echo "{$row->name} | {$row->descr} | {$row->code} | {$row->debit} | {$row->credit}\n";
}
