<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'name', 'description', 'discount_type', 'discount_value',
        'max_discount', 'applies_to', 'platform_id', 'max_uses', 'used_count',
        'max_uses_per_user', 'valid_from', 'valid_until', 'is_active',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'valid_from'  => 'datetime',
        'valid_until' => 'datetime',
    ];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function planRestrictions(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class, 'coupon_plan_restrictions');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(CouponRedemption::class);
    }

    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        if ($this->valid_from > now()) return false;
        if ($this->valid_until && $this->valid_until < now()) return false;
        if ($this->max_uses && $this->used_count >= $this->max_uses) return false;
        return true;
    }
}
