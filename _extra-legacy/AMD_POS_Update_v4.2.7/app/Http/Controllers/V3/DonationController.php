<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DonationController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private FifoService       $fifo
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'description'    => ['required', 'string', 'max:500'],
            'donation_date'  => ['required', 'date', 'before_or_equal:today'],
            'type'           => ['required', 'in:cash,inventory'],
            'amount'         => ['nullable', 'numeric', 'min:0.01'],
            'payment_method' => ['nullable', 'in:cash,bank'],
            'product_id'     => ['nullable', 'string', 'exists:products,id'],
            'warehouse_id'   => ['nullable', 'string', 'exists:warehouses,id'],
            'qty'            => ['nullable', 'numeric', 'min:0.0001'],
        ]);

        if ($validated['type'] === 'cash') {
            $request->validate([
                'amount'         => ['required', 'numeric', 'min:0.01'],
                'payment_method' => ['required', 'in:cash,bank'],
            ]);

            $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

            $this->accounting->createEntry([
                'date'     => $validated['donation_date'],
                'reference_type' => 'donation',
                'reference'   => Str::uuid()->toString(),
                'description'    => "Donation — {$validated['description']}",
            ], [
                ['account_code' => '6200',       'debit'  => $validated['amount'], 'credit' => 0],
                ['account_code' => $cashAccount, 'debit'  => 0, 'credit' => $validated['amount']],
            ]);

        } else {
            // Inventory donation — FIFO deduction
            $request->validate([
                'product_id'  => ['required'],
                'warehouse_id'=> ['required'],
                'qty'         => ['required'],
            ]);

            $deductions = $this->fifo->deductStock(
                productId:   $validated['product_id'],
                warehouseId: $validated['warehouse_id'],
                qty:         $validated['qty']
            );

            $donationCost = array_sum(array_column($deductions, 'total_cost'));

            $this->accounting->createEntry([
                'date'     => $validated['donation_date'],
                'reference_type' => 'donation',
                'reference'   => Str::uuid()->toString(),
                'description'    => "Inventory donation — {$validated['description']}",
            ], [
                ['account_code' => '6200', 'debit'  => $donationCost, 'credit' => 0],
                ['account_code' => '1100', 'debit'  => 0, 'credit' => $donationCost],
            ]);
        }

        return redirect()->back()->with('success', 'Donation posted.');
    }
}
