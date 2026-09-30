<?php

namespace App\Reckoner\Resolvers;

use App\Models\ChequeLeaf;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use Throwable;

final class ChequeStoppedTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'cheque.stopped_total';
    }

    protected function compute(ReckonerContext $ctx, ReckonerPeriod $period, array $card, array $args, string $id, ReckonerShape $shape): ReckonerResult
    {
        $amount = 0.0;
        try {
            if ($ctx->tenant) {
                $amount = (float) ChequeLeaf::where('tenant_id', $ctx->tenant->id)
                    ->where('status', ChequeLeaf::STATUS_STOPPED)
                    ->sum('amount');
            }
        } catch (Throwable $e) {
            return ReckonerResult::unavailable($id, self::key(), 'query_failed', 'Failed to compute stopped cheques amount: ' . $e->getMessage(), $card, $period);
        }

        return ReckonerResult::success($id, self::key(), $shape, $card, $period, ['value' => $amount]);
    }
}
