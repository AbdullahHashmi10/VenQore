<?php

namespace App\Services;

use App\Engines\AccountingService;
use App\Engines\FifoService;
use App\Models\Account;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * PosReturnService — handles anonymous POS open-return posting.
 *
 * This service owns the posting logic previously inline in
 * PosReturnController::store(). It is called by:
 *   1. PosReturnController::store()  — the direct (no-approval) path
 *   2. SalesReturnApprovalAdapter::post()  — after approval on the approved path
 *
 * Idempotency: when `idempotency_key` is present in the payload, the service
 * checks for a matching journal entry and returns the existing result rather
 * than double-posting.
 *
 * Callers should NOT wrap calls in their own DB transaction; the service
 * wraps the atomic section itself.
 *
 * Payload shape:
 *   items[]
 *     product_id
 *     quantity
 *     price
 *   warehouse_id
 *   idempotency_key
 *   refund_method  (nullable — defaults to 'cash')
 *   reason         (nullable)
 */
class PosReturnService
{
    public function __construct(
        private AccountingService $accounting,
        private FifoService $fifo,
    ) {}

    /**
     * @return array ['success', 'reference', 'total']
     */
    public function process(array $data, Tenant $tenant, User $user): array
    {
        $items          = $data['items'];
        $warehouseId    = $data['warehouse_id'];
        $idempotencyKey = $data['idempotency_key'] ?? null;
        $reason         = $data['reason'] ?? 'POS Open Return';
        $refundMethod   = $data['refund_method'] ?? 'cash';

        // ── Idempotency ────────────────────────────────────────────────────────
        if ($idempotencyKey) {
            $existingEntry = \App\Models\JournalEntry::where('tenant_id', $tenant->id)
                ->where('idempotency_key', "pos-return-{$idempotencyKey}")
                ->first();

            if ($existingEntry) {
                $existingSale = Sale::where('tenant_id', $tenant->id)
                    ->where('id', $existingEntry->reference)
                    ->first();
                if ($existingSale) {
                    return [
                        'success'   => true,
                        'reference' => $existingSale->reference_number,
                        'total'     => abs((float) $existingSale->total),
                    ];
                }
            }
        }

        $returnTotal = 0.0;
        $returnRef   = null;

        $lock = $idempotencyKey
            ? Cache::lock("pos-return-lock-{$idempotencyKey}", 10)
            : null;

        try {
            if ($lock) {
                $lock->block(5);
            }

            app()->instance('current.tenant', $tenant);

            DB::transaction(function () use (
                $items, $warehouseId, $idempotencyKey, $reason, $refundMethod,
                $tenant, $user, &$returnTotal, &$returnRef
            ) {
                $returnTotal = collect($items)->sum(fn ($i) => $i['price'] * $i['quantity']);
                $returnRef   = 'RET-' . strtoupper(uniqid());
                $tenantId    = $tenant->id;

                $activeShiftId = \App\Models\RegisterShift::where('tenant_id', $tenantId)
                    ->where('status', 'open')
                    ->where('opened_by', $user->id)
                    ->latest('id')
                    ->value('id');

                $sale = Sale::create([
                    'tenant_id'         => $tenantId,
                    'user_id'           => $user->id,
                    'register_shift_id' => $activeShiftId,
                    'reference_number'  => $returnRef,
                    'status'            => 'returned',
                    'payment_status'    => 'paid',
                    'payment_method'    => $refundMethod,
                    'subtotal'         => -$returnTotal,
                    'subtotal_gross'   => -$returnTotal,
                    'tax'              => 0,
                    'total_tax'        => 0,
                    'discount'         => 0,
                    'global_discount'  => 0,
                    'total'            => -$returnTotal,
                    'net_sales'        => -$returnTotal,
                    'invoice_total'    => -$returnTotal,
                    'notes'            => $reason,
                    'refund_reason'    => $reason,
                    'posted_at'        => now(),
                ]);

                $returnCogs = 0.0;

                foreach ($items as $item) {
                    $saleItem = SaleItem::create([
                        'sale_id'    => $sale->id,
                        'product_id' => $item['product_id'],
                        'quantity'   => $item['quantity'],
                        'unit_price' => $item['price'],
                        'net_amount' => -(float)($item['price'] * $item['quantity']),
                        'subtotal'   => -(float)($item['price'] * $item['quantity']),
                        'line_total' => -(float)($item['price'] * $item['quantity']),
                    ]);

                    $product = \App\Models\Product::find($item['product_id']);
                    if ($product?->type === 'service') {
                        continue;
                    }

                    $unitCost = (float) ($product?->cost_price ?? $item['price']);
                    $lineCost = round($unitCost * (float) $item['quantity'], 2);
                    $returnCogs += $lineCost;

                    $stock = DB::table('stocks')
                        ->where('product_id', $item['product_id'])
                        ->where('warehouse_id', $warehouseId)
                        ->where('tenant_id', $tenantId)
                        ->first();

                    if ($stock) {
                        DB::table('stocks')->where('id', $stock->id)->increment('quantity', $item['quantity']);
                    } else {
                        DB::table('stocks')->insert([
                            'id'           => Str::uuid()->toString(),
                            'tenant_id'    => $tenantId,
                            'product_id'   => $item['product_id'],
                            'warehouse_id' => $warehouseId,
                            'quantity'     => $item['quantity'],
                            'created_at'   => now(),
                            'updated_at'   => now(),
                        ]);
                    }

                    DB::table('products')
                        ->where('tenant_id', $tenantId)
                        ->where('id', $item['product_id'])
                        ->increment('stock_quantity', $item['quantity']);

                    $newBatch = $this->fifo->receiveBatch(
                        productId:   $item['product_id'],
                        warehouseId: $warehouseId,
                        qty:         $item['quantity'],
                        unitCost:    $unitCost,
                        batchType:   'return'
                    );

                    DB::table('sale_item_batches')->insert([
                        'id'                 => Str::uuid()->toString(),
                        'tenant_id'          => $tenantId,
                        'sale_item_id'       => $saleItem->id,
                        'inventory_batch_id' => $newBatch->id,
                        'qty_deducted'       => -$item['quantity'],
                        'unit_cost'          => $unitCost,
                        'total_cogs'         => -$lineCost,
                        'created_at'         => now(),
                        'updated_at'         => now(),
                    ]);
                }

                // GL: DR 4000, CR 1000, plus COGS reversal
                $revenueAccount   = Account::where('tenant_id', $tenantId)->where('code', '4000')->first();
                $cashAccount      = Account::where('tenant_id', $tenantId)->where('code', '1000')->first();
                $cogsAccount      = Account::where('tenant_id', $tenantId)->where('code', '5000')->first();
                $inventoryAccount = Account::where('tenant_id', $tenantId)->where('code', '1100')->first();

                $returnCogs = round($returnCogs, 2);
                $lines = [];

                if ($revenueAccount && $cashAccount) {
                    $lines[] = ['account_id' => $revenueAccount->id, 'debit' => $returnTotal, 'credit' => 0];
                    $lines[] = ['account_id' => $cashAccount->id,    'debit' => 0, 'credit' => $returnTotal];
                }

                if ($cogsAccount && $inventoryAccount && $returnCogs > 0) {
                    $lines[] = ['account_id' => $cogsAccount->id,      'debit' => 0,           'credit' => $returnCogs];
                    $lines[] = ['account_id' => $inventoryAccount->id, 'debit' => $returnCogs, 'credit' => 0];
                }

                if (!empty($lines)) {
                    $this->accounting->createEntry([
                        'date'            => now()->toDateString(),
                        'reference_type'  => 'sale_return',
                        'reference'       => $sale->id,
                        'description'     => "POS Return: {$returnRef}",
                        'idempotency_key' => $idempotencyKey ? "pos-return-{$idempotencyKey}" : null,
                        'party_id'        => null,
                    ], $lines);
                }
            });

        } finally {
            optional($lock)->release();
        }

        return [
            'success'   => true,
            'reference' => $returnRef,
            'total'     => $returnTotal,
        ];
    }
}
