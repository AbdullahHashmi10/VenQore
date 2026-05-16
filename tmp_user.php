<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

foreach (App\Models\TenantUser::with('tenant', 'user')->where('user_id', 5)->get() as $m) {
    echo $m->tenant->slug . ' - ' . $m->tenant->timezone . PHP_EOL;
}
