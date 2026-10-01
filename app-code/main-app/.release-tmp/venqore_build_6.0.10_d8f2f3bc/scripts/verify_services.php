<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n=== CHECK 3: Service Stub Load Validation ===\n";

try {
    $service = app(\App\Services\V3\AccountingService::class);
    echo "  AccountingService: OK\n";
    echo "\nCHECK 3: PASS\n";
} catch (\Throwable $e) {
    echo "  FAIL: " . $e->getMessage() . "\n";
    echo "\nCHECK 3: FAIL\n";
}
