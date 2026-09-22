<?php

namespace App\Reckoner;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;

/**
 * The tenant/user/role context a resolve pass runs under. Passed to every Source so
 * queries stay tenant-scoped and cache fingerprints remain deterministic.
 */
final class ReckonerContext
{
    public readonly string $role;
    public readonly array $permissions;
    public readonly string $permissionHash;

    public function __construct(
        public readonly ?Tenant $tenant,
        public readonly User $user,
        ?string $role = null,
        ?array $permissions = null,
        public readonly array $dataScope = []
    ) {
        if ($tenant && $user) {
            $membership = $user->getActiveMembership();
            $this->role = $role ?? $membership?->role ?? ($user->is_platform_admin ? 'admin' : 'viewer');
        } else {
            $this->role = $role ?? 'viewer';
        }

        $this->permissions = $permissions ?? ($user->permissions ?? []);
        $this->permissionHash = md5(json_encode($this->permissions) . ':' . $this->role);
    }

    /**
     * Deterministic scope fingerprint for caching.
     * Personal / user-scoped cards include user ID and permission hash.
     * Tenant-wide aggregated cards use tenant scope.
     */
    public function scopeFingerprint(string $metricKey): string
    {
        $isPersonal = str_starts_with($metricKey, 'approval.my_')
            || str_starts_with($metricKey, 'cashier.')
            || str_starts_with($metricKey, 'staff.my_')
            || in_array($metricKey, ['approval.awaiting_review', 'approval.pending_aging'], true);

        if ($isPersonal) {
            return 'user_' . $this->user->id . '_' . $this->permissionHash;
        }

        return 'role_' . $this->role . '_' . substr($this->permissionHash, 0, 8);
    }
}
