<?php
use Illuminate\Support\Facades\DB;

$variances = DB::table('journal_entries')
    ->join('journal_items', 'journal_entries.id', '=', 'journal_items.journal_entry_id')
    ->where('journal_entries.source_type', 'sale_variance_dump')
    ->select('journal_entries.source_id as sale_id', DB::raw('GREATEST(journal_items.debit, journal_items.credit) as abs_variance'))
    ->get();

$emptyReturnCount = 0;
$emptyReturnVariance = 0;

$otherCount = 0;
$otherVariance = 0;

foreach ($variances as $v) {
    $sale = DB::table('sales')->where('id', $v->sale_id)->first();
    $itemCount = DB::table('sale_items')->where('sale_id', $v->sale_id)->count();
    
    if ($itemCount == 0 && ($sale->status == 'returned' || $sale->total < 0)) {
        $emptyReturnCount++;
        $emptyReturnVariance += $v->abs_variance;
    } else {
        $otherCount++;
        $otherVariance += $v->abs_variance;
    }
}

echo "Empty Returns (Missing Items): {$emptyReturnCount} records, accounting for Rs. {$emptyReturnVariance} variance.\n";
echo "Other Anomalies (Math Mismatches): {$otherCount} records, accounting for Rs. {$otherVariance} variance.\n";

if ($otherCount > 0) {
    echo "\nLet's check the worst 'Other Anomaly':\n";
    $worstOther = null;
    $maxDiff = -1;
    foreach ($variances as $v) {
        $sale = DB::table('sales')->where('id', $v->sale_id)->first();
        $itemCount = DB::table('sale_items')->where('sale_id', $v->sale_id)->count();
        if ($itemCount > 0 && $v->abs_variance > $maxDiff) {
            $maxDiff = $v->abs_variance;
            $worstOther = $v->sale_id;
        }
    }
    
    $sale = DB::table('sales')->where('id', $worstOther)->first();
    echo "Worst Real Anomaly Sale: {$worstOther} | Ref: {$sale->reference_number} | Legacy Total: {$sale->total} | Variance: {$maxDiff}\n";
    $items = DB::table('sale_items')->where('sale_id', $worstOther)->get();
    echo "Line items:\n";
    foreach ($items as $item) {
        echo "- Item {$item->id}: Qty {$item->quantity} x Price {$item->unit_price} = Subtotal {$item->subtotal}\n";
    }
    echo "Legacy Global Discount: {$sale->discount}\n";
    echo "Legacy Tax: {$sale->tax}\n";
}
