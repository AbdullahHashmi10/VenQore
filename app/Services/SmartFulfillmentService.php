<?php

namespace App\Services;

use App\Models\EcommerceChannel;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Product;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SmartFulfillmentService — VenSynQ Core Engine
 *
 * ALL data sources (manual form, file upload in Phase 2, live API in Phase 3)
 * feed into this single service via the same NormalizedOrderItem contract.
 * Nothing in this service changes between phases. Only the caller changes.
 *
 * NormalizedOrderItem shape (array):
 * {
 *   sku              : string
 *   quantity          : int
 *   sale_price        : float
 *   platform_fee      : float|null    // null = use channel fee_percentage estimate
 *   channel_id        : int           // FK to ecommerce_channels.id
 *   channel_order_id  : string
 *   fulfillment_type  : fbm|fba|jit   // CRITICAL: determines inventory action
 *   currency          : string(3)     // ISO code e.g. GBP
 * }
 */
class SmartFulfillmentService
{
    /**
     * Run a pre-save validation preview (soft read — no locks, no writes).
     * Called before the actual transaction to show the client what will happen.
     *
     * @param  array  $items  Array of NormalizedOrderItem
     * @param  int    $channelId
     * @param  int    $tenantId
     * @return array  Preview rows for the frontend validation table
     */
    public function previewOrderItems(array $items, int $channelId, int $tenantId): array
    {
        $channel = EcommerceChannel::find($channelId);
        $preview = [];

        foreach ($items as $item) {
            $product = Product::where('sku', $item['sku'])
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$product) {
                $preview[] = [
                    'sku'             => $item['sku'],
                    'product_name'    => null,
                    'ordered_qty'     => $item['quantity'],
                    'in_warehouse'    => 0,
                    'action'          => 'error',
                    'action_label'    => '❌ SKU not found in VenQore — please map this product',
                    'estimated_cost'  => null,
                    'estimated_fee'   => null,
                    'color'           => 'red',
                ];
                continue;
            }

            $fulfillmentType = $item['fulfillment_type'] ?? $channel->default_fulfillment_type;
            $stock = Stock::where('product_id', $product->id)
                ->where('warehouse_id', $channel->warehouse_id)
                ->first();

            $availableQty = $stock ? $stock->available_quantity : 0;
            $shortfallQty = 0;
            $action       = 'unknown';
            $color        = 'grey';
            $actionLabel  = '';

            if ($fulfillmentType === 'fba') {
                $action      = 'fba';
                $color       = 'blue';
                $actionLabel = '🔵 FBA — Revenue recorded only (Amazon holds stock)';
            } elseif ($fulfillmentType === 'jit') {
                $shortfallQty = $item['quantity'];
                $action       = 'jit';
                $color        = 'amber';
                $actionLabel  = "🟡 JIT — Auto-creating purchase draft for {$shortfallQty} units";
            } else {
                // FBM: check warehouse
                $available    = min($availableQty, $item['quantity']);
                $shortfallQty = $item['quantity'] - $available;

                if ($shortfallQty === 0) {
                    $action      = 'deduct';
                    $color       = 'green';
                    $actionLabel = "🟢 Deducting {$item['quantity']} from warehouse";
                } else {
                    $action      = 'partial';
                    $color       = 'amber';
                    $actionLabel = "🟡 Deducting {$available} from warehouse + JIT draft for {$shortfallQty}";
                }
            }

            $estimatedFee = $item['platform_fee']
                ?? round($item['sale_price'] * ($channel->fee_percentage / 100), 2);

            $estimatedCost = $shortfallQty > 0
                ? round(($product->cost_price ?? 0) * $shortfallQty, 2)
                : null;

            $preview[] = [
                'sku'              => $item['sku'],
                'product_name'     => $product->name,
                'ordered_qty'      => $item['quantity'],
                'in_warehouse'     => $availableQty,
                'action'           => $action,
                'action_label'     => $actionLabel,
                'fulfillment_type' => $fulfillmentType,
                'estimated_cost'   => $estimatedCost,
                'estimated_fee'    => $estimatedFee,
                'color'            => $color,
            ];
        }

