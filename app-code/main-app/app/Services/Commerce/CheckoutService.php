<?php

namespace App\Services\Commerce;

use App\Models\Commerce\CommerceOrder;
use App\Models\Commerce\Storefront;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Guest checkout. Everything is priced on the server from the live catalogue; the browser only sends
 * product ids + quantities (+ an optional expected total used to detect stale quotes).
 */
class CheckoutService
{
    public const MAX_LINES = 40;
    public const MAX_QTY = 50;
    public const MAX_OPEN_PER_PHONE = 5;

    public function __construct(private OnlinePricing $pricing, private OrderService $orders)
    {
    }

    /** Server quote for a cart. Throws CommerceException for unsellable lines. */
    public function quote(Storefront $store, array $lines, string $fulfilment = 'pickup'): array
    {
        if (empty($lines)) {
            throw new CommerceException('Your cart is empty.', 'empty_cart');
        }
        if (count($lines) > self::MAX_LINES) {
            throw new CommerceException('Too many different items in one order.', 'too_many_lines');
        }

        // Lines identify a listing by the PUBLIC id (storefront_products.id, `item_id`);
        // `product_id` (internal) is also accepted for server-side callers/tests.
        $refs = [];
        foreach ($lines as $l) {
            $ref = (string) ($l['item_id'] ?? $l['product_id'] ?? '');
            $qty = (int) ($l['quantity'] ?? 0);
            if ($ref === '' || $qty < 1) {
                throw new CommerceException('Invalid quantity.', 'invalid_quantity');
            }
            $refs[$ref] = ($refs[$ref] ?? 0) + $qty;
        }

        $found = DB::table('storefront_products as sp')
            ->join('products as p', function ($j) {
                $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id');
            })
            ->where('sp.storefront_id', $store->id)
            ->where('sp.tenant_id', $store->tenant_id)
            ->where('sp.is_published', 1)
            ->whereNull('p.deleted_at')
            ->where(function ($q) use ($refs) {
                $q->whereIn('sp.id', array_keys($refs))->orWhereIn('sp.product_id', array_keys($refs));
            })
            ->get(['sp.*', 'p.name as p_name', 'p.sku', 'p.price', 'p.cost_price', 'p.tax_rate', 'p.price_includes_tax',
                'p.base_unit', 'p.unit', 'p.is_active', 'p.type', 'p.has_variants', 'p.is_weighted', 'p.track_serial']);

        // merge duplicate listings (same listing referenced twice) and key by product id
        $merged = [];
        $rows = collect();
        $problems = [];
        foreach ($refs as $ref => $qty) {
            $row = $found->first(fn ($r) => $r->id === $ref) ?? $found->first(fn ($r) => $r->product_id === $ref);
            if (! $row) {
                $problems[] = ['item_id' => $ref, 'product_id' => $ref, 'message' => 'This item is no longer available.'];
                continue;
            }
            $merged[$row->product_id] = ($merged[$row->product_id] ?? 0) + $qty;
            $rows->put($row->product_id, $row);
        }

        $items = [];
        $subtotal = 0.0;
        $tax = 0.0;
        foreach ($merged as $pid => $qty) {
            $row = $rows->get($pid);
            if (! $row) {
                $problems[] = ['item_id' => $row->id ?? $pid, 'product_id' => $pid, 'message' => 'This item is no longer available.'];
                continue;
            }
            if ($qty > self::MAX_QTY) {
                $problems[] = ['item_id' => $row->id ?? $pid, 'product_id' => $pid, 'message' => 'Maximum ' . self::MAX_QTY . ' per item per order.'];
                continue;
            }
            if (ProductReadiness::reason((object) array_merge((array) $row, ['id' => $row->product_id])) !== null) {
                $problems[] = ['item_id' => $row->id ?? $pid, 'product_id' => $pid, 'message' => 'This item is no longer available.'];
                continue;
            }
            $price = $this->pricing->resolve($row, $row, $store);
            if ($price['below_cost'] && ! $row->allow_below_cost) {
                $problems[] = ['item_id' => $row->id ?? $pid, 'product_id' => $pid, 'message' => 'This item is temporarily unavailable.'];
                continue;
            }
            $line = $this->pricing->line($price, $qty);
            $items[] = array_merge($price, $line, [
                'product_id' => $pid,
                'item_id' => $row->id,
                'title' => $row->public_name ?: $row->p_name,
                'sku' => $row->sku,
                'uom' => $row->base_unit ?: $row->unit,
                'quantity' => $qty,
                'allow_below_cost' => (bool) $row->allow_below_cost,
            ]);
            $subtotal += $line['line_net'];
            $tax += $line['tax_amount'];
        }
        if ($problems) {
            throw new CommerceException('Some items in your cart changed.', 'cart_changed', ['problems' => $problems]);
        }

        $fee = $fulfilment === 'delivery' ? round((float) $store->delivery_charge, 2) : 0.0;
        $subtotal = round($subtotal, 2);
        $tax = round($tax, 2);
        $total = round($subtotal + $tax + $fee, 2);

        return [
            'items' => $items,
            'subtotal' => $subtotal,
            'tax_total' => $tax,
            'delivery_fee' => $fee,
            'total' => $total,
            'currency_code' => $store->currency_code,
            'currency_symbol' => $store->currency_symbol,
        ];
    }

