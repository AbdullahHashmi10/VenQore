<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenant = \App\Models\Tenant::find(42) ?: \App\Models\Tenant::first();
echo "Tenant: " . ($tenant ? $tenant->slug : 'NOT FOUND') . PHP_EOL;

if ($tenant) {
    app()->instance('current.tenant', $tenant);
    $all = \App\Helpers\SettingsHelper::all();
    
    echo PHP_EOL . "=== Print-related settings ===" . PHP_EOL;
    $printKeys = [
        'default_print_type', 'paper_size', 'paper_orientation', 'print_theme',
        'thermal_page_size', 'thermal_show_barcode', 'thermal_show_headers',
        'print_show_delivery_charge', 'print_show_extra_charge', 'print_amount_decimal',
        'print_logo', 'print_received_amount', 'print_balance_amount',
        'thermal_use_bold', 'thermal_auto_cut'
    ];
    foreach ($printKeys as $k) {
        echo "  [$k] = " . var_export($all[$k] ?? 'NOT SET', true) . PHP_EOL;
    }

    // Test what getPrintSettings returns
    echo PHP_EOL . "=== getPrintSettings() ===" . PHP_EOL;
    $ps = \App\Helpers\SettingsHelper::getPrintSettings();
    echo "  default_print_type => " . var_export($ps['default_print_type'], true) . PHP_EOL;
    echo "  thermal_page_size => " . var_export($ps['thermal_page_size'], true) . PHP_EOL;
    echo "  thermal_show_barcode => " . var_export($ps['thermal_show_barcode'], true) . PHP_EOL;
    echo "  print_show_delivery_charge => " . var_export($ps['print_show_delivery_charge'], true) . PHP_EOL;
}
