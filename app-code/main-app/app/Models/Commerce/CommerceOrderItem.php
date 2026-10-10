<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CommerceOrderItem extends Model
{
    use HasUuids, \App\Models\Commerce\Concerns\UtcTimes;

    protected $table = 'commerce_order_items';
    protected $guarded = [];
    protected $casts = ['price_includes_tax' => 'boolean', 'mods' => 'array'];
}
