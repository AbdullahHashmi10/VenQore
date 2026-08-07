<?php
use Illuminate\Support\Facades\DB;

$variances = DB::table('journal_entries')
    ->join('journal_items', 'journal_entries.id', '=', 'journal_items.journal_entry_id')
    ->where('journal_entries.source_type', 'sale_variance_dump')
    ->select('journal_entries.source_id as sale_id', DB::raw('GREATEST(journal_items.debit, journal_items.credit) as abs_variance'))
    ->orderByDesc('abs_variance')
    ->limit(10)
    ->get();

foreach ($variances as $v) {
    $sale = DB::table('sales')->where('id', $v->sale_id)->first();
    $itemCount = DB::table('sale_items')->where('sale_id', $v->sale_id)->count();
    echo "Sale {$v->sale_id} | Status: {$sale->status} | Total: {$sale->total} | Math Total (assumed based on variance): " . ($sale->total - $v->abs_variance) . " | Variance: {$v->abs_variance} | Items: {$itemCount}\n";
}
