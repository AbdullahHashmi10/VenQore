<?php

require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tenants = \App\Models\Tenant::take(5)->get();
echo "ACTIVE TENANT ONBOARDING LINKS:\n";
echo "=========================================\n";
foreach ($tenants as $t) {
    echo "• " . $t->name . "\n";
    echo "  Onboarding V2: http://localhost:8000/s/" . $t->slug . "/onboarding/v2\n";
    echo "  Dashboard:     http://localhost:8000/s/" . $t->slug . "/dashboard\n\n";
}
