<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

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
class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'last_store_id',
        'is_platform_admin',
        'platform_role',
        'platform_pin',
        'google_id',
        'avatar',
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
            'is_platform_admin' => 'boolean',
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
                    ->withPivot(['role', 'status', 'display_name', 'pos_pin'])
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
    public function isPlatformOwner(): bool
    {
        // Legacy alias — use isPlatformAdmin() instead
        return $this->is_platform_admin === true;
    }

    public function isPlatformAdmin(): bool
    {
        // Reads the is_platform_admin boolean column only.
        // platform_role is legacy — NOT used for access control.
        return $this->is_platform_admin === true;
    }

    /**
     * Legacy shim: check if user has a specific role.
     * checks global is_platform_admin AND store-specific roles.
     */
    public function hasRole(string $role): bool
    {
        if ($this->is_platform_admin && ($role === 'platform_admin' || $role === 'admin')) return true;
        return $this->role === $role;
    }

    /**
     * Legacy shim: check if user has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->is_platform_admin) return true;
        return in_array($permission, $this->permissions) || in_array('*', $this->permissions);
    }

    // ──────────────────────────────────────────────────────────────────
    // Legacy ERP relationships (still needed for audit logs etc.)
    // ──────────────────────────────────────────────────────────────────

    // ──────────────────────────────────────────────────────────────────
    // Legacy Compatibility Shims (Definitive Plan)
    // ──────────────────────────────────────────────────────────────────

    /**
     * Shim: Get the role for the active store (last_store_id).
     */
    public function getRoleAttribute(): ?string
    {
        if ($this->is_platform_admin) return 'platform_admin';
        
        // Priority 1: Current active tenant (set by routing middleware)
        if (app()->bound('current.membership')) {
            return app('current.membership')->role;
        }

        // Priority 2: Fallback to last store, or self-heal and assign the first available store
        if (!$this->last_store_id) {
            $firstMembership = $this->memberships()->where('status', 'active')->first();
            if ($firstMembership) {
                $this->update(['last_store_id' => $firstMembership->tenant_id]);
                return $firstMembership->role;
            }
            return null;
        }

        return $this->roleIn($this->last_store_id);
    }

    /**
     * Shim: Get the passcode (POS PIN) for the active store.
     */
    public function getPasscodeAttribute(): ?string
    {
        if (!$this->last_store_id) return null;
        return $this->memberships()
                    ->where('tenant_id', $this->last_store_id)
                    ->value('pos_pin');
    }

    /**
     * Shim: Get permissions. Currently role-based in multi-tenant mode.
     *
     * SECURITY: Only platform admins (is_platform_admin = true) get '*'.
     * Store owners and admins get their store-scoped permissions.
     * The CheckPermissions middleware handles them via the fast-path
     * (owner/admin bypass within store context), but they do NOT get
     * a global wildcard that could bleed into platform routes.
     */
    public function getPermissionsAttribute(): array
    {
        // Platform level super admin only
        if ($this->is_platform_admin) return ['*'];

        // Store-level role permissions (store-scoped, NOT global wildcard)
        $role = $this->role;
        if ($role === 'owner' || $role === 'admin') {
            // Return full store permission set (no '*' wildcard — cannot reach /VenQore/*)
            return [
                'pos', 'inventory', 'sales', 'sales_view', 'purchases', 'finance',
                'reports', 'audit', 'customers', 'users', 'settings', 'discounts',
            ];
        }

        // Default staff permissions if no custom logic yet
        return ['pos', 'sales_view', 'inventory_view'];
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}
