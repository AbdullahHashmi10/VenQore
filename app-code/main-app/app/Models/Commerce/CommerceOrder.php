<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CommerceOrder extends Model
{
    use HasUuids, \App\Models\Commerce\Concerns\UtcTimes;

    protected $table = 'commerce_orders';
    protected $guarded = [];
    protected $hidden = ['status_token_hash'];
    protected $casts = [
        'confirmed_at' => 'datetime',
        'accept_by' => 'datetime',
        'completed_at' => 'datetime',
        'subtotal' => 'decimal:4',
        'tax_total' => 'decimal:4',
        'delivery_fee' => 'decimal:4',
        'total' => 'decimal:4',
        'amount_collected' => 'decimal:4',
        'revision' => 'array',
        'revision_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(CommerceOrderItem::class, 'order_id');
    }

    public function events()
    {
        return $this->hasMany(CommerceOrderEvent::class, 'order_id')->orderBy('id');
    }

    public function storefront()
    {
        return $this->belongsTo(Storefront::class);
    }
}
