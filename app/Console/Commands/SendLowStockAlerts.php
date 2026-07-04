<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\Product;
use App\Mail\LowStockAlertMail;
use Illuminate\Support\Facades\Mail;

class SendLowStockAlerts extends Command
{
    protected $signature = 'inventory:send-low-stock-alerts {--tenant= : Run for a specific tenant ID only}';
    protected $description = 'Checks stock levels against the global or per-product threshold and sends email notifications if enabled.';

    public function handle()
    {
        $this->info("Checking low stock levels...");

        $tenantQuery = Tenant::whereIn('status', ['active', 'trial']);

        if ($this->option('tenant')) {
            $tenantQuery->where('id', $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();

        foreach ($tenants as $tenant) {
            $this->info("🏪 Checking Tenant [{$tenant->id}] — {$tenant->name}");

            // Bind tenant context
            app()->instance('current.tenant', $tenant);
            \App\Helpers\SettingsHelper::clearCache();

            if (!\App\Helpers\SettingsHelper::isEnabled('low_stock_alerts')) {
                $this->line("   Skipped: 'low_stock_alerts' is disabled.");
                continue;
            }

            $globalThreshold = (float) \App\Helpers\SettingsHelper::get('low_stock_threshold', 10);
            $email = $tenant->ownerEmail();

            if (!$email) {
                $this->error("   ❌ Error: No owner email found for tenant [{$tenant->id}]");
                continue;
            }

            // Get all products and calculate their total stock
            $products = Product::where('tenant_id', $tenant->id)->get();
            $lowStockItems = [];

            foreach ($products as $product) {
                $totalStock = (float) $product->stocks()->sum('quantity');
                $threshold = $product->min_stock_alert !== null ? (float)$product->min_stock_alert : $globalThreshold;

                if ($totalStock <= $threshold) {
                    $lowStockItems[] = [
                        'name' => $product->name,
                        'sku' => $product->sku ?? $product->code ?? 'N/A',
                        'current_stock' => $totalStock,
                        'threshold' => $threshold,
                    ];
                }
            }

            if (count($lowStockItems) > 0) {
                try {
                    Mail::to($email)->send(new LowStockAlertMail($tenant, $lowStockItems));
                    $this->line("   ✅ Low stock alert email sent to: {$email} (" . count($lowStockItems) . " items)");
                } catch (\Exception $e) {
                    $this->error("   ❌ Error sending email: " . $e->getMessage());
                }
            } else {
                $this->line("   All items are above threshold.");
            }
        }

        $this->info("Low stock check completed.");
        return 0;
    }
}
