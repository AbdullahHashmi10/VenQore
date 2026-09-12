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
 * MySQL/MariaDB-only (InnoDB row locks; Laravel reports MariaDB as its own `mariadb`
 * driver, which is what production and this suite use) and requires the app to be bootable by a worker script. If the worker or a
 * real DB is unavailable (e.g. the CI sandbox without a live server), it SKIPS with a
 * clear message rather than passing vacuously — an honest skip, not a false green.
 */
class FifoConcurrencyRaceTest extends VenQoreTestCase implements \Tests\Support\RequiresGoldenCompany
{
    /** @test */
    public function concurrent_deductions_never_oversell_a_batch(): void
    {
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            $this->markTestSkipped('Concurrency race test is MySQL/MariaDB-only (row locks).');
        }

        // tests/tests/Feature/Guardrails → tests/tests/Support/concurrency
        $worker = dirname(__DIR__, 2) . '/Support/concurrency/fifo_deduct_worker.php';
        if (! is_file($worker)) {
            $this->markTestSkipped('FIFO worker script missing.');
        }

        // Arrange: a FRESH product with EXACTLY 10 units in one batch, in a fresh warehouse —
        // so no pre-existing (Golden) batch can absorb a deduction and mask an oversell.
        $tenant = \App\Models\Tenant::query()->firstOrFail();
        [$productId, $warehouseId, $batchId] = $this->seedLimitedBatch($tenant, availableQty: 10);

        // Workers are separate OS processes that boot the app from .env. Point them at
        // exactly the database THIS test is connected to (not whatever .env names).
        $conn     = DB::connection();
        $workerEnv = [
            'APP_ENV'       => 'testing',
            'DB_CONNECTION' => $conn->getName(),
            'DB_HOST'       => (string) $conn->getConfig('host'),
            'DB_PORT'       => (string) $conn->getConfig('port'),
            'DB_DATABASE'   => $conn->getDatabaseName(),
            'DB_USERNAME'   => (string) $conn->getConfig('username'),
            'DB_PASSWORD'   => (string) $conn->getConfig('password'),
            // Per-process cache: never share (or pollute) a real cache store with the app.
            'CACHE_STORE'   => 'array',
        ];

        // Commit parent's transaction so external sessions/workers can see the seeded batch.
        DB::commit();

        $successes = 0;
        $outputs   = [];
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
                ], base_path(), $workerEnv, null, 120);
                $p->start();
                $procs[] = $p;
            }
            foreach ($procs as $p) {
                $p->wait();
                $out = trim($p->getOutput());
                $outputs[] = $out . ($p->getErrorOutput() !== '' ? ' | ' . trim($p->getErrorOutput()) : '');
                if ($out === 'OK') {
                    $successes++;
                }
            }

            // Read the outcome BEFORE cleanup deletes the batch.
            $remaining = (float) DB::table('inventory_batches')->where('id', $batchId)->value('remaining_qty');
        } finally {
            // The fixture was committed: remove it (every batch of the throwaway product, in
            // case a worker ever created a negative_stock batch), then restart the per-test
            // transaction for VenQoreTestCase cleanup.
            DB::table('inventory_batches')->where('product_id', $productId)->delete();
            DB::table('products')->where('id', $productId)->delete();
            DB::table('warehouses')->where('id', $warehouseId)->delete();
            $this->beginDatabaseTransaction();
        }

        // Every worker must have actually run and answered OK/FAIL — a worker that could not
        // boot (wrong DB, fatal error) must not masquerade as a "correctly refused" deduction.
        foreach ($outputs as $i => $out) {
            $this->assertMatchesRegularExpression('/^(OK|FAIL)$/', explode(' | ', $out)[0], "Worker #{$i} misbehaved: {$out}");
        }

        // Assert: at most 10 succeeded, and remaining stock is exactly 10 - successes,
        // and never negative. A lost update would let >10 succeed or leave remaining < 0.
        $this->assertLessThanOrEqual(10, $successes, "Oversell: {$successes} deductions succeeded against 10 units.");
        $this->assertGreaterThanOrEqual(0, $remaining, "remaining_qty went negative ({$remaining}) — lost update under concurrency.");
        $this->assertEqualsWithDelta(
            10 - $successes,
            $remaining,
            0.0001,
            "Non-serializable outcome: remaining_qty ({$remaining}) != 10 - successes (" . (10 - $successes) . ')'
        );

        // And the lock must not starve legitimate sales: 20 workers x 1 unit against 10
        // units serializes to exactly 10 successes (the rest refused for insufficient stock).
        $this->assertSame(10, $successes, 'Expected exactly 10 of 20 workers to deduct 1 unit each; outputs: ' . implode(', ', $outputs));
    }

    /**
     * @return array{0:string,1:string,2:string} [productId, warehouseId, batchId]
     */
    private function seedLimitedBatch(\App\Models\Tenant $tenant, int $availableQty): array
    {
        // Minimal, self-contained fixture: a throwaway product + warehouse owned by the tenant,
        // so the ONLY stock the workers can reach is the batch seeded here.
        $productId   = \Illuminate\Support\Str::uuid()->toString();
        $warehouseId = \Illuminate\Support\Str::uuid()->toString();
        $batchId     = \Illuminate\Support\Str::uuid()->toString();

        DB::table('products')->insert([
            'id'         => $productId,
            'tenant_id'  => $tenant->id,
            'name'       => 'Race Fixture Product',
            'sku'        => 'RACE-' . \Illuminate\Support\Str::random(8),
            'base_unit'  => 'PCS',
            'cost_price' => 100.00,
            'price'      => 150.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('warehouses')->insert([
            'id'         => $warehouseId,
            'tenant_id'  => $tenant->id,
            'name'       => 'Race Fixture Warehouse',
            'is_default' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('inventory_batches')->insert([
            'id'            => $batchId,
            'tenant_id'     => $tenant->id,
            'product_id'    => $productId,
            'warehouse_id'  => $warehouseId,
            'batch_type'    => 'purchase',
            'initial_qty'   => $availableQty,
            'remaining_qty' => $availableQty,
            'unit_cost'     => 100.00,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        return [$productId, $warehouseId, $batchId];
    }
}
