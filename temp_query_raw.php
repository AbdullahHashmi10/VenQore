<?php
$query = "SELECT 
    p.name,
    p.type,
    a.code,
    SUM(ji.debit) as total_debit,
    SUM(ji.credit) as total_credit
FROM parties p
JOIN journal_entries je ON je.party_id = p.id
JOIN journal_items ji ON ji.journal_entry_id = je.id
JOIN accounts a ON ji.account_id = a.id
WHERE p.type = 'supplier'
AND je.is_reversed = 0
GROUP BY p.name, p.type, a.code
ORDER BY p.name, a.code";

$results = \Illuminate\Support\Facades\DB::select($query);

echo "Name | Type | Code | Total Debit | Total Credit\n";
echo "---------------------------------------------------------\n";
foreach ($results as $row) {
    echo "{$row->name} | {$row->type} | {$row->code} | {$row->total_debit} | {$row->total_credit}\n";
}
