<?php

namespace App\Policies;

use App\Models\ApprovalDocument;
use App\Models\User;

/**
 * ApprovalDocumentPolicy
 *
 * Gates who may perform actions on a specific ApprovalDocument.
 *
 * These gates are called by ApprovalDocumentController and the engine's
 * assertReviewerEligible() helper.  They operate on the ALREADY-RESOLVED
 * document (tenant_id is already validated by the controller scope).
 *
 * Three visibility tiers:
 *   own    — the maker sees their own submission
 *   role   — any active member with the reviewer permission can act
 *   shared — admins and owners always have full read access
 *
 * Security notes:
 *  - Gates do NOT re-validate tenant scoping — callers must pass the correct
 *    document (already scoped by ApprovalDocumentController).
 *  - reviewerEligibilityPermissions on the adapter provides the final-step
 *    post-permission check at approval time.
 */
class ApprovalDocumentPolicy
{
    /**
     * Can the user VIEW the document (inbox / detail page)?
     */
    public function view(User $user, ApprovalDocument $doc): bool
    {
        $makerId = $doc->maker_id ?? $doc->submitted_by;
        // The submitter can always see their own document.
        if ($makerId === $user->id) {
            return true;
        }

        if (!$this->canActOnSubmission($user, $doc)) {
            return false;
        }

        // Reviewers / approvers can see all pending documents in the queue.
        return $user->hasPermission('approvals.view_own')
            || $user->hasPermission('approvals.review')
            || $user->hasPermission('approvals.approve');
    }

    /**
     * Can the user APPROVE the document (posts the GL entries)?
     *
     * The adapter's reviewerEligibilityPermissions() is checked AFTER this
     * gate inside ApprovalExecutionEngine::assertReviewerEligible().
     */
    public function approve(User $user, ApprovalDocument $doc): bool
    {
        $makerId = $doc->maker_id ?? $doc->submitted_by;
        // Submitter may not self-approve.
        if ($makerId === $user->id) {
            return false;
        }

        if (!$this->canActOnSubmission($user, $doc)) {
            return false;
        }

        return $user->hasPermission('approvals.approve')
            || $user->hasPermission('approvals.review');
    }

    /**
     * Can the user REJECT the document (permanently declines it)?
     */
    public function reject(User $user, ApprovalDocument $doc): bool
    {
        $makerId = $doc->maker_id ?? $doc->submitted_by;
        if ($makerId === $user->id) {
            return false;
        }

        if (!$this->canActOnSubmission($user, $doc)) {
            return false;
        }

        return $user->hasPermission('approvals.reject')
            || $user->hasPermission('approvals.review');
    }

    /**
     * Can the user RETURN the document for correction?
     */
    public function return(User $user, ApprovalDocument $doc): bool
    {
        $makerId = $doc->maker_id ?? $doc->submitted_by;
        if ($makerId === $user->id) {
            return false;
        }

        if (!$this->canActOnSubmission($user, $doc)) {
            return false;
        }

        return $user->hasPermission('approvals.return')
            || $user->hasPermission('approvals.review');
    }

    public function canActOnSubmission(User $user, ApprovalDocument $doc): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        $membership = \App\Models\TenantUser::where('tenant_id', $doc->tenant_id)
            ->where('user_id', $user->id)
            ->first();

        if ($membership && in_array($membership->role, ['owner', 'admin'], true)) {
            return true;
        }

        $makerId = $doc->maker_id ?? $doc->submitted_by;
        // Check if submitter has assigned supervisors configured
        $supervisorsJson = \App\Models\Setting::withoutGlobalScopes()
            ->where('tenant_id', $doc->tenant_id)
            ->where('key', "approval_supervisors_user_{$makerId}")
            ->value('value');

        if (!empty($supervisorsJson)) {
            $assignedIds = json_decode($supervisorsJson, true);
            if (is_array($assignedIds) && count($assignedIds) > 0) {
                return in_array($user->id, array_map('intval', $assignedIds), true);
            }
        }

        return true;
    }

    /**
     * Can the user WITHDRAW their own submission?
     */
    public function withdraw(User $user, ApprovalDocument $doc): bool
    {
        $makerId = $doc->maker_id ?? $doc->submitted_by;
        return $makerId === $user->id
            && $doc->status === ApprovalDocument::STATUS_PENDING;
    }

    /**
     * Can the user RESUBMIT a returned document?
     */
    public function resubmit(User $user, ApprovalDocument $doc): bool
    {
        $makerId = $doc->maker_id ?? $doc->submitted_by;
        return $makerId === $user->id
            && $doc->status === ApprovalDocument::STATUS_RETURNED;
    }

    /**
     * Can the user view the full AUDIT TRAIL (revision history)?
     *
     * Maker sees their own trail; reviewers see all.
     */
    public function viewAuditTrail(User $user, ApprovalDocument $doc): bool
    {
        return $doc->submitted_by === $user->id
            || $user->hasPermission('approvals.review')
            || $user->hasPermission('approvals.approve');
    }
}
