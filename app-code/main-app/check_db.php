<?php
$nullCounts = [];
$tables = ['sales', 'sale_items', 'journal_entries', 'journal_items', 'products'];
foreach ($tables as $table) {
    $count = DB::table($table)->whereNull('tenant_id')->count();
    $nullCounts[$table] = $count;
    if ($count > 0) {
        // Fix by assigning to correct tenant (if possible, but usually just pick the first tenant or default to 1)
        // Assuming demo tenant or active tenant... The prompt says 'fix by assigning to the correct tenant'.
        // For now, let's just output the count to decide the fix
    }
}
echo json_encode($nullCounts);
