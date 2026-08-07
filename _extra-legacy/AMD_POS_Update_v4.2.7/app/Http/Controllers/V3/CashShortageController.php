<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
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
        ]);

        // Confirm approved_by is actually a manager
        $approver = DB::table('users')->where('users.tenant_id', app('current.tenant')->id)
            ->where('id', $validated['approved_by'])
            ->first();

        if (!$approver || !in_array($approver->role, ['manager', 'admin'])) {
            return back()->withErrors([
                'approved_by' => 'Cash shortage must be approved by a manager.',
            ]);
        }

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

        return redirect()->back()->with('success', 'Cash shortage recorded.');
    }
}
