<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashShortageController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount'       => ['required', 'numeric', 'min:0.01'],
            'shortage_date'=> ['required', 'date', 'before_or_equal:today'],
            'narration'    => ['required', 'string', 'min:10', 'max:1000'],
            'approved_by'  => ['required', 'string', 'exists:users,id'],
            'approval_pin' => ['nullable', 'string', 'max:20'],
        ]);

        // B28 "requires manager approval": approved_by must be a VERIFIED
        // approval — an active owner/admin/manager of THIS store, plus that
        // approver's PIN whenever they are not the logged-in user. (Naming any
        // manager's id used to be enough: a cashier could book their own till
        // shortage as "manager-approved" without the manager ever seeing it.)
        $problem = \App\Support\ManagerApproval::check(
            $validated['approved_by'],
            $validated['approval_pin'] ?? null,
            app('current.tenant')->id,
            auth()->id()
        );
        if ($problem !== null) {
            return back()->withErrors(['approved_by' => $problem]);
        }

        DB::transaction(function () use ($validated) {
            // 6900 is not in a new store's default chart
            $this->accounting->getAccountByCode('6900', 'Cash Shortage Loss', 'expense');
            $this->accounting->getAccountByCode('1000', 'Cash in Hand', 'asset');

            $this->accounting->createEntry([
                'date'     => $validated['shortage_date'],
                'reference_type' => 'cash_shortage',
                'reference'   => auth()->id() ?? 1,
                'description'    => 'Cash shortage',
                'narration'      => $validated['narration'], // mandatory per spec
                'approved_by'    => $validated['approved_by'],
            ], [
                [
                    'account_code' => '6900',
                    'debit'        => $validated['amount'],
                    'credit'       => 0,
                ],
                [
                    'account_code' => '1000',
                    'debit'        => 0,
                    'credit'       => $validated['amount'],
                ],
            ]);
        });

        return redirect()->back()->with('success', 'Cash shortage recorded.');
    }
}
