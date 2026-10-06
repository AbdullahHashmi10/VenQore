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
        'membership_type',
        'pos_capabilities',
        'assigned_location_id',
        'custom_role_name',
        'status',
        'display_name',
        'pos_pin',
        'invite_email',
        'invite_token',
        'invite_expires_at',
        'invited_at',
        'joined_at',
        'permissions',
        'permission_override_mode',
        'security_pin',
        'transaction_approval_mode',
        'approval_mode_changed_by',
        'approval_mode_changed_at',
    ];

    protected $casts = [
        'invite_expires_at'        => 'datetime',
        'invited_at'               => 'datetime',
        'joined_at'                => 'datetime',
        'approval_mode_changed_at' => 'datetime',
        'permissions'              => 'array',
        'pos_capabilities'         => 'array',
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

    public function assignedLocation(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'assigned_location_id');
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

    const CAP_TAKE_ORDERS = 'take_orders';
    const CAP_TAKE_PAYMENTS = 'take_payments';
    const CAP_PROCESS_RETURNS = 'process_returns';

    const POS_CAPABILITIES = [
        self::CAP_TAKE_ORDERS,
        self::CAP_TAKE_PAYMENTS,
        self::CAP_PROCESS_RETURNS,
    ];

    /**
     * Check if this membership is restricted POS staff.
     */
    public function isPosStaff(): bool
    {
        return $this->membership_type === 'pos';
    }

    /**
     * Check if this membership is a full staff seat.
     */
    public function isFullStaff(): bool
    {
        return $this->membership_type === 'full' || ($this->membership_type === null && $this->role !== 'cashier');
    }

    /**
     * Check if this POS staff member holds an explicitly assigned capability.
     */
    public function hasPosCapability(string $capability): bool
    {
        if (!$this->isPosStaff()) {
            return true;
        }

        $caps = is_array($this->pos_capabilities) ? $this->pos_capabilities : [];
        return in_array($capability, $caps, true);
    }

    /**
     * Derive exact technical permissions for POS staff from their 3 selected capabilities.
     * Enforces the hard access ceiling (rejects wildcards, admin, and ledger tools).
     */
    public function getDerivedPosPermissions(): array
    {
        if (!$this->isPosStaff()) {
            return [];
        }

        $perms = ['pos.view', 'pos.open_session', 'pos.close_session'];
        $caps = is_array($this->pos_capabilities) ? $this->pos_capabilities : [];

        if (in_array(self::CAP_TAKE_ORDERS, $caps, true)) {
            $perms[] = 'pos.browse';
            $perms[] = 'inventory.view';
            $perms[] = 'sales.create';
            $perms[] = 'sales.view';
        }

        if (in_array(self::CAP_TAKE_PAYMENTS, $caps, true)) {
            $perms[] = 'pos.checkout';
            $perms[] = 'sales.view';
            $perms[] = 'finance.receive_payment';
        }

        if (in_array(self::CAP_PROCESS_RETURNS, $caps, true)) {
            $perms[] = 'pos.refund';
            $perms[] = 'sales.returns';
            $perms[] = 'sales.view';
        }

        return array_values(array_unique($perms));
    }
}
