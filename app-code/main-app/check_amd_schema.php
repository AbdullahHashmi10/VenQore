<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== PURCHASES TABLE ===\n";
try {
    $results = DB::select('DESCRIBE purchases');
    foreach ($results as $r) echo "{$r->Field}\n";
} catch (\Exception $e) {
    echo "Table doesn't exist: purchases\n";
}

echo "\n=== PURCHASE_ORDERS TABLE ===\n";
try {
    $results = DB::select('DESCRIBE purchase_orders');
    foreach ($results as $r) echo "{$r->Field}\n";
} catch (\Exception $e) {
    echo "Table doesn't exist: purchase_orders\n";
}

echo "\n=== EXPENSES TABLE ===\n";
try {
    $results = DB::select('DESCRIBE expenses');
    foreach ($results as $r) echo "{$r->Field}\n";
} catch (\Exception $e) {
    echo "Table doesn't exist: expenses\n";
}

echo "\n=== TRANSACTIONS TABLE ===\n";
try {
    $results = DB::select('DESCRIBE transactions');
    foreach ($results as $r) echo "{$r->Field}\n";
} catch (\Exception $e) {
    echo "Table doesn't exist: transactions\n";
}

echo "\n=== ACCOUNTS TABLE ===\n";
try {
    $results = DB::select('DESCRIBE accounts');
    foreach ($results as $r) echo "{$r->Field}\n";
} catch (\Exception $e) {
    echo "Table doesn't exist: accounts\n";
}