    /**
     * @return array{order: CommerceOrder, token: string, replayed: bool}
     */
    public function place(Storefront $store, array $in): array
    {
        $key = (string) ($in['idempotency_key'] ?? '');
        if (strlen($key) < 16 || strlen($key) > 100) {
            throw new CommerceException('Missing checkout key. Please reload and try again.', 'bad_key');
        }

        // Replay (double click / retry after a timeout) returns the SAME order.
        if ($existing = $this->findReplay($store, $key)) {
            return $this->rotate($existing);
        }

        $this->assertStoreOpen($store);

        $fulfilment = $in['fulfilment'] ?? 'pickup';
        if (! in_array($fulfilment, ['pickup', 'delivery'], true)
            || ($fulfilment === 'pickup' && ! $store->supports_pickup)
            || ($fulfilment === 'delivery' && ! $store->supports_delivery)) {
            throw new CommerceException('That fulfilment option is not offered by this business.', 'bad_fulfilment');
        }
        $method = $in['payment_method'] ?? '';
        $allowed = ['cod' => $store->accept_cod && $fulfilment === 'delivery',
            'pickup' => $store->accept_pickup_payment && $fulfilment === 'pickup',
            'bank' => $store->accept_bank_transfer];
        if (empty($allowed[$method])) {
            throw new CommerceException('That payment option is not available for this order.', 'bad_payment');
        }
        if ($fulfilment === 'delivery' && trim((string) ($in['delivery_address'] ?? '')) === '') {
            throw new CommerceException('A delivery address is required.', 'address_required');
        }

        $name = trim((string) ($in['customer_name'] ?? ''));
        $phone = preg_replace('/[^\d+]/', '', (string) ($in['customer_phone'] ?? ''));
        if ($name === '' || mb_strlen($name) > 150) {
            throw new CommerceException('Please enter your name.', 'name_required');
        }
        if (strlen($phone) < 7 || strlen($phone) > 20) {
            throw new CommerceException('Please enter a valid phone number.', 'phone_invalid');
        }

        $open = DB::table('commerce_orders')->where('storefront_id', $store->id)
            ->where('customer_phone', $phone)->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'])->count();
        if ($open >= self::MAX_OPEN_PER_PHONE) {
            throw new CommerceException('You already have several open orders with this business. Please wait for them to be handled.', 'too_many_open', [], 429);
        }

        $q = $this->quote($store, $in['items'] ?? [], $fulfilment);

        if ($store->min_order_amount > 0 && ($q['subtotal'] + $q['tax_total']) < $store->min_order_amount) {
            throw new CommerceException('Minimum order is ' . $store->currency_symbol . ' ' . number_format($store->min_order_amount, 2) . '.', 'below_minimum');
        }
        if (isset($in['expected_total']) && abs((float) $in['expected_total'] - $q['total']) > 0.005) {
            throw new CommerceException('Prices changed. Please review your cart.', 'quote_changed', ['quote' => $q], 409);
        }

        $token = Str::random(48);

        try {
            $order = DB::transaction(function () use ($store, $in, $q, $fulfilment, $method, $name, $phone, $key, $token) {
                $order = CommerceOrder::create([
                    'tenant_id' => $store->tenant_id,
                    'storefront_id' => $store->id,
                    'public_number' => $this->nextPublicNumber(),
                    'status_token_hash' => hash('sha256', $token),
                    'idempotency_key' => $key,
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'payment_method' => $method,
                    'fulfilment' => $fulfilment,
                    'customer_name' => $name,
                    'customer_phone' => $phone,
                    'delivery_address' => $fulfilment === 'delivery' ? trim((string) $in['delivery_address']) : null,
                    'customer_note' => isset($in['customer_note']) ? mb_substr(trim((string) $in['customer_note']), 0, 500) : null,
                    'currency_code' => $q['currency_code'],
                    'currency_symbol' => $q['currency_symbol'],
                    'subtotal' => $q['subtotal'],
                    'tax_total' => $q['tax_total'],
                    'delivery_fee' => $q['delivery_fee'],
                    'total' => $q['total'],
                    'warehouse_id' => $store->warehouse_id,
                    'accept_by' => now('UTC')->addMinutes((int) $store->accept_deadline_minutes)->format('Y-m-d H:i:s'),
                ]);
                foreach ($q['items'] as $it) {
                    $order->items()->create([
                        'tenant_id' => $store->tenant_id,
                        'product_id' => $it['product_id'],
                        'title' => $it['title'],
                        'sku' => $it['sku'],
                        'uom' => $it['uom'],
                        'quantity' => $it['quantity'],
                        'base_price' => $it['base_price'],
                        'price_rule' => $it['rule'],
                        'rule_percent' => $it['rule_percent'],
                        'online_price' => $it['online_price'],
                        'net_unit_price' => $it['net_unit_price'],
                        'tax_rate' => $it['tax_rate'],
                        'price_includes_tax' => $it['price_includes_tax'],
                        'line_net' => $it['line_net'],
                        'tax_amount' => $it['tax_amount'],
                        'line_total' => $it['line_total'],
                    ]);
                }
                $this->orders->event($order, 'placed', null, 'pending', 'guest', null, 'Order placed by customer');
                DB::table('commerce_notifications')->insert([
                    'tenant_id' => $store->tenant_id, 'order_id' => $order->id, 'type' => 'new_order',
                    'title' => 'New online order ' . $order->public_number . ' from ' . $order->customer_name,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                return $order;
            });
        } catch (QueryException $e) {
            // Concurrent duplicate submit: the unique (storefront_id, idempotency_key) won the race.
            if ($existing = $this->findReplay($store, $key)) {
                return $this->rotate($existing);
            }
            throw $e;
        }

        return ['order' => $order->fresh('items'), 'token' => $token, 'replayed' => false];
    }

    public function assertStoreOpen(Storefront $store): void
    {
        $tenantActive = DB::table('tenants')->where('id', $store->tenant_id)->whereNull('deleted_at')->value('status');
        if ($store->status !== 'published' || $tenantActive === null || ! in_array($tenantActive, ['active', 'trial', 'trialing'], true)) {
            throw new CommerceException('This business is not taking online orders right now.', 'store_closed', [], 409);
        }
        if ($store->intake_paused) {
            throw new CommerceException('This business has paused online ordering for now.', 'intake_paused', [], 409);
        }
        if (! $store->warehouse_id) {
            throw new CommerceException('This business is not ready to take orders yet.', 'no_warehouse', [], 409);
        }
    }

    private function findReplay(Storefront $store, string $key): ?CommerceOrder
    {
        return CommerceOrder::where('storefront_id', $store->id)->where('idempotency_key', $key)->first();
    }

    /** A replay re-issues the status link (only the hash is stored, so the original cannot be re-shown). */
    private function rotate(CommerceOrder $order): array
    {
        $token = Str::random(48);
        $order->forceFill(['status_token_hash' => hash('sha256', $token)])->save();
        return ['order' => $order->load('items'), 'token' => $token, 'replayed' => true];
    }

    private function nextPublicNumber(): string
    {
        do {
            $n = 'VQ-' . strtoupper(Str::random(3)) . '-' . random_int(1000, 9999);
        } while (CommerceOrder::where('public_number', $n)->exists());
        return $n;
    }
}
