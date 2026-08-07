<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupplierAdvanceController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id'    => ['required', 'string', 'exists:parties,id'],
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'payment_date'   => ['required', 'date', 'before_or_equal:today'],
            'payment_method' => ['required', 'in:cash,bank'],
            'reference'      => ['nullable', 'string', 'max:100'],
        ]);

        $paymentAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

        $this->accounting->createEntry([
            'date'     => $validated['payment_date'],
            'reference_type' => 'supplier_advance',
            'reference'   => Str::uuid()->toString(),
            'description'    => 'Supplier advance payment' .
                                (isset($validated['reference']) && $validated['reference'] ? ' — ' . $validated['reference'] : ''),
            'party_id'       => $validated['supplier_id'],
        ], [
            [
                'account_code' => '1300',
                'debit'        => $validated['amount'],
                'credit'       => 0,
                'party_id'     => $validated['supplier_id'],
            ],
            [
                'account_code' => $paymentAccount,
                'debit'        => 0,
                'credit'       => $validated['amount'],
            ],
        ]);

        return redirect()->back()
            ->with('success', 'Supplier advance posted.');
    }
}
