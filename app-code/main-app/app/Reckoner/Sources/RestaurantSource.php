<?php

namespace App\Reckoner\Sources;

use App\Reckoner\ReckonerContext;
use Illuminate\Support\Facades\DB;

/**
 * Restaurant-specific operational counts, gated behind the `has_restaurant`
 * capability (only meaningful for a store that actually uses
 * restaurant_tables/kitchen_orders — verified schema in
 * 2026_08_05_000002_create_restaurant_tables_and_orders.php).
 */
final class RestaurantSource implements ReckonerSource
{
    public function supports(): array
    {
        return [
            'restaurant.tables_occupied',
            'restaurant.kitchen_orders_pending',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];
        $tenantId = $ctx->tenant->id;

        foreach ($requests as $request) {
            $key = $request['key'];
            $id = $request['id'];

            $out[$id] = match ($key) {
                'restaurant.tables_occupied' => DB::table('restaurant_tables')
                    ->where('tenant_id', $tenantId)
                    ->where('status', 'occupied')
                    ->count(),
                'restaurant.kitchen_orders_pending' => DB::table('kitchen_orders')
                    ->where('tenant_id', $tenantId)
                    ->whereIn('status', ['pending', 'preparing'])
                    ->count(),
                default => null,
            };
        }

        return $out;
    }
}
