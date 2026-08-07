<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ExpenseController extends Controller
{
    public function __construct(private AccountingService $accounting) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'description'    => ['required', 'string', 'max:500'],
            'expense_date'   => ['required', 'date', 'before_or_equal:today'],
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,bank'],
            'input_tax'      => ['nullable', 'numeric', 'min:0'],
        ]);

        $amount      = (float) $validated['amount'];
        $inputTax    = (float) ($validated['input_tax'] ?? 0);
        $totalPaid   = round($amount + $inputTax, 2);
        $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

        $lines = [
            ['account_code' => '6000',       'debit'  => $amount,    'credit' => 0],
            ['account_code' => $cashAccount, 'debit'  => 0,          'credit' => $totalPaid],
        ];

        if ($inputTax > 0) {
            $lines[] = ['account_code' => '2300', 'debit' => $inputTax, 'credit' => 0];
        }

        $this->accounting->createEntry([
            'date'     => $validated['expense_date'],
            'reference_type' => 'operating_expense',
            'reference'   => Str::uuid()->toString(),
            'description'    => "Expense — {$validated['description']}",
        ], $lines);

        return redirect()->back()->with('success', 'Expense posted.');
    }
}
