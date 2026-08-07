<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SharedProductAlias extends Model
{
    use HasFactory;

    protected $fillable = [
        'alias',
        'shared_product_id',
        'hits',
    ];

    public function sharedProduct(): BelongsTo
    {
        return $this->belongsTo(SharedProduct::class);
    }
}
