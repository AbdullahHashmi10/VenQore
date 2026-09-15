<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BankTransferController extends Controller
{
    private const ACCOUNT_NAMES = [
        '1000' => 'Cash in Hand',
        '1010' => 'Bank Account',
        '1011' => 'Bank Account — Other',
    ];

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

        // 1011 ("Bank Account — Other") is an allowed leg but is not part of a
        // new store's default chart — make sure both legs exist before posting,
        // and post atomically (AccountingService::createEntry() does not open
        // its own transaction).
        DB::transaction(function () use ($validated) {
            foreach ([$validated['from_account'], $validated['to_account']] as $code) {
                $this->accounting->getAccountByCode($code, self::ACCOUNT_NAMES[$code], 'asset');
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
        });

        return redirect()->back()->with('success', 'Bank transfer posted.');
    }
}
