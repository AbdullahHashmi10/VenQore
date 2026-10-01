<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenant = App\Models\Tenant::where('slug', 'apex-tech-store')->first();
echo "TENANT ID: " . $tenant->id . PHP_EOL;

$settings = App\Models\Setting::withoutGlobalScopes()->where('tenant_id', $tenant->id)->where('key', 'like', '%approval%')->get();
echo "APPROVAL SETTINGS IN DB:" . PHP_EOL;
foreach ($settings as $s) {
    echo "  " . $s->key . " => " . var_export($s->value, true) . PHP_EOL;
}

$all = \App\Helpers\SettingsHelper::all();
echo "SETTINGS FROM SETTINGSHELPER (count: " . count($all) . "):" . PHP_EOL;
foreach ($all as $k => $v) {
    if (str_contains($k, 'approval')) {
        echo "  " . $k . " => " . var_export($v, true) . PHP_EOL;
    }
}
