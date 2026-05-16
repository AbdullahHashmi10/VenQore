<?php

namespace App\Services\V3;

use App\Exceptions\InsufficientStockException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ManufacturingService
{
    private int $tenantId;

    public function __construct(
        private AccountingService $accounting,
        private FifoService       $fifo
    ) {
        $this->tenantId = app('current.tenant')->id;
    }

    /**
     * Start a production run.
     * Posts B17 Steps 1 and 2:
     *   Step 1: DR 6400 / CR 1100 — deduct raw materials FIFO
     *   Step 2: DR 6410 / CR 1000/1010 or 2400 — record labor
     *
     * @return object The production_runs row
     */
    public function startRun(array $data): object
    {
        return DB::transaction(function () use ($data) {

            $runId = Str::uuid()->toString();

            $tid = $this->tenantId;

            // Load active BOM
            $bom = DB::table('bill_of_materials')
                ->where('tenant_id', $tid)
                ->where('id', $data['bom_id'])
                ->where('is_active', 1)
                ->firstOrFail();

            $bomItems = DB::table('bom_items')
                ->where('tenant_id', $tid)
                ->where('bom_id', $bom->id)
                ->get();

            $plannedQty  = (float) $data['planned_qty'];
            $warehouseId = $data['warehouse_id'];
            $materialCost = 0.00;

            // ── Step 1: Deduct raw materials FIFO ─────────────────────
            $materialLines = [];

            foreach ($bomItems as $bomItem) {
                if ($bomItem->is_byproduct) continue; // by-products are outputs, not inputs

                $requiredQty = round($bomItem->qty_per_unit * $plannedQty, 4);

                $deductions = $this->fifo->deductStock(
                    productId:   $bomItem->product_id,
                    warehouseId: $warehouseId,
                    qty:         $requiredQty
                );

                $lineCost = array_sum(array_column($deductions, 'total_cost'));
                $materialCost += $lineCost;

                // Store deduction detail for production_run_materials table
                foreach ($deductions as $d) {
                    DB::table('production_run_materials')->insertOrIgnore([
                        'id'                  => Str::uuid()->toString(),
                        'tenant_id'           => $tid,
                        'production_run_id'   => $runId,
                        'bom_item_id'         => $bomItem->id,
                        'inventory_batch_id'  => $d['batch_id'],
                        'qty_deducted'        => $d['qty_taken'],
                        'unit_cost'           => $d['unit_cost'],
                        'total_cost'          => $d['total_cost'],
                        'created_at'          => now(),
                    ]);
                }
            }

            // Post Step 1 journal — DR 6400 / CR 1100
            $step1Entry = $this->accounting->createEntry([
                'date'     => $data['run_date'],
                'reference_type' => 'production_start',
                'reference'   => $runId,
                'description'    => "Production start — run {$runId}",
            ], [
                ['account_code' => '6400', 'debit'  => $materialCost, 'credit' => 0],
                ['account_code' => '1100', 'debit'  => 0, 'credit'  => $materialCost],
            ]);

            // ── Step 2: Record labor ───────────────────────────────────
            $laborCost = (float) ($data['labor_cost'] ?? 0);
            $laborType = $data['labor_type'] ?? null; // 'external' or 'internal'
            $step2EntryId = null;

            if ($laborCost > 0 && $laborType) {
                $laborCreditAccount = $laborType === 'internal' ? '2400' : '1000';

                if (isset($data['labor_bank']) && $data['labor_bank']) {
                    $laborCreditAccount = '1010';
                }

                $step2Entry = $this->accounting->createEntry([
                    'date'     => $data['run_date'],
                    'reference_type' => 'production_labor',
                    'reference'   => $runId,
                    'description'    => "Production labor — run {$runId}",
                ], [
                    ['account_code' => '6410', 'debit'  => $laborCost, 'credit' => 0],
                    ['account_code' => $laborCreditAccount, 'debit' => 0, 'credit' => $laborCost],
                ]);

                $step2EntryId = $step2Entry->id;
            }

            // ── Write production_runs record ───────────────────────────
            DB::table('production_runs')->insert([
                'id'               => $runId,
                'tenant_id'        => $tid,
                'product_id'       => $bom->product_id,
                'quantity'         => $plannedQty,
                'date'             => $data['run_date'],
                'bom_id'           => $bom->id,
                'warehouse_id'     => $warehouseId,
                'planned_qty'      => $plannedQty,
                'actual_qty'       => null,
                'status'           => 'in_progress',
                'material_cost'    => $materialCost,
                'labor_cost'       => $laborCost,
                'labor_type'       => $laborType,
                'total_cost'       => $materialCost + $laborCost,
                'wip_balance'      => $materialCost + $laborCost,
                'journal_entry_id' => $step1Entry->id,
                'created_by'       => auth()->id() ?? 1,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            return DB::table('production_runs')->where('tenant_id', $tid)->where('id', $runId)->first();
        });
    }

    /**
     * Complete a production run.
     * Posts B17 Step 3:
     *   DR 1100 Inventory = total_cost (creates finished goods batch)
     *   CR 6400 Manufacturing Cost = material_cost
     *   CR 6410 Applied Labor = labor_cost
     *
     * Handles by-products per S-094:
     *   DR 1100 Inventory = byproduct_nrv (creates by-product batch)
     *   CR 6400 = byproduct_nrv (reduces main product cost)
     *
     * @return object The created inventory batch for the finished good
     */
    public function completeRun(string $runId, float $actualQty): object
    {
        return DB::transaction(function () use ($runId, $actualQty) {

            $tid = $this->tenantId;
            $run = DB::table('production_runs')
                ->where('tenant_id', $tid)
                ->where('id', $runId)
                ->where('status', 'in_progress')
                ->lockForUpdate()
                ->firstOrFail();

            $bom      = DB::table('bill_of_materials')->where('tenant_id', $tid)->where('id', $run->bom_id)->first();
            $bomItems = DB::table('bom_items')->where('tenant_id', $tid)->where('bom_id', $bom->id)->get();

            $materialCost = (float) $run->material_cost;
            $laborCost    = (float) $run->labor_cost;

            // ── Handle by-products (S-094) ────────────────────────────
            // By-products are created at NRV and their value reduces main cost
            $byproductCostReduction = 0.00;

            foreach ($bomItems->where('is_byproduct', 1) as $byproduct) {
                $byproductQty  = round($byproduct->qty_per_unit * $actualQty, 4);
                $byproductCost = round($byproduct->byproduct_nrv * $byproductQty, 2);
                $byproductCostReduction += $byproductCost;

                // Create by-product inventory batch at NRV
                $this->fifo->receiveBatch(
                    productId:   $byproduct->product_id,
                    warehouseId: $run->warehouse_id,
                    qty:         $byproductQty,
                    unitCost:    (float) $byproduct->byproduct_nrv,
                    batchType:   'manufactured',
                    productionRunId: $runId
                );
            }

            // Net cost of finished good = total cost minus by-product NRV
            $finishedGoodCost    = round(
                $materialCost + $laborCost - $byproductCostReduction, 2
            );
            $unitCostFinished    = $actualQty > 0
                ? round($finishedGoodCost / $actualQty, 4)
                : 0;

            // ── Post Step 3 journal ───────────────────────────────────
            $step3Lines = [
                // DR 1100 for finished good cost
                ['account_code' => '1100', 'debit'  => $finishedGoodCost, 'credit' => 0],
                // CR 6400 closes manufacturing cost
                ['account_code' => '6400', 'debit'  => 0, 'credit' => $materialCost],
            ];

            if ($laborCost > 0) {
                // CR 6410 closes applied labor
                $step3Lines[] = [
                    'account_code' => '6410',
                    'debit'        => 0,
                    'credit'       => $laborCost,
                ];
            }

            if ($byproductCostReduction > 0) {
                // By-product NRV reduces main product cost allocation.
                // It's already captured in $finishedGoodCost reduction above.
                // Post additional DR 1100 for by-product inventory (no extra credit needed, 
                // total DR 1100 (FG+Byproduct) equals total CR 6400+6410).
                $step3Lines[] = [
                    'account_code' => '1100',
                    'debit'        => $byproductCostReduction,
                    'credit'       => 0,
                ];
            }

            $this->accounting->createEntry([
                'date'     => now()->toDateString(),
                'reference_type' => 'production_complete',
                'reference'   => $runId,
                'description'    => "Production complete — run {$runId}",
            ], $step3Lines);

            // ── Create finished goods batch ───────────────────────────
            $fgBatch = $this->fifo->receiveBatch(
                productId:       $bom->product_id,
                warehouseId:     $run->warehouse_id,
                qty:             $actualQty,
                unitCost:        $unitCostFinished,
                batchType:       'manufactured',
                productionRunId: $runId
            );

            // ── Update production run ──────────────────────────────────
            DB::table('production_runs')->where('tenant_id', $tid)->where('id', $runId)->update([
                'actual_qty'   => $actualQty,
                'status'       => 'completed',
                'total_cost'   => $finishedGoodCost,
                'wip_balance'  => 0,
                'completed_at' => now(),
                'updated_at'   => now(),
            ]);

            return $fgBatch;
        });
    }

    /**
     * Partial reversal of a production run — S-015.
     * Can only reverse the qty that has NOT yet been sold.
     * Restores raw materials at their original FIFO cost.
     */
    public function partialReverse(string $runId, float $reverseQty): void
    {
        DB::transaction(function () use ($runId, $reverseQty) {

            $tid = $this->tenantId;
            $run = DB::table('production_runs')
                ->where('tenant_id', $tid)
                ->where('id', $runId)
                ->whereIn('status', ['completed', 'partially_reversed'])
                ->lockForUpdate()
                ->firstOrFail();

            // Verify unsold qty is sufficient
            $soldQty = $this->getSoldQty($runId);
            $availableToReverse = (float) $run->actual_qty - $soldQty;

            if ($reverseQty > $availableToReverse + 0.0001) {
                throw new \App\Exceptions\ProductionReversalException(
                    $runId, $reverseQty, $availableToReverse
                );
            }

            $reversalCostPerUnit = (float) $run->total_cost /
                max((float) $run->actual_qty, 0.0001);
            $reversalCost = round($reverseQty * $reversalCostPerUnit, 2);

            // Remove finished goods from inventory (FIFO deduction on the run's batch)
            $this->fifo->deductStock(
                productId:   DB::table('bill_of_materials')
                                ->where('tenant_id', $tid)
                                ->where('id', $run->bom_id)
                                ->value('product_id'),
                warehouseId: $run->warehouse_id,
                qty:         $reverseQty
            );

            // Reverse the cost journal
            $this->accounting->createEntry([
                'date'     => now()->toDateString(),
                'reference_type' => 'production_reversal',
                'reference'   => $runId,
                'description'    => "Partial production reversal — {$reverseQty} units",
            ], [
                ['account_code' => '6400', 'debit'  => $reversalCost, 'credit' => 0],
                ['account_code' => '1100', 'debit'  => 0, 'credit' => $reversalCost],
            ]);

            $remainingQty = (float) $run->actual_qty - $reverseQty;
            $newStatus    = $remainingQty <= 0.0001 ? 'reversed' : 'partially_reversed';

            DB::table('production_runs')->where('tenant_id', $tid)->where('id', $runId)->update([
                'actual_qty'  => $remainingQty,
                'status'      => $newStatus,
                'updated_at'  => now(),
            ]);
        });
    }

    /**
     * B30 — Set disassembly.
     * Deducts the set (parent product) at FIFO cost.
     * Creates component inventory batches at allocated cost.
     * Allocation % from disassembly_bom_items — must sum to 100%.
     */
    public function disassemble(string $productId, float $qty, string $warehouseId): void
    {
        DB::transaction(function () use ($productId, $qty, $warehouseId) {

            $tid = $this->tenantId;
            $disassemblyBom = DB::table('disassembly_boms')
                ->where('tenant_id', $tid)
                ->where('product_id', $productId)
                ->firstOrFail();

            $components = DB::table('disassembly_bom_items')
                ->where('tenant_id', $tid)
                ->where('disassembly_bom_id', $disassemblyBom->id)
                ->get();

            // Validate allocation % sums to 100
            $totalPct = $components->sum('allocation_percent');
            if (abs($totalPct - 100) > 0.01) {
                throw new \App\Exceptions\InvalidDisassemblyBomException($productId, (float) $totalPct);
            }

            // Deduct the parent set from inventory FIFO — get actual FIFO cost
            $deductions = $this->fifo->deductStock(
                productId:   $productId,
                warehouseId: $warehouseId,
                qty:         $qty
            );

            $totalSetCost = array_sum(array_column($deductions, 'total_cost'));

            // Post B30 journal — just 1100 to 1100 reclassification entries
            $journalLines = [
                // Credit the set at FIFO cost
                ['account_code' => '1100', 'debit' => 0, 'credit' => $totalSetCost],
            ];

            foreach ($components as $component) {
                $componentCost = round(
                    $totalSetCost * ($component->allocation_percent / 100), 2
                );

                // Create component batch at allocated cost
                $this->fifo->receiveBatch(
                    productId:   $component->component_product_id,
                    warehouseId: $warehouseId,
                    qty:         $qty, // same qty as the set
                    unitCost:    $componentCost / max($qty, 0.0001),
                    batchType:   'disassembly'
                );

                $journalLines[] = [
                    'account_code' => '1100',
                    'debit'        => $componentCost,
                    'credit'       => 0,
                ];
            }

            $this->accounting->createEntry([
                'date'     => now()->toDateString(),
                'reference_type' => 'disassembly',
                'reference'   => $disassemblyBom->id,
                'description'    => "Set disassembly — product {$productId}, qty {$qty}",
            ], $journalLines);
        });
    }

    // ── Private helpers ───────────────────────────────────────────────

    private function getSoldQty(string $runId): float
    {
        // Count qty from sale_item_batches that came from this run's FG batches
        $tid = $this->tenantId;
        $runBatchIds = DB::table('inventory_batches')
            ->where('tenant_id', $tid)
            ->where('production_run_id', $runId)
            ->where('batch_type', 'manufactured')
            ->pluck('id');

        return (float) DB::table('sale_item_batches')
            ->where('tenant_id', $tid)
            ->whereIn('inventory_batch_id', $runBatchIds)
            ->where('is_reversed', 0)
            ->sum('qty_deducted');
    }
}
