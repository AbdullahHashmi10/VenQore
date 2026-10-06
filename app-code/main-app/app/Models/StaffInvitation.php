<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * StaffInvitation — V1 Invitation System
 *
 * Statuses: pending | no_account | awaiting_approval | active | expired | revoked | declined
 */
class StaffInvitation extends Model
{
    use HasTenant;

    protected $table = 'staff_invitations';

    protected $fillable = [
        'tenant_id',
        'invited_by',
        'invitee_name',
        'invitee_email',
        'invitee_phone',
        'membership_type',
        'pos_capabilities',
        'assigned_location_id',
        'roles',
        'token',
        'short_code',
        'status',
        'expires_at',
        'accepted_at',
        'approved_at',
        'permissions',
        'transaction_approval_mode',
        'metadata',
        // Legacy compat
        'email',
        'role',
    ];

    protected $casts = [
        'roles'            => 'array',
        'pos_capabilities' => 'array',
        'metadata'         => 'array',
        'expires_at'       => 'datetime',
        'accepted_at'      => 'datetime',
        'approved_at'      => 'datetime',
        'permissions'      => 'array',
    ];

    // ─── Relationships ─────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function assignedLocation(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'assigned_location_id');
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    // Keep legacy alias
    public function invitedBy(): BelongsTo
    {
        return $this->inviter();
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    /**
     * Generate a unique short invite code like VQ-A3X9P2.
     */
    public static function generateShortCode(): string
    {
        do {
            $code = 'VQ-' . strtoupper(Str::random(6));
        } while (static::where('short_code', $code)->exists());

        return $code;
    }

    /**
     * Generate a secure random 64-char token.
     */
    public static function generateToken(): string
    {
        return Str::random(64);
    }

    /**
     * Check if this invite is still actionable (not expired/revoked/declined).
     */
    public function isValid(): bool
    {
        return in_array($this->status, ['pending', 'no_account'])
            && $this->expires_at?->isFuture();
    }

    /**
     * Legacy compat: isExpired()
     */
    public function isExpired(): bool
    {
        return $this->expires_at?->isPast() ?? true;
    }

    /**
     * Check if this invite is for POS staff.
     */
    public function isPosStaff(): bool
    {
        return $this->membership_type === 'pos';
    }

    /**
     * Check if this invite is for full staff.
     */
    public function isFullStaff(): bool
    {
        return $this->membership_type === 'full' || ($this->membership_type === null && ($this->roles[0] ?? $this->role) !== 'cashier');
    }

    /**
     * Primary role (first in the roles array) for display.
     */
    public function primaryRole(): string
    {
        if (!empty($this->roles)) return $this->roles[0];
        return $this->role ?? 'cashier';
    }

    /**
     * Formatted status label for the UI.
     */
    public function statusLabel(): string
    {
        return match ($this->status) {
            'pending'            => 'Pending',
            'no_account'         => 'No Account',
            'awaiting_approval'  => 'Awaiting Approval',
            'active'             => 'Active',
            'expired'            => 'Expired',
            'revoked'            => 'Revoked',
            'declined'           => 'Declined',
            default              => ucfirst($this->status ?? 'Pending'),
        };
    }
}
