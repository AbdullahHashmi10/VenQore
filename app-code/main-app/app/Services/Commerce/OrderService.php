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
        // customer email after the surrounding transaction commits (a mail problem never touches the order)
        $key = $type === 'status_changed' ? $to : $type;
        if ($o->customer_email && $actorType !== 'guest' && in_array($key, ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'rejected', 'cancelled', 'expired', 'revision_proposed'], true)) {
            $fresh = $o->fresh() ?? $o;
            DB::afterCommit(fn () => app(CustomerNotifier::class)->send($fresh, $key));
        }
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
            if ($o->revision_status === 'proposed') {
                throw new CommerceException('You proposed changes to this order. Wait for the customer to answer first.', 'awaiting_customer', [], 409);
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
                // identical predicate and order to FifoService::deductStock so the two always lock rows in the same sequence
                DB::table('inventory_batches')->where('tenant_id', $tenantId)->where('product_id', $pid)
                    ->where('warehouse_id', $warehouse)->where('remaining_qty', '>', 0)
                    ->orderBy('created_at', 'ASC')->orderBy('seq', 'ASC')->lockForUpdate()->pluck('id');
            }

            $need = [];
            foreach ($items as $it) {
                $need[$it->product_id] = ($need[$it->product_id] ?? 0) + $this->baseQty($it);
            }
            $short = [];
            foreach ($need as $pid => $qty) {
                $avail = $this->stock->available($tenantId, $pid, $warehouse, $o->id, true); // locking read: latest committed state
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

    /**
     * A closed order must never silently keep a customer's money. If the customer reported a transfer or staff
     * recorded a collection, the business has to confirm the money is being returned before the order can close.
     * (Collection is a tracking flag, not a ledger posting, so the refund is the same kind of record: no journal
     * entry is invented. The money has to be returned outside the system, then confirmed here.)
     */
    private function settleOnClose(CommerceOrder $o, bool $refundConfirmed, ?int $actor): void
    {
        if (! in_array($o->payment_status, ['collected', 'transfer_reported'], true)) {
            return;
        }
        if (! $refundConfirmed) {
            throw new CommerceException(
                $o->payment_status === 'collected'
                    ? 'This customer already paid. Return their money first, then tick "refund confirmed" to close the order.'
                    : 'This customer reported sending a transfer. Check your bank; if it arrived, return it, then tick "refund confirmed" to close the order.',
                'refund_required', ['payment_status' => $o->payment_status], 409
            );
        }
        $o->forceFill(['payment_status' => 'refunded'])->save();
        $this->event($o, 'payment_refunded', null, null, 'staff', $actor, 'Refund confirmed by staff before closing the order');
    }

    /** A closed order gives its coupon use back (once). */
    private function releasePromo(CommerceOrder $o): void
    {
        if ($o->promotion_id && ! $o->promo_released) {
            DB::table('commerce_promotions')->where('id', $o->promotion_id)->where('uses', '>', 0)->decrement('uses');
            $o->forceFill(['promo_released' => true])->save();
        }
    }

    /** Customer cancels their own order: only before work started and only when no money is involved. */
    public function customerCancel(string $orderId, int $tenantId): CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId) {
            $o = $this->lock($orderId, $tenantId, null);
            if (! in_array($o->status, ['pending', 'confirmed'], true)) {
                throw new CommerceException('This order is already being prepared. Please contact the business to change it.', 'bad_state', [], 409);
            }
            if ($o->payment_status !== 'unpaid') {
                throw new CommerceException('You have already paid or reported a transfer for this order. Please contact the business to cancel and refund it.', 'refund_required', [], 409);
            }
            DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'active')->update(['status' => 'released', 'updated_at' => now()]);
            $from = $o->status;
            $this->releasePromo($o);
            $o->forceFill(['status' => 'cancelled', 'reason' => 'Cancelled by the customer', 'version' => $o->version + 1])->save();
            $this->event($o, 'cancelled', $from, 'cancelled', 'guest', null, 'Customer cancelled');
            DB::table('commerce_notifications')->insert(['tenant_id' => $o->tenant_id, 'order_id' => $o->id, 'type' => 'order_cancelled',
                'title' => 'Customer cancelled order ' . $o->public_number, 'created_at' => now(), 'updated_at' => now()]);
            return $o->fresh();
        });
    }

    public function reject(string $orderId, int $tenantId, ?int $actor, string $reason, ?int $expectedVersion = null, bool $refundConfirmed = false): CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId, $actor, $reason, $expectedVersion, $refundConfirmed) {
            $o = $this->lock($orderId, $tenantId, $expectedVersion);
            if ($o->status !== 'pending') {
                throw new CommerceException('Only a pending order can be rejected. Use cancel for accepted orders.', 'bad_state', [], 409);
            }
            $this->settleOnClose($o, $refundConfirmed, $actor);
            $this->releasePromo($o);
            $this->move($o, 'rejected', 'rejected', $actor, $reason, ['reason' => mb_substr($reason, 0, 255)]);
            return $o->fresh();
        });
    }

    public function cancel(string $orderId, int $tenantId, ?int $actor, string $reason, ?int $expectedVersion = null, bool $refundConfirmed = false): CommerceOrder
    {
        return DB::transaction(function () use ($orderId, $tenantId, $actor, $reason, $expectedVersion, $refundConfirmed) {
            $o = $this->lock($orderId, $tenantId, $expectedVersion);
            if (! in_array($o->status, ['confirmed', 'preparing', 'ready', 'out_for_delivery'], true)) {
                throw new CommerceException('This order cannot be cancelled in its current state.', 'bad_state', [], 409);
            }
            $this->settleOnClose($o, $refundConfirmed, $actor);
            DB::table('commerce_stock_holds')->where('order_id', $o->id)->where('status', 'active')
                ->update(['status' => 'released', 'updated_at' => now()]);
            $this->releasePromo($o);
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
    public function complete(string $orderId, int $tenantId, ?int $actor, bool $collectNow = false, ?int $expectedVersion = null, bool $approveBelowCost = false, ?string $partyId = null): CommerceOrder
    {
        $tenant = Tenant::withoutGlobalScopes()->findOrFail($tenantId);
        $previous = app()->bound('current.tenant') ? app('current.tenant') : null;
        app()->instance('current.tenant', $tenant);

        try {
            return DB::transaction(function () use ($orderId, $tenantId, $actor, $collectNow, $expectedVersion, $approveBelowCost, $partyId) {
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

                $tz = (string) (DB::table('storefronts')->where('id', $o->storefront_id)->value('timezone') ?: 'UTC');
                if ($partyId && ! DB::table('parties')->where('id', $partyId)->where('tenant_id', $tenantId)->whereNull('deleted_at')->exists()) {
                    throw new CommerceException('That customer record was not found.', 'bad_party', [], 422);
                }
                $partyId = $o->party_id ?: ($partyId ?: $this->createParty($o));
                $method = ! $paid ? 'credit' : ($o->payment_method === 'bank' ? 'bank' : 'cash');
                $payload = [
                    'customer_id' => $partyId,
                    'warehouse_id' => $o->warehouse_id,
                    'sale_date' => now($tz)->toDateString(),
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
                    $this->releasePromo($l);
                    $l->forceFill(['status' => 'expired', 'version' => $l->version + 1, 'reason' => 'Not accepted in time'])->save();
                    $this->event($l, 'expired', 'pending', 'expired', 'system', null, 'Accept deadline passed');
                    if ($l->payment_status === 'transfer_reported') {
                        DB::table('commerce_notifications')->insert(['tenant_id' => $l->tenant_id, 'order_id' => $l->id, 'type' => 'refund_due',
                            'title' => 'Order ' . $l->public_number . ' expired but the customer reported a transfer — check your bank and refund if it arrived', 'created_at' => now(), 'updated_at' => now()]);
                    }
                    $count++;
                }
            });
        });
        return $count;
    }

    /**
     * A business whose subscription is locked (view-only) or inactive cannot answer orders. Their waiting orders are
     * closed at once so customers are not left hanging; a reported transfer raises a refund alert.
     */
    public function sweepUnavailable(): int
    {
        $n = 0;
        $ids = DB::table('tenants')->where(function ($q) {
            $q->whereNotNull('view_only_since')->orWhereNotIn('status', ['active', 'trial', 'trialing']);
        })->pluck('id');
        if ($ids->isEmpty()) {
            return 0;
        }
        CommerceOrder::where('status', 'pending')->whereIn('tenant_id', $ids)->orderBy('id')->each(function ($o) use (&$n) {
            DB::transaction(function () use ($o, &$n) {
                $l = CommerceOrder::where('id', $o->id)->lockForUpdate()->first();
                if ($l && $l->status === 'pending') {
                    $this->releasePromo($l);
                    $l->forceFill(['status' => 'expired', 'version' => $l->version + 1, 'reason' => 'This business is not able to take orders right now'])->save();
                    $this->event($l, 'expired', 'pending', 'expired', 'system', null, 'Business unavailable (subscription)');
                    if (in_array($l->payment_status, ['transfer_reported', 'collected'], true)) {
                        DB::table('commerce_notifications')->insert(['tenant_id' => $l->tenant_id, 'order_id' => $l->id, 'type' => 'refund_due',
                            'title' => 'Order ' . $l->public_number . ' was closed because your subscription is inactive; the customer paid or reported a transfer. Refund them.', 'created_at' => now(), 'updated_at' => now()]);
                    }
                    $n++;
                }
            });
        });
        return $n;
    }

    /** Privacy: closed orders lose their personal details after $days days. Totals, items and numbers stay for accounting. */
    public function purgeCustomerData(int $days = 180): int
    {
        $cut = now('UTC')->subDays($days)->format('Y-m-d H:i:s');
        return DB::table('commerce_orders')->whereNull('purged_at')->whereIn('status', ['completed', 'rejected', 'cancelled', 'expired'])
            ->where('updated_at', '<', $cut)
            ->update(['customer_name' => 'Customer', 'customer_phone' => DB::raw("CONCAT('***', RIGHT(customer_phone, 3))"),
                'customer_email' => null, 'delivery_address' => null, 'customer_note' => null, 'bank_reference' => null, 'purged_at' => now()]);
    }

    public const STALE_NOTIFY_HOURS = 24;
    public const STALE_CANCEL_HOURS = 72;

    /**
     * Accepted orders nobody finished. After 24h the business is told once; after 72h an UNPAID order is cancelled
     * so its stock hold is released (a paid order is never auto-cancelled: that needs a human refund decision).
     * Returns [notified, cancelled].
     */
    public function sweepStale(): array
    {
        $notified = 0;
        $cancelled = 0;
        $open = ['confirmed', 'preparing', 'ready', 'out_for_delivery'];
        CommerceOrder::whereIn('status', $open)->whereNotNull('confirmed_at')
            ->where('confirmed_at', '<', now('UTC')->subHours(self::STALE_NOTIFY_HOURS)->format('Y-m-d H:i:s'))->orderBy('id')
            ->each(function ($o) use (&$notified, &$cancelled) {
                DB::transaction(function () use ($o, &$notified, &$cancelled) {
                    $l = CommerceOrder::where('id', $o->id)->lockForUpdate()->first();
                    if (! $l || ! in_array($l->status, ['confirmed', 'preparing', 'ready', 'out_for_delivery'], true)) {
                        return;
                    }
                    $old = $l->confirmed_at && $l->confirmed_at->lt(now('UTC')->subHours(self::STALE_CANCEL_HOURS));
                    if ($old && $l->payment_status === 'unpaid') {
                        DB::table('commerce_stock_holds')->where('order_id', $l->id)->where('status', 'active')->update(['status' => 'released', 'updated_at' => now()]);
                        $this->releasePromo($l);
                        $from = $l->status;
                        $l->forceFill(['status' => 'cancelled', 'reason' => 'Not completed in time', 'version' => $l->version + 1])->save();
                        $this->event($l, 'cancelled', $from, 'cancelled', 'system', null, 'Accepted but never completed: cancelled automatically, stock released');
                        DB::table('commerce_notifications')->insert(['tenant_id' => $l->tenant_id, 'order_id' => $l->id, 'type' => 'stale_cancelled',
                            'title' => 'Order ' . $l->public_number . ' was never completed and has been cancelled; its stock is available again', 'created_at' => now(), 'updated_at' => now()]);
                        $cancelled++;
                    } elseif (! $l->stale_notified_at) {
                        $l->forceFill(['stale_notified_at' => now()])->save();
                        DB::table('commerce_notifications')->insert(['tenant_id' => $l->tenant_id, 'order_id' => $l->id, 'type' => 'stale_order',
                            'title' => 'Order ' . $l->public_number . ' has been open for over ' . self::STALE_NOTIFY_HOURS . ' hours and is holding stock. Complete or cancel it.', 'created_at' => now(), 'updated_at' => now()]);
                        $notified++;
                    }
                });
            });
        return [$notified, $cancelled];
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
            // an inactive product stays out of POS search and product lists; the sale engine does not need it active
            DB::table('products')->where('id', $id)->where('is_active', 1)->update(['is_active' => 0]);
            return $id;
        }
        $id = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $id, 'tenant_id' => $tenantId, 'name' => 'Online delivery charge', 'sku' => 'ONLINE-DELIVERY',
            'type' => 'service', 'price' => 0, 'cost_price' => 0, 'unit' => 'pcs', 'base_unit' => 'pcs',
            'is_active' => 0, 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }
}
