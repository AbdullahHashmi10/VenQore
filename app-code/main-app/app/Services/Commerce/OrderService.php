<?php

namespace App\Services\Commerce;

use App\Engines\SaleService;
use App\Engines\UomService;
use App\Models\Commerce\CommerceOrder;
use App\Models\Commerce\Storefront;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Order lifecycle. Every transition: row-locked, version-bumped, audited in commerce_order_events.
 *
 *   pending -> confirmed (stock held) -> preparing -> ready | out_for_delivery -> completed (sale posted)
 *   pending -> rejected | expired ;  confirmed..out_for_delivery -> cancelled (holds released)
 *
 * Payment status is SEPARATE from fulfilment status.
 */
class OrderService
{
    public const NEXT = [
        'confirmed' => ['preparing'],
        'preparing' => ['ready', 'out_for_delivery'],
    ];

    public function __construct(private StockAvailability $stock, private UomService $uom)
    {
    }

    public function event(CommerceOrder $o, string $type, ?string $from, ?string $to, string $actorType = 'system', ?int $actorId = null, ?string $note = null, ?array $meta = null): void
    {
        DB::table('commerce_order_events')->insert([
            'order_id' => $o->id, 'tenant_id' => $o->tenant_id, 'type' => $type,
            'from_status' => $from, 'to_status' => $to, 'actor_type' => $actorType, 'actor_id' => $actorId,
            'note' => $note, 'meta' => $meta ? json_encode($meta) : null, 'created_at' => now(),
        ]);
    }

    private function lock(string $orderId, int $tenantId, ?int $expectedVersion): CommerceOrder
    {
        $o = CommerceOrder::where('id', $orderId)->where('tenant_id', $tenantId)->lockForUpdate()->first();
        if (! $o) {
            throw new CommerceException('Order not found.', 'not_found', [], 404);
        }
        if ($expectedVersion !== null && $expectedVersion !== (int) $o->version) {
            throw new CommerceException('This order was changed by someone else. Reload and try again.', 'stale', [], 409);
        }
        return $o;
    }

    private function move(CommerceOrder $o, string $to, string $type, ?int $actor, ?string $note = null, array $extra = []): void
    {
        $from = $o->status;
        $o->forceFill(array_merge($extra, ['status' => $to, 'version' => $o->version + 1]))->save();
        $this->event($o, $type, $from, $to, 'staff', $actor, $note);
    }

