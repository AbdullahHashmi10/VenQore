<?php

namespace App\Reckoner\Resolvers;

use App\Models\ChequeLeaf;
use App\Models\ReceivedCheque;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use Throwable;

final class ChequePostDatedDueResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'cheque.post_dated_due';
    }

    protected function compute(ReckonerContext $ctx, ReckonerPeriod $period, array $card, array $args, string $id, ReckonerShape $shape): ReckonerResult
    {
        $amount = 0.0;
        try {
            if ($ctx->tenant) {
                $today = now()->toDateString();
                $inSevenDays = now()->addDays(7)->toDateString();

                $issuedDue = (float) ChequeLeaf::where('tenant_id', $ctx->tenant->id)
                    ->whereIn('status', [ChequeLeaf::STATUS_ISSUED, ChequeLeaf::STATUS_RESERVED])
                    ->whereBetween('cheque_date', [$today, $inSevenDays])
                    ->sum('amount');

                $receivedDue = (float) ReceivedCheque::where('tenant_id', $ctx->tenant->id)
                    ->whereIn('status', [ReceivedCheque::STATUS_RECEIVED, ReceivedCheque::STATUS_DEPOSITED])
                    ->whereBetween('cheque_date', [$today, $inSevenDays])
                    ->sum('amount');

                $amount = $issuedDue + $receivedDue;
            }
        } catch (Throwable $e) {
            return ReckonerResult::unavailable($id, self::key(), 'query_failed', 'Failed to compute post-dated cheques due amount: ' . $e->getMessage(), $card, $period);
        }

        return ReckonerResult::success($id, self::key(), $shape, $card, $period, ['value' => $amount]);
    }
}
