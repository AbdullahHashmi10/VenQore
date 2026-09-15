<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$res = \App\Services\PlanRepository::getEffectiveLimit(1, 'business', 'transactions_per_month');
var_dump('getEffectiveLimit business transactions_per_month:', $res);

$plan = \App\Models\Plan::with('limits')->where('slug', 'business')->first();
if ($plan) {
    $row = $plan->limits->where('key', 'transactions_per_month')->first();
    var_dump('plan_limits row:', $row ? $row->toArray() : 'NULL');
}
