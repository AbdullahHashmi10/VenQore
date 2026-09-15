<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AppSumoCode extends Model
{
    use HasFactory, SoftDeletes, HasUuids;

    protected $table = 'appsumo_codes';

    protected $guarded = [];

    protected $casts = [
        'is_redeemed' => 'boolean',
        'redeemed_at' => 'datetime',
        'metadata'    => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
