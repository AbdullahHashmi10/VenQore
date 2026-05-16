<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use App\Services\V3\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomerPaymentController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private PaymentService    $payments
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'    => ['required', 'string', 'exists:parties,id'],
            'payment_date'   => ['required', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', 'in:cash,bank'],
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'reference'      => ['nullable', 'string', 'max:100'],
            'allocations'    => ['required', 'array', 'min:1'],
            'allocations.*.sale_id' => ['required', 'string', 'exists:sales,id'],
            'allocations.*.amount'  => ['required', 'numeric', 'min:0.01'],
        ]);

        // Validate allocation total does not exceed payment amount
        $allocTotal = array_sum(array_column($validated['allocations'], 'amount'));
        if (round($allocTotal, 2) > round($validated['amount'], 2)) {
            return back()->withErrors([
                'allocations' => 'Total allocations (' . $allocTotal . ') exceed ' .
                                 'payment amount (' . $validated['amount'] . ').',
            ]);
        }

        DB::transaction(function () use ($validated) {

            $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

            // B4 Journal:
            // DR 1000/1010 Cash or Bank
            // CR 1200 Accounts Receivable
            $journalEntry = $this->accounting->createEntry([
                'date'     => $validated['payment_date'],
                'reference_type' => 'customer_payment',
                'reference'   => Str::uuid()->toString(),
                'description'    => 'Customer payment' .
                                    (isset($validated['reference']) && $validated['reference']
                                        ? ' — ' . $validated['reference']
                                        : ''),
                'party_id'       => $validated['customer_id'],
            ], [
                [
                    'account_code' => $cashAccount,
                    'debit'        => $validated['amount'],
                    'credit'       => 0,
                ],
                [
                    'account_code' => '1200',
                    'debit'        => 0,
                    'credit'       => $validated['amount'],
                    'party_id'     => $validated['customer_id'],
                ],
            ]);

            // Allocate to sale invoices
            $allocations = array_map(fn($a) => [
                'sale_id' => $a['sale_id'],
                'amount'  => $a['amount'],
            ], $validated['allocations']);

            $this->payments->allocate($journalEntry->id, $allocations);
        });

        return redirect()->back()->with('success', 'Customer payment posted.');
    }
}
