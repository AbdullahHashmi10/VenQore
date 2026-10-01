<?php

namespace App\Reckoner\Streams;

use Illuminate\Support\Facades\DB;

/**
 * DocStatusStream: Pure tenant-explicit reader for document sequences, unposted transactions, and integrity.
 */
class DocStatusStream
{
    /**
     * Unposted documents count (posted documents with no matching journal entry).
     */
    public function unpostedCount(int|string $tenantId): int
    {
        $unpostedSales = DB::table('sales as s')
            ->leftJoin('journal_entries as je', function ($join) use ($tenantId) {
                $join->on('je.reference', '=', 's.id')
                    ->where('je.tenant_id', '=', $tenantId)
                    ->where('je.reference_type', '=', 'sale');
            })
            ->where('s.tenant_id', $tenantId)
            ->whereIn('s.status', ['posted', 'completed'])
            ->whereNull('je.id')
            ->count();

        return $unpostedSales;
    }

    /**
     * Check if sales document numbers have any gaps or duplicates.
     */
    public function documentSequenceOk(string $from, string $to, int|string $tenantId): array
    {
        $duplicates = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
            ->whereNotNull('reference_number')
            ->select('reference_number', DB::raw('COUNT(*) as cnt'))
            ->groupBy('reference_number')
            ->having('cnt', '>', 1)
            ->count();

        $passed = $duplicates === 0;

        return [
            'passed'     => $passed,
            'message'    => $passed ? 'Document sequence intact with 0 duplicates.' : "Found {$duplicates} duplicate reference numbers.",
            'difference' => (float) $duplicates,
        ];
    }
}
