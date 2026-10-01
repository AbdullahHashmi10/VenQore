<?php

namespace App\Reckoner\Resolvers;

use App\Models\ApprovalDocument;
use App\Models\ApprovalTransition;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use Throwable;

final class ApprovalReviewerDecisionsCompletedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'approval.reviewer_decisions_completed';
    }

    protected function compute(ReckonerContext $ctx, ReckonerPeriod $period, array $card, array $args, string $id, ReckonerShape $shape): ReckonerResult
    {
        $count = 0;
        try {
            if ($ctx->tenant && $ctx->user) {
                $count = ApprovalTransition::where('actor_id', $ctx->user->id)
                    ->whereIn('to_status', [ApprovalDocument::STATUS_APPROVED, ApprovalDocument::STATUS_REJECTED, ApprovalDocument::STATUS_RETURNED])
                    ->whereHas('approvalDocument', fn ($q) => $q->where('tenant_id', $ctx->tenant->id))
                    ->whereBetween('created_at', [$period->start, $period->end])
                    ->count();
            }
        } catch (Throwable $e) {
            return ReckonerResult::unavailable($id, self::key(), 'query_failed', 'Failed to compute reviewer decisions count: ' . $e->getMessage(), $card, $period);
        }

        return ReckonerResult::success($id, self::key(), $shape, $card, $period, ['value' => $count]);
    }
}
