<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasTenant;

class UserDevice extends Model
{
    use HasFactory, HasTenant;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'device_token_hash',
        'device_label',
        'ip_country',
        'current_session_id',
        'is_active',
        'last_active_at',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'last_active_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
