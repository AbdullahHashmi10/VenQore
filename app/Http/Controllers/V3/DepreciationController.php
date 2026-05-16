<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DepreciationController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'description'       => ['required', 'string', 'max:500'],
            'depreciation_date' => ['required', 'date', 'before_or_equal:today'],
            'amount'            => ['required', 'numeric', 'min:0.01'],
        ]);

        $this->accounting->createEntry([
            'date'     => $validated['depreciation_date'],
            'reference_type' => 'depreciation',
            'reference'   => Str::uuid()->toString(),
            'description'    => "Depreciation — {$validated['description']}",
        ], [
            ['account_code' => '6600', 'debit'  => $validated['amount'], 'credit' => 0],
            ['account_code' => '1510', 'debit'  => 0, 'credit' => $validated['amount']],
        ]);

        return redirect()->back()->with('success', 'Depreciation posted.');
    }
}
