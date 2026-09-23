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
    public readonly string $approvalMode;
    public readonly ?int $branchId;

    public function __construct(
        public readonly ?Tenant $tenant,
        public readonly User $user,
        ?string $role = null,
        ?array $permissions = null,
        public readonly array $dataScope = []
    ) {
        $membership = null;
        if ($tenant && $user) {
            $membership = $user->getActiveMembership();
            $this->role = $role ?? $membership?->role ?? ($user->is_platform_admin ? 'admin' : 'viewer');
        } else {
            $this->role = $role ?? 'viewer';
        }

        $this->approvalMode = $membership?->transaction_approval_mode ?? 'inherit';
        $this->branchId = $membership?->branch_id ?? null;

        $perms = $permissions ?? ($user->permissions ?? []);
        sort($perms);
        $this->permissions = $perms;

        $normalizedScope = $this->normalizeScope($this->dataScope);
        $dataScopeStr = !empty($normalizedScope) ? json_encode($normalizedScope) : '';
        $this->permissionHash = md5(json_encode($perms) . ':' . $this->role . ':' . $this->approvalMode . ':' . ($this->branchId ?? '') . ':' . $dataScopeStr);
    }

    private function normalizeScope(array $scope): array
    {
        ksort($scope);
        foreach ($scope as $k => $v) {
            if (is_array($v)) {
                $scope[$k] = $this->normalizeScope($v);
            }
        }
        return $scope;
    }

    /**
     * Deterministic effective-scope fingerprint for caching.
     * Includes tenant, user, role, permission hash, approval mode, and store scope.
     */
    public function scopeFingerprint(string $metricKey): string
    {
        $isPersonal = str_starts_with($metricKey, 'approval.my_')
            || str_starts_with($metricKey, 'cashier.')
            || str_starts_with($metricKey, 'staff.my_')
            || in_array($metricKey, ['approval.awaiting_review', 'approval.pending_aging'], true);

        if ($isPersonal) {
            return 'u_' . $this->user->id . '_' . $this->permissionHash;
        }

        return 'role_' . $this->role . '_' . $this->permissionHash;
    }
}
