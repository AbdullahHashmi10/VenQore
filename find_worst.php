<?php
use Illuminate\Support\Facades\DB;

$variances = DB::table('journal_entries')
    ->join('journal_items', 'journal_entries.id', '=', 'journal_items.journal_entry_id')
    ->where('journal_entries.source_type', 'sale_variance_dump')
    ->select('journal_entries.source_id as sale_id', 'journal_entries.reference', DB::raw('GREATEST(journal_items.debit, journal_items.credit) as abs_variance'))
    ->orderByDesc('abs_variance')
    ->limit(10)
    ->get();

echo "Top 10 Worst Variances:\n";
foreach ($variances as $v) {
    echo "Sale ID: {$v->sale_id} | Ref: {$v->reference} | Variance: {$v->abs_variance}\n";
}

$worstSaleId = $variances->first()->sale_id;

echo "\n--- FORENSIC AUDIT FOR WORST SALE: {$worstSaleId} ---\n";
$sale = DB::table('sales')->where('id', $worstSaleId)->first();
echo "Legacy Sale Total: {$sale->total}\n";
echo "Legacy Subtotal: {$sale->subtotal}\n";
echo "Legacy Discount: {$sale->discount}\n";
echo "Legacy Tax: {$sale->tax}\n";
echo "Parsed Invoice Total: {$sale->invoice_total}\n\n";

$items = DB::table('sale_items')->where('sale_id', $worstSaleId)->get();
echo "Line Items:\n";
foreach ($items as $item) {
    echo "- Item ID: {$item->id} | Qty: {$item->quantity} | Free Qty: {$item->free_quantity} | Unit Price: {$item->unit_price} | Legacy Subtotal: {$item->subtotal} | Math Line Total: {$item->line_total}\n";
}
