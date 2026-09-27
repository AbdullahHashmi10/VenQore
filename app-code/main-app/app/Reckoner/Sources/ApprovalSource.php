<?php

namespace App\Reckoner\Sources;

use App\Models\ApprovalDocument;
use App\Reckoner\ReckonerContext;
use Illuminate\Support\Facades\DB;

/**
 * Approval workflow dashboard readings for makers and reviewers.
 * Strictly scoped to current tenant and authenticated employee context.
 */
final class ApprovalSource implements ReckonerSource
{
    public function supports(): array
    {
        return [
            'approval.my_pending',
            'approval.my_returned',
            'approval.my_submitted',
            'approval.my_approved',
            'approval.awaiting_review',
            'approval.pending_aging',
            'approval.reviewer_decisions_completed',
            'approval.reviewer_returned_to_maker',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];
        $tenantId = $ctx->tenant?->id;
        $userId = $ctx->user->id;

        if (!$tenantId) {
            foreach ($requests as $request) {
                $out[$request['id']] = 0;
            }
            return $out;
        }

        foreach ($requests as $request) {
            $key = $request['key'];
            $id = $request['id'];

            $out[$id] = match ($key) {
                'approval.my_pending' => [
                    'count'  => ApprovalDocument::where('tenant_id', $tenantId)
                        ->where('maker_id', $userId)
                        ->where('status', ApprovalDocument::STATUS_PENDING)
                        ->count(),
                    'amount' => (float) ApprovalDocument::where('tenant_id', $tenantId)
                        ->where('maker_id', $userId)
                        ->where('status', ApprovalDocument::STATUS_PENDING)
                        ->sum('amount'),
                ],
                'approval.my_returned' => [
                    'count'  => ApprovalDocument::where('tenant_id', $tenantId)
                        ->where('maker_id', $userId)
                        ->where('status', ApprovalDocument::STATUS_RETURNED)
                        ->count(),
                    'amount' => (float) ApprovalDocument::where('tenant_id', $tenantId)
                        ->where('maker_id', $userId)
                        ->where('status', ApprovalDocument::STATUS_RETURNED)
                        ->sum('amount'),
                ],
                'approval.my_submitted' => [
                    'count'  => ApprovalDocument::where('tenant_id', $tenantId)
                        ->where('maker_id', $userId)
                        ->count(),
                    'amount' => (float) ApprovalDocument::where('tenant_id', $tenantId)
                        ->where('maker_id', $userId)
                        ->sum('amount'),
                ],
                'approval.my_approved' => [
                    'count'  => ApprovalDocument::where('tenant_id', $tenantId)
                        ->where('maker_id', $userId)
                        ->where('status', ApprovalDocument::STATUS_APPROVED)
                        ->count(),
                    'amount' => (float) ApprovalDocument::where('tenant_id', $tenantId)
                        ->where('maker_id', $userId)
                        ->where('status', ApprovalDocument::STATUS_APPROVED)
                        ->sum('amount'),
                ],
                'approval.awaiting_review' => $this->resolveAwaitingReview($ctx),
                'approval.pending_aging' => $this->resolveAging($ctx),
                'approval.reviewer_decisions_completed' => [
                    'count' => \App\Models\ApprovalTransition::where('actor_id', $userId)
                        ->whereIn('to_status', [ApprovalDocument::STATUS_APPROVED, ApprovalDocument::STATUS_REJECTED, ApprovalDocument::STATUS_RETURNED])
                        ->whereHas('approvalDocument', fn ($q) => $q->where('tenant_id', $tenantId))
                        ->count(),
                ],
                'approval.reviewer_returned_to_maker' => [
                    'count' => \App\Models\ApprovalTransition::where('actor_id', $userId)
                        ->where('to_status', ApprovalDocument::STATUS_RETURNED)
                        ->whereHas('approvalDocument', fn ($q) => $q->where('tenant_id', $tenantId))
                        ->count(),
                ],
                default => 0,
            };
        }

        return $out;
    }

    private function resolveAwaitingReview(ReckonerContext $ctx): array
    {
        $tenant = $ctx->tenant;
        $user = $ctx->user;
        if (!$tenant || !$user) {
            return ['count' => 0, 'amount' => 0.0];
        }

        $engine = app(\App\Services\Approval\ApprovalExecutionEngine::class);
        $eligibleTypes = $engine->getEligibleDocumentTypes($tenant, $user);

        if (empty($eligibleTypes)) {
            return ['count' => 0, 'amount' => 0.0];
        }

        $query = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('status', ApprovalDocument::STATUS_PENDING)
            ->whereIn('document_type', $eligibleTypes);

        $membership = \App\Models\TenantUser::where('tenant_id', $tenant->id)->where('user_id', $user->id)->first();
        $isOwner = ($membership?->role === 'owner');

        $strictOwnerSetting = \App\Models\Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_strict_owner_separation')
            ->value('value');
        $strictOwnerSeparation = filter_var($strictOwnerSetting, FILTER_VALIDATE_BOOLEAN);

        if (!$isOwner || $strictOwnerSeparation) {
            $query->where('maker_id', '!=', $user->id);
        }

        return [
            'count'  => $query->count(),
            'amount' => (float) $query->sum('amount'),
        ];
    }

    private function resolveAging(ReckonerContext $ctx): array
    {
        $tenant = $ctx->tenant;
        $user = $ctx->user;
        if (!$tenant || !$user) {
            return [
                'under_24h' => 0,
                '24h_to_48h' => 0,
                'over_48h' => 0,
                'total_pending' => 0,
            ];
        }

        $engine = app(\App\Services\Approval\ApprovalExecutionEngine::class);
        $eligibleTypes = $engine->getEligibleDocumentTypes($tenant, $user);

        if (empty($eligibleTypes)) {
            return [
                'under_24h' => 0,
                '24h_to_48h' => 0,
                'over_48h' => 0,
                'total_pending' => 0,
            ];
        }

        $query = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('status', ApprovalDocument::STATUS_PENDING)
            ->whereIn('document_type', $eligibleTypes);

        $membership = \App\Models\TenantUser::where('tenant_id', $tenant->id)->where('user_id', $user->id)->first();
        $isOwner = ($membership?->role === 'owner');

        $strictOwnerSetting = \App\Models\Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('key', 'approval_strict_owner_separation')
            ->value('value');
        $strictOwnerSeparation = filter_var($strictOwnerSetting, FILTER_VALIDATE_BOOLEAN);

        if (!$isOwner || $strictOwnerSeparation) {
            $query->where('maker_id', '!=', $user->id);
        }

        $now = now();
        $docs = $query->get(['id', 'amount', 'created_at']);

        $under24 = 0;
        $day1To2 = 0;
        $over48 = 0;

        foreach ($docs as $doc) {
            $hours = abs((float) $now->diffInHours($doc->created_at, false));
            if ($hours < 24) {
                $under24++;
            } elseif ($hours <= 48) {
                $day1To2++;
            } else {
                $over48++;
            }
        }

        return [
            'under_24h' => $under24,
            '24h_to_48h' => $day1To2,
            'over_48h' => $over48,
            'total_pending' => count($docs),
        ];
    }
}
