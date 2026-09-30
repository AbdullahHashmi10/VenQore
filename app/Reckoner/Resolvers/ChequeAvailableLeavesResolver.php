<?php

namespace App\Reckoner\Resolvers;

use App\Models\ChequeLeaf;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use Throwable;

final class ChequeAvailableLeavesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'cheque.available_leaves';
    }

    protected function compute(ReckonerContext $ctx, ReckonerPeriod $period, array $card, array $args, string $id, ReckonerShape $shape): ReckonerResult
    {
        $count = 0;
        try {
            if ($ctx->tenant) {
                $count = ChequeLeaf::where('tenant_id', $ctx->tenant->id)
                    ->where('status', ChequeLeaf::STATUS_AVAILABLE)
                    ->count();
            }
        } catch (Throwable $e) {
            return ReckonerResult::unavailable($id, self::key(), 'query_failed', 'Failed to compute available leaves: ' . $e->getMessage(), $card, $period);
        }

        return ReckonerResult::success($id, self::key(), $shape, $card, $period, ['value' => $count]);
    }
}
