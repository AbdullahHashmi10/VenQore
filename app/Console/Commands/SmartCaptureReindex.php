<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\SmartCapture\ProductSearchIndexService;
use Illuminate\Console\Command;

class SmartCaptureReindex extends Command
{
    protected $signature = 'smartcapture:reindex {--tenant= : Reindex a specific tenant ID}';
    protected $description = 'Populates the product_search_index table for local fuzzy matching (T1-2)';

    public function handle(ProductSearchIndexService $indexer): int
    {
        $tenantId = $this->option('tenant');
        $query = Product::withoutGlobalScopes();

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $total = $query->count();
        $this->info("Reindexing {$total} products into product_search_index...");

        $bar = $this->output->createProgressBar($total);

        $query->chunk(200, function ($products) use ($indexer, $bar) {
            foreach ($products as $product) {
                $indexer->indexProduct($product);
                $bar->advance();
            }
        });

        $bar->finish();
        $this->info("\nReindexing complete!");

        return 0;
    }
}
