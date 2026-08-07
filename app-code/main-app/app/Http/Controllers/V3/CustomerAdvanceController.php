<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomerAdvanceController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'    => ['required', 'string', 'exists:parties,id'],
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'receipt_date'   => ['required', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', 'in:cash,bank'],
            'reference'      => ['nullable', 'string', 'max:100'],
        ]);

        $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

        // B20 — NO tax. TaxService is deliberately not called here (S-048).
        // Tax is posted at delivery (SaleService::post() step 8), not at receipt.
        $this->accounting->createEntry([
            'date'     => $validated['receipt_date'],
            'reference_type' => 'customer_advance',
            'reference'   => Str::uuid()->toString(),
            'description'    => 'Customer advance receipt' .
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
                'account_code' => '2100',
                'debit'        => 0,
                'credit'       => $validated['amount'],
                'party_id'     => $validated['customer_id'],
            ],
        ]);

        return redirect()->back()
            ->with('success', 'Customer advance posted.');
    }
}
