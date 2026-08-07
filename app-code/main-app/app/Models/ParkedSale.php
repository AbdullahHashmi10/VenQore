<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ParkedSale extends Model
{
    use HasUuids, HasTenant;

    protected $fillable = [
        'cart_data',
        'user_id',
        'customer_name',
        'expires_at',
    ];

    protected $casts = [
        'cart_data' => 'array',
        'expires_at' => 'datetime',
    ];

    // Scope to get only non-expired parked sales
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now())
            ->orWhereNull('expires_at');
    }

    // Check if parked sale is expired
    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Virtual accessor for items count
    public function getItemsCountAttribute()
    {
        return is_array($this->cart_data) ? count($this->cart_data) : 0;
    }

    // Virtual accessor for total amount
    public function getTotalAmountAttribute()
    {
        if (!is_array($this->cart_data)) {
            return 0;
        }

        return collect($this->cart_data)->sum(function ($item) {
            return ($item['quantity'] ?? 0) * ($item['price'] ?? 0);
        });
    }
}
