<?php

/**
 * FIFO deduction worker — spawned in parallel by FifoConcurrencyRaceTest.
 *
 * Boots the Laravel app, binds the tenant context, then attempts ONE stock deduction
 * through the PRODUCTION FifoService::deductStock() — the single writer that locks the
 * batches with SELECT ... FOR UPDATE. Prints "OK" on a successful deduction, "FAIL" if
 * there was insufficient stock (correctly refused) or a lock/serialization error. The
 * parent counts the OKs and asserts the total never oversells.
 *
 * The tenant's `stop_sale_negative_stock` setting is forced ON for this process (the
 * Golden tenant allows negative stock, which would legitimately turn every shortfall into
 * a negative_stock batch); the race under test is the lock, not the setting lookup.
 *
 * Usage: php fifo_deduct_worker.php <tenantId> <productId> <warehouseId> <qty>
 */

$root = dirname(__DIR__, 4); // tests/tests/Support/concurrency → project root
require $root . '/vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require $root . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

[$script, $tenantId, $productId, $warehouseId, $qty] = array_pad($argv, 5, null);
$qty = (float) $qty;

use Illuminate\Support\Facades\Cache;

try {
    $tenant = \App\Models\Tenant::query()->findOrFail($tenantId);
    app()->instance('current.tenant', $tenant);

    // Force "stop sale on negative stock" for this worker only (per-process array cache).
    $settings = \App\Models\Setting::withoutGlobalScopes()
        ->where('tenant_id', $tenant->id)
        ->pluck('value', 'key')
        ->toArray();
    $settings['stop_sale_negative_stock'] = '1';
    Cache::put("settings:{$tenant->id}", $settings, 300);

    $deductions = app(\App\Services\V3\FifoService::class)
        ->deductStock($productId, $warehouseId, $qty, 'PCS');

    $taken = array_sum(array_column($deductions, 'qty_taken'));
    echo abs($taken - $qty) < 0.0001 ? 'OK' : 'FAIL';
} catch (\App\Exceptions\InsufficientStockException $e) {
    echo 'FAIL'; // insufficient stock — correctly refused
} catch (\Throwable $e) {
    // A serialization/deadlock failure that exhausted retries counts as FAIL (refused),
    // never as a silent oversell. The reason goes to stderr for the parent's diagnostics.
    fwrite(STDERR, get_class($e) . ': ' . $e->getMessage());
    echo 'FAIL';
}
