<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformEquityDrawing extends Model
{
    protected $fillable = [
        'partner_id',
        'amount',
        'description',
        'date',
    ];

    protected $casts = [
        'amount' => 'decimal:4',
        'date'   => 'datetime',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(PlatformPartner::class, 'partner_id');
    }
}
