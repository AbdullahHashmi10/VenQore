<?php

namespace App\Reckoner\Resolvers;

use App\Models\ChequeLeaf;
use App\Models\ReceivedCheque;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use Throwable;

final class ChequeBouncedTotalResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'cheque.bounced_total';
    }

    protected function compute(ReckonerContext $ctx, ReckonerPeriod $period, array $card, array $args, string $id, ReckonerShape $shape): ReckonerResult
    {
        $amount = 0.0;
        try {
            if ($ctx->tenant) {
                $issuedBounced = (float) ChequeLeaf::where('tenant_id', $ctx->tenant->id)
                    ->where('status', ChequeLeaf::STATUS_BOUNCED)
                    ->sum('amount');
                $receivedBounced = (float) ReceivedCheque::where('tenant_id', $ctx->tenant->id)
                    ->where('status', ReceivedCheque::STATUS_BOUNCED)
                    ->sum('amount');
                $amount = $issuedBounced + $receivedBounced;
            }
        } catch (Throwable $e) {
            return ReckonerResult::unavailable($id, self::key(), 'query_failed', 'Failed to compute bounced total amount: ' . $e->getMessage(), $card, $period);
        }

        return ReckonerResult::success($id, self::key(), $shape, $card, $period, ['value' => $amount]);
    }
}
