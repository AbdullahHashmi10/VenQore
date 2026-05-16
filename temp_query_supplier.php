<?php

$query = "SELECT 
    p.name,
    p.type,
    p.current_balance,
    p.opening_balance_type,
    SUM(CASE WHEN a.code = '2000' THEN ji.credit - ji.debit ELSE 0 END) as ap_from_journal,
    SUM(CASE WHEN a.code = '1200' THEN ji.debit - ji.credit ELSE 0 END) as ar_from_journal
FROM parties p
LEFT JOIN journal_entries je ON je.party_id = p.id AND je.is_reversed = 0
LEFT JOIN journal_items ji ON ji.journal_entry_id = je.id
LEFT JOIN accounts a ON ji.account_id = a.id
WHERE p.name = 'Supplier 2'
GROUP BY p.name, p.type, p.current_balance, p.opening_balance_type";

$results = \Illuminate\Support\Facades\DB::select($query);

echo "Name | Type | Current Balance | OB Type | AP from Journal | AR from Journal\n";
echo "--------------------------------------------------------------------------------\n";
foreach ($results as $row) {
    echo "{$row->name} | {$row->type} | {$row->current_balance} | {$row->opening_balance_type} | {$row->ap_from_journal} | {$row->ar_from_journal}\n";
}
