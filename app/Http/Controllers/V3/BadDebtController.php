<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BadDebtController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function store(Request $request, string $saleId)
    {
        $tid = app('current.tenant')->id;
        $validated = $request->validate([
            'approved_by' => ['required', 'string', 'exists:users,id'],
            'reason'      => ['required', 'string', 'max:500'],
        ]);

        $sale = DB::table('sales')->where('tenant_id', $tid)->where('id', $saleId)->firstOrFail();

        if ($sale->payment_status === 'paid') {
            return back()->withErrors([
                'sale' => 'Cannot write off a fully paid invoice.',
            ]);
        }

        if ($sale->payment_status === 'written_off') {
            return back()->withErrors([
                'sale' => 'This invoice has already been written off.',
            ]);
        }

        // Outstanding = invoice total minus active allocations
        $allocated = (float) DB::table('payment_allocations')
            ->where('tenant_id', $tid)
            ->where('sale_id', $saleId)
            ->where('status', 'active')
            ->sum('allocated_amount');

        $outstanding = round((float) ($sale->invoice_total ?? $sale->total) - $allocated, 2);

        if ($outstanding <= 0) {
            return back()->withErrors([
                'sale' => 'No outstanding balance to write off.',
            ]);
        }

        DB::transaction(function () use ($saleId, $sale, $outstanding, $validated) {

            // B26 journal:
            // DR 6700 Bad Debt Expense = outstanding
            // CR 1200 Accounts Receivable = outstanding
            // approved_by is mandatory — manager gate
            $this->accounting->createEntry([
                'date'     => now()->toDateString(),
                'reference_type' => 'bad_debt',
                'reference'   => $saleId,
                'description'    => 'Bad debt write-off — ' .
                                    ($sale->invoice_number ?? $saleId) .
                                    ': ' . $validated['reason'],
                'party_id'       => $sale->party_id,
                'approved_by'    => $validated['approved_by'],
            ], [
                [
                    'account_code' => '6700',
                    'debit'        => $outstanding,
                    'credit'       => 0,
                ],
                [
                    'account_code' => '1200',
                    'debit'        => 0,
                    'credit'       => $outstanding,
                    'party_id'     => $sale->party_id,
                ],
            ]);

            // Mark invoice as written_off — bypasses normal badge logic
            // PaymentService::updatePaymentBadge() checks this and never overrides it
            DB::table('sales')
                ->where('tenant_id', $tid)
                ->where('id', $saleId)
                ->update([
                    'payment_status' => 'written_off',
                    'updated_at'     => now(),
                ]);
        });

        return redirect()->back()
            ->with('success', 'Bad debt written off. Invoice marked written_off.');
    }
}
