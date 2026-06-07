<?php
$rows = DB::select("SELECT a.code as account_code, je.description, je.reference_type, ji.debit, ji.credit, je.is_reversed, je.id as entry_id FROM journal_entries je JOIN journal_items ji ON ji.journal_entry_id = je.id JOIN accounts a ON ji.account_id = a.id WHERE a.code IN ('1000', '1010') AND (je.description LIKE '%Mukhra%' OR je.description LIKE '%Expense%') ORDER BY je.created_at ASC");
printf("%-4s | %-40s | %-15s | %10s | %10s | %s | %s\n", "CODE", "Description", "Type", "Debit", "Credit", "REV", "ID");
foreach($rows as $r) {
    printf("%-4s | %-40s | %-15s | %10.2f | %10.2f | %d | %s\n", $r->account_code, substr($r->description, 0, 40), $r->reference_type, $r->debit, $r->credit, $r->is_reversed, $r->entry_id);
}
