<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\WooConnection;

$connections = WooConnection::withTrashed()->get();
echo "--- ALL CONNECTIONS IN DATABASE ---\n";
foreach ($connections as $conn) {
    echo "ID: {$conn->id}\n";
    echo "Name: {$conn->name}\n";
    echo "Tenant ID: {$conn->tenant_id}\n";
    echo "Status: {$conn->status}\n";
    echo "Deleted At: {$conn->deleted_at}\n";
    echo "-------------------\n";
}
