<?php
use Illuminate\Support\Facades\DB;

$worstSaleId = '019c681d-b4ef-7060-8a9b-ae8438a6e687';
$sale = DB::table('sales')->where('id', $worstSaleId)->first();
echo "--- FORENSIC AUDIT FOR WORST SALE ---\n";
echo "Sale ID: {$sale->id}\n";
echo "Reference: {$sale->reference_number}\n";
echo "Type: {$sale->type}\n";
echo "Status: {$sale->status}\n";
echo "Payment Status: {$sale->payment_status}\n";
echo "Legacy Total: {$sale->total}\n";
echo "Legacy Subtotal: {$sale->subtotal}\n";
echo "Legacy Discount: {$sale->discount}\n";
echo "Legacy Tax: {$sale->tax}\n";
echo "Created At: {$sale->created_at}\n\n";

$items = DB::table('sale_items')->where('sale_id', $worstSaleId)->get();
echo "Line Items Count: " . count($items) . "\n";
foreach ($items as $item) {
    echo "- Item ID: {$item->id} | Qty: {$item->quantity} | Unit Price: {$item->unit_price} | Legacy Subtotal: {$item->subtotal}\n";
}

$payments = DB::table('payments')->where('payable_id', $worstSaleId)->get();
echo "\nPayments Count: " . count($payments) . "\n";
foreach ($payments as $payment) {
    echo "- Payment ID: {$payment->id} | Amount: {$payment->amount} | Type: {$payment->type}\n";
}
