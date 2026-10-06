<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * One public storefront per tenant. Deliberately NOT using HasTenant: public
 * request paths resolve it by slug and must never rely on an ambient tenant.
 */
class Storefront extends Model
{
    use HasUuids;

    protected $table = 'storefronts';

    protected $guarded = [];

    protected $casts = [
        'opening_hours' => 'array',
        'supports_pickup' => 'boolean',
        'supports_delivery' => 'boolean',
        'accept_cod' => 'boolean',
        'accept_pickup_payment' => 'boolean',
        'accept_bank_transfer' => 'boolean',
        'intake_paused' => 'boolean',
        'orders_outside_hours' => 'boolean',
        'orders_during_break' => 'boolean',
        'show_images' => 'boolean',
        'onsite_ordering_enabled' => 'boolean',
        'counter_qr_enabled' => 'boolean',
        'onsite_show_images' => 'boolean',
        'delivery_zones' => 'array',
        'delivery_charge' => 'float',
        'min_order_amount' => 'float',
        'pricing_percent' => 'float',
        'published_at' => 'datetime',
    ];

    public function isAcceptingOrders(): bool
    {
        return $this->customer_mode !== 'catalogue'
            && $this->status === 'published'
            && ! $this->intake_paused
            && ! $this->isClosedByHours();
    }

    public function isAcceptingOnsiteOrders(): bool
    {
        return (bool) $this->onsite_ordering_enabled;
    }

    /**
     * Opening hours check respecting granular intake settings:
     * - If on a scheduled break: depends on `orders_during_break`.
     * - If outside opening hours: depends on `orders_outside_hours`.
     */
    public function isClosedByHours(?\Carbon\CarbonImmutable $now = null): bool
    {
        $hours = $this->opening_hours;
        if (empty($hours)) {
            return false;
        }
        $tz = $this->timezone ?: 'UTC';

        $onBreak = \App\Services\Commerce\OpeningHours::isOnBreak($hours, $tz, $now);
        if ($onBreak !== null) {
            return ! $this->orders_during_break;
        }

        $isOpen = \App\Services\Commerce\OpeningHours::isOpenNow($hours, $tz, $now);
        if ($isOpen === false) {
            return ! $this->orders_outside_hours;
        }

        return false;
    }

    public function isOnBreak(?\Carbon\CarbonImmutable $now = null): ?array
    {
        return \App\Services\Commerce\OpeningHours::isOnBreak($this->opening_hours, $this->timezone ?: 'UTC', $now);
    }

    public function isVisible(): bool
    {
        return $this->status === 'published';
    }
}
