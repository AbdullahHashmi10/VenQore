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
    public function quote(Storefront $store, array $lines, string $fulfilment = 'pickup', array $opts = []): array
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
        $variants = [];
        foreach ($lines as $l) {
            $ref = (string) ($l['item_id'] ?? $l['product_id'] ?? '');
            $qty = (int) ($l['quantity'] ?? 0);
            if ($ref === '' || $qty < 1) {
                throw new CommerceException('Invalid quantity.', 'invalid_quantity');
            }
            $refs[$ref] = ($refs[$ref] ?? 0) + $qty;

            // The same dish with different add-ons is a different line.
            $modIds = collect((array) ($l['mods'] ?? []))
                ->map(fn ($m) => (int) (is_array($m) ? ($m['id'] ?? 0) : $m))
                ->filter()->unique()->sort()->values()->all();
            // On the QR menu the same dish with a different note ("no onions") is a separate line for the kitchen.
            $lineNote = mb_substr(trim((string) ($l['notes'] ?? '')), 0, 200);
            $noteKey = ! empty($opts['split_notes']) && $lineNote !== '' ? '|' . md5($lineNote) : '';
            $vk = $ref . '|' . implode(',', $modIds) . $noteKey;
            $variants[$vk] ??= ['ref' => $ref, 'mods' => $modIds, 'qty' => 0, 'notes' => '', 'nk' => $noteKey];
            $variants[$vk]['qty'] += $qty;
            if ($variants[$vk]['notes'] === '' && $lineNote !== '') {
                $variants[$vk]['notes'] = $lineNote;
            }
        }

        $found = DB::table('storefront_products as sp')
            ->join('products as p', function ($j) {
                $j->on('p.id', '=', 'sp.product_id')->on('p.tenant_id', '=', 'sp.tenant_id');
            })
            ->where('sp.storefront_id', $store->id)
            ->where('sp.tenant_id', $store->tenant_id)
            ->where('sp.is_published', 1)
            ->where(($opts['channel'] ?? 'online') === 'onsite' ? 'sp.show_onsite' : 'sp.show_online', 1)
            ->whereNull('p.deleted_at')
            ->where(function ($q) use ($refs) {
                $q->whereIn('sp.id', array_keys($refs))->orWhereIn('sp.product_id', array_keys($refs));
            })
            ->get(['sp.*', 'p.name as p_name', 'p.sku', 'p.price', 'p.cost_price', 'p.tax_rate', 'p.price_includes_tax',
                'p.category_id', 'p.base_unit', 'p.unit', 'p.is_active', 'p.type', 'p.has_variants', 'p.is_weighted', 'p.track_serial']);

        // merge duplicate listings (same listing referenced twice) and key by product id
        $merged = [];
        $rows = collect();
        $problems = [];
        $pidTotals = [];
        foreach ($variants as $v) {
            $ref = $v['ref'];
            $row = $found->first(fn ($r) => $r->id === $ref) ?? $found->first(fn ($r) => $r->product_id === $ref);
            if (! $row) {
                $problems[] = ['item_id' => $ref, 'product_id' => $ref, 'message' => 'This item is no longer available.'];
                continue;
            }
            $mk = $row->product_id . '|' . implode(',', $v['mods']) . ($v['nk'] ?? '');
            $merged[$mk] ??= ['pid' => $row->product_id, 'qty' => 0, 'mods' => $v['mods'], 'notes' => $v['notes']];
            $merged[$mk]['qty'] += $v['qty'];
            $pidTotals[$row->product_id] = ($pidTotals[$row->product_id] ?? 0) + $v['qty'];
            $rows->put($row->product_id, $row);
        }

        // add-ons for every product in the cart, fetched together
        $addOnGroups = app(OnlineAddOns::class)->forProducts(
            (int) $store->tenant_id,
            $rows->mapWithKeys(fn ($r, $pid) => [(string) $pid => $r->category_id])->all()
        );

        $cand = [];
        $gross = 0.0;
        foreach ($merged as $m) {
            $pid = $m['pid'];
            $qty = $m['qty'];
            $row = $rows->get($pid);
            if (! $row) {
                $problems[] = ['item_id' => $pid, 'product_id' => $pid, 'message' => 'This item is no longer available.'];
                continue;
            }
            if (($pidTotals[$pid] ?? $qty) > self::MAX_QTY) {
                $problems[] = ['item_id' => $row->id, 'product_id' => $pid, 'message' => 'Maximum ' . self::MAX_QTY . ' per item per order.'];
                continue;
            }
            if (ProductReadiness::reason((object) array_merge((array) $row, ['id' => $row->product_id])) !== null) {
                $problems[] = ['item_id' => $row->id, 'product_id' => $pid, 'message' => 'This item is no longer available.'];
                continue;
            }
            $price = $this->pricing->resolve($row, $row, $store);

            // Add-ons: validated against what the product really offers; only the
            // chosen option ids come from the browser, never a price.
            $chosen = app(OnlineAddOns::class)->resolve($addOnGroups[$pid] ?? [], $m['mods'], (string) ($row->public_name ?: $row->p_name));
            $delta = round(array_sum(array_column($chosen, 'price_delta')), 2);
            if ($delta != 0.0) {
                $online = round(max(0.0, $price['online_price'] + $delta), 2);
                $price['online_price'] = $online;
                $price['net_unit_price'] = $price['price_includes_tax']
                    ? round($online / (1 + $price['tax_rate'] / 100), 4)
                    : round($online, 4);
                $price['below_cost'] = $price['net_unit_price'] < round((float) ($row->cost_price ?? 0), 4);
            }
            if ($price['below_cost'] && ! $row->allow_below_cost) {
                $problems[] = ['item_id' => $row->id, 'product_id' => $pid, 'message' => 'This item is temporarily unavailable.'];
                continue;
            }
            if ($store->warehouse_id && ! app(StockAvailability::class)->sellsWithoutStock((int) $store->tenant_id, $pid)) {
                $svc = app(StockAvailability::class);
                // orders still waiting for the business also claim units (they expire on their own, so this self-heals)
                $rawAvailable = $svc->available($store->tenant_id, $pid, $store->warehouse_id);
                $offline = (float) ($row->offline_reserve_qty ?? 0);
                $onlineAvailable = max(0.0, $rawAvailable - $offline);
                if ($row->online_stock_limit !== null) {
                    $onlineAvailable = min($onlineAvailable, (float) $row->online_stock_limit);
                }
                $left = $onlineAvailable - $svc->pendingDemand($store->tenant_id, $pid);
                $need = $this->baseNeed($pid, (float) ($pidTotals[$pid] ?? $qty), $row);
                if ($left + 0.00001 < $need) {
                    $problems[] = ['item_id' => $row->id, 'product_id' => $pid, 'message' => $left <= 0 ? 'Sold out.' : 'Only ' . rtrim(rtrim(number_format($left, 2, '.', ''), '0'), '.') . ' left.'];
                    continue;
                }
            }
            $gross += round($qty * $price['online_price'], 2);
            $cand[] = [$pid, $qty, $row, $price, $chosen, $m['notes']];
        }

        // promotions: validated against the pre-discount order value
        $promos = app(Promotions::class);
        $plan = ['coupon' => null, 'auto' => collect()];
        if (! $problems) {
            $plan = $promos->resolve($store, $opts['coupon'] ?? null, $gross);
        }

        $eff = $promos->effective($plan, $cand);
        $items = [];
        $subtotal = 0.0;
        $tax = 0.0;
        $discount = 0.0;
        $names = [];
        $couponUsed = false;
        foreach ($cand as $candLine) {
            [$pid, $qty, $row, $price] = $candLine;
            $chosenMods = $candLine[4] ?? [];
            $lineNotes = $candLine[5] ?? '';
            if ($promo = $promos->pickFor($plan, $row->category_id, $eff)) {
                $d = $this->pricing->discount($price, $row, (float) ($eff[$promo->id] ?? $promo->percent));
                if (! $d['below_cost'] || $row->allow_below_cost) {
                    $price = $d;
                    $names[$promo->name] = true;
                    $couponUsed = $couponUsed || ($plan['coupon'] && $promo->id === $plan['coupon']->id);
                }
            }
            $line = $this->pricing->line($price, $qty);
            $discount += round(($price['list_price'] ?? $price['online_price']) * $qty, 2) - round($price['online_price'] * $qty, 2);
            $items[] = array_merge($price, $line, [
                'product_id' => $pid,
                'item_id' => $row->id,
                'title' => ($row->public_name ?: $row->p_name) . ($row->option_label ? " — {$row->option_label}" : ''),
                'sku' => $row->sku,
                'uom' => $row->base_unit ?: $row->unit,
                'quantity' => $qty,
                'allow_below_cost' => (bool) $row->allow_below_cost,
                'mods' => $chosenMods,
                'notes' => $lineNotes,
            ]);
            $subtotal += $line['line_net'];
            $tax += $line['tax_amount'];
        }
        if ($plan['coupon'] && ! $couponUsed && ! $problems) {
            throw new CommerceException('That coupon does not apply to the items in your cart.', 'invalid_coupon');
        }
        if ($problems) {
            throw new CommerceException('Some items in your cart changed.', 'cart_changed', ['problems' => $problems]);
        }

        $zone = null;
        $zones = is_array($store->delivery_zones) ? $store->delivery_zones : [];
        $minOrder = (float) $store->min_order_amount;
        $fee = $fulfilment === 'delivery' ? round((float) $store->delivery_charge, 2) : 0.0;
        if ($fulfilment === 'delivery' && $zones) {
            $wanted = trim((string) ($opts['zone'] ?? ''));
            $zone = collect($zones)->first(fn ($z) => $wanted !== '' && strcasecmp($z['name'], $wanted) === 0);
            if ($wanted !== '' && ! $zone) {
                throw new CommerceException('We do not deliver to that area.', 'bad_zone');
            }
            if ($zone) {
                $fee = round((float) $zone['fee'], 2);
                $minOrder = max($minOrder, (float) ($zone['min_order'] ?? 0));
            }
        }
        // Totals in integer paisa (each line amount is already exact to the paisa).
        $minor = fn ($v) => \App\Support\Money::toMinor(\Brick\Math\BigDecimal::of(number_format((float) $v, 6, '.', '')));
        $subtotalMinor = array_sum(array_map(fn ($it) => $minor($it['line_net']), $items));
        $taxMinor = array_sum(array_map(fn ($it) => $minor($it['tax_amount']), $items));
        $subtotal = \App\Support\Money::toFloat($subtotalMinor);
        $tax = \App\Support\Money::toFloat($taxMinor);
        $total = \App\Support\Money::toFloat($subtotalMinor + $taxMinor + $minor($fee));

        return [
            'items' => $items,
            'subtotal' => $subtotal,
            'tax_total' => $tax,
            'delivery_fee' => $fee,
            'delivery_zone' => $zone['name'] ?? null,
            'zone_required' => $fulfilment === 'delivery' && $zones && ! $zone,
            'min_order' => $minOrder,
            'discount_total' => round($discount, 2),
            'promo_name' => $names ? mb_substr(implode(', ', array_keys($names)), 0, 120) : null,
            'promotion_id' => $couponUsed ? $plan['coupon']->id : null,
            'promo_code' => $couponUsed ? $plan['coupon']->code : null,
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

        if (DB::table('commerce_blocked_phones')->where('tenant_id', $store->tenant_id)->where('phone', $phone)->exists()) {
            throw new CommerceException('This business cannot take an order from that phone number.', 'blocked', [], 403);
        }

        $open = DB::table('commerce_orders')->where('storefront_id', $store->id)
            ->where('customer_phone', $phone)->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'])->count();
        if ($open >= self::MAX_OPEN_PER_PHONE) {
            throw new CommerceException('You already have several open orders with this business. Please wait for them to be handled.', 'too_many_open', [], 429);
        }

        $q = $this->quote($store, $in['items'] ?? [], $fulfilment, ['zone' => $in['delivery_zone'] ?? null, 'coupon' => $in['coupon'] ?? null]);

        if ($q['zone_required']) {
            throw new CommerceException('Please choose your delivery area.', 'zone_required');
        }
        if ($q['min_order'] > 0 && ($q['subtotal'] + $q['tax_total']) < $q['min_order']) {
            throw new CommerceException('Minimum order is ' . $store->currency_symbol . ' ' . number_format($q['min_order'], 2) . '.', 'below_minimum');
        }
        if (isset($in['expected_total']) && abs((float) $in['expected_total'] - $q['total']) > 0.005) {
            throw new CommerceException('Prices changed. Please review your cart.', 'quote_changed', ['quote' => $q], 409);
        }

        $token = Str::random(48);

        try {
            $order = DB::transaction(function () use ($store, $in, $q, $fulfilment, $method, $name, $phone, $key, $token) {
                if ($q['promotion_id']) {
                    $pr = DB::table('commerce_promotions')->where('id', $q['promotion_id'])->lockForUpdate()->first();
                    if (! $pr || ($pr->max_uses !== null && $pr->uses >= $pr->max_uses)) {
                        throw new CommerceException('That coupon has just been fully used.', 'invalid_coupon');
                    }
                    DB::table('commerce_promotions')->where('id', $pr->id)->increment('uses');
                }
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
                    'customer_email' => filter_var(trim((string) ($in['customer_email'] ?? '')), FILTER_VALIDATE_EMAIL) ?: null,
                    'delivery_address' => $fulfilment === 'delivery' ? trim((string) $in['delivery_address']) : null,
                    'customer_note' => isset($in['customer_note']) ? mb_substr(trim((string) $in['customer_note']), 0, 500) : null,
                    'currency_code' => $q['currency_code'],
                    'currency_symbol' => $q['currency_symbol'],
                    'subtotal' => $q['subtotal'],
                    'tax_total' => $q['tax_total'],
                    'delivery_fee' => $q['delivery_fee'],
                    'delivery_zone' => $q['delivery_zone'],
                    'promotion_id' => $q['promotion_id'], 'promo_name' => $q['promo_name'], 'promo_code' => $q['promo_code'],
                    'discount_total' => $q['discount_total'],
                    'total' => $q['total'],
                    'warehouse_id' => $store->warehouse_id,
                    'accept_by' => $this->acceptBy($store),
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
                        'list_price' => $it['list_price'] ?? $it['online_price'],
                        'discount_percent' => $it['discount_percent'] ?? 0,
                        'net_unit_price' => $it['net_unit_price'],
                        'tax_rate' => $it['tax_rate'],
                        'price_includes_tax' => $it['price_includes_tax'],
                        'line_net' => $it['line_net'],
                        'tax_amount' => $it['tax_amount'],
                        'line_total' => $it['line_total'],
                        'mods' => ! empty($it['mods']) ? $it['mods'] : null,
                        'notes' => ($it['notes'] ?? '') !== '' ? $it['notes'] : null,
                    ]);
                }
                DB::table('commerce_order_tokens')->insert(['order_id' => $order->id, 'token_hash' => hash('sha256', $token), 'created_at' => now()]);
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

        app(CustomerNotifier::class)->send($order->fresh(), 'placed', $token);

        return ['order' => $order->fresh('items'), 'token' => $token, 'replayed' => false];
    }

    private function baseNeed(string $pid, float $qty, object $row): float
    {
        try {
            return (float) app(\App\Engines\UomService::class)->toBaseQty($pid, $qty, $row->base_unit ?: ($row->unit ?: 'pcs'));
        } catch (\Throwable) {
            return $qty;
        }
    }

    /** Accept deadline. An order placed while closed or on break gets its window from the next opening/resume time. */
    public function acceptBy(Storefront $store): string
    {
        $mins = (int) $store->accept_deadline_minutes;
        $from = now('UTC');
        $tz = $store->timezone ?: 'UTC';
        if ($store->orders_outside_hours && OpeningHours::isOpenNow($store->opening_hours, $tz) === false) {
            $from = OpeningHours::nextOpening($store->opening_hours, $tz) ?? $from;
        } elseif ($store->orders_during_break && ($onBreak = OpeningHours::isOnBreak($store->opening_hours, $tz)) !== null) {
            $from = $onBreak['resumes_utc'] ?? $from;
        }
        return $from->addMinutes($mins)->format('Y-m-d H:i:s');
    }

    public function assertStoreOpen(Storefront $store): void
    {
        $tenantActive = DB::table('tenants')->where('id', $store->tenant_id)->whereNull('deleted_at')->value('status');
        if ($store->status !== 'published' || $tenantActive === null || ! in_array($tenantActive, ['active', 'trial', 'trialing'], true)) {
            throw new CommerceException('This business is not taking online orders right now.', 'store_closed', [], 409);
        }
        if (! $store->moduleOn('online_store')) {
            throw new CommerceException('This business is not taking online orders right now.', 'store_closed', [], 409);
        }
        if ($store->intake_paused) {
            throw new CommerceException('This business has paused online ordering for now.', 'intake_paused', [], 409);
        }
        if ($store->isClosedByHours()) {
            $onBreak = $store->isOnBreak();
            if ($onBreak !== null) {
                throw new CommerceException('This business is on a break until ' . $onBreak['resumes_at'] . ' and is not taking orders during break hours.', 'closed_hours', [], 409);
            }
            throw new CommerceException('This business is closed right now and is not taking orders outside its opening hours.', 'closed_hours', [], 409);
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
        // add a link, never replace: the one the customer already saved must keep working
        DB::table('commerce_order_tokens')->insert(['order_id' => $order->id, 'token_hash' => hash('sha256', $token), 'created_at' => now()]);
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
