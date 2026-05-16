<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id'         => ['required', 'string', 'exists:products,id'],
            'from_warehouse_id'  => ['required', 'string', 'exists:warehouses,id'],
            'to_warehouse_id'    => ['required', 'string', 'exists:warehouses,id',
                                    'different:from_warehouse_id'],
            'qty'                => ['required', 'numeric', 'min:0.0001'],
            'reason'             => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($validated) {
            $qty = (float) $validated['qty'];

            // Lock batches in source warehouse oldest-first (FIFO order)
            $batches = DB::table('inventory_batches')->where('inventory_batches.tenant_id', app('current.tenant')->id)
                ->where('product_id',   $validated['product_id'])
                ->where('warehouse_id', $validated['from_warehouse_id'])
                ->where('remaining_qty', '>', 0)
                ->orderBy('created_at', 'ASC')
                ->lockForUpdate()
                ->get();

            $totalAvailable = $batches->sum('remaining_qty');

            if ($totalAvailable < $qty) {
                throw new \App\Exceptions\InsufficientStockException(
                    $validated['product_id'],
                    $validated['from_warehouse_id'],
                    $qty,
                    $totalAvailable
                );
            }

            $remaining = $qty;

            foreach ($batches as $batch) {
                if ($remaining <= 0) break;

                $take = min($remaining, (float) $batch->remaining_qty);

                // Reduce source batch
                DB::table('inventory_batches')->where('inventory_batches.tenant_id', app('current.tenant')->id)
                    ->where('id', $batch->id)
                    ->decrement('remaining_qty', $take);

                // Create new batch in destination warehouse
                // unit_cost carried over exactly — never recalculated
                DB::table('inventory_batches')->where('inventory_batches.tenant_id', app('current.tenant')->id)->insert([
                    'id'            => \Illuminate\Support\Str::uuid()->toString(),
                    'product_id'    => $batch->product_id,
                    'warehouse_id'  => $validated['to_warehouse_id'],
                    'batch_type'    => 'purchase', // preserves original type logic
                    'unit_cost'     => $batch->unit_cost, // locked — never changes
                    'initial_qty'   => $take,
                    'remaining_qty' => $take,
                    'purchase_id'   => $batch->purchase_id ?? null,
                    'notes'         => 'Transferred from warehouse ' .
                                      $validated['from_warehouse_id'] .
                                      (isset($validated['reason']) && $validated['reason'] ? ': ' . $validated['reason'] : ''),
                    'created_at'    => $batch->created_at, // preserve FIFO order
                    'updated_at'    => now(),
                ]);

                $remaining -= $take;
            }
        });

        return redirect()->back()
            ->with('success', 'Stock transferred successfully.');
    }
}
