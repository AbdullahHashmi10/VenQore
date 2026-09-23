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

        // 2. Resolve per-document policy and thresholds upfront
        $docPolicySetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', "approval_policy_{$documentType}")
            ->value('value') ?? 'inherit';

        $docThresholdSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', "approval_threshold_{$documentType}")
            ->value('value');

        // 3. Check store administrative approval master toggle
        $adminEnabledSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_admin_enabled')
            ->value('value');
        $adminEnabled = $adminEnabledSetting !== null ? filter_var($adminEnabledSetting, FILTER_VALIDATE_BOOLEAN) : true;

        if (!$adminEnabled) {
            // Check for explicit stronger per-document policy or threshold
            if ($docPolicySetting === 'required') {
                return [
                    'requires_approval' => true,
                    'reason'            => 'document_policy_required',
                    'effective_mode'    => 'required_by_doc_policy',
                    'can_approve'       => false,
                    'policy_details'    => ['document_policy' => 'required', 'store_admin_enabled' => false],
                ];
            }
            if ($docThresholdSetting !== null && is_numeric($docThresholdSetting) && $amount >= (float)$docThresholdSetting) {
                return [
                    'requires_approval' => true,
                    'reason'            => 'document_threshold_exceeded',
                    'effective_mode'    => 'required_by_threshold',
                    'can_approve'       => false,
                    'policy_details'    => ['document_threshold' => (float)$docThresholdSetting, 'store_admin_enabled' => false],
                ];
            }

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

        // Amount Threshold Setting (global or per-document)
        $docThresholdSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', "approval_threshold_{$documentType}")
            ->value('value');
        $globalThresholdSetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_amount_threshold')
            ->value('value');

        $thresholdSetting = $docThresholdSetting ?? $globalThresholdSetting;
        $amountThreshold = $thresholdSetting !== null && is_numeric($thresholdSetting) ? (float)$thresholdSetting : null;
        $amountExceeded = ($amountThreshold !== null && $amount >= $amountThreshold);

        // Per-Document Type Policy Setting (direct, required, inherit)
        $docPolicySetting = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', "approval_policy_{$documentType}")
            ->value('value') ?? 'inherit';

        // Store Default Employee Mode
        $defaultEmployeeMode = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_default_employee_mode')
            ->value('value') ?? 'inherit';

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

        // 7. Evaluate Explicit Per-Document Policy
        if ($docPolicySetting === 'required') {
            return [
                'requires_approval' => true,
                'reason'            => 'document_policy_required',
                'effective_mode'    => 'required_by_doc_policy',
                'can_approve'       => $canApprove,
                'policy_details'    => [
                    'document_policy' => 'required',
                    'document_type'   => $documentType,
                ],
            ];
        }

        if ($docPolicySetting === 'direct' && !$amountExceeded) {
            return [
                'requires_approval' => false,
                'reason'            => 'document_policy_direct',
                'effective_mode'    => 'direct',
                'can_approve'       => $canApprove,
                'policy_details'    => [
                    'document_policy' => 'direct',
                    'document_type'   => $documentType,
                ],
            ];
        }

        // 8. Amount Threshold Check (on inherit mode)
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

        // 9. Store Default Employee Mode (if configured as direct or required)
        if ($defaultEmployeeMode === 'required') {
            return [
                'requires_approval' => true,
                'reason'            => 'store_default_employee_mode_required',
                'effective_mode'    => 'required_by_store_default',
                'can_approve'       => $canApprove,
                'policy_details'    => [
                    'default_employee_mode' => 'required',
                ],
            ];
        }

        if ($defaultEmployeeMode === 'direct') {
            return [
                'requires_approval' => false,
                'reason'            => 'store_default_employee_mode_direct',
                'effective_mode'    => 'direct',
                'can_approve'       => $canApprove,
                'policy_details'    => [
                    'default_employee_mode' => 'direct',
                ],
            ];
        }

        // 10. Role Defaults (Inherit)
        $roleRequiresApproval = in_array($role, ['cashier', 'viewer', 'accountant', 'purchasing_officer'], true);

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
