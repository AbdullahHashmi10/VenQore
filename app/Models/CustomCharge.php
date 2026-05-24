<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class CustomCharge extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = [
        'name',
        'description',
        'default_amount',
        'is_percentage',
        'is_active',
        'sort_order'
    ];

    protected $casts = [
        'default_amount' => 'decimal:2',
        'is_percentage' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }

    public function calculateAmount($subtotal)
    {
        if ($this->is_percentage) {
            return round(($this->default_amount / 100) * $subtotal, 2);
        }
        return $this->default_amount;
    }
}
