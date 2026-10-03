<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StorefrontReview extends Model
{
    use HasUuids, \App\Models\Commerce\Concerns\UtcTimes;

    protected $table = 'storefront_reviews';
    protected $guarded = [];

    protected $casts = [
        'rating' => 'integer',
        'is_verified_purchaser' => 'boolean',
    ];

    public function storefront()
    {
        return $this->belongsTo(Storefront::class);
    }
}
