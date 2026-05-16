<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\PartyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerStatementController extends Controller
{
    public function __construct(
        private PartyService $parties
    ) {}

    public function show(Request $request, string $customerId)
    {
        $tid = app('current.tenant')->id;
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to'   => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $customer = DB::table('parties')->where('tenant_id', $tid)->where('id', $customerId)->firstOrFail();

        $from = $validated['from'] ?? now()->startOfYear()->toDateString();
        $to   = $validated['to']   ?? now()->toDateString();

        // All transactions for this customer in the period
        $transactions = DB::table('journal_entries as je')
            ->join('journal_items as ji', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tid)
            ->where('je.party_id', $customerId)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$from, $to])
            ->orderBy('je.date')
            ->orderBy('je.created_at')
            ->select(
                'je.id as journal_entry_id',
                'je.date as entry_date',
                'je.reference_type',
                'je.description',
                'a.code as account_code',
                'a.name as account_name',
                'ji.debit',
                'ji.credit'
            )
            ->get();

        // Current AR balance
        $arBalance = $this->parties->getBalance($customerId, '1200');

        // Outstanding invoices with aging
        $outstanding = DB::table('sales')
            ->where('tenant_id', $tid)
            ->where('party_id', $customerId)
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->orderBy('posted_at')
            ->get(['id', 'reference_number', 'posted_at',
                   'invoice_total', 'total', 'payment_status'])
            ->map(function ($sale) {
                $paid = (float) DB::table('payment_allocations')
                    ->where('sale_id', $sale->id)
                    ->where('status', 'active')
                    ->sum('allocated_amount');

                $saleTotal = $sale->invoice_total ?? $sale->total;

                $sale->paid       = $paid;
                $sale->balance    = round(
                    (float) $saleTotal - $paid, 2
                );
                $sale->days_overdue = now()
                    ->diffInDays($sale->posted_at, false) * -1;

                // Aging buckets
                $days = $sale->days_overdue;
                $sale->aging_bucket = match(true) {
                    $days <= 0   => 'current',
                    $days <= 30  => '1-30',
                    $days <= 60  => '31-60',
                    $days <= 90  => '61-90',
                    default      => '90+',
                };

                return $sale;
            });

        // Aging summary
        $aging = [
            'current' => $outstanding->where('aging_bucket', 'current')
                                     ->sum('balance'),
            '1-30'    => $outstanding->where('aging_bucket', '1-30')
                                     ->sum('balance'),
            '31-60'   => $outstanding->where('aging_bucket', '31-60')
                                     ->sum('balance'),
            '61-90'   => $outstanding->where('aging_bucket', '61-90')
                                     ->sum('balance'),
            '90+'     => $outstanding->where('aging_bucket', '90+')
                                     ->sum('balance'),
        ];

        return response()->json([
            'customer'     => $customer,
            'period_from'  => $from,
            'period_to'    => $to,
            'ar_balance'   => $arBalance,
            'outstanding'  => $outstanding,
            'aging'        => $aging,
            'transactions' => $transactions,
        ]);
    }
}
