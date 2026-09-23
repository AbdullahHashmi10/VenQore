<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Hash;
use Illuminate\Contracts\Auth\MustVerifyEmail;

/**
 * User Model — Definitive Plan
 *
 * Global identity only. Email + password is the master key.
 * Store-specific roles, PINs, and display names live in TenantUser pivot.
 * Users can belong to many stores (as owner, admin, cashier, etc.)
 *
 * REMOVED (now in tenant_users pivot):
 *   - tenant_id
 *   - role
 *   - permissions
 *   - passcode
 *
 * ADDED:
 *   - last_store_id (remembers which store to auto-enter on login)
 *   - is_platform_admin (platform-level admin, not store-level)
 */
class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * Request-level memoized active membership.
     */
    protected ?TenantUser $resolvedMembership = null;
    protected bool $membershipResolved = false;
    protected ?string $temp_passcode = null;

    protected $fillable = [
        'name',
        'email',
        'password',
        'last_store_id',
        'platform_pin',
        'google_id',
        'avatar',
        'role',
        'permissions',
        'passcode',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'platform_pin',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'passcode'          => 'hashed',
            'is_platform_admin' => 'boolean',
            'permissions'       => 'array',
        ];
    }

    // ──────────────────────────────────────────────────────────────────
    // Relationships
    // ──────────────────────────────────────────────────────────────────

    /**
     * All store memberships this user has (any status).
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(TenantUser::class);
    }

    /**
     * Active store memberships only (excludes invited/suspended).
     */
    public function activeMemberships(): HasMany
    {
        return $this->hasMany(TenantUser::class)->where('status', 'active');
    }

    /**
     * All stores this user belongs to (via pivot).
     */
    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_users')
                    ->withPivot(['role', 'status', 'display_name', 'pos_pin', 'security_pin'])
                    ->withTimestamps();
    }

    /**
     * Active, accessible stores only (trial or active status).
     */
    public function activeStores()
    {
        return $this->tenants()
                    ->where('tenant_users.status', 'active')
                    ->whereIn('tenants.status', ['trial', 'active']);
    }

    /**
     * The last store this user used (for auto-redirect on login).
     */
    public function lastStore(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'last_store_id');
    }

    /**
     * All licenses owned by this user.
     */
    public function licenses(): HasMany
    {
        return $this->hasMany(StoreLicense::class);
    }

    // ──────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────

    /**
     * Check if the user has an active membership for a specific store.
     */
    public function isMemberOf(int|string $tenantId): bool
    {
        return $this->memberships()
                    ->where('tenant_id', $tenantId)
                    ->where('status', 'active')
                    ->exists();
    }

    /**
     * Get the user's role in a specific store.
     */
    public function roleIn(int|string $tenantId): ?string
    {
        return $this->memberships()
                    ->where('tenant_id', $tenantId)
                    ->where('status', 'active')
                    ->value('role');
    }

    /**
     * Get the user's display name for a specific store.
     * Falls back to global name if no store-specific override.
     */
    public function displayNameIn(int|string $tenantId): string
    {
        $membership = $this->memberships()
                           ->where('tenant_id', $tenantId)
                           ->first();
        return $membership?->display_name ?? $this->name;
    }

    /**
     * Platform level checks (Tier 1).
     *
     * isPlatformAdmin() is the SINGLE authoritative check for platform access.
     * It reads the `is_platform_admin` column (boolean, set manually in DB).
     * This is NEVER set during store creation or user registration.
     */
    public function isPlatformAdmin(): bool
    {
        return (bool) ($this->attributes['is_platform_admin'] ?? false);
    }

    public function isPlatformOwner(): bool
    {
        return $this->isPlatformAdmin() && (($this->attributes['platform_role'] ?? null) === 'platform_owner');
    }

    public function isPlatformSuperAdmin(): bool
    {
        return $this->isPlatformAdmin() && in_array($this->attributes['platform_role'] ?? null, ['platform_owner', 'platform_manager', 'product_manager']);
    }

    public function isPlatformSupport(): bool
    {
        return $this->isPlatformAdmin() && in_array($this->attributes['platform_role'] ?? null, [
            'platform_owner', 'platform_manager', 'product_manager',
            'support_director', 'support_dept_manager', 'support_agent', 'support_qa', 'tech_escalation'
        ]);
    }

    public function isPlatformStaff(): bool
    {
        $platformRole = $this->attributes['platform_role'] ?? null;
        $staffRole = $this->attributes['staff_role'] ?? null;

        return $this->isPlatformAdmin() ||
            ($platformRole !== 'none' && !empty($platformRole)) ||
            (!empty($staffRole) && in_array($staffRole, ['support', 'content', 'marketing', 'finance', 'sales']));
    }

    /**
     * Legacy shim: check if user has a specific role.
     * checks global is_platform_admin AND store-specific roles.
     */
    public function hasRole(string $role): bool
    {
        if ($this->isPlatformAdmin() && ($role === 'platform_admin' || $role === 'admin')) return true;
        return $this->role === $role;
    }

    /**
     * Check if user has a specific permission.
     *
     * Resolution order (first match wins):
     *   1. Platform admins → wildcard '*' (bypasses everything)
     *   2. Custom permissions stored in the TenantUser pivot → use those
     *   3. config/permissions.php role map → canonical source of truth
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->is_platform_admin) return true;

        $membership = $this->getActiveMembership();
        if (!$membership) return false;

        // Owner retains full control across all store capabilities
        if ($membership->role === 'owner') {
            return true;
        }

        $perms = $this->permissions; // delegates to getPermissionsAttribute()
        if (!is_array($perms)) {
            $perms = [];
        }

        if (in_array('*', $perms, true) || in_array($permission, $perms, true)) {
            return true;
        }

        // Wildcard matching: e.g. "sales.*" matches "sales.view" or "admin.*" matches "admin.staff_view"
        foreach ($perms as $p) {
            if (str_ends_with($p, '.*')) {
                $prefix = substr($p, 0, -2);
                if (str_starts_with($permission, $prefix . '.')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if the user holds ANY of the given permissions (OR semantics).
     */
    public function hasAnyPermission(array|string $permissions): bool
    {
        $perms = is_array($permissions) ? $permissions : func_get_args();
        foreach ($perms as $perm) {
            if ($this->hasPermission($perm)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if the user holds ALL of the given permissions (AND semantics).
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $perm) {
            if (!$this->hasPermission($perm)) {
                return false;
            }
        }
        return true;
    }

    // ──────────────────────────────────────────────────────────────────
    // Legacy ERP relationships (still needed for audit logs etc.)
    // ──────────────────────────────────────────────────────────────────

    // ──────────────────────────────────────────────────────────────────
    // Legacy Compatibility Shims (Definitive Plan)
    // ──────────────────────────────────────────────────────────────────

    /**
     * Get the active membership for this request, memoized.
     */
    public function getActiveMembership(): ?TenantUser
    {
        $boundTenantId = app()->bound('current.tenant') ? app('current.tenant')?->id : null;

        // 1. If container already has active membership for this user and tenant, use it directly (0 queries, always fresh)
        if (app()->bound('current.membership')) {
            $membership = app('current.membership');
            if ($membership && (string)$membership->user_id === (string)$this->id && ($boundTenantId === null || (string)$membership->tenant_id === (string)$boundTenantId) && $membership->status === 'active') {
                $this->resolvedMembership = $membership;
                $this->membershipResolved = true;
                return $membership;
            }
        }

        if ($this->membershipResolved) {
            if ($boundTenantId === null || ($this->resolvedMembership && (string)$this->resolvedMembership->tenant_id === (string)$boundTenantId)) {
                return $this->resolvedMembership;
            }
            $this->membershipResolved = false;
            $this->resolvedMembership = null;
        }

        // 2. If we are in a tenant context, query/match the membership for this specific tenant ONLY.
        // B07: Never fall back to another store or mutate last_store_id during authorization.
        if (app()->bound('current.tenant') && app('current.tenant')) {
            $tenant = app('current.tenant');
            $membership = $this->memberships()
                ->where('tenant_id', $tenant->id)
                ->where('status', 'active')
                ->first();

            $this->resolvedMembership = $membership;
            $this->membershipResolved = true;
            return $membership;
        }

        // 2. Fallback in tenantless context (e.g. Hub / Store Switcher):
        if (app()->bound('current.membership')) {
            $membership = app('current.membership');
            if ((string)$membership->user_id === (string)$this->id && $membership->status === 'active') {
                $this->resolvedMembership = $membership;
                $this->membershipResolved = true;
                return $membership;
            }
        }

        // 3. Fallback to last store or first available store without mutating DB during read
        if ($this->last_store_id) {
            $this->resolvedMembership = $this->memberships()
                ->where('tenant_id', $this->last_store_id)
                ->where('status', 'active')
                ->first();
        }

        if (!$this->resolvedMembership) {
            $this->resolvedMembership = $this->memberships()
                ->where('status', 'active')
                ->first();
        }

        $this->membershipResolved = true;
        return $this->resolvedMembership;
    }

    /**
     * Helper to ensure passcode is properly hashed.
     */
    protected function ensureHashed(?string $value): ?string
    {
        if (empty($value)) {
            return null;
        }
        if (str_starts_with($value, '$2y$') || str_starts_with($value, '$argon2')) {
            return $value;
        }
        return Hash::make($value);
    }

    /**
     * Shim: Get the role for the active store (last_store_id).
     */
    public function getRoleAttribute(): ?string
    {
        if ($this->is_platform_admin) return 'platform_admin';
        
        $membership = $this->getActiveMembership();
        if ($membership && !empty($membership->role)) {
            return $membership->role;
        }

        if (!empty($this->attributes['role'])) {
            return $this->attributes['role'];
        }

        return null;
    }

    /**
     * Mutator: Set the legacy users.role column only.
     *
     * NOTE: Store-level roles live in tenant_users.role, NOT here.
     * This column is kept for backward compatibility only.
     * Never use this to change a user's store role — update TenantUser directly.
     */
    public function setRoleAttribute(?string $value): void
    {
        $this->attributes['role'] = $value;
    }

    /**
     * Shim: Get the passcode (POS PIN) for the active store.
     */
    public function getPasscodeAttribute(): ?string
    {
        if ($this->temp_passcode !== null) {
            return $this->temp_passcode;
        }

        if (!$this->last_store_id) return null;
        return $this->memberships()
                    ->where('tenant_id', $this->last_store_id)
                    ->value('pos_pin');
    }

    /**
     * Mutator: Set user passcode (POS PIN) and sync with pivot if in tenant context.
     */
    public function setPasscodeAttribute(?string $value): void
    {
        $hashed = $this->ensureHashed($value);
        $this->temp_passcode = $hashed;
        $this->attributes['passcode'] = $hashed;

        if (app()->bound('current.tenant')) {
            $membership = $this->getActiveMembership();
            if ($membership && $membership->pos_pin !== $hashed) {
                $membership->update(['pos_pin' => $hashed]);
            }
        }
    }

    /**
     * Shim: Get the security pin (6 digits) for the active store.
     */
    public function getSecurityPinAttribute(): ?string
    {
        if (!$this->last_store_id) return null;
        return $this->memberships()
                    ->where('tenant_id', $this->last_store_id)
                    ->value('security_pin');
    }

    /**
     * Shim: Get permissions for this user.
     *
     * Resolution order:
     *   1. Platform admin → ['*']
     *   2. Custom permissions stored in TenantUser pivot (non-empty array) → use those verbatim
     *   3. config/permissions.php using the resolved store role → canonical source of truth
     *
     * config/permissions.php is the SINGLE SOURCE OF TRUTH for role-to-permission mapping.
     * Do NOT add inline permission arrays here — update config/permissions.php instead.
     */
    public function getPermissionsAttribute(): array
    {
        // Platform level super admin only
        if ($this->is_platform_admin) return ['*'];

        // Resolve the active membership
        $membership = $this->getActiveMembership();

        if ($membership) {
            if ($membership->role === 'owner') {
                return config('permissions.owner', ['*']);
            }

            $mode = $membership->permission_override_mode;

            // 1. 'inherit' mode: strictly resolve role permissions from config/permissions.php (ignore any stale custom array)
            if ($mode === 'inherit') {
                $role = $membership->role ?? 'viewer';
                return config('permissions.' . $role, []);
            }

            // 2. 'custom' mode: use stored custom permissions verbatim, including an empty array
            if ($mode === 'custom') {
                return is_array($membership->permissions) ? $membership->permissions : [];
            }

            // 3. Null / legacy mode: fallback to custom permissions if non-empty, otherwise role defaults
            if (!empty($membership->permissions) && is_array($membership->permissions)) {
                return $membership->permissions;
            }

            $role = $membership->role ?? 'viewer';
            return config('permissions.' . $role, []);
        }

        // SEC-02 (2026-09-10): no ACTIVE membership → no store permissions.
        // The legacy users.permissions column and the old ['pos','sales_view']
        // default let suspended/removed members keep store abilities.
        return [];
    }

    /**
     * Mutator: Set the legacy users.permissions column only.
     *
     * NOTE: Store-level permissions live in tenant_users.permissions, NOT here.
     * This column is kept for backward compatibility only.
     * Never use this to change a user's store permissions — update TenantUser directly.
     */
    public function setPermissionsAttribute(mixed $value): void
    {
        $perms = is_array($value) ? $value : (json_decode($value, true) ?? []);
        $this->attributes['permissions'] = json_encode($perms);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}
