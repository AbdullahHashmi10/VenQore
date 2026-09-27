<?php

namespace App\Services\Approval\Adapters;

use App\Models\ApprovalDocument;
use App\Models\Tenant;
use App\Models\User;

interface ApprovalAdapterInterface
{
    /**
     * Unique document type identifier (e.g. 'customer_receipt', 'sales_invoice').
     */
    public function documentType(): string;

    /**
     * Normalize and validate payload on submission.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function validatePayload(array $payload, Tenant $tenant, User $maker): array;

    /**
     * Revalidate the payload against the live database at the moment of approval.
     *
     * @throws \Illuminate\Validation\ValidationException|\RuntimeException
     */
    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void;

    /**
     * Execute final operational and financial posting atomically.
     * Returns array with posted entity details: ['type' => string, 'id' => mixed, 'reference' => string].
     */
    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array;

    /**
     * The business permission(s) a reviewer must ALSO hold — in addition to a
     * generic transition permission (approvals.review/approve/reject/return) —
     * to decide on a document of this type. Any one of the returned keys is
     * sufficient (OR). This is what stops a role with only a generic approvals
     * grant (e.g. a manager) from approving a financial action it has no
     * business authority over: reviewer eligibility is scoped per document
     * type, never satisfied by the transition permission alone.
     *
     * Owner, admin, and platform admins are exempt from this check elsewhere
     * (they already have blanket authority); this method only governs
     * everyone else. Return an empty array if no additional business
     * permission should be required beyond the transition permission.
     *
     * @return string[]
     */
    public function reviewerEligibilityPermissions(): array;

    /**
     * R10 FIX: Business permissions that the reviewer must ALL hold (AND semantics).
     * Adapters that require multiple distinct business authorities simultaneously
     * (e.g. SalesReturn: BOTH 'sales.edit' AND 'finance.customer_refund') implement
     * this method. Failing any one of these blocks the reviewer even if they hold
     * reviewerEligibilityPermissions().
     *
     * Default: empty array (no AND requirement — only the OR list above applies).
     * Adapters may implement this without it being forced by the interface by using
     * the HasAndEligibilityPermissions trait, or by implementing it directly.
     *
     * @return string[]
     */
    public function reviewerEligibilityPermissionsAll(): array;
}
