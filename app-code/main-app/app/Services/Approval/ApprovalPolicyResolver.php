<?php

namespace App\Services\Approval;

use App\Models\ApprovalDocument;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;

class ApprovalPolicyResolver
{
    /**
     * Resolve whether a transaction requires maker-checker approval before posting.
     *
     * @return array{
     *   requires_approval: bool,
     *   reason: string,
     *   effective_mode: string,
     *   can_approve: bool,
     *   policy_details: array
     * }
     */
    public function resolve(
        Tenant $tenant,
        User $user,
        string $documentType,
        float $amount = 0.0,
        bool $isTrustedPos = false
    ): array {
        // 1. Check document type support
        if (!in_array($documentType, ApprovalDocument::SUPPORTED_TYPES, true)) {
            return [
                'requires_approval' => false,
                'reason'            => 'unsupported_type',
                'effective_mode'    => 'direct',
                'can_approve'       => false,
                'policy_details'    => ['supported' => false],
            ];
        }

        // 2. Check store administrative approval master toggle
        $adminEnabledSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_admin_enabled')
            ->value('value');
        $adminEnabled = $adminEnabledSetting !== null ? filter_var($adminEnabledSetting, FILTER_VALIDATE_BOOLEAN) : true;

        if (!$adminEnabled) {
            return [
                'requires_approval' => false,
                'reason'            => 'store_approval_disabled',
                'effective_mode'    => 'direct',
                'can_approve'       => false,
                'policy_details'    => ['store_admin_enabled' => false],
            ];
        }

        // 3. Trusted POS Clearance (verified server-side open shift & cashier)
        if ($isTrustedPos) {
            return [
                'requires_approval' => false,
                'reason'            => 'trusted_pos_clearance',
                'effective_mode'    => 'direct',
                'can_approve'       => false,
                'policy_details'    => ['trusted_pos' => true],
            ];
        }

        // 4. Resolve Membership & Role
        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->first();
        $role = $membership?->role ?? 'cashier';
        $userMode = $membership?->transaction_approval_mode ?? 'inherit';

        $isOwner = ($role === 'owner');
        $isAdmin = ($role === 'admin');
        $isManager = ($role === 'manager');
        $canApprove = ($isOwner || $isAdmin || $isManager);

        // Strict Owner Separation Setting
        $strictOwnerSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_strict_owner_separation')
            ->value('value');
        $strictOwnerSeparation = filter_var($strictOwnerSetting, FILTER_VALIDATE_BOOLEAN);

        // Amount Threshold Setting
        $thresholdSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_amount_threshold')
            ->value('value');
        $amountThreshold = $thresholdSetting !== null && is_numeric($thresholdSetting) ? (float)$thresholdSetting : null;

        $amountExceeded = ($amountThreshold !== null && $amount >= $amountThreshold);

        // 5. Evaluate Owner
        if ($isOwner && !$strictOwnerSeparation && $userMode !== 'required') {
            return [
                'requires_approval' => false,
                'reason'            => 'owner_direct_post',
                'effective_mode'    => 'direct',
                'can_approve'       => true,
                'policy_details'    => [
                    'role' => 'owner',
                    'strict_owner_separation' => false,
                ],
            ];
        }

        // 6. Evaluate Explicit User Mode
        if ($userMode === 'required') {
            return [
                'requires_approval' => true,
                'reason'            => 'user_approval_required',
                'effective_mode'    => 'required',
                'can_approve'       => $canApprove,
                'policy_details'    => [
                    'user_mode' => 'required',
                ],
            ];
        }

        if ($userMode === 'direct') {
            if ($amountExceeded) {
                return [
                    'requires_approval' => true,
                    'reason'            => 'amount_threshold_exceeded',
                    'effective_mode'    => 'required_by_threshold',
                    'can_approve'       => $canApprove,
                    'policy_details'    => [
                        'user_mode'        => 'direct',
                        'amount'           => $amount,
                        'amount_threshold' => $amountThreshold,
                    ],
                ];
            }

            return [
                'requires_approval' => false,
                'reason'            => 'user_direct_mode',
                'effective_mode'    => 'direct',
                'can_approve'       => $canApprove,
                'policy_details'    => [
                    'user_mode' => 'direct',
                ],
            ];
        }

        // 7. Inherit (Role Defaults)
        // Cashiers, accountants, purchasing officers, viewers require approval by default
        // Admins and managers post direct unless amount threshold is exceeded
        $roleRequiresApproval = in_array($role, ['cashier', 'viewer', 'accountant', 'purchasing_officer'], true);

        if ($amountExceeded) {
            return [
                'requires_approval' => true,
                'reason'            => 'amount_threshold_exceeded',
                'effective_mode'    => 'required_by_threshold',
                'can_approve'       => $canApprove,
                'policy_details'    => [
                    'inherited_role'   => $role,
                    'amount'           => $amount,
                    'amount_threshold' => $amountThreshold,
                ],
            ];
        }

        if ($roleRequiresApproval) {
            return [
                'requires_approval' => true,
                'reason'            => 'role_default_approval_required',
                'effective_mode'    => 'required_by_role',
                'can_approve'       => $canApprove,
                'policy_details'    => [
                    'inherited_role' => $role,
                ],
            ];
        }

        return [
            'requires_approval' => false,
            'reason'            => 'role_default_direct',
            'effective_mode'    => 'direct',
            'can_approve'       => $canApprove,
            'policy_details'    => [
                'inherited_role' => $role,
            ],
        ];
    }
}
