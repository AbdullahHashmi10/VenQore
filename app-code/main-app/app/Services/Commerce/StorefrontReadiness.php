<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Storefront;
use Illuminate\Support\Facades\DB;

/** What must be true before a storefront may be published. Returns a list of human-readable blockers. */
class StorefrontReadiness
{
    public static function problems(Storefront $s): array
    {
        $p = [];
        if (trim((string) $s->display_name) === '') {
            $p[] = 'Add a public business name.';
        }
        if (! $s->country_id || ! $s->city_id) {
            $p[] = 'Choose your country and city.';
        }
        if (trim((string) $s->address_line) === '') {
            $p[] = 'Add your business address.';
        }
        if (trim((string) $s->phone) === '') {
            $p[] = 'Add a contact phone number.';
        }
        if (! $s->supports_pickup && ! $s->supports_delivery) {
            $p[] = 'Offer at least pickup or delivery.';
        }
        $pay = ($s->supports_pickup && ($s->accept_pickup_payment || $s->accept_bank_transfer))
            || ($s->supports_delivery && ($s->accept_cod || $s->accept_bank_transfer));
        if (! $pay) {
            $p[] = 'Enable a payment option that matches pickup/delivery.';
        }
        if ($s->accept_bank_transfer && trim((string) $s->bank_instructions) === '') {
            $p[] = 'Add bank transfer instructions for customers.';
        }
        if (! $s->warehouse_id || ! DB::table('warehouses')->where('id', $s->warehouse_id)->where('tenant_id', $s->tenant_id)->whereNull('deleted_at')->exists()) {
            $p[] = 'Choose the warehouse that fulfils online orders.';
        }
        if ($err = OnlinePricing::validateRule($s->pricing_mode, (float) $s->pricing_percent)) {
            $p[] = $err;
        }
        if (! DB::table('storefront_products')->where('storefront_id', $s->id)->where('is_published', 1)->exists()) {
            $p[] = 'Publish at least one product.';
        }
        $tenantStatus = DB::table('tenants')->where('id', $s->tenant_id)->value('status');
        if (! in_array($tenantStatus, ['active', 'trial', 'trialing'], true)) {
            $p[] = 'Your VenQore subscription must be active.';
        }
        return $p;
    }
}
