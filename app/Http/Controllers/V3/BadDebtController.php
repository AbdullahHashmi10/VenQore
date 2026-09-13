<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BadDebtController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function store(Request $request, string $saleId)
    {
        $validated = $request->validate([
            'approved_by'  => ['required', 'string', 'exists:users,id'],
            'approval_pin' => ['nullable', 'string', 'max:20'],
            'reason'       => ['required', 'string', 'max:500'],
        ]);

        // B26 "requires manager approval": approved_by must be a verified
        // manager/admin/owner of THIS store (any user id used to pass).
        $problem = \App\Support\ManagerApproval::check(
            $validated['approved_by'],
            $validated['approval_pin'] ?? null,
            app('current.tenant')->id,
            auth()->id()
        );
        if ($problem !== null) {
            return back()->withErrors(['approved_by' => $problem]);
        }

        $sale = DB::table('sales')->where('sales.tenant_id', app('current.tenant')->id)->where('id', $saleId)->firstOrFail();

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
        $allocated = (float) DB::table('allocations')->where('allocations.tenant_id', app('current.tenant')->id)
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
            // 6700 is not part of a new store's default chart — provision it
            // instead of failing with "Account code not found".
            $badDebt = $this->accounting->getAccountByCode('6700', 'Bad Debt Expense', 'expense');

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
                    'account_id'   => $badDebt->id,
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
            DB::table('sales')->where('sales.tenant_id', app('current.tenant')->id)
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
