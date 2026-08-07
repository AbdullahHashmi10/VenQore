<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BankTransferController extends Controller
{
    public function __construct(private AccountingService $accounting) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'description'     => ['required', 'string', 'max:500'],
            'transfer_date'   => ['required', 'date', 'before_or_equal:today'],
            'amount'          => ['required', 'numeric', 'min:0.01'],
            'from_account'    => ['required', 'in:1000,1010,1011'],
            'to_account'      => ['required', 'in:1000,1010,1011'],
        ]);

        if ($validated['from_account'] === $validated['to_account']) {
            return back()->withErrors([
                'to_account' => 'Source and destination accounts must differ.',
            ]);
        }

        $this->accounting->createEntry([
            'date'     => $validated['transfer_date'],
            'reference_type' => 'bank_transfer',
            'reference'   => Str::uuid()->toString(),
            'description'    => "Bank transfer — {$validated['description']}",
        ], [
            ['account_code' => $validated['to_account'],   'debit'  => $validated['amount'], 'credit' => 0],
            ['account_code' => $validated['from_account'], 'debit'  => 0, 'credit' => $validated['amount']],
        ]);

        return redirect()->back()->with('success', 'Bank transfer posted.');
    }
}
