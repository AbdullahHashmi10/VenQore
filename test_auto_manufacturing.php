<?php

use App\Models\Product;
use App\Models\Stock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\StockMovement;
use App\Services\AutoManufacturingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    // Get the Garam Masala product
    $garamMasala = Product::where('sku', 'PRD-GM')->first();
    $pepper = Product::where('sku', 'ING-PEP')->first();
    $cumin = Product::where('sku', 'ING-CUM')->first();
    
    if (!$garamMasala) {
        echo "ERROR: Garam Masala product not found!\n";
        exit;
    }
    
    echo "=== BEFORE SALE ===\n";
    echo "Black Pepper Stock: " . Stock::where('product_id', $pepper->id)->where('warehouse_id', 1)->first()->quantity . "g\n";
    echo "Cumin Seeds Stock: " . Stock::where('product_id', $cumin->id)->where('warehouse_id', 1)->first()->quantity . "g\n";
    echo "Garam Masala Stock: " . Stock::where('product_id', $garamMasala->id)->where('warehouse_id', 1)->first()->quantity . "pkt\n";
    
    // Simulate a sale
    DB::beginTransaction();
    
    // Create Sale
    $sale = Sale::create([
        'reference_number' => 'TEST-' . time(),
        'source' => 'pos',
        'party_id' => null,
        'customer_id' => null,
        'user_id' => 1,
        'warehouse_id' => 1,
        'subtotal' => 500,
        'tax' => 0,
        'discount' => 0,
        'total' => 500,
        'tendered_amount' => 500,
        'change_return' => 0,
        'round_off' => 0,
        'status' => 'completed',
        'payment_status' => 'paid',
        'payment_method' => 'cash',
    ]);
    
    // Create SaleItem
    SaleItem::create([
        'sale_id' => $sale->id,
        'product_id' => $garamMasala->id,
        'quantity' => 1,
        'unit_price' => 500,
        'cost_price' => 0,
        'subtotal' => 500,
    ]);
    
    // Check stock and trigger auto-manufacturing (simulating SaleController logic)
    $stock = Stock::where('product_id', $garamMasala->id)
        ->where('warehouse_id', 1)
        ->first();
    
    $currentQty = $stock ? $stock->quantity : 0;
    $soldQty = 1;
    
    echo "\n=== MANUFACTURING LOGIC ===\n";
    echo "Current Garam Masala Stock: {$currentQty}\n";
    echo "Quantity Sold: {$soldQty}\n";
    
    $manufacturingNotifications = [];
    
    // AUTO-MANUFACTURING LOGIC (same as SaleController)
    if ($currentQty < $soldQty) {
        $manufacturingService = new AutoManufacturingService();
        if ($manufacturingService->hasManufacturingRules($garamMasala->id)) {
            $shortage = $soldQty - max(0, $currentQty);
            echo "Shortage detected: {$shortage} units. Triggering auto-manufacturing...\n";
            
            $result = $manufacturingService->manufactureByProductId($garamMasala->id, $shortage, $sale);
            
            if ($result['success']) {
                $manufacturingNotifications[] = $result['notification'];
                echo "Manufacturing SUCCESS: " . $result['notification'] . "\n";
                $stock->refresh();
            } else {
                echo "Manufacturing FAILED: " . ($result['notification'] ?? 'Unknown error') . "\n";
            }
        } else {
            echo "No manufacturing rules found for this product.\n";
        }
    }
    
    // Deduct stock (same as SaleController)
    if ($stock) {
        $stock->decrement('quantity', $soldQty);
    }
    
    // Log Movement
    StockMovement::create([
        'product_id' => $garamMasala->id,
        'warehouse_id' => 1,
        'type' => 'sale',
        'quantity' => -$soldQty,
        'reference_id' => $sale->reference_number,
        'description' => 'Sale #' . $sale->id,
        'user_id' => 1,
    ]);
    
    // Create Payment
    Payment::create([
        'sale_id' => $sale->id,
        'amount' => 500,
        'method' => 'cash',
    ]);
    
    DB::commit();
    
    // Refresh and show final stocks
    echo "\n=== AFTER SALE ===\n";
    echo "Black Pepper Stock: " . Stock::where('product_id', $pepper->id)->where('warehouse_id', 1)->first()->quantity . "g\n";
    echo "Cumin Seeds Stock: " . Stock::where('product_id', $cumin->id)->where('warehouse_id', 1)->first()->quantity . "g\n";
    echo "Garam Masala Stock: " . Stock::where('product_id', $garamMasala->id)->where('warehouse_id', 1)->first()->quantity . "pkt\n";
    
    echo "\n=== EXPECTED VALUES ===\n";
    echo "Black Pepper: 1000 - 10 = 990g\n";
    echo "Cumin Seeds: 1000 - 5 = 995g\n";
    echo "Garam Masala: 0 + 1 (manufactured) - 1 (sold) = 0pkt\n";
    
    echo "\n✅ TEST COMPLETE!\n";
    
} catch (\Exception $e) {
    DB::rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "File: " . $e->getFile() . "\n";
}
