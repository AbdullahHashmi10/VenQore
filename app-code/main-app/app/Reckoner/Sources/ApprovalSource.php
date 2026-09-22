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
            'approval.awaiting_review',
            'approval.pending_aging',
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
                'approval.awaiting_review' => [
                    'count'  => ApprovalDocument::where('tenant_id', $tenantId)
                        ->where('status', ApprovalDocument::STATUS_PENDING)
                        ->count(),
                    'amount' => (float) ApprovalDocument::where('tenant_id', $tenantId)
                        ->where('status', ApprovalDocument::STATUS_PENDING)
                        ->sum('amount'),
                ],
                'approval.pending_aging' => $this->resolveAging($tenantId),
                default => 0,
            };
        }

        return $out;
    }

    private function resolveAging(int|string $tenantId): array
    {
        $now = now();
        $docs = ApprovalDocument::where('tenant_id', $tenantId)
            ->where('status', ApprovalDocument::STATUS_PENDING)
            ->get(['id', 'amount', 'created_at']);

        $under24 = 0;
        $day1To2 = 0;
        $over48 = 0;

        foreach ($docs as $doc) {
            $hours = $now->diffInHours($doc->created_at);
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
