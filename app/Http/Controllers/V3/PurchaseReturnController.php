<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PurchaseReturnController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private FifoService       $fifo
    ) {}

    public function create(string $purchaseId)
    {
        $purchase = DB::table('purchases')->where('purchases.tenant_id', app('current.tenant')->id)
            ->join('parties', 'purchases.party_id', '=', 'parties.id')
            ->where('purchases.id', $purchaseId)
            ->select('purchases.*', 'parties.name as supplier_name')
            ->firstOrFail();

        $items = DB::table('purchase_items')->where('purchase_items.tenant_id', app('current.tenant')->id)
            ->join('products', 'purchase_items.product_id', '=', 'products.id')
            ->join('inventory_batches',
                'purchase_items.inventory_batch_id', '=', 'inventory_batches.id')
            ->where('purchase_items.purchase_id', $purchaseId)
            ->select(
                'purchase_items.id',
                'purchase_items.product_id',
                'purchase_items.qty as original_qty',
                'purchase_items.unit_cost',
                'purchase_items.inventory_batch_id',
                'inventory_batches.remaining_qty',
                'products.name as product_name',
                'products.sku',
                'products.base_unit'
            )
            ->get();

        return Inertia::render('V3/Purchases/Return', [
            'purchase' => $purchase,
            'items'    => $items,
        ]);
    }

    public function store(Request $request, string $purchaseId)
    {
        $validated = $request->validate([
            'return_date' => ['required', 'date', 'before_or_equal:today'],
            'reason'      => ['required', 'string', 'max:500'],
            'items'       => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id'   => ['required', 'string',
                                             'exists:purchase_items,id'],
            'items.*.inventory_batch_id' => ['required', 'string',
                                             'exists:inventory_batches,id'],
            'items.*.return_qty'         => ['required', 'numeric', 'min:0.0001'],
        ]);

        $purchase = DB::table('purchases')->where('purchases.tenant_id', app('current.tenant')->id)->where('id', $purchaseId)->firstOrFail();

        DB::transaction(function () use ($validated, $purchase, $purchaseId) {

            $totalReturnCost = 0.00;
            $journalLines    = [];

            foreach ($validated['items'] as $item) {
                $batch = DB::table('inventory_batches')->where('inventory_batches.tenant_id', app('current.tenant')->id)
                    ->where('id', $item['inventory_batch_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $returnQty = (float) $item['return_qty'];

                // Validate return qty does not exceed remaining
                if ($returnQty > (float) $batch->remaining_qty) {
                    throw new \InvalidArgumentException(
                        "Return qty {$returnQty} exceeds remaining batch qty " .
                        "{$batch->remaining_qty} for batch {$batch->id}. " .
                        "Cannot return stock that has already been sold."
                    );
                }

                // Use original batch unit_cost — never recalculate
                $lineCost         = round($returnQty * (float) $batch->unit_cost, 2);
                $totalReturnCost += $lineCost;

                // Deduct from inventory batch
                DB::table('inventory_batches')->where('inventory_batches.tenant_id', app('current.tenant')->id)
                    ->where('id', $batch->id)
                    ->decrement('remaining_qty', $returnQty);
            }

            // B18 Journal:
            // DR 2000 Accounts Payable (supplier owes us back)
            // CR 1100 Inventory Asset  (stock leaves)
            $journalLines = [
                [
                    'account_code' => '2000',
                    'debit'        => $totalReturnCost,
                    'credit'       => 0,
                    'party_id'     => $purchase->party_id,
                ],
                [
                    'account_code' => '1100',
                    'debit'        => 0,
                    'credit'       => $totalReturnCost,
                ],
            ];

            $returnId = Str::uuid()->toString();

            $journalEntry = $this->accounting->createEntry([
                'date'     => $validated['return_date'],
                'reference_type' => 'purchase_return',
                'reference'   => $returnId,
                'description'    => "Purchase return — {$purchase->invoice_number}: {$validated['reason']}",
                'party_id'       => $purchase->party_id,
            ], $journalLines);

            // Record the return for audit trail
            DB::table('purchase_returns')->where('purchase_returns.tenant_id', app('current.tenant')->id)->insert([
                'id'               => $returnId,
                'purchase_id'      => $purchaseId,
                'return_date'      => $validated['return_date'],
                'reason'           => $validated['reason'],
                'total_amount'     => $totalReturnCost,
                'journal_entry_id' => $journalEntry->id,
                'created_by'       => auth()->id() ?? 1,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
        });

        return redirect()
            ->route('v3.purchases.show', $purchaseId)
            ->with('success', 'Purchase return posted successfully.');
    }
}
