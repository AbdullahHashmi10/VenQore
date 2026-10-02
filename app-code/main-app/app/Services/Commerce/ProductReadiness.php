<?php

namespace App\Services\Commerce;

use Illuminate\Support\Facades\DB;

/** Decides whether an existing product can be sold online in the MVP (fixed-unit retail stock only). */
class ProductReadiness
{
    /** @return string|null reason it is NOT publishable, or null when ready */
    public static function reason(object $p): ?string
    {
        if (! $p->is_active) {
            return 'Product is inactive.';
        }
        if (($p->type ?? 'standard') !== 'standard') {
            return 'Only standard stock products can be sold online in this release (' . $p->type . ' is not supported yet).';
        }
        if (! empty($p->has_variants)) {
            return 'Products with variants are not supported online yet.';
        }
        if (! empty($p->is_weighted)) {
            return 'Weighed products are not supported online yet.';
        }
        if (! empty($p->track_serial)) {
            return 'Serial-tracked products are not supported online yet.';
        }
        if ((float) $p->price <= 0) {
            return 'Set a retail price greater than zero.';
        }
        if (DB::table('compositions')->where('tenant_id', $p->tenant_id)->where('product_id', $p->id)->where('is_active', 1)->exists()) {
            return 'Recipe products are not supported online yet.';
        }
        if (DB::table('product_price_tiers')->where('tenant_id', $p->tenant_id)->where('product_id', $p->id)->exists()) {
            return 'Products with quantity price tiers are not supported online yet.';
        }
        return null;
    }
}
