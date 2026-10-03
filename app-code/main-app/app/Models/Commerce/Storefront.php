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
        'intake_paused' => 'boolean', 'orders_outside_hours' => 'boolean', 'show_images' => 'boolean', 'delivery_zones' => 'array',
        'delivery_charge' => 'float',
        'min_order_amount' => 'float',
        'pricing_percent' => 'float',
        'published_at' => 'datetime',
    ];

    public function isAcceptingOrders(): bool
    {
        return $this->status === 'published' && ! $this->intake_paused && ! $this->isClosedByHours();
    }

    /** Opening hours set, the business is closed right now (store timezone), and it has not opted in to advance orders. */
    public function isClosedByHours(?\Carbon\CarbonImmutable $now = null): bool
    {
        if ($this->orders_outside_hours) {
            return false;
        }
        return \App\Services\Commerce\OpeningHours::isOpenNow($this->opening_hours, $this->timezone ?: 'UTC', $now) === false;
    }

    public function isVisible(): bool
    {
        return $this->status === 'published';
    }
}
