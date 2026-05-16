<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * StoreLicense — Definitive Plan
 *
 * Decouples billing from users and tenants.
 * A user owns a license; a license can be attached to one store.
 */
class StoreLicense extends Model
{
    protected $fillable = [
        'user_id',
        'tenant_id',
        'type',
        'status',
        'plan',
        'source',
        'source_reference',
        'valid_until',
        'consumed_at',
    ];

    protected $casts = [
        'valid_until'  => 'datetime',
        'consumed_at'  => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Is this license still valid (not expired and not cancelled)?
     */
    public function isValid(): bool
    {
        if (in_array($this->status, ['expired', 'cancelled'])) return false;
        if ($this->valid_until !== null && $this->valid_until->isPast()) return false;
        return true;
    }
}
