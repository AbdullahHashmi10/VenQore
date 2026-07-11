<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * TerminalPairingToken — L032
 *
 * A short-lived, single-use token a tenant admin issues in-app so a new
 * terminal can prove it is authorized to bind to that tenant on first contact.
 */
class TerminalPairingToken extends Model
{
    use HasUuids, HasTenant;

    protected $table = 'terminal_pairing_tokens';

    protected $fillable = [
        'tenant_id', 'token', 'label', 'terminal_id',
        'expires_at', 'used_at', 'created_by',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at'    => 'datetime',
    ];

    public static function generateToken(): string
    {
        return 'pair_' . Str::random(40);
    }

    public function isUsable(): bool
    {
        return $this->used_at === null
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }
}
