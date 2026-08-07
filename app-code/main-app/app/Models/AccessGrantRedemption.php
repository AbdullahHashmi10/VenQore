<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccessGrantRedemption extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'access_grant_id',
        'user_id',
        'tenant_id',
        'granted_until',
        'redeemed_at',
        'ip_address',
    ];

    protected $casts = [
        'granted_until' => 'datetime',
        'redeemed_at'   => 'datetime',
    ];

    public function grant(): BelongsTo
    {
        return $this->belongsTo(AccessGrant::class, 'access_grant_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
