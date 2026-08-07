<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\User;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Party;
use App\Services\V3\FifoService;
use Exception;

class ConcurrencyTest extends Command
{
    protected $signature = 'test:race {process}';
    protected $description = 'Run concurrency test';

    public function handle()
    {
        $process = $this->argument('process');
        $uniqueName = 'Race Product ' . date('Ymd');
        $warehouse = Warehouse::first();
        if (!$warehouse) {
            $warehouse = Warehouse::create(['name' => 'Main Warehouse']);
        }
        $party = Party::firstOrCreate(['name' => 'Walk-in Customer']);
        $user = User::first();
        if (!$user) {
            $user = User::factory()->create();
        }
        
        if ($process == 'setup') {
            DB::table('inventory_batches')->where('notes', 'concurrency_test')->delete();
            Product::where('name', $uniqueName)->forceDelete();
            
            $product = Product::create(['name' => $uniqueName, 'price' => 200, 'cost_price' => 50]);
            
            (new FifoService())->receiveBatch($product->id, $warehouse->id, 1, 50, null, null, 'concurrency_test');
            $this->info("Setup complete. Product ID: {$product->id}");
            return;
        }

        $product = Product::where('name', $uniqueName)->first();
        if (!$product) {
            $this->error("Setup not run.");
            return;
        }
        
        // Create actual sale to satisfy foreign key constraints
        $sale = Sale::create([
            'reference_number' => 'RACE-' . time() . '-' . $process,
            'source' => 'pos',
            'party_id' => $party->id,
            'user_id' => $user->id,
            'warehouse_id' => $warehouse->id,
            'subtotal_gross' => 200, 'total_item_discounts' => 0, 'global_discount' => 0,
            'net_sales' => 200, 'total_tax' => 0, 'shipping_charges' => 0,
            'invoice_total' => 200, 'tendered_amount' => 200, 'change_return' => 0,
            'round_off' => 0, 'status' => 'posted', 'posted_at' => now(), 'payment_status' => 'paid',
            'payment_method' => 'cash'
        ]);
        
        $saleItem = SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 1, 'unit_price' => 200, 'cost_price' => 50,
            'gross_amount' => 200, 'discount_amount' => 0, 'net_amount' => 200,
            'tax_rate' => 0, 'tax_amount' => 0, 'line_total' => 200, 'subtotal' => 200
        ]);
        
        $productId = $product->id;
        $warehouseId = $warehouse->id;
        $saleItemId = $saleItem->id;

        try {
            DB::transaction(function () use ($productId, $warehouseId, $saleItemId, $process) {
                $fifo = new FifoService();
                $this->info("Process {$process} attempting deduction on warehouse {$warehouseId}...");
                
                if ($process == 1) {
                    $fifo->deductAndRecord($saleItemId, $productId, $warehouseId, 1);
                    $this->info("Process 1 acquired lock and deducted stock. Sleeping 3s to hold lock...");
                    sleep(3);
                } else {
                    $this->info("Process 2 starting deduction...");
                    $fifo->deductAndRecord($saleItemId, $productId, $warehouseId, 1);
                }
                
                $this->info("Process {$process} transaction complete.");
            });
        } catch (Exception $e) {
            $this->error("Process {$process} failed with exception:");
            $this->error($e->getMessage());
        }
    }
}
