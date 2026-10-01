<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use App\Engines\FifoService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DonationController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private FifoService       $fifo
    ) {}

    public function store(Request $request)
    {
        // Product and warehouse must be this store's.
        $tenantId = app('current.tenant')->id;
        $validated = $request->validate([
            'description'    => ['required', 'string', 'max:500'],
            'donation_date'  => ['required', 'date', 'before_or_equal:today'],
            'type'           => ['required', 'in:cash,inventory'],
            'amount'         => ['nullable', 'numeric', 'min:0.01'],
            'payment_method' => ['nullable', 'in:cash,bank'],
            'product_id'     => ['nullable', 'string', Rule::exists('products', 'id')->where('tenant_id', $tenantId)],
            'warehouse_id'   => ['nullable', 'string', Rule::exists('warehouses', 'id')->where('tenant_id', $tenantId)],
            'qty'            => ['nullable', 'numeric', 'min:0.0001'],
        ]);

        if ($validated['type'] === 'cash') {
            $request->validate([
                'amount'         => ['required', 'numeric', 'min:0.01'],
                'payment_method' => ['required', 'in:cash,bank'],
            ]);

            $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

            // 6200 is not in a new store's default chart — provision it.
            $this->accounting->getAccountByCode('6200', 'Charity Expense', 'expense');
            $this->accounting->getAccountByCode($cashAccount, $cashAccount === '1010' ? 'Bank Account' : 'Cash in Hand', 'asset');

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

            $product = DB::table('products')->where('tenant_id', $tenantId)->where('id', $validated['product_id'])->first();
            if ($product && $product->type === 'service') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'product_id' => ['Service products cannot be donated as physical inventory.']
                ]);
            }

            // Stock deduction and its journal are one unit: previously a failed
            // posting (e.g. 6200 missing) left the stock deducted with no ledger.
            DB::transaction(function () use ($validated) {
                // 6200 is not in a new store's default chart — provision it.
                $this->accounting->getAccountByCode('6200', 'Charity Expense', 'expense');
                $this->accounting->getAccountByCode('1100', 'Inventory Asset', 'asset');

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
            });
        }

        return redirect()->back()->with('success', 'Donation posted.');
    }
}
