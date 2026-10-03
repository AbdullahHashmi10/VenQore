<?php
/**
 * Child process for ReservationConcurrencyTest: a REAL second database connection.
 * Usage: php concurrency_worker.php <scenario> <tenantId> <orderId> <productId> <warehouseId> <flagFile>
 */
require __DIR__ . '/../../../../vendor/autoload.php';
$app = require __DIR__ . '/../../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

[, $scenario, $tenantId, $orderId, $productId, $warehouseId, $flag] = $argv;
$tenant = App\Models\Tenant::findOrFail((int) $tenantId);
app()->instance('current.tenant', $tenant);
use Illuminate\Support\Facades\DB;

try {
    if ($scenario === 'confirm_holds_lock') {
        // Same locking order as OrderService::confirm, then pause so the competing sale arrives while we hold the locks.
        DB::beginTransaction();
        DB::table('inventory_batches')->where('tenant_id', $tenantId)->where('product_id', $productId)->where('warehouse_id', $warehouseId)->where('remaining_qty', '>', 0)->orderBy('created_at', 'ASC')->orderBy('seq', 'ASC')->lockForUpdate()->pluck('id');
        file_put_contents($flag, 'locked');
        sleep(2);
        app(App\Services\Commerce\OrderService::class)->confirm($orderId, (int) $tenantId, null);
        DB::commit();
        echo "CONFIRMED";
    } elseif ($scenario === 'sale') {
        while (! is_file($flag)) { usleep(20000); }
        usleep(400000);
        $d = app(App\Engines\FifoService::class)->deductStock($productId, $warehouseId, 2.0);
        echo "SOLD";
    } elseif ($scenario === 'sale_holds_lock') {
        DB::beginTransaction();
        app(App\Engines\FifoService::class)->deductStock($productId, $warehouseId, 2.0); // takes the batch locks
        file_put_contents($flag, 'locked');
        sleep(2);
        DB::commit();
        echo "SOLD";
    } elseif ($scenario === 'confirm') {
        while (! is_file($flag)) { usleep(20000); }
        usleep(400000);
        app(App\Services\Commerce\OrderService::class)->confirm($orderId, (int) $tenantId, null);
        echo "CONFIRMED";
    }
} catch (Throwable $e) {
    DB::rollBack();
    echo "BLOCKED:" . class_basename($e) . ($e instanceof Illuminate\Database\QueryException ? '[' . substr($e->getMessage(), 0, 160) . ']' : '') . ($e instanceof App\Services\Commerce\CommerceException ? ':' . $e->reason : '');
}
