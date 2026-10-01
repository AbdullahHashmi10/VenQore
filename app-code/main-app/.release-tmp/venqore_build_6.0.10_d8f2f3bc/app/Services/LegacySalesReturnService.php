<?php

namespace App\Services;

use App\Engines\AccountingService;
use App\Engines\FifoService;
use App\Engines\PaymentService;
use App\Models\Activity;
use App\Models\Payment;
use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleItemBatch;
use App\Models\StockMovement;
use App\Models\Tenant;
use App\Models\User;
use App\Services\SequenceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * LegacySalesReturnService — handles SRET (legacy credit-note-style) returns.
 *
 * This service owns the posting logic that was previously inline in
 * ReturnController::store(). It is called by:
 *   1. ReturnController::store()  — the direct (no-approval) path
 *   2. SalesReturnApprovalAdapter::post()  — after approval on the approved path
 *
 * Callers are responsible for the DB transaction wrapper.
 *
 * Payload shape:
 *   customer_id          — party id
 *   original_sale_id     — sale being returned against
 *   return_reason        — nullable string
 *   warehouse_id         — nullable warehouse id (falls back to sale's warehouse)
 *   items[]
 *     product_id
 *     original_sale_item_id
 *     quantity
 *     price
 *     tax_rate   (nullable)
 *     discount   (nullable)
 *   payment_method       — 'cash' | 'credit'
 *   amount_refunded      — numeric
 *   payment_account_id   — nullable account id
 *   notes                — nullable
 *   date                 — nullable date string
 */
class LegacySalesReturnService
{
    public function __construct(
        private AccountingService $accounting,
        private FifoService $fifo,
        private PaymentService $paymentService,
    ) {}

    /**
     * Validate that the items in the payload are returnable (cap check).
     * Call this both at submission time and at revalidation time.
     *
     * @throws ValidationException
     */
    public function validateCaps(array $data, Tenant $tenant): void
    {
        $tenantId   = $tenant->id;
        $originalId = $data['original_sale_id'];

        $sold = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.tenant_id', $tenantId)
            ->whereNull('sales.deleted_at')
            ->whereNull('sale_items.deleted_at')
            ->where('sale_items.sale_id', $originalId)
            ->pluck('sale_items.quantity', 'sale_items.id');

        $lineReturned = DB::table('sale_items')
            ->where('sale_id', $originalId)
            ->pluck('returned_quantity', 'id');

        $back = DB::table('sale_items')
            ->join('sales as r', 'sale_items.sale_id', '=', 'r.id')
            ->where('r.tenant_id', $tenantId)
            ->where('r.original_sale_id', $originalId)
            ->where('r.status', 'returned')
            ->whereNotNull('sale_items.original_sale_item_id')
            ->groupBy('sale_items.original_sale_item_id')
            ->selectRaw('sale_items.original_sale_item_id as line_id, SUM(ABS(sale_items.quantity)) as qty')
            ->pluck('qty', 'line_id');

        $returnable = [];
        foreach ($sold as $lineId => $qty) {
            $already = max((float) ($back[$lineId] ?? 0), (float) ($lineReturned[$lineId] ?? 0));
            $returnable[$lineId] = max(0, (float) $qty - $already);
        }

        foreach ($data['items'] as $i => $item) {
            $lineId = $item['original_sale_item_id'] ?? null;
            if (!$lineId || !array_key_exists($lineId, $returnable)) {
                throw ValidationException::withMessages([
                    "items.{$i}.quantity" => ['That line belongs to a different sale.'],
                ]);
            }
            if ((float) $item['quantity'] > $returnable[$lineId] + 0.0001) {
                $name = Product::find($item['product_id'])?->name ?? 'this item';
                throw ValidationException::withMessages([
                    "items.{$i}.quantity" => ["Only {$returnable[$lineId]} of {$name} is still returnable on that sale."],
                ]);
            }
        }
    }

    /**
     * Execute the full SRET posting inside a transaction.
     *
     * @param  array   $data    Validated payload (see class docblock for shape)
     * @param  Tenant  $tenant
     * @param  User    $user
     * @return array   ['return_id', 'refunded', 'credited', 'reference_number']
     */
    public function process(array $data, Tenant $tenant, User $user): array
    {
        $tenantId   = $tenant->id;
        $originalId = $data['original_sale_id'];

        // ── 1. Compute amounts ─────────────────────────────────────────────────
        $goods   = 0.0;
        $taxBack = 0.0;
        $itemsData = [];

        foreach ($data['items'] as $item) {
            $qty      = (float) $item['quantity'];
            $price    = (float) $item['price'];
            $discount = (float) ($item['discount'] ?? 0);
            $net      = max(0, ($qty * $price) - $discount);
            $rate     = (float) ($item['tax_rate'] ?? 0);
            $lineTax  = round($net * ($rate / 100), 2);

            $goods   += $net;
            $taxBack += $lineTax;

            $itemsData[] = [
                'product_id'            => $item['product_id'],
                'original_sale_item_id' => $item['original_sale_item_id'] ?? null,
                'quantity'              => $qty,
                'price'                 => $price,
                'discount'              => $discount,
                'tax_rate'              => $rate,
                'tax'                   => $lineTax,
                'total'                 => $net,
            ];
        }

        $subtotal    = round($goods, 2);
        $taxBack     = round($taxBack, 2);
        $returnValue = round($subtotal + $taxBack, 2);
        $refundNow   = round(min(max(0, (float) ($data['amount_refunded'] ?? 0)), $returnValue), 2);
        $asCredit    = round($returnValue - $refundNow, 2);

        // ── 2. The return sale (negative SRET record) ──────────────────────────
        $reference   = SequenceService::generateTransactionNumber('SRET');
        $warehouseId = $data['warehouse_id']
            ?? DB::table('sales')->where('id', $originalId)->value('warehouse_id')
            ?? \App\Models\Warehouse::first()?->id
            ?? 1;

        app()->instance('current.tenant', $tenant);

        $sale = Sale::forceCreate([
            'tenant_id'        => $tenantId,
            'reference_number' => $reference,
            'party_id'         => $data['customer_id'],
            'customer_id'      => null,
            'user_id'          => $user->id,
            'warehouse_id'     => $warehouseId,
            'original_sale_id' => $originalId,
            'return_reason'    => $data['return_reason'] ?? null,
            'subtotal'         => -$subtotal,
            'tax'              => -$taxBack,
            'discount'         => 0,
            'total'            => -$returnValue,
            'net_sales'        => -$subtotal,
            'subtotal_gross'   => -$subtotal,
            'total_tax'        => -$taxBack,
            'invoice_total'    => -$returnValue,
            'tendered_amount'  => -$refundNow,
            'change_return'    => 0,
            'status'           => 'returned',
            'payment_status'   => 'refunded',
            'payment_method'   => $data['payment_method'] ?? 'cash',
            'notes'            => $data['notes'] ?? null,
            'posted_at'        => isset($data['date']) ? $data['date'] : now(),
        ]);

        // ── 3. Items, FIFO stock restoration ──────────────────────────────────
        $totalCogs = 0.0;

        foreach ($itemsData as $itemDatum) {
            $productRecord = Product::find($itemDatum['product_id']);

            SaleItem::create([
                'sale_id'                => $sale->id,
                'product_id'             => $itemDatum['product_id'],
                'original_sale_item_id'  => $itemDatum['original_sale_item_id'],
                'quantity'               => -$itemDatum['quantity'],
                'unit_price'             => $itemDatum['price'],
                'discount_amount'        => $itemDatum['discount'],
                'tax_rate'               => $itemDatum['tax_rate'],
                'subtotal'               => -$itemDatum['total'],
                'net_amount'             => -$itemDatum['total'],
                'cost_price'             => $productRecord?->cost_price ?? 0,
            ]);

            $restored = false;
            if ($itemDatum['original_sale_item_id']) {
                $batches = DB::table('sale_item_batches')
                    ->where('sale_item_id', $itemDatum['original_sale_item_id'])
                    ->where('is_reversed', 0)
                    ->get();

                if ($batches->isNotEmpty()) {
                    $remaining = $itemDatum['quantity'];
                    foreach ($batches as $b) {
                        if ($remaining <= 0.0001) break;
                        $take = min($remaining, (float) $b->qty_deducted);
                        DB::table('inventory_batches')
                            ->where('id', $b->inventory_batch_id)
                            ->increment('remaining_qty', $take);
                        $unit = (float) ($b->unit_cost
                            ?? DB::table('inventory_batches')
                                ->where('id', $b->inventory_batch_id)->value('unit_cost')
                            ?? 0);
                        $totalCogs += $take * $unit;
                        $remaining -= $take;

                        $row = SaleItemBatch::find($b->id);
                        if ($row) {
                            if ($take >= (float) $b->qty_deducted - 0.0001) {
                                $row->markReversed("Returned on #{$reference}");
                            } else {
                                $left = (float) $b->qty_deducted - $take;
                                $row->update([
                                    'qty_deducted' => $left,
                                    'total_cogs'   => round($left * (float) $b->unit_cost, 4),
                                ]);
                            }
                        }
                    }
                    if ($remaining > 0.0001) {
                        $unitCost = $productRecord?->cost_price ?? $itemDatum['price'];
                        $this->fifo->receiveBatch(
                            productId: $itemDatum['product_id'], warehouseId: $warehouseId,
                            qty: $remaining, unitCost: $unitCost, batchType: 'return',
                        );
                        $totalCogs += $remaining * $unitCost;
                    }
                    $restored = true;
                }
            }

            if (!$restored) {
                $unitCost = $productRecord?->cost_price ?? $itemDatum['price'];
                $this->fifo->receiveBatch(
                    productId: $itemDatum['product_id'], warehouseId: $warehouseId,
                    qty: $itemDatum['quantity'], unitCost: $unitCost, batchType: 'return',
                );
                $totalCogs += $itemDatum['quantity'] * $unitCost;
            }

            if ($itemDatum['original_sale_item_id']) {
                DB::table('sale_items')
                    ->where('id', $itemDatum['original_sale_item_id'])
                    ->increment('returned_quantity', $itemDatum['quantity']);
            }

            if ($productRecord?->type !== 'service') {
                $stockRow = DB::table('stocks')
                    ->where('tenant_id', $tenantId)
                    ->where('product_id', $itemDatum['product_id'])
                    ->where('warehouse_id', $warehouseId)
                    ->first();
                if ($stockRow) {
                    DB::table('stocks')->where('id', $stockRow->id)->increment('quantity', $itemDatum['quantity']);
                } else {
                    DB::table('stocks')->insert([
                        'id'           => \Illuminate\Support\Str::uuid()->toString(),
                        'tenant_id'    => $tenantId,
                        'product_id'   => $itemDatum['product_id'],
                        'warehouse_id' => $warehouseId,
                        'quantity'     => $itemDatum['quantity'],
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ]);
                }
                DB::table('products')->where('id', $itemDatum['product_id'])->increment('stock_quantity', $itemDatum['quantity']);
            }

            StockMovement::create([
                'product_id'   => $itemDatum['product_id'],
                'warehouse_id' => $warehouseId,
                'type'         => 'return',
                'quantity'     => $itemDatum['quantity'],
                'reference_id' => $reference,
                'description'  => 'Return #' . $sale->id,
                'user_id'      => $user->id,
            ]);
        }

        // ── 4. GL entries ──────────────────────────────────────────────────────
        $journalItems = [];

        $salesAccount = $this->accounting->getAccountByCode('4000', 'Sales Revenue', 'income');
        $journalItems[] = [
            'account_id'  => $salesAccount->id,
            'debit'       => $subtotal,
            'credit'      => 0,
            'description' => "Return for Sale #{$sale->reference_number}",
            'party_id'    => $sale->party_id,
        ];

        if ($taxBack > 0.0001) {
            $taxAccount = $this->accounting->getAccountByCode('2100', 'Tax Payable', 'liability');
            $journalItems[] = [
                'account_id'  => $taxAccount->id,
                'debit'       => $taxBack,
                'credit'      => 0,
                'description' => "Tax on return #{$sale->reference_number}",
                'party_id'    => $sale->party_id,
            ];
        }

        if ($refundNow > 0.0001) {
            $acc = null;
            if (!empty($data['payment_account_id'])) {
                $acc = \App\Models\Account::find($data['payment_account_id']);
            }
            $acc = $acc ?: $this->accounting->getAccountByCode('1000', 'Cash in Hand', 'asset');
            $journalItems[] = [
                'account_id'  => $acc->id,
                'debit'       => 0,
                'credit'      => $refundNow,
                'description' => "Refund for Return #{$sale->reference_number}",
                'party_id'    => $sale->party_id,
            ];
            Payment::create([
                'sale_id' => $sale->id, 'amount' => -$refundNow, 'method' => 'cash',
                'type' => 'out', 'date' => today()->toDateString(), 'reference' => 'Refund paid',
            ]);
        }

        if ($asCredit > 0.0001) {
            $receivables = $this->accounting->getAccountByCode('1200', 'Accounts Receivable', 'asset');
            $journalItems[] = [
                'account_id'  => $receivables->id,
                'debit'       => 0,
                'credit'      => $asCredit,
                'description' => "Credited to account — Return #{$sale->reference_number}",
                'party_id'    => $sale->party_id,
            ];
            Payment::create([
                'sale_id' => $sale->id, 'amount' => -$asCredit, 'method' => 'store_credit',
                'type' => 'out', 'date' => today()->toDateString(), 'reference' => 'Credited to account',
                'cheque_date' => null,
            ]);
        }

        if ($totalCogs > 0) {
            $totalCogs       = round($totalCogs, 2);
            $cogsAccount      = $this->accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense');
            $inventoryAccount = $this->accounting->getAccountByCode('1100', 'Inventory Asset', 'asset');
            $journalItems[]   = [
                'account_id'  => $cogsAccount->id,
                'debit'       => 0,
                'credit'      => $totalCogs,
                'description' => "COGS reversal for Return #{$sale->reference_number}",
            ];
            $journalItems[] = [
                'account_id'  => $inventoryAccount->id,
                'debit'       => $totalCogs,
                'credit'      => 0,
                'description' => "Inventory addition for Return #{$sale->reference_number}",
            ];
        }

        $sale->posted_at = $sale->posted_at ?: $sale->created_at;
        $sale->save();

        $this->accounting->createEntry([
            'date'           => isset($data['date']) ? \Carbon\Carbon::parse($data['date'])->toDateString() : today()->toDateString(),
            'reference_type' => 'sale_return',
            'reference'      => $sale->id,
            'description'    => "Auto journal — Return #{$sale->reference_number}",
            'party_id'       => $sale->party_id,
        ], $journalItems);

        // ── 5. Original sale status ────────────────────────────────────────────
        $open = DB::table('sale_items')
            ->where('sale_id', $originalId)
            ->whereNull('deleted_at')
            ->whereRaw('returned_quantity < quantity - 0.0001')
            ->exists();
        DB::statement(
            'UPDATE sales SET status = ?, updated_at = ? WHERE id = ? AND status IN (?, ?)',
            [$open ? 'partially_returned' : 'returned', now(), $originalId, 'posted', 'partially_returned']
        );
        $this->paymentService->updatePaymentBadge($originalId);

        // ── 6. Activity log ────────────────────────────────────────────────────
        Activity::create([
            'type'           => 'return',
            'description'    => 'Return from ' . (Party::find($data['customer_id'])?->name ?? 'Customer'),
            'amount'         => $returnValue,
            'reference_id'   => $sale->id,
            'reference_type' => 'sale',
            'user_id'        => $user->id,
            'metadata'       => json_encode([
                'reference_number' => $sale->reference_number,
                'original_sale_id' => $originalId,
                'refunded_now'     => $refundNow,
                'credited'         => $asCredit,
                'items_count'      => count($data['items']),
                'payment_method'   => $data['payment_method'] ?? 'cash',
            ]),
        ]);

        return [
            'return_id'        => $sale->id,
            'reference_number' => $reference,
            'refunded'         => $refundNow,
            'credited'         => $asCredit,
            'return_value'     => $returnValue,
        ];
    }
}