        return $preview;
    }

    /**
     * Process a dropship order — the main transactional method.
     * Implements all 8 steps from the VenSynQ corrected plan Section 3.2.
     * All steps are atomic — if any fail, nothing is written.
     *
     * @param  array  $items  Array of NormalizedOrderItem
     * @param  int    $channelId
     * @param  int    $tenantId
     * @param  int    $userId
     * @param  array  $saleMeta  Additional sale metadata (notes, etc.)
     * @return Sale   The created Sale record
     *
     * @throws \Exception  If a SKU is not found or the transaction fails
     */
    public function processDropshipSale(
        array $items,
        int $channelId,
        int $tenantId,
        int $userId,
        array $saleMeta = []
    ): Sale {
        return DB::transaction(function () use ($items, $channelId, $tenantId, $userId, $saleMeta) {

            $channel = EcommerceChannel::find($channelId);

            // ── Step 0: Duplicate Check ───────────────────────────────────────
            // Use first item's channel_order_id for duplicate detection
            $channelOrderId = $items[0]['channel_order_id'] ?? null;
            if ($channelOrderId) {
                $existingSale = Sale::where('tenant_id', $tenantId)
                    ->where('ecommerce_channel_id', $channelId)
                    ->where('channel_order_id', $channelOrderId)
                    ->first();

                if ($existingSale) {
                    Log::info("VenSynQ: Duplicate order skipped. channel_order_id={$channelOrderId}");
                    return $existingSale;
                }
            }

            $saleItems     = [];
            $jitDrafts     = [];
            $grossRevenue  = 0;
            $allFromStock  = true;   // Tracks if we need financial_reconciled = false

            foreach ($items as $item) {
                // ── Step 1: Pre-validation — Resolve Product ──────────────────
                if (isset($item['product_id'])) {
                    $product = Product::where('id', $item['product_id'])
                        ->where('tenant_id', $tenantId)
                        ->firstOrFail();
                } else {
                    $product = Product::where('sku', $item['sku'])
                        ->where('tenant_id', $tenantId)
                        ->firstOrFail(); // Throws if SKU not found
                }

                $fulfillmentType = $item['fulfillment_type'] ?? $channel->default_fulfillment_type;
                $availableQty    = 0;
                $shortfallQty    = 0;

                if ($fulfillmentType !== 'fba') {
                    // ── Step 1 (continued): Lock row for race condition protection ──
                    $stock = Stock::where('product_id', $product->id)
                        ->where('warehouse_id', $channel->warehouse_id)
                        ->lockForUpdate()
                        ->first();

                    $currentStock = $stock ? $stock->available_quantity : 0;

                    if ($fulfillmentType === 'jit') {
                        // JIT: always buy everything
                        $availableQty = 0;
                        $shortfallQty = $item['quantity'];
                    } else {
                        // FBM: use what's available, JIT the rest
                        $availableQty = min($currentStock, $item['quantity']);
                        $shortfallQty = $item['quantity'] - $availableQty;
                    }
                }

                // Build sale item record
                $lineTotal = $item['sale_price'] * $item['quantity'];
                $grossRevenue += $lineTotal;

                $saleItems[] = [
                    'product_id'    => $product->id,
                    'quantity'      => $item['quantity'],
                    'unit_price'    => $item['sale_price'],
                    'total'         => $lineTotal,
                    'fulfillment_type' => $fulfillmentType,
                ];

                // ── Step 4: Stock Deduction ────────────────────────────────────
                if ($fulfillmentType !== 'fba' && $availableQty > 0) {
                    Stock::where('product_id', $product->id)
                        ->where('warehouse_id', $channel->warehouse_id)
                        ->decrement('quantity', $availableQty);
                }

                // ── Step 5: Build JIT Draft ────────────────────────────────────
                if ($shortfallQty > 0) {
                    $allFromStock = false;
                    $jitDrafts[] = [
                        'product_id'      => $product->id,
                        'sku'             => $item['sku'],
                        'shortfall_qty'   => $shortfallQty,
                        'cost_price'      => $product->cost_price ?? 0,
                    ];
                }
            }

            // ── Step 3: Create the Sale record ────────────────────────────────
            $sale = Sale::create([
                'tenant_id'             => $tenantId,
                'user_id'               => $userId,
                'warehouse_id'          => $channel->warehouse_id,
                'ecommerce_channel_id'  => $channelId,
                'channel_store_name'    => $channel->name,
                'channel_order_id'      => $channelOrderId,
                'is_dropship'           => true,
                'fulfillment_type'      => $items[0]['fulfillment_type'] ?? $channel->default_fulfillment_type,
                'subtotal'              => $grossRevenue,
                'tax'                   => 0,
                'discount'              => 0,
                'total'                 => $grossRevenue,
                'status'                => 'posted',
                'posted_at'             => now(),
                'payment_status'        => 'unpaid',
                'payment_method'        => 'channel',
                'dispatch_status'       => 'pending',
                'financial_reconciled'  => !$allFromStock ? false : true,
                'channel_currency'      => $items[0]['currency'] ?? $channel->currency,
                'notes'                 => $saleMeta['notes'] ?? "Channel order from {$channel->name}",
            ]);

            // ── Create SaleItems ──────────────────────────────────────────────
            foreach ($saleItems as $si) {
                SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $si['product_id'],
                    'quantity'   => $si['quantity'],
                    'unit_price' => $si['unit_price'],
                    'total'      => $si['total'],
                ]);
            }

            // ── Step 5: Create JIT Purchase Drafts ────────────────────────────
            // One draft per shortfall SKU so client can confirm each supplier cost individually
            foreach ($jitDrafts as $draft) {
                $invoice = Invoice::create([
                    'tenant_id'       => $tenantId,
                    'user_id'         => $userId,
                    'type'            => 'purchase',
                    'invoice_number'  => 'JIT-' . time() . '-' . rand(100, 999),
                    'jit_sale_id'     => $sale->id,
                    'channel_order_id'=> $sale->channel_order_id,
                    'is_jit'          => true,
                    'approval_status' => 'draft',
                    'subtotal'        => $draft['cost_price'] * $draft['shortfall_qty'],
                    'total_amount'    => $draft['cost_price'] * $draft['shortfall_qty'],
                    'status'          => 'draft',
                    'date'            => now()->toDateString(),
                ]);

                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $draft['product_id'],
                    'quantity'   => $draft['shortfall_qty'],
                    'price'      => $draft['cost_price'],
                    'total'      => $draft['cost_price'] * $draft['shortfall_qty'],
                ]);
            }

            // ── Step 6: Platform Fee Expense ──────────────────────────────────
            $this->createChannelFeeExpense($sale, $items, $channel);

            return $sale;
        });
    }

    /**
     * Auto-post the platform fee as an Expense against the channel's expense category.
     * Step 6 of the SmartFulfillmentService processing flow.
     */
    private function createChannelFeeExpense(Sale $sale, array $items, EcommerceChannel $channel): void
    {
        $totalFee = 0;
        $feeIsEstimated = true;

        foreach ($items as $item) {
            if ($item['platform_fee'] !== null) {
                $totalFee += $item['platform_fee'];
                $feeIsEstimated = false;
            } else {
                $totalFee += $item['sale_price'] * ($channel->fee_percentage / 100);
            }
        }

        if ($totalFee <= 0) {
            return;
        }

        // Auto-create expense category if it doesn't exist yet for this channel
        $categoryId = $channel->expense_category_id;
        if (!$categoryId) {
            $category = ExpenseCategory::firstOrCreate(
                [
                    'tenant_id' => $sale->tenant_id,
                    'name'      => "{$channel->name} Fees",
                ],
                [
                    'is_active' => true,
                    'group'     => 'channel_fees',
                ]
            );
            $categoryId = $category->id;
            // Save back to channel for future use
            $channel->update(['expense_category_id' => $categoryId]);
        }

        $label = $feeIsEstimated
            ? "[Estimated] {$channel->platform} fee for order {$sale->channel_order_id}"
            : "{$channel->platform} fee for order {$sale->channel_order_id}";

        Expense::create([
            'tenant_id'           => $sale->tenant_id,
            'expense_category_id' => $categoryId,
            'date'                => now()->toDateString(),
            'amount'              => round($totalFee, 2),
            'description'         => $label,
            'reference'           => $sale->id,
        ]);

        // Store gross_platform_fee on the sale for dashboard display
        $sale->update([
            'gross_platform_fee' => round($totalFee, 2),
        ]);
    }

    /**
     * Approve a JIT draft purchase — client has confirmed the actual supplier cost.
     * Marks the draft as approved. If all JIT drafts for the linked sale are now
     * approved, marks the sale as financially_reconciled = true.
     *
     * @param  Invoice  $purchase
     * @param  float    $confirmedCost  Actual total the client paid the supplier
     * @param  string|null $supplierId  FK to party/supplier record
     */
    public function approveJitDraft(Invoice $purchase, float $confirmedCost, ?string $supplierId = null): void
    {
        DB::transaction(function () use ($purchase, $confirmedCost, $supplierId) {
            $purchase->update([
                'approval_status' => 'approved',
                'subtotal'        => $confirmedCost,
                'total_amount'    => $confirmedCost,
                'party_id'        => $supplierId,
            ]);

            // Check if all JIT drafts for the linked sale are now approved
            if ($purchase->jit_sale_id) {
                $pendingDrafts = Invoice::where('jit_sale_id', $purchase->jit_sale_id)
                    ->where('approval_status', 'draft')
                    ->count();

                if ($pendingDrafts === 0) {
                    Sale::where('id', $purchase->jit_sale_id)
                        ->update(['financial_reconciled' => true]);
                }
            }
        });
    }

    /**
     * Bulk update tracking numbers for dispatched orders.
     * Phase 1: updates local DB only. Phase 3: this method will also dispatch
     * async jobs to push tracking to each platform API.
     *
     * @param  array  $trackingUpdates  [['sale_id' => ..., 'tracking_number' => ..., 'shipping_carrier' => ...]]
     */
    public function syncTrackingNumbers(array $trackingUpdates): int
    {
        $updated = 0;
        foreach ($trackingUpdates as $update) {
            $rows = Sale::where('id', $update['sale_id'])
                ->where('is_dropship', true)
                ->update([
                    'tracking_number'  => $update['tracking_number'],
                    'shipping_carrier' => $update['shipping_carrier'] ?? null,
                    'dispatch_status'  => 'dispatched',
                ]);
            $updated += $rows;

            // Phase 3 hook — async job dispatch will go here
            // dispatch(new PushTrackingToChannelJob($update['sale_id']));
        }
        return $updated;
    }
}
