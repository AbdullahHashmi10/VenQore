<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class SupplierAdvanceController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            // Only this store's suppliers (a bare exists: accepted any store's id).
            'supplier_id'    => ['required', 'string', Rule::exists('parties', 'id')->where('tenant_id', app('current.tenant')->id)],
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
