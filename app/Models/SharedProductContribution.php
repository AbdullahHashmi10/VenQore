<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SharedProductContribution extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'shared_product_id',
        'tenant_hash',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(SharedProduct::class, 'shared_product_id');
    }
}
