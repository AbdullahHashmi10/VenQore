<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sale;

echo "--- STATS ---\n";
echo "Total Sales: " . Sale::count() . "\n";
echo "Total Revenue: " . number_format(Sale::sum('total'), 2) . "\n";
echo "Unique Party IDs in sales: " . Sale::distinct()->count('party_id') . "\n";
echo "Unique Customer IDs in sales: " . Sale::distinct()->count('customer_id') . "\n";

echo "\n--- SAMPLE SALES WITH PARTY NAMES ---\n";
$sales = Sale::with('party')->latest()->take(10)->get();
foreach ($sales as $s) {
    echo "ID: {$s->reference_number} | Total: {$s->total} | Party: " . ($s->party->name ?? 'N/A') . "\n";
}
