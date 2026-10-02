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
        'delivery_charge' => 'float',
        'min_order_amount' => 'float',
        'pricing_percent' => 'float',
        'published_at' => 'datetime',
    ];

    public function isAcceptingOrders(): bool
    {
        return $this->status === 'published' && ! $this->intake_paused;
    }

    public function isVisible(): bool
    {
        return $this->status === 'published';
    }
}
