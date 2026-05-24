<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Plan extends Model
{
    protected $fillable = [
        'platform_id', 'name', 'slug', 'type',
        'price_monthly', 'price_annual', 'price_lifetime', 'currency',
        'display_name', 'description', 'is_featured', 'sort_order',
        'is_active', 'is_visible', 'is_ltd', 'trial_days', 'internal_notes',
    ];

    protected $casts = [
        'is_featured'    => 'boolean',
        'is_active'      => 'boolean',
        'is_visible'     => 'boolean',
        'is_ltd'         => 'boolean',
        'price_monthly'  => 'decimal:2',
        'price_annual'   => 'decimal:2',
        'price_lifetime' => 'decimal:2',
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function limits(): HasMany
    {
        return $this->hasMany(PlanLimit::class);
    }

    public function features()
    {
        return $this->hasMany(PlanFeature::class)->orderBy('sort_order');
    }

    public function coupons(): BelongsToMany
    {
        return $this->belongsToMany(Coupon::class, 'coupon_plan_restrictions');
    }

    /** How many tenants are currently on this plan */
    public function activeTenantCount(): int
    {
        return Tenant::where('plan', $this->slug)->count();
    }
}
