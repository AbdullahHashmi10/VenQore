<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Storefront;
use App\Models\Occupancy;
use App\Models\Position;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OnsiteOrderService
{
    public function __construct(private CheckoutService $checkout)
    {
    }

    public function place(Storefront $store, ?Position $position, array $data): array
    {
        return DB::transaction(function () use ($store, $position, $data) {
            $existing = DB::table('onsite_order_requests')
                ->where('storefront_id', $store->id)->where('idempotency_key', $data['idempotency_key'])->first();
            if ($existing) {
                return ['number' => $existing->public_number, 'occupancy_id' => $existing->occupancy_id, 'replayed' => true];
            }

            if ($position) {
                $position = Position::withoutGlobalScopes()->where('tenant_id', $store->tenant_id)->lockForUpdate()->findOrFail($position->id);
                abort_unless($position->customer_ordering_enabled, 404);
                $occupancy = Occupancy::withoutGlobalScopes()->where('tenant_id', $store->tenant_id)->where('position_id', $position->id)
                    ->whereNull('closed_at')->lockForUpdate()->first();
                if (! $occupancy) {
                    $occupancy = Occupancy::create([
                        'tenant_id' => $store->tenant_id, 'position_id' => $position->id,
                        'label' => $position->label ?: $position->code, 'opened_by' => null, 'opened_at' => now(),
                        'source_type' => 'table_qr',
                        'session_data' => ['order_type' => 'dine_in', 'covers' => 1, 'cart' => [], 'order_total' => 0, 'note' => '', 'sent_at' => null],
                    ]);
                    $position->update(['status' => 'active']);
                }
                $channel = 'table_qr';
            } else {
                abort_unless($store->counter_qr_enabled, 404);
                $occupancy = Occupancy::create([
                    'tenant_id' => $store->tenant_id, 'position_id' => null,
                    'label' => 'SQ-' . strtoupper(Str::random(6)), 'opened_by' => null, 'opened_at' => now(),
                    'source_type' => 'counter_qr',
                    'session_data' => ['order_type' => 'takeaway', 'covers' => 0, 'cart' => [], 'order_total' => 0, 'note' => '', 'sent_at' => null,
                        'customer_name' => trim((string) ($data['customer_name'] ?? '')), 'phone' => ''],
                ]);
                $channel = 'counter_qr';
            }

            // Use the same authoritative quote path as online checkout. This keeps
            // public availability, promotions, stock limits and server pricing in
            // lockstep with what the customer saw before pressing Send.
            $quote = $this->checkout->quote($store, $data['items'], 'pickup');
            $notes = collect($data['items'])->mapWithKeys(fn ($line) => [
                (string) $line['item_id'] => trim((string) ($line['notes'] ?? '')),
            ]);
            $requestId = (string) Str::uuid();
            $newLines = [];
            $total = 0.0;
            foreach ($quote['items'] as $item) {
                $qty = (int) $item['quantity'];
                $lineTotal = round((float) $item['online_price'] * $qty, 2);
                $total += $lineTotal;
                $newLines[] = [
                    'id' => $item['product_id'], 'line_id' => (string) Str::uuid(),
                    'name' => $item['title'], 'price' => (float) $item['online_price'],
                    'unit_price' => (float) $item['online_price'], 'qty' => $qty,
                    'notes' => $notes->get((string) $item['item_id'], ''), 'mods' => [], 'sent' => false,
                    'source' => $channel, 'customer_request_id' => $requestId,
                    'customer_pending' => true,
                ];
            }

            $session = $occupancy->session_data ?? [];
            $session['cart'] = array_values(array_merge($session['cart'] ?? [], $newLines));
            $session['order_total'] = round(collect($session['cart'])->sum(fn ($line) => empty($line['paid_sale_id']) ? (float) ($line['unit_price'] ?? $line['price'] ?? 0) * (float) ($line['qty'] ?? 0) : 0), 2);
            $session['customer_order_received_at'] = now()->toIso8601String();
            if (! empty($data['customer_note'])) {
                $session['note'] = trim(implode("\n", array_filter([$session['note'] ?? '', 'Customer: ' . $data['customer_note']])));
            }
            if (! $position && ! empty($data['customer_name'])) $session['customer_name'] = trim($data['customer_name']);
            $occupancy->session_data = $session;
            $occupancy->save();

            $number = 'SO-' . now()->format('ymd') . '-' . strtoupper(Str::random(5));
            DB::table('onsite_order_requests')->insert([
                'tenant_id' => $store->tenant_id, 'storefront_id' => $store->id,
                'position_id' => $position?->id, 'occupancy_id' => $occupancy->id,
                'public_number' => $number, 'idempotency_key' => $data['idempotency_key'],
                'channel' => $channel, 'customer_name' => trim((string) ($data['customer_name'] ?? '')) ?: null,
                'line_count' => count($newLines), 'total' => round($total, 2), 'created_at' => now(), 'updated_at' => now(),
            ]);

            return ['number' => $number, 'occupancy_id' => $occupancy->id, 'replayed' => false];
        }, 3);
    }
}
