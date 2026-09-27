<?php

namespace App\Reckoner\Sources;

use App\Models\ChequeBook;
use App\Models\ChequeLeaf;
use App\Models\ReceivedCheque;
use App\Reckoner\ReckonerContext;

/**
 * Cheque management dashboard readings for bank and received cheques.
 * Strictly scoped to current tenant.
 */
final class ChequeSource implements ReckonerSource
{
    public function supports(): array
    {
        return [
            'cheque.available_leaves',
            'cheque.issued_uncleared',
            'cheque.cheques_in_hand',
            'cheque.deposited_uncleared',
            'cheque.bounced_total',
            'cheque.stopped_total',
            'cheque.post_dated_due',
        ];
    }

    public function resolveBatch(array $requests, ReckonerContext $ctx): array
    {
        $out = [];
        $tenantId = $ctx->tenant?->id;

        if (!$tenantId) {
            foreach ($requests as $request) {
                $out[$request['id']] = 0;
            }
            return $out;
        }

        $today = now()->toDateString();
        $inSevenDays = now()->addDays(7)->toDateString();

        foreach ($requests as $request) {
            $key = $request['key'];
            $id = $request['id'];

            $out[$id] = match ($key) {
                'cheque.available_leaves' => [
                    'count'       => ChequeLeaf::where('tenant_id', $tenantId)->where('status', ChequeLeaf::STATUS_AVAILABLE)->count(),
                    'books_count' => ChequeBook::where('tenant_id', $tenantId)->where('status', ChequeBook::STATUS_ACTIVE)->count(),
                ],
                'cheque.issued_uncleared' => [
                    'count'  => ChequeLeaf::where('tenant_id', $tenantId)->where('status', ChequeLeaf::STATUS_ISSUED)->count(),
                    'amount' => (float) ChequeLeaf::where('tenant_id', $tenantId)->where('status', ChequeLeaf::STATUS_ISSUED)->sum('amount'),
                ],
                'cheque.cheques_in_hand' => [
                    'count'  => ReceivedCheque::where('tenant_id', $tenantId)->where('status', ReceivedCheque::STATUS_RECEIVED)->count(),
                    'amount' => (float) ReceivedCheque::where('tenant_id', $tenantId)->where('status', ReceivedCheque::STATUS_RECEIVED)->sum('amount'),
                ],
                'cheque.deposited_uncleared' => [
                    'count'  => ReceivedCheque::where('tenant_id', $tenantId)->where('status', ReceivedCheque::STATUS_DEPOSITED)->count(),
                    'amount' => (float) ReceivedCheque::where('tenant_id', $tenantId)->where('status', ReceivedCheque::STATUS_DEPOSITED)->sum('amount'),
                ],
                'cheque.bounced_total' => (function () use ($tenantId) {
                    $issuedCount = ChequeLeaf::where('tenant_id', $tenantId)->where('status', ChequeLeaf::STATUS_BOUNCED)->count();
                    $issuedAmount = (float) ChequeLeaf::where('tenant_id', $tenantId)->where('status', ChequeLeaf::STATUS_BOUNCED)->sum('amount');
                    $recCount = ReceivedCheque::where('tenant_id', $tenantId)->where('status', ReceivedCheque::STATUS_BOUNCED)->count();
                    $recAmount = (float) ReceivedCheque::where('tenant_id', $tenantId)->where('status', ReceivedCheque::STATUS_BOUNCED)->sum('amount');

                    return [
                        'count'           => $issuedCount + $recCount,
                        'amount'          => $issuedAmount + $recAmount,
                        'issued_count'    => $issuedCount,
                        'issued_amount'   => $issuedAmount,
                        'received_count'  => $recCount,
                        'received_amount' => $recAmount,
                    ];
                })(),
                'cheque.stopped_total' => [
                    'count'  => ChequeLeaf::where('tenant_id', $tenantId)->where('status', ChequeLeaf::STATUS_STOPPED)->count(),
                    'amount' => (float) ChequeLeaf::where('tenant_id', $tenantId)->where('status', ChequeLeaf::STATUS_STOPPED)->sum('amount'),
                ],
                'cheque.post_dated_due' => (function () use ($tenantId, $today, $inSevenDays) {
                    $outQ = ChequeLeaf::where('tenant_id', $tenantId)
                        ->whereIn('status', [ChequeLeaf::STATUS_ISSUED, ChequeLeaf::STATUS_RESERVED])
                        ->where('cheque_date', '>=', $today)
                        ->where('cheque_date', '<=', $inSevenDays);
                    $outCount = $outQ->count();
                    $outAmount = (float) $outQ->sum('amount');

                    $inQ = ReceivedCheque::where('tenant_id', $tenantId)
                        ->whereIn('status', [ReceivedCheque::STATUS_RECEIVED, ReceivedCheque::STATUS_DEPOSITED])
                        ->where('cheque_date', '>=', $today)
                        ->where('cheque_date', '<=', $inSevenDays);
                    $inCount = $inQ->count();
                    $inAmount = (float) $inQ->sum('amount');

                    return [
                        'count'           => $outCount + $inCount,
                        'amount'          => $outAmount + $inAmount,
                        'outgoing_count'  => $outCount,
                        'outgoing_amount' => $outAmount,
                        'incoming_count'  => $inCount,
                        'incoming_amount' => $inAmount,
                    ];
                })(),
                default => 0,
            };
        }

        return $out;
    }
}