    /** Accept: re-check live availability atomically, then hold stock for this order. */
    public function confirm(string $orderId, int $tenantId, ?int $actor, ?int $expectedVersion = null): CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId, $actor, $expectedVersion) {
            $o = $this->lock($orderId, $tenantId, $expectedVersion);
            if ($o->status !== 'pending') {
                throw new CommerceException('Only a pending order can be accepted.', 'bad_state', [], 409);
            }
            if ($o->accept_by && $o->accept_by->isPast()) {
                $this->move($o, 'expired', 'expired', null, 'Accept deadline passed');
                throw new CommerceException('This order passed its acceptance deadline and has expired.', 'expired', [], 409);
            }
            $warehouse = $o->warehouse_id;
            if (! $warehouse) {
                throw new CommerceException('No fulfilment warehouse is set for this order.', 'no_warehouse');
            }

            $items = $o->items()->orderBy('product_id')->get();

            // Serialize with POS deductions: they lock the same batch rows (FifoService::deductStock).
            foreach ($items->pluck('product_id')->unique() as $pid) {
                DB::table('inventory_batches')->where('tenant_id', $tenantId)->where('product_id', $pid)
                    ->where('warehouse_id', $warehouse)->orderBy('id')->lockForUpdate()->pluck('id');
            }

            $need = [];
            foreach ($items as $it) {
                $need[$it->product_id] = ($need[$it->product_id] ?? 0) + $this->baseQty($it);
            }
            $short = [];
            foreach ($need as $pid => $qty) {
                $avail = $this->stock->available($tenantId, $pid, $warehouse, $o->id);
                if ($avail + 0.00001 < $qty) {
                    $title = $items->firstWhere('product_id', $pid)->title;
                    $short[] = $title . ' (need ' . rtrim(rtrim(number_format($qty, 4, '.', ''), '0'), '.') . ', available ' . rtrim(rtrim(number_format(max($avail, 0), 4, '.', ''), '0'), '.') . ')';
                }
            }
            if ($short) {
                throw new CommerceException('Not enough stock: ' . implode('; ', $short) . '. Reject the order or adjust stock.', 'insufficient_stock', ['lines' => $short], 409);
            }

            foreach ($need as $pid => $qty) {
                DB::table('commerce_stock_holds')->insert([
                    'id' => (string) Str::uuid(), 'order_id' => $o->id, 'tenant_id' => $tenantId,
                    'product_id' => $pid, 'warehouse_id' => $warehouse, 'quantity' => $qty,
                    'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
            $this->move($o, 'confirmed', 'confirmed', $actor, null, ['confirmed_at' => now()]);
            return $o->fresh(['items']);
        });
    }

    public function reject(string $orderId, int $tenantId, ?int $actor, string $reason, ?int $expectedVersion = null): CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId, $actor, $reason, $expectedVersion) {
            $o = $this->lock($orderId, $tenantId, $expectedVersion);
            if ($o->status !== 'pending') {
                throw new CommerceException('Only a pending order can be rejected. Use cancel for accepted orders.', 'bad_state', [], 409);
            }
            $this->move($o, 'rejected', 'rejected', $actor, $reason, ['reason' => mb_substr($reason, 0, 255)]);
            return $o->fresh();
        });
    }

    public function cancel(string $orderId, int $tenantId, ?int $actor, string $reason, ?int $expectedVersion = null): CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId, $actor, $reason, $expectedVersion) {
            $o = $this->lock($orderId, $tenantId, $expectedVersion);
            if (! in_array($o->status, ['confirmed', 'preparing', 'ready', 'out_for_delivery'], true)) {
                throw new CommerceException('This order cannot be cancelled in its current state.', 'bad_state', [], 409);
            }
            DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'active')
                ->update(['status' => 'released', 'updated_at' => now()]);
            $this->move($o, 'cancelled', 'cancelled', $actor, $reason, ['reason' => mb_substr($reason, 0, 255)]);
            return $o->fresh();
        });
    }

    public function advance(string $orderId, int $tenantId, ?int $actor, string $to, ?int $expectedVersion = null): CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId, $actor, $to, $expectedVersion) {
            $o = $this->lock($orderId, $tenantId, $expectedVersion);
            $allowed = self::NEXT[$o->status] ?? [];
            // confirmed may skip preparing straight to the hand-over state
            if ($o->status === 'confirmed') {
                $allowed = array_merge($allowed, ['ready', 'out_for_delivery']);
            }
            $handover = $o->fulfilment === 'delivery' ? 'out_for_delivery' : 'ready';
            $allowed = array_values(array_filter($allowed, fn ($s) => ! in_array($s, ['ready', 'out_for_delivery'], true) || $s === $handover));
            if (! in_array($to, $allowed, true)) {
                throw new CommerceException("Cannot move order from {$o->status} to {$to}.", 'bad_transition', [], 409);
            }
            $this->move($o, $to, 'status_changed', $actor);
            return $o->fresh();
        });
    }

    /** Customer says they sent a transfer. NEVER marks the order paid. */
    public function reportTransfer(string $orderId, int $tenantId, string $reference): CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId, $reference) {
            $o = $this->lock($orderId, $tenantId, null);
            if ($o->payment_method !== 'bank' || $o->payment_status !== 'unpaid' || in_array($o->status, ['rejected', 'cancelled', 'expired', 'completed'], true)) {
                throw new CommerceException('A transfer cannot be reported for this order.', 'bad_state', [], 409);
            }
            $o->forceFill(['payment_status' => 'transfer_reported', 'bank_reference' => mb_substr($reference, 0, 120), 'version' => $o->version + 1])->save();
            $this->event($o, 'transfer_reported', null, null, 'guest', null, 'Customer reported a bank transfer (unverified)');
            return $o->fresh();
        });
    }

    /**
     * After hand-over, a credit/COD order's money is received through the normal Payments screen
     * (canonical receipt + allocation). This mirrors the result onto the order: once the linked sale
     * is fully paid, the order's payment state becomes 'collected'. Never writes money itself.
     */
    public function syncPaymentFromSale(string $orderId, int $tenantId): ?CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId) {
            $o = $this->lock($orderId, $tenantId, null);
            if ($o->status !== 'completed' || ! $o->sale_id || $o->payment_status === 'refunded') {
                return $o;
            }
            $sale = DB::table('sales')->where('tenant_id', $tenantId)->where('id', $o->sale_id)->first(['payment_status', 'status']);
            if ($sale && $sale->status === 'returned') {
                // Full return/reversal went through the existing sale-reversal engine; mirror it here.
                $o->forceFill(['payment_status' => 'refunded', 'version' => $o->version + 1])->save();
                $this->event($o, 'payment_refunded', null, null, 'system', null, 'Sale fully returned');
            } elseif ($o->payment_status !== 'collected' && $sale && $sale->payment_status === 'paid') {
                $o->forceFill(['payment_status' => 'collected', 'amount_collected' => $o->total, 'version' => $o->version + 1])->save();
                $this->event($o, 'payment_collected', null, null, 'system', null, 'Receivable settled through Payments');
            }
            return $o->fresh();
        });
    }

    /** Staff confirms money was actually received (e.g. verified transfer). Not a ledger posting by itself. */
    public function markCollected(string $orderId, int $tenantId, ?int $actor, ?int $expectedVersion = null): CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId, $actor, $expectedVersion) {
            $o = $this->lock($orderId, $tenantId, $expectedVersion);
            if (! in_array($o->status, ['confirmed', 'preparing', 'ready', 'out_for_delivery'], true)) {
                throw new CommerceException('Payment can only be recorded on an accepted, open order.', 'bad_state', [], 409);
            }
            if (! in_array($o->payment_status, ['unpaid', 'transfer_reported'], true)) {
                throw new CommerceException('Payment is already recorded.', 'bad_state', [], 409);
            }
            $o->forceFill(['payment_status' => 'collected', 'amount_collected' => $o->total, 'version' => $o->version + 1])->save();
            $this->event($o, 'payment_collected', null, null, 'staff', $actor, 'Payment verified/collected');
            return $o->fresh();
        });
    }

    /**
     * Hand-over: post ONE sale through SaleService, link it, consume holds. All-or-nothing.
     * $collectNow: cash/bank handed over right now (posts a paid sale). Otherwise, unless the order was
     * already marked collected, the sale posts on credit (receivable) and the order stays unpaid.
     */
    public function complete(string $orderId, int $tenantId, ?int $actor, bool $collectNow = false, ?int $expectedVersion = null, bool $approveBelowCost = false): CommerceOrder
    {
        $tenant = Tenant::withoutGlobalScopes()->findOrFail($tenantId);
        $previous = app()->bound('current.tenant') ? app('current.tenant') : null;
        app()->instance('current.tenant', $tenant);

        try {
            return DB::transaction(function () use ($orderId, $tenantId, $actor, $collectNow, $expectedVersion, $approveBelowCost) {
                $o = $this->lock($orderId, $tenantId, $expectedVersion);
                if ($o->sale_id || $o->status === 'completed') {
                    return $o->fresh(['items']); // already posted: idempotent no-op
                }
                if (! in_array($o->status, ['ready', 'out_for_delivery'], true)) {
                    throw new CommerceException('Only an order that is ready / out for delivery can be completed.', 'bad_state', [], 409);
                }

                $items = $o->items()->get();
                $paid = $o->payment_status === 'collected' || $collectNow;

                // Below-cost lines need the merchant's explicit per-product approval (set at configuration).
                $lines = [];
                foreach ($items as $it) {
                    $lines[] = [
                        'product_id' => $it->product_id, 'qty' => (float) $it->quantity, 'sale_uom' => $it->uom,
                        'unit_price' => (float) $it->net_unit_price, 'discount_percent' => 0,
                        'tax_rate' => (float) $it->tax_rate, 'is_promotional' => false,
                    ];
                }
                if ((float) $o->delivery_fee > 0) {
                    $lines[] = [
                        'product_id' => $this->deliveryProductId($tenantId), 'qty' => 1, 'sale_uom' => 'pcs',
                        'unit_price' => (float) $o->delivery_fee, 'discount_percent' => 0, 'tax_rate' => 0, 'is_promotional' => false,
                    ];
                }

                $partyId = $o->party_id ?: $this->createParty($o);
                $method = ! $paid ? 'credit' : ($o->payment_method === 'bank' ? 'bank' : 'cash');
                $payload = [
                    'customer_id' => $partyId,
                    'warehouse_id' => $o->warehouse_id,
                    'sale_date' => now()->toDateString(),
                    'payment_method' => $method,
                    'amount_received' => $paid ? (float) $o->total : null,
                    'idempotency_key' => 'commerce-' . $o->id,
                    'source_order_id' => $o->id, // engine flag: keep the locked order prices (no tier re-pricing)
                    'user_id' => $actor,
                    'items' => $lines,
                ];
                if ($approveBelowCost) {
                    $payload['approved_by'] = $actor;
                }

                try {
                    $sale = app(SaleService::class)->post($payload);
                } catch (\App\Exceptions\BelowCostSaleException $e) {
                    throw new CommerceException('A line is priced below cost. Allow below-cost pricing for that product in Online Store > Products, or adjust the price.', 'below_cost', [], 422);
                } catch (\App\Exceptions\InsufficientStockException $e) {
                    throw new CommerceException('Stock is no longer sufficient to complete this order. It stays open; fix stock and retry.', 'insufficient_stock', [], 409);
                }

                if (abs((float) $sale->invoice_total - (float) $o->total) > 0.01) {
                    // Should be impossible (shared math); refuse rather than book a different amount than the customer agreed.
                    throw new CommerceException('Posted total differs from the agreed order total. Nothing was completed.', 'total_mismatch', ['sale_total' => (float) $sale->invoice_total, 'order_total' => (float) $o->total], 500);
                }

                DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'active')
                    ->update(['status' => 'consumed', 'updated_at' => now()]);

                $from = $o->status;
                $o->forceFill([
                    'status' => 'completed', 'sale_id' => $sale->id, 'party_id' => $partyId, 'completed_at' => now(),
                    'payment_status' => $paid ? 'collected' : $o->payment_status,
                    'amount_collected' => $paid ? $o->total : $o->amount_collected,
                    'version' => $o->version + 1,
                ])->save();
                $this->event($o, 'completed', $from, 'completed', 'staff', $actor, 'Sale ' . $sale->reference_number . ($paid ? ' (paid)' : ' (on credit — receivable)'), ['sale_id' => $sale->id]);

                return $o->fresh(['items']);
            });
        } finally {
            if ($previous) {
                app()->instance('current.tenant', $previous);
            } else {
                app()->forgetInstance('current.tenant');
            }
        }
    }

    /** Cron: pending orders past their deadline become expired. Returns count. */
    public function expireDue(): int
    {
        $count = 0;
        CommerceOrder::where('status', 'pending')->where('accept_by', '<', now('UTC')->format('Y-m-d H:i:s'))->orderBy('id')->each(function ($o) use (&$count) {
            DB::transaction(function () use ($o, &$count) {
                $l = CommerceOrder::where('id', $o->id)->lockForUpdate()->first();
                if ($l && $l->status === 'pending') {
                    $l->forceFill(['status' => 'expired', 'version' => $l->version + 1, 'reason' => 'Not accepted in time'])->save();
                    $this->event($l, 'expired', 'pending', 'expired', 'system', null, 'Accept deadline passed');
                    $count++;
                }
            });
        });
        return $count;
    }

    private function baseQty(object $it): float
    {
        return (float) $this->uom->toBaseQty($it->product_id, (float) $it->quantity, $it->uom ?: 'pcs');
    }

    private function createParty(CommerceOrder $o): string
    {
        // A NEW party per order: never merged with historical parties by phone/name (identity unverified).
        $id = (string) Str::uuid();
        DB::table('parties')->insert([
            'id' => $id, 'tenant_id' => $o->tenant_id, 'name' => $o->customer_name . ' (online)', 'phone' => $o->customer_phone,
            'type' => 'customer', 'address' => $o->delivery_address, 'notes' => 'Created from online order ' . $o->public_number,
            'is_active' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    private function deliveryProductId(int $tenantId): string
    {
        $id = DB::table('products')->where('tenant_id', $tenantId)->where('sku', 'ONLINE-DELIVERY')->whereNull('deleted_at')->value('id');
        if ($id) {
            return $id;
        }
        $id = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $id, 'tenant_id' => $tenantId, 'name' => 'Online delivery charge', 'sku' => 'ONLINE-DELIVERY',
            'type' => 'service', 'price' => 0, 'cost_price' => 0, 'unit' => 'pcs', 'base_unit' => 'pcs',
            'is_active' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }
}
