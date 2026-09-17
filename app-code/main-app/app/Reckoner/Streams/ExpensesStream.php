<?php

namespace App\Reckoner\Streams;

use Illuminate\Support\Facades\DB;

/**
 * ExpensesStream: Pure tenant-explicit reader for expenses table.
 * Tables: expenses, expense_categories
 */
class ExpensesStream
{
    /**
     * Get operational expenses aggregates.
     */
    public function summary(string $from, string $to, int|string $tenantId): array
    {
        $query = DB::table('expenses')
            ->where('tenant_id', $tenantId)
            ->whereBetween('date', [$from, $to]);

        $count = (clone $query)->count();
        $total = (float) ((clone $query)->sum('amount') ?? 0.0);
        $unpaid = (float) (DB::table('expenses')
            ->where('tenant_id', $tenantId)
            ->whereRaw('amount > COALESCE(amount_paid, amount)')
            ->sum('amount') ?? 0.0);

        return [
            'count'  => (float) $count,
            'total'  => round($total, 2),
            'unpaid' => round($unpaid, 2),
        ];
    }

    /**
     * Expenses grouped by category.
     */
    public function byCategory(string $from, string $to, int|string $tenantId): array
    {
        $rows = DB::table('expenses as e')
            ->leftJoin('expense_categories as ec', 'e.expense_category_id', '=', 'ec.id')
            ->where('e.tenant_id', $tenantId)
            ->whereBetween('e.date', [$from, $to])
            ->selectRaw('COALESCE(ec.name, "Uncategorised") as cat_name, SUM(e.amount) as total')
            ->groupBy('cat_name')
            ->orderByDesc('total')
            ->get();

        $result = [];
        foreach ($rows as $r) {
            $result[$r->cat_name] = round((float) $r->total, 2);
        }

        return $result;
    }

    /**
     * Top largest expenses in window.
     */
    public function largest(string $from, string $to, int|string $tenantId, int $limit = 10): array
    {
        return DB::table('expenses as e')
            ->leftJoin('expense_categories as ec', 'e.expense_category_id', '=', 'ec.id')
            ->where('e.tenant_id', $tenantId)
            ->whereBetween('e.date', [$from, $to])
            ->select('e.id', 'e.date', 'e.description', 'e.reference', 'e.amount', 'ec.name as category')
            ->orderByDesc('e.amount')
            ->limit($limit)
            ->get()
            ->map(fn($item) => [
                'id'          => $item->id,
                'date'        => $item->date,
                'title'       => $item->description ?: ($item->reference ?: 'Expense'),
                'amount'      => round((float) $item->amount, 2),
                'category'    => $item->category ?: 'Uncategorised',
            ])
            ->all();
    }
}
