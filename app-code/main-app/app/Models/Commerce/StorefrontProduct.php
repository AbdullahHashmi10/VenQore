<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StorefrontProduct extends Model
{
    use HasUuids;

    protected $table = 'storefront_products';
    protected $guarded = [];
    protected $casts = [
        'is_published' => 'boolean',
        'allow_below_cost' => 'boolean', 'is_featured' => 'boolean',
        'override_price' => 'float',
    ];
}
