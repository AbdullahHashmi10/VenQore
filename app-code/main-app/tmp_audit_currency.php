<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Tenant;

echo "Tenant Currency Audit:\n";
foreach(Tenant::withTrashed()->get() as $t) {
    echo "- Slug: {$t->slug}\n";
    echo "  Currency Symbol: " . ($t->currency_symbol ?: 'NULL') . "\n";
    echo "  Hex Dump: " . bin2hex($t->currency_symbol) . "\n\n";
}
