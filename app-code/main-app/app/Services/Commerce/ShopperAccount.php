<?php

namespace App\Services\Commerce;

use App\Models\Commerce\CommerceOrder;
use App\Models\Commerce\Storefront;
use App\Models\Commerce\StorefrontReview;
use App\Services\LoyaltyAwarder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The online shopper's account. A shopper is "signed in" only after proving they own an email
 * address with a 6-digit code (EmailOtpService). Loyalty points are earned, shown and spent ONLY
 * for a signed-in shopper, and the customer record is matched by that verified email, never by
 * a phone number someone typed in.
 */
class ShopperAccount
{
    /** The verified shopper in this browser session, or null. */
    public static function session(): ?array
    {
        $s = session('commerce_customer');
        return (is_array($s) && ! empty($s['verified']) && ! empty($s['email'])) ? $s : null;
    }

    /** The shopper's customer record at this business (created on first use when $create). */
    public static function partyId(int $tenantId, array $sess, bool $create = true): ?string
    {
        $email = mb_strtolower(trim((string) $sess['email']));
        $id = DB::table('parties')->where('tenant_id', $tenantId)->whereRaw('LOWER(email) = ?', [$email])
            ->whereNull('deleted_at')->orderBy('created_at')->value('id');
        if ($id || ! $create) {
            return $id ?: null;
        }
        $id = (string) Str::uuid();
        DB::table('parties')->insert([
            'id' => $id, 'tenant_id' => $tenantId, 'name' => $sess['name'] ?: 'Online Customer', 'email' => $email,
            'phone' => $sess['phone'] ?? null, 'type' => 'customer', 'notes' => 'Signed up on the online store',
            'is_active' => 1, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return $id;
    }

    /** Reviews are keyed by phone; an email-only shopper gets a stable key derived from the verified email. */
    public static function reviewKey(array $sess): string
    {
        return ! empty($sess['phone']) ? $sess['phone'] : 'em:' . substr(md5(mb_strtolower($sess['email'])), 0, 24);
    }

    /** Points balance and what it is worth, or null when this business has no loyalty. */
    public static function loyalty(int $tenantId, ?string $partyId): ?array
    {
        $rates = LoyaltyAwarder::ratesFor($tenantId);
        if (! $rates) {
            return null;
        }
        $balance = $partyId ? (int) (DB::table('loyalty_balances')->where('party_id', $partyId)->value('balance') ?? 0) : 0;

        return [
            'balance' => $balance,
            'redemption_rate' => $rates['redemption'],
            'value' => $rates['redemption'] > 0 ? round($balance / $rates['redemption'], 2) : 0,
        ];
    }

    /** What the storefront knows about the signed-in shopper (null = not signed in). */
    public static function payload(Storefront $store): ?array
    {
        $sess = self::session();
        if (! $sess) {
            return null;
        }
        $tenantId = (int) $store->tenant_id;
        $partyId = self::partyId($tenantId, $sess, false);

        $orders = $partyId ? DB::table('commerce_orders')->where('storefront_id', $store->id)->where('party_id', $partyId)
            ->orderByDesc('created_at')->limit(20)
            ->get(['id', 'public_number', 'status', 'total', 'currency_symbol', 'created_at', 'fulfilment', 'loyalty_points_used'])
            ->map(function ($o) use ($store) {
                $token = Str::random(48);
                DB::table('commerce_order_tokens')->insert(['order_id' => $o->id, 'token_hash' => hash('sha256', $token), 'created_at' => now()]);

                return [
                    'id' => $o->id, 'number' => $o->public_number, 'status' => $o->status, 'total' => (float) $o->total,
                    'currency_symbol' => $o->currency_symbol, 'fulfilment' => $o->fulfilment,
                    'created_at' => CommerceOrder::localTime($o->created_at, $store->timezone ?? 'UTC'),
                    'status_url' => url('/order-status/' . $token),
                ];
            })->values() : collect();

        $phone = $sess['phone'] ?? null;
        $mine = StorefrontReview::where('storefront_id', $store->id)->where('customer_phone', self::reviewKey($sess))->first();

        return [
            'name' => $sess['name'], 'email' => $sess['email'], 'phone' => $phone, 'verified' => true,
            'orders' => $orders, 'has_reviewed' => (bool) $mine,
            'review' => $mine ? ['rating' => (int) $mine->rating, 'review' => $mine->review] : null,
            'loyalty' => self::loyalty($tenantId, $partyId),
        ];
    }
}
