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
        'subtotal' => 'float',
        'tax_total' => 'float',
        'delivery_fee' => 'float',
        'total' => 'float',
        'amount_collected' => 'float',
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
