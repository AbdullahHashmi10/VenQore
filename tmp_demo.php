<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$demoTenant = \App\Models\Tenant::withTrashed()->where('is_demo', true)->orWhere('slug', 'demo')->first();
if ($demoTenant) {
    if ($demoTenant->trashed()) {
        $demoTenant->restore();
        echo "Restored demo store." . PHP_EOL;
    }
} else {
    $demoTenant = \App\Models\Tenant::create([
        'name' => 'VenQore Demo Store',
        'slug' => 'demo',
        'status' => 'active',
        'plan' => 'business',
        'is_demo' => true
    ]);
    echo "Created demo store." . PHP_EOL;
}
