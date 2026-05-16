<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class AiRecommendation extends Model
{
    use HasUuids, HasFactory, HasTenant;

    protected $fillable = [
        'tenant_id',         // WOUND 3 FIX — explicit tenant stamp required
        'type',
        'priority',
        'party_id',
        'product_id',
        'title',
        'message',
        'data',
        'potential_revenue',
        'action_type',
        'action_url',
        'is_read',
        'is_dismissed',
        'valid_until',
    ];

    protected $casts = [
        'data'              => 'array',
        'is_read'           => 'boolean',
        'is_dismissed'      => 'boolean',
        'valid_until'       => 'date',
        'potential_revenue' => 'decimal:2',
    ];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_dismissed', false)
            ->where(function ($q) {
                $q->whereNull('valid_until')
                    ->orWhere('valid_until', '>=', now());
            });
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }
}
