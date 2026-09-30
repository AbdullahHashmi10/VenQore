<?php

namespace App\Reckoner\Resolvers;

use App\Models\ApprovalDocument;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use Throwable;

final class ApprovalMyPendingResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'approval.my_pending';
    }

    protected function compute(ReckonerContext $ctx, ReckonerPeriod $period, array $card, array $args, string $id, ReckonerShape $shape): ReckonerResult
    {
        $count = 0;
        try {
            if ($ctx->tenant && $ctx->user) {
                $count = ApprovalDocument::where('tenant_id', $ctx->tenant->id)
                    ->where('maker_id', $ctx->user->id)
                    ->where('status', ApprovalDocument::STATUS_PENDING)
                    ->count();
            }
        } catch (Throwable $e) {
            return ReckonerResult::unavailable($id, self::key(), 'query_failed', 'Failed to compute pending count: ' . $e->getMessage(), $card, $period);
        }

        return ReckonerResult::success($id, self::key(), $shape, $card, $period, ['value' => $count]);
    }
}
