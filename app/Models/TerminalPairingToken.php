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
        // Short enough to type on a POS keyboard: "ABCD-2345" (32^8 ≈ 1.1e12),
        // single-use, 60-minute expiry, and the heartbeat endpoint is throttled.
        $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        do {
            $c = '';
            for ($i = 0; $i < 8; $i++) {
                $c .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $code = substr($c, 0, 4) . '-' . substr($c, 4, 4);
        } while (static::withoutGlobalScopes()->where('token', $code)->exists());

        return $code;
    }

    public function isUsable(): bool
    {
        return $this->used_at === null
            && ($this->expires_at === null || $this->expires_at->isFuture());
    }
}
