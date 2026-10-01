<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Engines\AccountingService;
use App\Engines\FifoService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
        // Products and warehouses must be this store's.
        $tenantId = app('current.tenant')->id;
        $validated = $request->validate([
            'description'  => ['required', 'string', 'max:1000'],
            'loss_date'    => ['required', 'date', 'before_or_equal:today'],
            'items'        => ['required', 'array', 'min:1'],
            'items.*.product_id'   => ['required', 'string', Rule::exists('products', 'id')->where('tenant_id', $tenantId)],
            'items.*.warehouse_id' => ['required', 'string', Rule::exists('warehouses', 'id')->where('tenant_id', $tenantId)],
            'items.*.qty'          => ['required', 'numeric', 'min:0.0001'],
        ]);

        DB::transaction(function () use ($validated) {

            $claimId    = Str::uuid()->toString();
            $lossAmount = 0.00;

            // Deduct inventory FIFO and accumulate cost
            foreach ($validated['items'] as $item) {
                $product = DB::table('products')->where('tenant_id', app('current.tenant')->id)->where('id', $item['product_id'])->first();
                if ($product && $product->type === 'service') {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'items' => ['Service products cannot have physical inventory disaster loss.']
                    ]);
                }

                $deductions = $this->fifo->deductStock(
                    productId:   $item['product_id'],
                    warehouseId: $item['warehouse_id'],
                    qty:         $item['qty']
                );
                $lossAmount += array_sum(array_column($deductions, 'total_cost'));

                // FifoService only moves the batches; the physical stock
                // (stocks / products.stock_quantity / stock_movements) must
                // follow, exactly as InventoryService::adjustStock() does —
                // otherwise destroyed goods stay on hand and sellable.
                $this->removePhysicalStock($item['product_id'], $item['warehouse_id'], (float) $item['qty'], $claimId);
            }

            // 6950 is not in a new store's default chart
            $this->accounting->getAccountByCode('6950', 'Disaster Loss', 'expense');
            $this->accounting->getAccountByCode('1100', 'Inventory Asset', 'asset');

            $journalEntry = $this->accounting->createEntry([
                'date'     => $validated['loss_date'],
                'reference_type' => 'disaster_loss',
                'reference'   => $claimId,
                'description'    => "Disaster loss — {$validated['description']}",
            ], [
                ['account_code' => '6950', 'debit'  => $lossAmount, 'credit' => 0],
                ['account_code' => '1100', 'debit'  => 0, 'credit' => $lossAmount],
            ]);

            DB::table('disaster_claims')->where('disaster_claims.tenant_id', app('current.tenant')->id)->insert([
                'id'                      => $claimId,
                // where() before insert() does not stamp tenant_id; without it
                // the claim was invisible to recover() (Step 2 404'd).
                'tenant_id'               => app('current.tenant')->id,
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

        $claim = DB::table('disaster_claims')->where('disaster_claims.tenant_id', app('current.tenant')->id)->where('id', $id)->firstOrFail();

        if ($claim->status === 'closed') {
            return back()->withErrors([
                'claim' => 'This claim is already closed.',
            ]);
        }

        $cashAccount = $validated['payment_method'] === 'bank' ? '1010' : '1000';

        DB::transaction(function () use ($id, $claim, $validated, $cashAccount) {

            // 6960 is not in a new store's default chart
            $this->accounting->getAccountByCode('6960', 'Insurance Recovery', 'income');
            $this->accounting->getAccountByCode($cashAccount, $cashAccount === '1010' ? 'Bank Account' : 'Cash in Hand', 'asset');

            $journalEntry = $this->accounting->createEntry([
                'date'     => $validated['recovery_date'],
                'reference_type' => 'insurance_recovery',
                'reference'   => $id,
                'description'    => "Insurance recovery — {$claim->description}",
            ], [
                ['account_code' => $cashAccount, 'debit' => $validated['recovery_amount'], 'credit' => 0],
                ['account_code' => '6960',       'debit' => 0, 'credit' => $validated['recovery_amount']],
            ]);

            DB::table('disaster_claims')->where('disaster_claims.tenant_id', app('current.tenant')->id)->where('id', $id)->update([
                'recovery_journal_entry_id' => $journalEntry->id,
                'recovery_amount'           => $validated['recovery_amount'],
                'status'                    => 'closed',
                'updated_at'                => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Insurance recovery posted.');
    }

    private function removePhysicalStock(string $productId, string $warehouseId, float $qty, string $claimId): void
    {
        $tenantId = app('current.tenant')->id;

        $stock = DB::table('stocks')->where('tenant_id', $tenantId)
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->first();
        if ($stock) {
            DB::table('stocks')->where('tenant_id', $tenantId)
                ->where('id', $stock->id)
                ->decrement('quantity', $qty);
        } else {
            DB::table('stocks')->insert([
                'id'           => Str::uuid()->toString(),
                'tenant_id'    => $tenantId,
                'product_id'   => $productId,
                'warehouse_id' => $warehouseId,
                'quantity'     => -$qty,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        DB::table('products')->where('tenant_id', $tenantId)
            ->where('id', $productId)
            ->decrement('stock_quantity', $qty);

        DB::table('stock_movements')->insert([
            'id'           => Str::uuid()->toString(),
            'tenant_id'    => $tenantId,
            'product_id'   => $productId,
            'warehouse_id' => $warehouseId,
            'quantity'     => -$qty,
            'type'         => 'disaster_loss',
            'reference_id' => $claimId,
            'description'  => "Disaster loss — claim {$claimId}",
            'user_id'      => auth()->id() ?? 1,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);
    }
}
