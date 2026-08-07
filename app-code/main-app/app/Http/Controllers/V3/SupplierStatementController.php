<?php

namespace App\Http\Controllers\V3;

use App\Models\Party;
use App\Http\Controllers\Controller;
use App\Services\V3\PartyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierStatementController extends Controller
{
    public function __construct(
        private PartyService $parties
    ) {}

    public function show(Request $request, string $supplierId)
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to'   => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $tenantId = app('current.tenant')->id;
        $supplier = Party::findOrFail($supplierId);

        $from = $validated['from'] ?? now()->startOfYear()->toDateString();
        $to   = $validated['to']   ?? now()->toDateString();

        // All journal lines touching this supplier
        $transactions = DB::table('journal_entries as je')->where('je.tenant_id', app('current.tenant')->id)
            ->join('journal_items as ji', 'je.id', '=', 'ji.journal_entry_id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->where('je.party_id', $supplierId)
            ->where('je.is_reversed', 0)
            ->whereBetween('je.date', [$from, $to])
            ->orderBy('je.date')
            ->orderBy('je.created_at')
            ->select(
                'je.id',
                'je.date as date',
                'je.reference',
                'je.description',
                'je.source_type',
                'a.name as account_name',
                'ji.debit',
                'ji.credit'
            )
            ->get();

        // Current AP balance from snapshot
        $apBalance = $this->parties->getBalance($supplierId, '2000');

        // Current advance balance
        $advanceBalance = $this->parties->getBalance($supplierId, '1300');

        // Outstanding purchases
        $outstanding = DB::table('purchases')->where('purchases.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->where('party_id', $supplierId)
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->orderBy('purchase_date')
            ->select('id', 'invoice_number', 'purchase_date', 'total', 'payment_status')
            ->get()
            ->map(function ($p) use ($tenantId) {
                $paid = DB::table('payment_allocations')->where('payment_allocations.tenant_id', app('current.tenant')->id)
                    ->where('tenant_id', $tenantId)
                    ->where('purchase_id', $p->id)
                    ->where('status', 'active')
                    ->sum('allocated_amount');
                $p->paid      = (float) $paid;
                $p->balance   = round((float) $p->total - (float) $paid, 2);
                return $p;
            });

        return response()->json([
            'supplier'        => $supplier,
            'period_from'     => $from,
            'period_to'       => $to,
            'ap_balance'      => $apBalance,
            'advance_balance' => $advanceBalance,
            'net_payable'     => round($apBalance - $advanceBalance, 2),
            'outstanding'     => $outstanding,
            'transactions'    => $transactions,
        ]);
    }
}
