<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AssetController extends Controller
{
    public function __construct(
        private AccountingService $accounting
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'description'    => ['required', 'string', 'max:500'],
            'purchase_date'  => ['required', 'date', 'before_or_equal:today'],
            'amount'         => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,bank'],
        ]);

        $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';
        $assetId     = Str::uuid()->toString();

        $this->accounting->createEntry([
            'date'     => $validated['purchase_date'],
            'reference_type' => 'asset_purchase',
            'reference'   => $assetId,
            'description'    => "Asset purchase — {$validated['description']}",
        ], [
            ['account_code' => '1500',        'debit'  => $validated['amount'], 'credit' => 0],
            ['account_code' => $cashAccount,  'debit'  => 0, 'credit' => $validated['amount']],
        ]);

        return redirect()->back()->with('success', 'Fixed asset purchase posted.');
    }
}
