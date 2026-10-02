<?php

namespace App\Models\Commerce;

use Illuminate\Database\Eloquent\Model;

class CommerceOrderEvent extends Model
{
    use \App\Models\Commerce\Concerns\UtcTimes;

    protected $table = 'commerce_order_events';
    public $timestamps = false;
    protected $guarded = [];
    protected $casts = ['meta' => 'array', 'created_at' => 'datetime'];
}
