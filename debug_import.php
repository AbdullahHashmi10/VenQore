<?php
require 'vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Maatwebsite\Excel\Facades\Excel;

$filePath = storage_path('app/temp_imports/1772988045_parties_template_2026-03-08.xlsx');

if (!file_exists($filePath)) {
    echo "File not found: $filePath\n";
    exit;
}

$data = Excel::toArray(new class {}, $filePath);

echo "Total Sheets: " . count($data) . "\n";
echo "Total Rows in Sheet 1: " . count($data[0] ?? []) . "\n";
if (!empty($data[0])) {
    echo "First 20 rows:\n";
    foreach (array_slice($data[0], 0, 20) as $i => $row) {
        echo "Row $i: " . json_encode($row) . "\n";
    }
}
