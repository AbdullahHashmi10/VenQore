<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\TenantUser;

class FundController extends Controller
{
    public function __construct(private AccountingService $accounting) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'           => ['required', 'in:drawing,injection'],
            'description'    => ['required', 'string', 'max:500'],
            'transaction_date' => ['required', 'date', 'before_or_equal:today'],
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,bank'],
            'passcode'       => ['required', 'string', 'size:6'],
        ]);

        // Backend PIN verification
        $membership = TenantUser::where('tenant_id', app('current.tenant')->id)
            ->where('user_id', Auth::id())
            ->first();
        if (!$membership || !$membership->security_pin || !Hash::check($request->input('passcode', ''), $membership->security_pin)) {
            return redirect()->back()->with('error', 'Incorrect security PIN. Action blocked.');
        }

        $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';
        $isDrawing   = $validated['type'] === 'drawing';

        // B14 Drawing:   DR 3000 / CR 1000
        // B15 Injection: DR 1000 / CR 3000
        $lines = $isDrawing
            ? [
                ['account_code' => '3000',       'debit'  => $validated['amount'], 'credit' => 0],
                ['account_code' => $cashAccount, 'debit'  => 0, 'credit' => $validated['amount']],
              ]
            : [
                ['account_code' => $cashAccount, 'debit'  => $validated['amount'], 'credit' => 0],
                ['account_code' => '3000',       'debit'  => 0, 'credit' => $validated['amount']],
              ];

        $refType = $isDrawing ? 'owner_drawing' : 'capital_injection';

        $this->accounting->createEntry([
            'date'     => $validated['transaction_date'],
            'reference_type' => $refType,
            'reference'   => Str::uuid()->toString(),
            'description'    => ($isDrawing ? 'Owner drawing' : 'Capital injection') .
                                " — {$validated['description']}",
        ], $lines);

        return redirect()->back()->with('success',
            $isDrawing ? 'Drawing posted.' : 'Capital injection posted.'
        );
    }
}
