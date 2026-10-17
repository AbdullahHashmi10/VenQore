<?php

namespace App\Services\Commerce;

use App\Models\Commerce\CommerceOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * One customer account across every store.
 *
 * A shopper's record at each business (a `parties` row) is matched by VERIFIED email, never by a typed
 * phone number (see ShopperAccount). A signed-in VenQore user whose email is verified is the same
 * person, so their orders and loyalty points at every store are found through that one email.
 * Nothing is copied or merged: each store keeps its own records, this only reads across them.
 * An unverified email sees nothing, so nobody can read another person's orders by registering with their address.
 */
class CustomerHub
{
    public const ACTIVE = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'];

    /** @return array{verified:bool, orders:array, loyalty:array} */
    public static function forUser(User $user, int $limit = 40): array
    {
        $email = mb_strtolower(trim((string) $user->email));
        if ($email === '' || ! $user->email_verified_at) {
            return ['verified' => false, 'orders' => [], 'loyalty' => [], 'top_items' => [], 'addresses' => [], 'info' => null];
        }

        $parties = DB::table('parties')->whereRaw('LOWER(email) = ?', [$email])->whereNull('deleted_at')->pluck('tenant_id', 'id');
        if ($parties->isEmpty()) {
            return ['verified' => true, 'orders' => [], 'loyalty' => [], 'top_items' => [], 'addresses' => [], 'info' => null];
        }

        $orders = DB::table('commerce_orders as o')
            ->join('storefronts as s', 's.id', '=', 'o.storefront_id')
            ->whereIn('o.party_id', $parties->keys()->all())
            ->orderByDesc('o.created_at')->limit($limit)
            ->get(['o.id', 'o.public_number', 'o.status', 'o.total', 'o.currency_symbol', 'o.fulfilment', 'o.created_at',
                'o.delivery_address', 'o.customer_name', 'o.customer_phone',
                's.display_name as store', 's.slug as store_slug', 's.timezone']);

        // What this person orders most, across every store (read from the same orders).
        $topItems = DB::table('commerce_order_items as i')
            ->join('commerce_orders as o', 'o.id', '=', 'i.order_id')
            ->join('storefronts as s', 's.id', '=', 'o.storefront_id')
            ->whereIn('o.id', $orders->pluck('id')->all())
            ->groupBy('i.title', 's.display_name', 's.slug', 'o.currency_symbol')
            ->orderByRaw('SUM(i.quantity) DESC')->limit(8)
            ->get(['i.title', 's.display_name as store', 's.slug as store_slug', 'o.currency_symbol',
                DB::raw('SUM(i.quantity) as times'), DB::raw('MAX(i.online_price) as price')])
            ->map(fn ($r) => [
                'title' => $r->title, 'store' => $r->store, 'store_url' => '/shop/' . $r->store_slug,
                'times' => (int) round((float) $r->times), 'price' => (float) $r->price, 'currency_symbol' => $r->currency_symbol,
            ])->values()->all();

        // Delivery addresses used before, newest first, so they never have to be typed again.
        $addresses = $orders->filter(fn ($o) => trim((string) $o->delivery_address) !== '')
            ->unique(fn ($o) => mb_strtolower(trim((string) $o->delivery_address)))
            ->take(5)->map(fn ($o) => ['address' => trim((string) $o->delivery_address), 'store' => $o->store])->values()->all();

        $latest = $orders->first();
        $info = ['name' => $user->name, 'email' => $user->email, 'phone' => $latest?->customer_phone];

        $rows = $orders->map(function ($o) {
            $token = Str::random(48);
            DB::table('commerce_order_tokens')->insert(['order_id' => $o->id, 'token_hash' => hash('sha256', $token), 'created_at' => now()]);

            return [
                'id' => $o->id,
                'number' => $o->public_number,
                'status' => $o->status,
                'active' => in_array($o->status, self::ACTIVE, true),
                'total' => (float) $o->total,
                'currency_symbol' => $o->currency_symbol,
                'fulfilment' => $o->fulfilment,
                'store' => $o->store,
                'store_url' => '/shop/' . $o->store_slug,
                'created_at' => CommerceOrder::localTime($o->created_at, $o->timezone ?: 'UTC'),
                'status_url' => url('/order-status/' . $token),
            ];
        })->values()->all();

        $loyalty = DB::table('loyalty_balances')->whereIn('party_id', $parties->keys()->all())->where('balance', '>', 0)
            ->get(['party_id', 'balance'])
            ->map(function ($b) use ($parties) {
                $store = DB::table('storefronts')->where('tenant_id', $parties[$b->party_id])->first(['display_name', 'slug']);

                return $store ? ['store' => $store->display_name, 'store_url' => '/shop/' . $store->slug, 'points' => (int) $b->balance] : null;
            })->filter()->values()->all();

        return ['verified' => true, 'orders' => $rows, 'loyalty' => $loyalty, 'top_items' => $topItems, 'addresses' => $addresses, 'info' => $info];
    }
}
