<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Invoice;
use App\Models\Expense;
use App\Models\Product;
use App\Mail\WeeklyBusinessSummaryMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SendWeeklyBusinessSummaries extends Command
{
    protected $signature = 'sales:send-weekly-summary {--tenant= : Run for a specific tenant ID only}';
    protected $description = 'Sends a weekly business performance digest email to store owners if enabled.';

    public function handle()
    {
        $this->info("Gathering weekly business summaries...");

        $tenantQuery = Tenant::whereIn('status', ['active', 'trial']);

        if ($this->option('tenant')) {
            $tenantQuery->where('id', $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();

        $start = Carbon::now()->subDays(7)->startOfDay();
        $end = Carbon::now()->endOfDay();

        foreach ($tenants as $tenant) {
            $this->info("🏪 Processing Tenant [{$tenant->id}] — {$tenant->name}");

            // Bind tenant context
            app()->instance('current.tenant', $tenant);
            \App\Helpers\SettingsHelper::clearCache();

            if (!\App\Helpers\SettingsHelper::isEnabled('email_notifications')) {
                $this->line("   Skipped: 'email_notifications' is disabled.");
                continue;
            }

            $email = $tenant->ownerEmail();
            if (!$email) {
                $this->error("   ❌ Error: No owner email found for tenant [{$tenant->id}]");
                continue;
            }

            try {
                // Calculate Sales metrics
                $salesQuery = Sale::posted()->whereBetween('created_at', [$start, $end]);
                $salesRevenue = (float) $salesQuery->sum('net_sales');
                $salesCount = $salesQuery->count();
                $saleIds = $salesQuery->pluck('id')->toArray();

                // Calculate COGS
                $cogs = 0.0;
                if (!empty($saleIds)) {
                    $cogs = (float) SaleItem::whereIn('sale_id', $saleIds)
                        ->sum(DB::raw('qty * cost_price'));
                }

                // Calculate Purchases
                $purchasesTotal = (float) Invoice::where('tenant_id', $tenant->id)
                    ->where('type', 'purchase')
                    ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                    ->sum('total_amount');

                // Calculate Expenses
                $expensesTotal = (float) Expense::whereBetween('date', [$start->toDateString(), $end->toDateString()])
                    ->sum('amount');

                // Net Profit Estimate
                $netProfit = $salesRevenue - $cogs - $expensesTotal;

                // Calculate Low Stock Count
                $globalThreshold = (float) \App\Helpers\SettingsHelper::get('low_stock_threshold', 10);
                $products = Product::where('tenant_id', $tenant->id)->get();
                $lowStockCount = 0;
                foreach ($products as $product) {
                    $totalStock = (float) $product->stocks()->sum('quantity');
                    $threshold = $product->min_stock_alert !== null ? (float)$product->min_stock_alert : $globalThreshold;
                    if ($totalStock <= $threshold) {
                        $lowStockCount++;
                    }
                }

                // Top Selling Product Name
                $topProduct = 'N/A';
                if (!empty($saleIds)) {
                    $topItem = SaleItem::whereIn('sale_id', $saleIds)
                        ->select('product_id', DB::raw('SUM(qty) as total_qty'))
                        ->groupBy('product_id')
                        ->orderByDesc('total_qty')
                        ->first();
                    if ($topItem) {
                        $topProductRecord = Product::find($topItem->product_id);
                        if ($topProductRecord) {
                            $topProduct = "{$topProductRecord->name} ({$topItem->total_qty} sold)";
                        }
                    }
                }

                $metrics = [
                    'sales_revenue' => $salesRevenue,
                    'sales_count'   => $salesCount,
                    'cogs'          => $cogs,
                    'purchases_total' => $purchasesTotal,
                    'expenses_total' => $expensesTotal,
                    'net_profit'    => $netProfit,
                    'low_stock_count' => $lowStockCount,
                    'top_product'   => $topProduct,
                ];

                Mail::to($email)->send(new WeeklyBusinessSummaryMail($tenant, $metrics));
                $this->line("   ✅ Weekly summary email successfully sent to: {$email}");

            } catch (\Exception $e) {
                $this->error("   ❌ Error processing weekly summary: " . $e->getMessage());
            }
        }

        $this->info("Completed weekly business summaries.");
        return 0;
    }
}
