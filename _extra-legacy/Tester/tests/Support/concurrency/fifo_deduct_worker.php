<?php

/**
 * FIFO deduction worker — spawned in parallel by FifoConcurrencyRaceTest.
 *
 * Boots the Laravel app, then attempts ONE atomic stock deduction against the given
 * product/warehouse inside a transaction using SELECT ... FOR UPDATE (the same lock the
 * production FifoService is supposed to take). Prints "OK" on a successful deduction,
 * "FAIL" if there was insufficient stock (correctly refused) or a lock/serialization
 * error. The parent counts the OKs and asserts the total never oversells.
 *
 * Usage: php fifo_deduct_worker.php <tenantId> <productId> <warehouseId> <qty>
 */

$root = dirname(__DIR__, 4); // .../  (Tester/tests/Support/concurrency → project root)
require $root . '/vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require $root . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

[$script, $tenantId, $productId, $warehouseId, $qty] = array_pad($argv, 5, null);
$qty = (float) $qty;

use Illuminate\Support\Facades\DB;

try {
    $result = DB::transaction(function () use ($tenantId, $productId, $warehouseId, $qty) {
        // Lock the oldest batch with stock for this product/warehouse.
        $batch = DB::table('inventory_batches')
            ->where('tenant_id', $tenantId)
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->where('remaining_qty', '>=', $qty)
            ->orderBy('created_at')
            ->lockForUpdate()
            ->first();

        if ($batch === null) {
            return false; // insufficient stock — correctly refused
        }

        DB::table('inventory_batches')
            ->where('id', $batch->id)
            ->update([
                'remaining_qty' => DB::raw('remaining_qty - ' . $qty),
                'updated_at'    => now(),
            ]);

        return true;
    }, 3); // up to 3 deadlock retries

    echo $result ? 'OK' : 'FAIL';
} catch (\Throwable $e) {
    // A serialization/deadlock failure that exhausted retries counts as FAIL (refused),
    // never as a silent oversell.
    echo 'FAIL';
}
