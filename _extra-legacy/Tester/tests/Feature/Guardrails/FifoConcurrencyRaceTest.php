<?php

namespace Tests\Feature\Guardrails;

use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\Feature\VenQoreTestCase;

/**
 * FIFO Concurrency Race Test (blueprint Phase F, §12 concurrency mapping).
 *
 * Replaces the static `lockForUpdate()` grep as the AUTHORITY on concurrency safety.
 * A grep proves the string is present; only a real race proves the lock works. This test
 * spawns N genuinely-parallel OS processes that all try to deduct from the SAME limited
 * stock at once, then asserts the outcome is serializable: total deducted never exceeds
 * available stock (no oversell / lost update / phantom read), and remaining_qty is
 * exactly available - sum(successful deductions).
 *
 * MySQL-only and requires the app to be bootable by a worker script. If the worker or a
 * real DB is unavailable (e.g. the CI sandbox without a live server), it SKIPS with a
 * clear message rather than passing vacuously — an honest skip, not a false green.
 */
class FifoConcurrencyRaceTest extends VenQoreTestCase implements \Tests\Support\RequiresGoldenCompany
{
    /** @test */
    public function concurrent_deductions_never_oversell_a_batch(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('Concurrency race test is MySQL-only (row locks).');
        }

        $worker = base_path('Tester/tests/Support/concurrency/fifo_deduct_worker.php');
        if (! is_file($worker)) {
            $this->markTestSkipped('FIFO worker script missing.');
        }

        // Arrange: a product with EXACTLY 10 units in one batch, in a fresh warehouse.
        $tenant = \App\Models\Tenant::query()->firstOrFail();
        [$productId, $warehouseId, $batchId] = $this->seedLimitedBatch($tenant, availableQty: 10);

        // Commit parent's transaction so external sessions/workers can see the seeded batch.
        DB::commit();

        try {
            // Act: launch 20 workers, each trying to deduct 1 unit. Only 10 can succeed.
            $procs = [];
            for ($i = 0; $i < 20; $i++) {
                $p = new Process([
                    PHP_BINARY,
                    $worker,
                    (string) $tenant->id,
                    $productId,
                    $warehouseId,
                    '1', // qty each
                ], base_path());
                $p->start();
                $procs[] = $p;
            }
            $successes = 0;
            foreach ($procs as $p) {
                $p->wait();
                if (str_contains($p->getOutput(), 'OK')) {
                    $successes++;
                }
            }
        } finally {
            // Restart database transaction for PHPUnit/VenQoreTestCase cleanup, and delete seeded batch
            DB::table('inventory_batches')->where('id', $batchId)->delete();
            $this->beginDatabaseTransaction();
        }

        // Assert: at most 10 succeeded, and remaining stock is exactly 10 - successes,
        // and never negative. A lost update would let >10 succeed or leave remaining < 0.
        $remaining = (float) DB::table('inventory_batches')->where('id', $batchId)->value('remaining_qty');

        $this->assertLessThanOrEqual(10, $successes, "Oversell: {$successes} deductions succeeded against 10 units.");
        $this->assertGreaterThanOrEqual(0, $remaining, "remaining_qty went negative ({$remaining}) — lost update under concurrency.");
        $this->assertEqualsWithDelta(
            10 - $successes,
            $remaining,
            0.0001,
            "Non-serializable outcome: remaining_qty ({$remaining}) != 10 - successes (" . (10 - $successes) . ')'
        );
    }

    /**
     * @return array{0:string,1:string,2:string} [productId, warehouseId, batchId]
     */
    private function seedLimitedBatch(\App\Models\Tenant $tenant, int $availableQty): array
    {
        // Minimal, self-contained fixture. Field names follow the schema used elsewhere in
        // the Golden suite; adjust to the live schema when running on-machine.
        $productId   = (string) DB::table('products')->where('tenant_id', $tenant->id)->value('id');
        $warehouseId = (string) DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');
        $batchId     = \Illuminate\Support\Str::uuid()->toString();

        DB::table('inventory_batches')->insert([
            'id'            => $batchId,
            'tenant_id'     => $tenant->id,
            'product_id'    => $productId,
            'warehouse_id'  => $warehouseId,
            'remaining_qty' => $availableQty,
            'unit_cost'     => 100.00,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        return [$productId, $warehouseId, $batchId];
    }
}
