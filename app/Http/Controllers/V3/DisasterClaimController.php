<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DisasterClaimController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private FifoService       $fifo
    ) {}

    /**
     * B29 Step 1 — Record inventory loss.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'description'  => ['required', 'string', 'max:1000'],
            'loss_date'    => ['required', 'date', 'before_or_equal:today'],
            'items'        => ['required', 'array', 'min:1'],
            'items.*.product_id'   => ['required', 'string', 'exists:products,id'],
            'items.*.warehouse_id' => ['required', 'string', 'exists:warehouses,id'],
            'items.*.qty'          => ['required', 'numeric', 'min:0.0001'],
        ]);

        DB::transaction(function () use ($validated) {

            $claimId    = Str::uuid()->toString();
            $lossAmount = 0.00;

            // Deduct inventory FIFO and accumulate cost
            foreach ($validated['items'] as $item) {
                $deductions = $this->fifo->deductStock(
                    productId:   $item['product_id'],
                    warehouseId: $item['warehouse_id'],
                    qty:         $item['qty']
                );
                $lossAmount += array_sum(array_column($deductions, 'total_cost'));
            }

            $journalEntry = $this->accounting->createEntry([
                'date'     => $validated['loss_date'],
                'reference_type' => 'disaster_loss',
                'reference'   => $claimId,
                'description'    => "Disaster loss — {$validated['description']}",
            ], [
                ['account_code' => '6950', 'debit'  => $lossAmount, 'credit' => 0],
                ['account_code' => '1100', 'debit'  => 0, 'credit' => $lossAmount],
            ]);

            DB::table('disaster_claims')->insert([
                'id'                      => $claimId,
                'description'             => $validated['description'],
                'loss_journal_entry_id'   => $journalEntry->id,
                'loss_amount'             => $lossAmount,
                'recovery_amount'         => 0,
                'status'                  => 'recovery_pending',
                'created_at'              => now(),
                'updated_at'              => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Disaster loss recorded.');
    }

    /**
     * B29 Step 2 — Record insurance recovery.
     */
    public function recover(Request $request, string $id)
    {
        $validated = $request->validate([
            'recovery_amount'  => ['required', 'numeric', 'min:0.01'],
            'recovery_date'    => ['required', 'date', 'before_or_equal:today'],
            'payment_method'   => ['required', 'in:cash,bank'],
        ]);

        $claim = DB::table('disaster_claims')->where('id', $id)->firstOrFail();

        if ($claim->status === 'closed') {
            return back()->withErrors([
                'claim' => 'This claim is already closed.',
            ]);
        }

        $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

        DB::transaction(function () use ($id, $claim, $validated, $cashAccount) {

            $journalEntry = $this->accounting->createEntry([
                'date'     => $validated['recovery_date'],
                'reference_type' => 'insurance_recovery',
                'reference'   => $id,
                'description'    => "Insurance recovery — {$claim->description}",
            ], [
                ['account_code' => $cashAccount, 'debit' => $validated['recovery_amount'], 'credit' => 0],
                ['account_code' => '6960',       'debit' => 0, 'credit' => $validated['recovery_amount']],
            ]);

            DB::table('disaster_claims')->where('id', $id)->update([
                'recovery_journal_entry_id' => $journalEntry->id,
                'recovery_amount'           => $validated['recovery_amount'],
                'status'                    => 'closed',
                'updated_at'                => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Insurance recovery posted.');
    }
}
