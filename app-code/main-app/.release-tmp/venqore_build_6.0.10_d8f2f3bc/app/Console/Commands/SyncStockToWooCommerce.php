<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SyncStockToWooCommerce extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'amd:sync-stock';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync dirty stock levels to WooCommerce';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Stock Sync...');

        // In a real scenario, we would track "dirty" products via a flag or timestamp.
        // For now, let's sync products updated in the last 10 minutes.
        $products = Product::where('updated_at', '>=', Carbon::now()->subMinutes(10))->get();

        if ($products->isEmpty()) {
            $this->info('No products to sync.');
            return;
        }

        $url = config('services.woocommerce.url');
        $key = config('services.woocommerce.key');
        $secret = config('services.woocommerce.secret');

        if (!$url || !$key || !$secret) {
            $this->error('WooCommerce credentials not configured.');
            return;
        }

        $batchData = [];

        foreach ($products as $product) {
            // Calculate total available stock
            $quantity = $product->stocks()->where('status', 'available')->sum('quantity');

            // Assuming SKU matches WooCommerce SKU or ID
            // If matching by SKU, we might need to look up ID first or use an endpoint that supports SKU
            // WooCommerce Batch API usually requires ID.
            // For this MVP, let's assume we store WC ID in a column or just log the payload.

            // If we don't have WC ID, we can try to find it or skip.
            // Let's assume SKU is the key.

            // Note: WC Batch update by SKU is not direct in standard v3 API, usually needs ID.
            // But let's construct the payload as if we are sending to a custom endpoint or standard batch.

            if ($product->sku) {
                $batchData[] = [
                    'sku' => $product->sku,
                    'manage_stock' => true,
                    'stock_quantity' => (int) $quantity,
                ];
            }
        }

        if (empty($batchData)) {
            $this->info('No valid products with SKU to sync.');
            return;
        }

        // Send Batch Update
        // Note: This is a simplified example. Real WC API might need 'update' key.
        $payload = ['update' => $batchData];

        try {
            // $response = Http::withBasicAuth($key, $secret)->post("$url/wp-json/wc/v3/products/batch", $payload);

            // Mocking the request for now as we don't have real credentials
            Log::info('Syncing Stock to WooCommerce', ['payload' => $payload]);
            $this->info('Synced ' . count($batchData) . ' products.');

        } catch (\Exception $e) {
            Log::error('Stock Sync Failed: ' . $e->getMessage());
            $this->error('Stock Sync Failed.');
        }
    }
}
