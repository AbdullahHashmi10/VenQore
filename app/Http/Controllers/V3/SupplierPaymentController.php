<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StoreSupplierPaymentRequest;
use App\Engines\AccountingService;
use App\Engines\PaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SupplierPaymentController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private PaymentService    $payments
    ) {}

    public function store(StoreSupplierPaymentRequest $request)
    {
        $validated = $request->validated();

        try {
            DB::transaction(function () use ($validated) {

                $paymentAccount = '1000'; // Cash
                if ($validated['payment_method'] === 'bank') {
                    $paymentAccount = '1010'; // Default Bank
                    if (!empty($validated['bank_account_id'])) {
                        $ba = \App\Models\BankAccount::find($validated['bank_account_id']);
                        if ($ba && $ba->account_id) {
                            $acc = \App\Models\Account::find($ba->account_id);
                            if ($acc) {
                                $paymentAccount = $acc->code;
                            }
                        }
                    }
                }

                // B5 Journal:
                // DR 2000 Accounts Payable  (liability reduces)
                // CR 1000/1010 Cash or Bank (asset reduces)
                $journalEntry = $this->accounting->createEntry([
                    'date'     => $validated['payment_date'],
                    'reference_type' => 'supplier_payment',
                    'reference'   => Str::uuid()->toString(),
                    'description'    => 'Supplier payment — ' . ($validated['reference'] ?? ''),
                    'party_id'       => $validated['supplier_id'],
                ], [
                    [
                        'account_code' => '2000',
                        'debit'        => $validated['amount'],
                        'credit'       => 0,
                        'party_id'     => $validated['supplier_id'],
                    ],
                    [
                        'account_code' => $paymentAccount,
                        'debit'        => 0,
                        'credit'       => $validated['amount'],
                    ],
                ]);

                // Allocate payment to purchase invoices
                $allocations = array_map(fn($a) => [
                    'purchase_id' => $a['purchase_id'],
                    'amount'      => $a['amount'],
                ], $validated['allocations']);

                $this->payments->allocate($journalEntry->id, $allocations);

                // Update payment_status badge on each allocated purchase
                foreach ($validated['allocations'] as $alloc) {
                    $this->updatePurchaseBadge($alloc['purchase_id']);
                }
            });
        } catch (\App\Exceptions\OverAllocationException $e) {
            if (request()->expectsJson() || request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'errors'  => ['allocations' => [$e->getMessage()]],
                    'message' => $e->getMessage()
                ], 422);
            }
            return redirect()->back()->withErrors([
                'allocations' => $e->getMessage(),
            ]);
        }

        return redirect()->back()->with('success', 'Supplier payment posted.');
    }

    private function updatePurchaseBadge(string $purchaseId): void
    {
        $this->payments->updatePurchaseBadge($purchaseId);
    }
}

