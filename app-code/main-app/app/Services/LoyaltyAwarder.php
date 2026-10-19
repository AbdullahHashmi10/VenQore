<?php

namespace App\Services;

use App\Models\LoyaltyBalance;
use App\Models\LoyaltyPoint;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Loyalty points: one implementation for every sales channel.
 *
 *  - the till (SaleController::store) and the sales form (V3\SaleController)
 *  - online-store orders, when staff complete them into a sale (OrderService::complete)
 *
 * Plan-gated on `loyalty_points`. The earn rate is whatever the owner saved in
 * Growth Engine > Settings > Loyalty (ai_settings loyalty_points_per_amount and
 * loyalty_points_earned_per_unit). Never throws: loyalty must not roll back or
 * delay a posted sale, and a replayed sale never earns twice.
 *
 * Online customers are guests identified by phone; they only EARN online (the
 * points land on the customer record the order is linked to). Spending points is
 * done by staff, never from the public site, because a phone number alone must
 * not be enough to spend someone's balance.
 */
class LoyaltyAwarder
{
    /** Rates for a store, or null when its plan has no loyalty. */
    public static function ratesFor(int|string $tenantId): ?array
    {
        try {
            $tenant = Tenant::find($tenantId);
            if (!$tenant || !PlanGate::check('loyalty_points', $tenant)) {
                return null;
            }
            $get = fn (string $key, $default) => DB::table('ai_settings')
                ->where('tenant_id', $tenantId)->where('key', $key)->value('value') ?? $default;

            return [
                'per_amount' => max(1.0, (float) $get('loyalty_points_per_amount', 100)),
                'per_unit'   => (float) $get('loyalty_points_earned_per_unit', 1),
                'redemption' => (float) $get('loyalty_redemption_rate', 10),
            ];
        } catch (\Throwable $e) {
            return null;
        }
    }

    /** Points an amount would earn at this store's rates (0 when loyalty is off). */
    public static function pointsFor(int|string $tenantId, float $total): int
    {
        $r = self::ratesFor($tenantId);
        return $r ? max(0, (int) floor(($total / $r['per_amount']) * $r['per_unit'])) : 0;
    }

    public static function awardForSale($sale, int|string|null $tenantId = null): int
    {
        try {
            if (!$sale || !$sale->party_id) {
                return 0;
            }
            $tenantId ??= app('current.tenant')->id;

            $total  = (float) ($sale->invoice_total ?? $sale->total ?? $sale->total_amount ?? 0);
            $points = self::pointsFor($tenantId, $total);
            if ($points < 1) {
                return 0;
            }

            $label = 'Points earned on sale ' . ($sale->reference_number ?? $sale->id);
            if (LoyaltyPoint::where('party_id', $sale->party_id)->where('description', $label)->exists()) {
                return 0;
            }

            LoyaltyBalance::awardPoints($sale->party_id, $points, $label, null);
            return $points;
        } catch (\Throwable $e) {
            Log::warning('Loyalty auto-award failed (sale unaffected): ' . $e->getMessage(), [
                'sale_id' => $sale->id ?? null,
            ]);
            return 0;
        }
    }

    /** For staff: the linked/matching customer's balance and what this order earns. */
    public static function summaryForOrder($order): ?array
    {
        $rates = self::ratesFor($order->tenant_id);
        if (!$rates) {
            return null;
        }
        $partyId = $order->party_id;
        if (!$partyId && $order->customer_phone) {
            $partyId = DB::table('parties')->where('tenant_id', $order->tenant_id)
                ->where('phone', $order->customer_phone)->whereNull('deleted_at')->value('id');
        }
        $balance = $partyId ? (int) (LoyaltyBalance::where('party_id', $partyId)->value('balance') ?? 0) : 0;

        return [
            'balance'    => $balance,
            'value'      => $rates['redemption'] > 0 ? round($balance / $rates['redemption'], 2) : 0,
            'will_earn'  => $order->loyalty_member ? self::pointsFor($order->tenant_id, (float) $order->total) : 0,
            'member'     => (bool) $order->loyalty_member,
            'used'       => (int) $order->loyalty_points_used,
            'completed'  => $order->status === 'completed',
        ];
    }
}
