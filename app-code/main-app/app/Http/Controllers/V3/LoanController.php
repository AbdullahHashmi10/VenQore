<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LoanController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function drawdown(Request $request)
    {
        $validated = $request->validate([
            'description'    => ['required', 'string', 'max:500'],
            'drawdown_date'  => ['required', 'date', 'before_or_equal:today'],
            'principal'      => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,bank'],
        ]);

        $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

        $this->accounting->createEntry([
            'date'     => $validated['drawdown_date'],
            'reference_type' => 'loan_drawdown',
            'reference'   => Str::uuid()->toString(),
            'description'    => "Loan drawdown — {$validated['description']}",
        ], [
            ['account_code' => $cashAccount, 'debit'  => $validated['principal'], 'credit' => 0],
            ['account_code' => '2500',       'debit'  => 0, 'credit' => $validated['principal']],
        ]);

        return redirect()->back()->with('success', 'Loan drawdown posted.');
    }

    public function repay(Request $request)
    {
        $validated = $request->validate([
            'description'      => ['required', 'string', 'max:500'],
            'repayment_date'   => ['required', 'date', 'before_or_equal:today'],
            'principal'        => ['required', 'numeric', 'min:0'],
            'interest'         => ['nullable', 'numeric', 'min:0'],
            'payment_method'   => ['required', 'in:cash,bank'],
        ]);

        $principal   = (float) $validated['principal'];
        $interest    = (float) ($validated['interest'] ?? 0);
        $totalPaid   = round($principal + $interest, 2);
        $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

        $journalLines = [
            ['account_code' => $cashAccount, 'debit' => 0, 'credit' => $totalPaid],
        ];

        if ($principal > 0) {
            $journalLines[] = [
                'account_code' => '2500',
                'debit'        => $principal,
                'credit'       => 0,
            ];
        }

        if ($interest > 0) {
            $journalLines[] = [
                'account_code' => '6500',
                'debit'        => $interest,
                'credit'       => 0,
            ];
        }

        $this->accounting->createEntry([
            'date'     => $validated['repayment_date'],
            'reference_type' => 'loan_repayment',
            'reference'   => Str::uuid()->toString(),
            'description'    => "Loan repayment — {$validated['description']}",
        ], $journalLines);

        return redirect()->back()->with('success', 'Loan repayment posted.');
    }
}
