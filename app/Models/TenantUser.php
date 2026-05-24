<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TenantUser — The Pivot Model (Definitive Plan)
 *
 * Represents a user's membership in a specific store.
 * Roles: owner, admin, manager, cashier, viewer
 * One user can have many TenantUser records (one per store).
 */
class TenantUser extends Model
{
    use \App\Traits\HasActivityLog;
    protected $table = 'tenant_users';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'role',
        'status',
        'display_name',
        'pos_pin',
        'invite_email',
        'invite_token',
        'invite_expires_at',
        'invited_at',
        'joined_at',
        'permissions',
    ];

    protected $casts = [
        'invite_expires_at' => 'datetime',
        'invited_at'        => 'datetime',
        'joined_at'         => 'datetime',
        'permissions'       => 'array',
    ];

    protected $hidden = [
        'pos_pin',
        'invite_token',
    ];

    // ──────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /**
     * The name to display in POS, receipts, and reports.
     * Falls back to the global user name.
     */
    public function effectiveName(): string
    {
        return $this->display_name ?? $this->user?->name ?? 'Unknown';
    }

    /**
     * Check if a pending invite is still valid.
     */
    public function isInviteValid(): bool
    {
        return $this->status === 'invited'
            && $this->invite_expires_at !== null
            && $this->invite_expires_at->isFuture();
    }

    /**
     * Check if this membership grants a minimum role level.
     * Role hierarchy: owner > admin > manager > cashier > viewer
     */
    public function hasRoleAtLeast(string $minRole): bool
    {
        $hierarchy = [
            'viewer'                  => 1,
            'delivery_driver'         => 2,
            'fulfillment_lead'        => 2,
            'cashier'                 => 3,
            'dispenser'               => 4,
            'sales_executive'        => 4,
            'kitchen_manager'         => 5,
            'hr_officer'              => 5,
            'accountant'              => 5,
            'purchasing_officer'      => 5,
            'inventory_controller'    => 5,
            'production_supervisor'   => 5,
            'shift_supervisor'        => 6,
            'manager'                 => 7,
            'admin'                   => 8,
            'franchise_admin'         => 9,
            'owner'                   => 10,
        ];
        $myLevel   = $hierarchy[$this->role] ?? 0;
        $required  = $hierarchy[$minRole] ?? 99;
        return $myLevel >= $required;
    }
}
