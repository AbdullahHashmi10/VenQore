<?php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

$pid = Str::uuid()->toString(); 
DB::table('products')->insert([
    'id' => $pid, 
    'name' => 'Test Widget', 
    'sku' => 'T-001', 
    'price' => 100, 
    'cost_price' => 50, 
    'base_unit' => 'pcs', 
    'created_at' => now(), 
    'updated_at' => now()
]); 

$sid = Str::uuid()->toString(); 
DB::table('parties')->insert([
    'id' => $sid, 
    'name' => 'Test Supplier', 
    'type' => 'supplier', 
    'created_at' => now(), 
    'updated_at' => now()
]); 

$cid = Str::uuid()->toString(); 
DB::table('parties')->insert([
    'id' => $cid, 
    'name' => 'Test Customer', 
    'type' => 'customer', 
    'created_at' => now(), 
    'updated_at' => now()
]); 

echo json_encode(['product_id' => $pid, 'supplier_id' => $sid, 'customer_id' => $cid]) . PHP_EOL;
