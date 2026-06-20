<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Services\V3\AccountingService;

class PosReturnController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:0.001',
            'items.*.price'      => 'required|numeric|min:0',
            'warehouse_id'       => 'required|exists:warehouses,id',
            'idempotency_key'    => 'required|string',
            'refund_method'      => 'nullable|string',
            'reason'             => 'nullable|string',
        ]);

        $tenant = app('current.tenant');
        $idempotencyKey = $request->input('idempotency_key');
        $warehouseId = $request->input('warehouse_id');

        $lock = \Illuminate\Support\Facades\Cache::lock("pos-return-lock-{$idempotencyKey}", 10);

        try {
            $lock->block(5);

            // Idempotency check: look up existing journal entry with this idempotency key
            $existingEntry = \App\Models\JournalEntry::where('tenant_id', $tenant->id)
                ->where('idempotency_key', "pos-return-{$idempotencyKey}")
                ->first();

            if ($existingEntry) {
                $existingSale = \App\Models\Sale::where('tenant_id', $tenant->id)
                    ->where('id', $existingEntry->reference)
                    ->first();
                if ($existingSale) {
                    return response()->json([
                        'success'   => true,
                        'message'   => 'Return processed successfully',
                        'reference' => $existingSale->reference_number,
                        'total'     => abs($existingSale->total),
                    ]);
                }
            }

            $returnTotal = 0;
            $returnRef   = null;

            DB::transaction(function () use ($request, $tenant, $warehouseId, $idempotencyKey, &$returnTotal, &$returnRef) {
                $items   = $request->input('items');
                $reason  = $request->input('reason', 'POS Open Return');

                $returnTotal = collect($items)->sum(fn($i) => $i['price'] * $i['quantity']);
                $returnRef   = 'RET-' . strtoupper(uniqid());

                // Create return sale record with negative values
                $sale = Sale::create([
                    'tenant_id'        => $tenant->id,
                    'user_id'          => Auth::id(),
                    'reference_number' => $returnRef,
                    'status'           => 'returned',
                    'payment_status'   => 'paid',
                    'payment_method'   => $request->input('refund_method', 'cash'),
                    'subtotal'         => -$returnTotal,
                    'tax'              => 0,
                    'discount'         => 0,
                    'total'            => -$returnTotal,
                    'net_sales'        => -$returnTotal,
                    'invoice_total'    => -$returnTotal,
                    'notes'            => $reason,
                    'posted_at'        => now(),
                ]);

                // Create sale items and restore stock
                foreach ($items as $item) {
                    $saleItem = SaleItem::create([
                        'sale_id'    => $sale->id,
                        'product_id' => $item['product_id'],
                        'quantity'   => $item['quantity'], // Keep quantity positive
                        'unit_price' => $item['price'],
                        'net_amount' => -($item['price'] * $item['quantity']),
                        'subtotal'   => -($item['price'] * $item['quantity']),
                        'line_total' => -($item['price'] * $item['quantity']),
                    ]);

                    // Restore stock scoped to product_id, warehouse_id, tenant_id
                    $stock = DB::table('stocks')
                        ->where('product_id', $item['product_id'])
                        ->where('warehouse_id', $warehouseId)
                        ->where('tenant_id', $tenant->id)
                        ->first();

                    if ($stock) {
                        DB::table('stocks')
                            ->where('id', $stock->id)
                            ->increment('quantity', $item['quantity']);
                    } else {
                        DB::table('stocks')->insert([
                            'id'           => \Illuminate\Support\Str::uuid()->toString(),
                            'tenant_id'    => $tenant->id,
                            'product_id'   => $item['product_id'],
                            'warehouse_id' => $warehouseId,
                            'quantity'     => $item['quantity'],
                            'created_at'   => now(),
                            'updated_at'   => now(),
                        ]);
                    }

                    $unitCost = \App\Models\Product::find($item['product_id'])?->cost_price ?? $item['price'];

                    $newBatch = app(\App\Services\V3\FifoService::class)->receiveBatch(
                        productId:   $item['product_id'],
                        warehouseId: $warehouseId,
                        qty:         $item['quantity'],
                        unitCost:    $unitCost,
                        batchType:   'return'
                    );

                    // Insert to sale_item_batches with negative qty_deducted and negative total_cogs
                    DB::table('sale_item_batches')->insert([
                        'id'                 => \Illuminate\Support\Str::uuid()->toString(),
                        'tenant_id'          => $tenant->id,
                        'sale_item_id'       => $saleItem->id,
                        'inventory_batch_id' => $newBatch->id,
                        'qty_deducted'       => -$item['quantity'],
                        'unit_cost'          => $unitCost,
                        'total_cogs'         => -($unitCost * $item['quantity']),
                        'created_at'         => now(),
                        'updated_at'         => now(),
                    ]);
                }

                // Post proper double-entry journal for return via AccountingService
                // DR 4000 Revenue (reverse the sale revenue)
                // CR 1000 Cash in Hand (refund cash out)
                // CR 5000 COGS (reverse the cost — stock is back)
                // DR 1100 Inventory (stock asset restored)

                $revenueAccount   = Account::where('tenant_id', $tenant->id)->where('code', '4000')->first();
                $cashAccount      = Account::where('tenant_id', $tenant->id)->where('code', '1000')->first();
                $cogsAccount      = Account::where('tenant_id', $tenant->id)->where('code', '5000')->first();
                $inventoryAccount = Account::where('tenant_id', $tenant->id)->where('code', '1100')->first();

                $returnCogs = collect($items)->sum(function ($item) {
                    $product = \App\Models\Product::find($item['product_id']);
                    return ($product?->cost_price ?? 0) * $item['quantity'];
                });

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
                    app(\App\Services\V3\AccountingService::class)->createEntry([
                        'date'            => now()->toDateString(),
                        'reference_type'  => 'sale_return',
                        'reference'       => $sale->id,
                        'description'     => "POS Return: {$returnRef}",
                        'idempotency_key' => "pos-return-{$idempotencyKey}", // prevents duplicate journals on retry
                        'party_id'        => null,
                    ], $lines);
                }
            });

            return response()->json([
                'success'   => true,
                'message'   => 'Return processed successfully',
                'reference' => $returnRef,
                'total'     => $returnTotal,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        } finally {
            optional($lock)->release();
        }
    }
}
