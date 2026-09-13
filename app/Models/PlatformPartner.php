<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlatformPartner extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'role',
        'equity_pct',
    ];

    protected $casts = [
        'equity_pct' => 'float',
    ];

    public function drawings(): HasMany
    {
        return $this->hasMany(PlatformEquityDrawing::class, 'partner_id');
    }
}
