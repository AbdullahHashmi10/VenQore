<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- ALL USER RECORDS ---\n";
$users = \Illuminate\Support\Facades\DB::table('users')->get();
foreach ($users as $u) {
    echo "ID: {$u->id} | Email: {$u->email} | Name: {$u->name} | Deleted: " . ($u->deleted_at ? 'YES' : 'NO') . "\n";
}

echo "\n--- ALL TENANT RECORDS ---\n";
$tenants = \Illuminate\Support\Facades\DB::table('tenants')->get();
foreach ($tenants as $t) {
    echo "ID: {$t->id} | Name: {$t->name} | Slug: {$t->slug} | Status: {$t->status} | Deleted: " . ($t->deleted_at ? 'YES' : 'NO') . "\n";
}
