<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Storefront;
use App\Models\Occupancy;
use App\Models\Position;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class OnsiteOrderService
{
    /** Guest lines a table may have waiting for staff before the QR menu asks the guest to call someone over. */
    public const MAX_PENDING_LINES = 40;
    /** Orders one table may send, and walk-in orders one device may send, inside the window. */
    public const TABLE_BURST = 8;
    public const TABLE_WINDOW = 300;
    public const COUNTER_BURST = 5;
    public const COUNTER_WINDOW = 600;
    /** Walk-in tickets opened from the counter QR in the last half hour, across all guests. */
    public const COUNTER_OPEN_CAP = 30;

    public function __construct(private CheckoutService $checkout)
    {
    }

    public function place(Storefront $store, ?Position $position, array $data): array
    {
        return DB::transaction(function () use ($store, $position, $data) {
            $existing = DB::table('onsite_order_requests')
                ->where('storefront_id', $store->id)->where('idempotency_key', $data['idempotency_key'])->first();
            if ($existing) {
                return ['number' => $existing->public_number, 'occupancy_id' => $existing->occupancy_id, 'request_id' => $existing->request_id, 'replayed' => true];
            }

            if ($hold = $store->onsiteHoldReason()) {
                throw new CommerceException($hold, 'onsite_held', [], 409);
            }
            $this->throttle($store, $position, (string) ($data['client_ip'] ?? ''));

            // Price and validate first: if anything is wrong nothing is opened on the floor.
            $quote = $this->checkout->quote($store, $data['items'], 'pickup', ['channel' => 'onsite', 'split_notes' => true]);

            // The reference the guest is shown is also the walk-in ticket's name on the POS, so staff can find it.
            $number = 'SO-' . now()->format('ymd') . '-' . strtoupper(Str::random(5));
            $requestId = (string) Str::uuid();

            if ($position) {
                $position = Position::withoutGlobalScopes()->where('tenant_id', $store->tenant_id)->lockForUpdate()->findOrFail($position->id);
                abort_unless($position->customer_ordering_enabled, 404);
                $occupancy = Occupancy::withoutGlobalScopes()->where('tenant_id', $store->tenant_id)->where('position_id', $position->id)
                    ->whereNull('closed_at')->lockForUpdate()->first();
                if (! $occupancy) {
                    if ($store->onsite_require_seated) {
                        throw new CommerceException('Please ask a member of staff to open your table first, then try again.', 'table_not_open', [], 409);
                    }
                    $occupancy = Occupancy::create([
                        'tenant_id' => $store->tenant_id, 'position_id' => $position->id,
                        'label' => $position->label ?: $position->code, 'opened_by' => null, 'opened_at' => now(),
                        'source_type' => 'table_qr',
                        'session_data' => ['order_type' => 'dine_in', 'covers' => 1, 'cart' => [], 'order_total' => 0, 'note' => '', 'sent_at' => null],
                    ]);
                    $position->update(['status' => 'active']);
                }
                $waiting = collect($occupancy->session_data['cart'] ?? [])
                    ->filter(fn ($l) => ! empty($l['customer_pending']) && empty($l['sent']))->count();
                if ($waiting + count($quote['items']) > self::MAX_PENDING_LINES) {
                    throw new CommerceException('There are a lot of items waiting for staff on this table. Please ask someone to come over.', 'too_many_pending', [], 429);
                }
                $channel = 'table_qr';
            } else {
                abort_unless($store->counter_qr_enabled, 404);
                $recent = Occupancy::withoutGlobalScopes()->where('tenant_id', $store->tenant_id)->where('source_type', 'counter_qr')
                    ->whereNull('closed_at')->where('opened_at', '>=', now()->subMinutes(30))->count();
                if ($recent >= self::COUNTER_OPEN_CAP) {
                    throw new CommerceException('The counter is very busy right now. Please order at the counter.', 'counter_busy', [], 429);
                }
                $occupancy = Occupancy::create([
                    'tenant_id' => $store->tenant_id, 'position_id' => null,
                    'label' => $number, 'opened_by' => null, 'opened_at' => now(),
                    'source_type' => 'counter_qr',
                    'session_data' => ['order_type' => 'takeaway', 'covers' => 0, 'cart' => [], 'order_total' => 0, 'note' => '', 'sent_at' => null,
                        'customer_name' => trim((string) ($data['customer_name'] ?? '')), 'phone' => ''],
                ]);
                $channel = 'counter_qr';
            }

            $newLines = [];
            $total = 0.0;
            foreach ($quote['items'] as $item) {
                $qty = (int) $item['quantity'];
                $lineTotal = round((float) $item['online_price'] * $qty, 2);
                $total += $lineTotal;
                // Add-ons arrive priced inside online_price; the register stores the
                // base price and adds the option deltas itself, so split them back.
                $mods = array_map(fn ($m) => [
                    'id' => $m['id'], 'name' => $m['name'], 'price_delta' => (float) $m['price_delta'],
                ], $item['mods'] ?? []);
                $delta = array_sum(array_column($mods, 'price_delta'));
                $newLines[] = [
                    'id' => $item['product_id'], 'line_id' => (string) Str::uuid(),
                    'name' => $item['title'], 'price' => round(max(0.0, (float) $item['online_price'] - $delta), 4),
                    'unit_price' => (float) $item['online_price'], 'qty' => $qty,
                    'notes' => (string) ($item['notes'] ?? ''), 'mods' => $mods, 'sent' => false,
                    'source' => $channel, 'customer_request_id' => $requestId, 'customer_ref' => $number,
                    'customer_pending' => true,
                ];
            }

            $session = $occupancy->session_data ?? [];
            $session['cart'] = array_values(array_merge($session['cart'] ?? [], $newLines));
            $session['order_total'] = round(collect($session['cart'])->sum(fn ($line) => empty($line['paid_sale_id']) ? (float) ($line['unit_price'] ?? $line['price'] ?? 0) * (float) ($line['qty'] ?? 0) : 0), 2);
            $session['customer_order_received_at'] = now()->toIso8601String();
            $session['customer_orders'] = array_slice(array_merge($session['customer_orders'] ?? [], [[
                'number' => $number, 'at' => now()->toIso8601String(), 'name' => trim((string) ($data['customer_name'] ?? '')),
            ]]), -20);
            if (! empty($data['customer_note'])) {
                $session['note'] = trim(implode("\n", array_filter([$session['note'] ?? '', 'Customer (' . $number . '): ' . $data['customer_note']])));
            }
            if (! $position && ! empty($data['customer_name'])) $session['customer_name'] = trim($data['customer_name']);
            $occupancy->session_data = $session;
            $occupancy->save();

            DB::table('onsite_order_requests')->insert([
                'tenant_id' => $store->tenant_id, 'storefront_id' => $store->id,
                'position_id' => $position?->id, 'occupancy_id' => $occupancy->id,
                'public_number' => $number, 'idempotency_key' => $data['idempotency_key'], 'request_id' => $requestId,
                'channel' => $channel, 'customer_name' => trim((string) ($data['customer_name'] ?? '')) ?: null,
                'line_count' => count($newLines), 'total' => round($total, 2), 'created_at' => now(), 'updated_at' => now(),
            ]);

            return ['number' => $number, 'occupancy_id' => $occupancy->id, 'request_id' => $requestId, 'replayed' => false];
        }, 3);
    }

    /**
     * Where an order of this reference stands, for the guest's status page. Built only from what the table
     * itself shows staff: lines still waiting, lines sent to the kitchen, lines staff removed, and a closed bill.
     */
    public function status(Storefront $store, string $number): ?array
    {
        $req = DB::table('onsite_order_requests')->where('storefront_id', $store->id)->where('public_number', $number)->first();
        if (! $req) {
            return null;
        }
        $occ = Occupancy::withoutGlobalScopes()->where('tenant_id', $store->tenant_id)->find($req->occupancy_id);
        $session = $occ?->session_data ?? [];
        $cart = collect($session['cart'] ?? []);
        $mine = $cart->filter(fn ($l) => ($l['customer_request_id'] ?? null) === $req->request_id)->values();
        $closed = ! $occ || $occ->closed_at !== null;

        $lines = $mine->map(function ($l) use ($closed) {
            $qty = (float) ($l['qty'] ?? 1);
            $sentQty = (float) ($l['sent_qty'] ?? (! empty($l['sent']) ? $qty : 0));
            $state = $closed ? 'done' : ($sentQty >= $qty && $qty > 0 ? 'kitchen' : 'waiting');

            return [
                'name' => (string) ($l['name'] ?? ''), 'qty' => (int) $qty, 'notes' => (string) ($l['notes'] ?? ''),
                'mods' => collect($l['mods'] ?? [])->pluck('name')->filter()->values()->all(), 'state' => $state,
            ];
        })->all();

        // Lines this guest sent that staff have since taken off the table.
        $gone = collect($session['guest_removed'] ?? [])->where('request_id', $req->request_id)->values();
        $removed = max($gone->count(), 0);
        if ($gone->isEmpty()) {
            $removed = $mine->isEmpty() ? max(0, (int) $req->line_count) : max(0, (int) $req->line_count - count($lines));
        }
        $states = collect($lines)->pluck('state')->unique();
        $overall = $closed ? 'done' : ($states->isEmpty() ? 'changed' : ($states->contains('waiting') ? 'waiting' : 'kitchen'));

        $call = $session['guest_call'] ?? null;

        return [
            'number' => $req->public_number,
            'channel' => $req->channel,
            'status' => $overall,
            'lines' => $lines,
            'removed' => $removed,
            'removed_lines' => $gone->map(fn ($g) => ['name' => $g['name'], 'reason' => $g['reason'] ?? null])->all(),
            'placed_at' => (string) $req->created_at,
            'call' => $call && empty($call['handled_at']) ? ['kind' => $call['kind'], 'at' => $call['at']] : null,
        ];
    }

    /** The guest taps "Call a waiter" or "Request the bill". Shown to staff on the table until they clear it. */
    public function call(Storefront $store, Position $position, string $kind): void
    {
        abort_unless(in_array($kind, ['waiter', 'bill'], true), 422);
        abort_unless($position->customer_ordering_enabled, 404);
        $occ = Occupancy::withoutGlobalScopes()->where('tenant_id', $store->tenant_id)->where('position_id', $position->id)
            ->whereNull('closed_at')->lockForUpdate()->first();
        if (! $occ) {
            throw new CommerceException('Please ask a member of staff to open your table first.', 'table_not_open', [], 409);
        }
        $session = $occ->session_data ?? [];
        $session['guest_call'] = ['kind' => $kind, 'at' => now()->toIso8601String(), 'handled_at' => null];
        $occ->session_data = $session;
        $occ->save();
    }

    private function throttle(Storefront $store, ?Position $position, string $ip): void
    {
        $key = $position ? 'onsite:table:' . $position->id : 'onsite:counter:' . $store->id . ':' . sha1($ip);
        [$max, $window] = $position ? [self::TABLE_BURST, self::TABLE_WINDOW] : [self::COUNTER_BURST, self::COUNTER_WINDOW];
        if (RateLimiter::tooManyAttempts($key, $max)) {
            throw new CommerceException('Too many orders in a short time. Please wait a few minutes or ask a member of staff.', 'rate_limited', [], 429);
        }
        RateLimiter::hit($key, $window);
    }
}
