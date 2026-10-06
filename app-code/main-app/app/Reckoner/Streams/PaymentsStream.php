<?php

namespace App\Reckoner\Streams;

use Illuminate\Support\Facades\DB;

/**
 * PaymentsStream: Pure tenant-explicit reader for payments table.
 * Tables: payments, allocations
 */
class PaymentsStream
{
    /**
     * Receipts breakdown by payment method.
     */
    public function receiptsByMethod(string $from, string $to, int|string $tenantId): array
    {
        $rows = DB::table('payments')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('COALESCE(date, DATE(created_at))'), [$from, $to])
            ->whereIn('type', ['in', 'received'])
            ->selectRaw("COALESCE(NULLIF(method, ''), 'other') as method_name, SUM(amount) as total")
            ->groupBy('method_name')
            ->get();

        $result = [];
        foreach ($rows as $r) {
            $m = strtolower(trim((string) ($r->method_name ?: 'other')));
            $result[$m] = round((float) $r->total, 2);
        }

        return $result;
    }

    /**
     * Unallocated payment journal entries.
     */
    public function unallocated(string $asOf, int|string $tenantId): array
    {
        $entries = DB::table('journal_entries as je')
            ->where('je.tenant_id', $tenantId)
            ->where('je.is_reversed', 0)
            ->whereIn('je.reference_type', ['customer_payment', 'payment', 'receipt'])
            ->where('je.date', '<=', $asOf)
            ->get();

        $unallocatedList = [];
        foreach ($entries as $je) {
            $allocatedSum = (float) DB::table('allocations')
                ->where('tenant_id', $tenantId)
                ->where('payment_journal_entry_id', $je->id)
                ->where('status', 'active')
                ->sum('allocated_amount');

            $amount = (float) DB::table('journal_items')
                ->where('tenant_id', $tenantId)
                ->where('journal_entry_id', $je->id)
                ->max('debit');

            $diff = $amount - $allocatedSum;
            if ($diff > 0.01) {
                $unallocatedList[] = [
                    'id'               => $je->id,
                    'reference'        => $je->reference,
                    'date'             => $je->date,
                    'amount'           => round($amount, 2),
                    'unallocated_amount' => round($diff, 2),
                ];
            }
        }

        return $unallocatedList;
    }

    /**
     * The newest payments in the window, received and paid.
     */
    public function recent(string $from, string $to, int|string $tenantId, int $limit = 10): array
    {
        return DB::table('payments')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('COALESCE(date, DATE(created_at))'), [$from, $to])
            ->select('id', 'amount', 'method', 'type', DB::raw('COALESCE(date, DATE(created_at)) as day'))
            ->orderByDesc('day')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(function ($r) {
                $in = in_array((string) $r->type, ['in', 'received'], true);
                $method = ucfirst(strtolower(trim((string) ($r->method ?: 'payment'))));
                return [
                    'id'     => $r->id,
                    'date'   => $r->day,
                    'title'  => ($in ? 'Received · ' : 'Paid · ') . $method,
                    'amount' => round((float) $r->amount, 2),
                ];
            })
            ->all();
    }
}
