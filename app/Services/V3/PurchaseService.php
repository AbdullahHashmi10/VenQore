<?php

namespace App\Services\V3;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PurchaseService
{
    public function __construct(
        private AccountingService $accounting,
        private InventoryService  $inventory,
        private TaxService        $tax
    ) {}

    public function store(array $validated)
    {
        return DB::transaction(function () use ($validated) {
            $purchaseId    = Str::uuid()->toString();
            $invoiceNumber = \App\Services\SequenceService::generateTransactionNumber('PUR');

            // ── 1. Calculate totals ───────────────────────────────────
            $subtotal  = 0.00;
            $taxTotal  = 0.00;
            $itcTotal  = 0.00;
            $expTotal  = 0.00;
            $lineItems = [];

            foreach ($validated['items'] as $item) {
                $lineCost    = round($item['qty'] * $item['unit_cost'], 2);
                $businessPct = isset($item['business_pct'])
                                ? (float) $item['business_pct']
                                : 100.0; // default full ITC

                $taxCalc = $this->tax->calculateLineTax(
                    amount:           $lineCost,
                    taxRate:          $item['tax_rate'] ?? 0,
                    priceIncludesTax: false
                );

                $recoverableTax   = round($taxCalc['tax'] * ($businessPct / 100), 2);
                $nonRecoverableTax = round($taxCalc['tax'] - $recoverableTax, 2);

                $subtotal  += $taxCalc['net'];
                $taxTotal  += $taxCalc['tax'];          // total tax for grand total calc
                $itcTotal  += $recoverableTax;          // goes to 2300
                $expTotal  += $nonRecoverableTax;       // goes to 6000

                $lineItems[] = array_merge($item, [
                    'line_total'        => $lineCost,
                    'tax_amount'        => $taxCalc['tax'],
                    'recoverable_tax'   => $recoverableTax,
                    'nonrecoverable_tax'=> $nonRecoverableTax,
                    'business_pct'      => $businessPct,
                ]);
            }

            $grandTotal = round($subtotal + $taxTotal, 2);

            // ── 2. Build journal lines ────────────────────────────────
            $journalLines = [
                ['account_code' => '1100', 'debit' => $subtotal, 'credit' => 0],
            ];

            if ($itcTotal > 0) {
                $journalLines[] = [
                    'account_code' => '2300',
                    'debit'        => $itcTotal,
                    'credit'       => 0,
                ];
            }

            if ($expTotal > 0) {
                $journalLines[] = [
                    'account_code' => '6000',
                    'debit'        => $expTotal,
                    'credit'       => 0,
                ];
            }

            if ($validated['payment_method'] === 'cash') {
                // B3 — Cash leaves immediately
                $journalLines[] = [
                    'account_code' => '1000',
                    'debit'        => 0,
                    'credit'       => $grandTotal,
                    'party_id'     => $validated['supplier_id'] ?? $validated['vendor_id'] ?? null,
                ];
                $paymentStatus = 'paid';
            } else {
                // B6 — Liability created, cash stays
                $journalLines[] = [
                    'account_code' => '2000',
                    'debit'        => 0,
                    'credit'       => $grandTotal,
                    'party_id'     => $validated['supplier_id'] ?? $validated['vendor_id'] ?? null,
                ];
                $paymentStatus = 'unpaid';
            }

            // ── 3. Post the journal entry ─────────────────────────────
            $journalEntry = $this->accounting->createEntry([
                'date'           => $validated['purchase_date'],
                'reference_type' => 'purchase',
                'reference'      => $purchaseId,
                'description'    => ($validated['payment_method'] === 'cash' ? 'Cash' : 'Credit')
                                    . " purchase — {$invoiceNumber}",
                'party_id'       => $validated['supplier_id'] ?? $validated['vendor_id'] ?? null,
            ], $journalLines);

            // ── 4. Insert purchases record ────────────────────────────
            DB::table('purchases')->where('purchases.tenant_id', app('current.tenant')->id)->insert([
                'id'               => $purchaseId,
                'tenant_id'        => app('current.tenant')->id,
                'invoice_number'   => $validated['supplier_invoice'] ?? $invoiceNumber,
                'party_id'         => $validated['supplier_id'] ?? $validated['vendor_id'] ?? null,
                'warehouse_id'     => $validated['warehouse_id'],
                'purchase_date'    => $validated['purchase_date'],
                'subtotal'         => $subtotal,
                'tax'              => $taxTotal,
                'total'            => $grandTotal,
                'payment_status'   => $paymentStatus,
                'payment_method'   => $validated['payment_method'],
                'journal_entry_id' => $journalEntry->id,
                'created_by'       => auth()->id() ?? 1,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            // ── 5. Insert purchase_items + create inventory batches ───
            foreach ($lineItems as $item) {
                $itemId = Str::uuid()->toString();

                DB::table('purchase_items')->where('purchase_items.tenant_id', app('current.tenant')->id)->insert([
                    'id'           => $itemId,
                    'tenant_id'    => app('current.tenant')->id,
                    'purchase_id'  => $purchaseId,
                    'product_id'   => $item['product_id'],
                    'qty'          => $item['qty'],
                    'unit_cost'    => $item['unit_cost'],
                    'tax_rate'     => $item['tax_rate'] ?? 0,
                    'business_pct' => $item['business_pct'],
                    'line_total'   => $item['line_total'],
                    'created_at'   => now(),
                ]);

                // receiveBatch — unit_cost locked here, never changed
                $batch = $this->inventory->fifo->receiveBatch(
                    productId:   $item['product_id'],
                    warehouseId: $validated['warehouse_id'],
                    qty:         (float) $item['qty'],
                    unitCost:    (float) $item['unit_cost'],
                    batchType:   'purchase',
                    purchaseId:  $purchaseId
                );

                // Link batch back to purchase_item
                DB::table('purchase_items')->where('purchase_items.tenant_id', app('current.tenant')->id)
                    ->where('id', $itemId)
                    ->update(['inventory_batch_id' => $batch->id]);

                // Auto-Update Product Cost Price based on policy
                $product = Product::find($item['product_id']);
                if ($product) {
                    $policy = \App\Helpers\SettingsHelper::getProductCostUpdatePolicy();
                    $newCost = (float)$item['unit_cost'];
                    $oldCost = (float)$product->cost_price;

                    $shouldUpdate = false;
                    if ($policy === 'always') {
                        $shouldUpdate = true;
                    } elseif ($policy === 'increase_only' && $newCost > $oldCost) {
                        $shouldUpdate = true;
                    } elseif ($policy === 'decrease_only' && $newCost < $oldCost) {
                        $shouldUpdate = true;
                    }

                    if ($shouldUpdate) {
                        $product->update(['cost_price' => $newCost]);
                    }
                }
            }

            return DB::table('purchases')->where('purchases.tenant_id', app('current.tenant')->id)
                ->join('parties', 'purchases.party_id', '=', 'parties.id')
                ->where('purchases.id', $purchaseId)
                ->select('purchases.*', 'parties.name as supplier_name')
                ->first();
        });
    }

    public function createReturn(string $purchaseId, array $data)
    {
        $purchase = DB::table('purchases')->where('purchases.tenant_id', app('current.tenant')->id)->where('id', $purchaseId)->firstOrFail();

        return DB::transaction(function () use ($data, $purchase, $purchaseId) {
            $totalReturnCost = 0.00;
            $journalLines    = [];

            foreach ($data['items'] as $item) {
                $pi = DB::table('purchase_items')
                    ->where('tenant_id', app('current.tenant')->id)
                    ->where('id', $item['purchase_item_id'])
                    ->first();

                if (!$pi) {
                    throw new \InvalidArgumentException("Purchase item not found");
                }

                $batchId = $item['inventory_batch_id'] ?? $pi->inventory_batch_id;

                $batch = DB::table('inventory_batches')->where('inventory_batches.tenant_id', app('current.tenant')->id)
                    ->where('id', $batchId)
                    ->lockForUpdate()
                    ->firstOrFail();

                $returnQty = (float)($item['qty_returned'] ?? $item['return_qty']);

                // Validate return qty does not exceed remaining
                if ($returnQty > (float) $batch->remaining_qty) {
                    throw new \InvalidArgumentException(
                        "Return qty {$returnQty} exceeds remaining batch qty " .
                        "{$batch->remaining_qty} for batch {$batch->id}. " .
                        "Cannot return stock that has already been sold."
                    );
                }

                // Use original batch unit_cost — never recalculate
                $lineCost         = round($returnQty * (float) $batch->unit_cost, 2);
                $totalReturnCost += $lineCost;

                // Deduct from inventory batch
                DB::table('inventory_batches')->where('inventory_batches.tenant_id', app('current.tenant')->id)
                    ->where('id', $batch->id)
                    ->decrement('remaining_qty', $returnQty);

                // Deduct from physical product stock
                DB::table('products')->where('tenant_id', app('current.tenant')->id)
                    ->where('id', $batch->product_id)
                    ->decrement('stock_quantity', $returnQty);

                // Deduct from warehouse stock
                DB::table('stocks')->where('tenant_id', app('current.tenant')->id)
                    ->where('product_id', $batch->product_id)
                    ->where('warehouse_id', $batch->warehouse_id)
                    ->decrement('quantity', $returnQty);

                // Log a negative stock movement
                DB::table('stock_movements')->insert([
                    'id'           => Str::uuid()->toString(),
                    'tenant_id'    => app('current.tenant')->id,
                    'product_id'   => $batch->product_id,
                    'warehouse_id' => $batch->warehouse_id,
                    'quantity'     => -$returnQty,
                    'type'         => 'purchase_return',
                    'reference_id' => $purchase->invoice_number,
                    'description'  => "Purchase return for invoice {$purchase->invoice_number}",
                    'user_id'      => auth()->id() ?? 1,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }

            // B18 Journal:
            // DR 2000 Accounts Payable (supplier owes us back)
            // CR 1100 Inventory Asset  (stock leaves)
            $journalLines = [
                [
                    'account_code' => '2000',
                    'debit'        => $totalReturnCost,
                    'credit'       => 0,
                    'party_id'     => $purchase->party_id,
                ],
                [
                    'account_code' => '1100',
                    'debit'        => 0,
                    'credit'       => $totalReturnCost,
                ],
            ];

            $returnId = Str::uuid()->toString();

            $journalEntry = $this->accounting->createEntry([
                'date'     => $data['return_date'],
                'reference_type' => 'purchase_return',
                'reference'   => $returnId,
                'description'    => "Purchase return — {$purchase->invoice_number}: {$data['reason']}",
                'party_id'       => $purchase->party_id,
            ], $journalLines);

            // Record the return for audit trail
            DB::table('purchase_returns')->insert([
                'id'               => $returnId,
                'tenant_id'        => app('current.tenant')->id,
                'purchase_id'      => $purchaseId,
                'return_date'      => $data['return_date'],
                'reason'           => $data['reason'],
                'total_amount'     => $totalReturnCost,
                'journal_entry_id' => $journalEntry->id,
                'created_by'       => auth()->id() ?? 1,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
        });
    }
}
