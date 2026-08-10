<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Http\Requests\V3\StoreSupplierPaymentRequest;
use App\Services\V3\AccountingService;
use App\Services\V3\PaymentService;
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

                $paymentAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

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

    // Badge update for purchases — reads from `invoices` (type='purchase') which is
    // where purchase records actually live. Mirrors PaymentService::updatePaymentBadge.
    private function updatePurchaseBadge(string $purchaseId): void
    {
        $tid = app('current.tenant')->id;

        // Purchases live in `invoices` table with type = 'purchase'
        $purchase = DB::table('invoices')
            ->where('tenant_id', $tid)
            ->where('id', $purchaseId)
            ->where('type', 'purchase')
            ->first();
        if (!$purchase) return;

        $allocated = (float) DB::table('payment_allocations')
            ->where('tenant_id', $tid)
            ->where('purchase_id', $purchaseId)
            ->where('status', 'active')
            ->sum('allocated_amount');

        $total     = (float) ($purchase->total_amount ?? 0);
        $tolerance = (float) (DB::table('system_settings')
            ->where('tenant_id', $tid)
            ->where('key', 'roundoff_tolerance')
            ->value('value') ?? 1.00);

        $outstanding = $total - $allocated;

        if ($allocated <= 0) {
            $status = 'unpaid';
        } elseif ($outstanding <= $tolerance) {
            $status = 'paid';
        } else {
            $status = 'partial';
        }

        DB::table('invoices')
            ->where('tenant_id', $tid)
            ->where('id', $purchaseId)
            ->update(['status' => $status, 'updated_at' => now()]);
    }
}

