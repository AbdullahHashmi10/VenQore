<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\Party;
use App\Models\Product;
use App\Models\CustomerAnalytics;
use App\Models\AiRecommendation;
use App\Services\AiRetentionService;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RunGrowthEngine extends Command
{
    protected $signature = 'growth:analyze {--tenant= : Run for a specific tenant ID only} {--force : Force regenerate all recommendations}';
    protected $description = 'Run the Growth Engine AI to generate smart business recommendations (per tenant)';

    public function handle()
    {
        $this->info('🚀 Starting Growth Engine Analysis...');

        // 6D FIX: Run per active tenant
        $tenantQuery = Tenant::whereIn('status', ['active', 'trial']);

        if ($this->option('tenant')) {
            $tenantQuery->where('id', (int) $this->option('tenant'));
        }

        $tenants = $tenantQuery->get();

        if ($tenants->isEmpty()) {
            $this->warn('No active tenants found.');
            return 0;
        }

        foreach ($tenants as $tenant) {
            $this->info("\n🏪 Tenant [{$tenant->id}] {$tenant->name}");
            $this->processForTenant($tenant->id);
        }

        $this->info("\n✅ Growth Engine analysis completed for all tenants.");
        return 0;
    }

    private function processForTenant(int $tenantId): void
    {
        // Load AI Settings
        $settings = $this->loadSettings($tenantId);

        // Clear old recommendations if forcing
        if ($this->option('force')) {
            AiRecommendation::where('tenant_id', $tenantId)->delete();
            CustomerAnalytics::where('tenant_id', $tenantId)->delete();
            $this->info('   - Cleared existing recommendations.');
        }

        // --- Brain A: Customer Retention Engine ---
        $this->info('   🧠 Brain A: Customer Retention Engine...');
        $retentionService = resolve(AiRetentionService::class);
        $retentionCount = $retentionService->runRetentionAnalysis($tenantId);
        $this->info("   - Generated {$retentionCount} retention alerts.");

        // --- Brain B: Inventory Forecaster ---
        $this->runInventoryForecaster($tenantId, $settings);

        // --- Brain C: Churn Detector ---
        $this->runChurnDetector($tenantId);

        // --- Recovery Alerts: Overdue Invoices ---
        $this->runRecoveryAlerts($tenantId);
    }

    private function loadSettings(int $tenantId): array
    {
        // ai_settings are global config — no tenant scope needed here
        $settings = DB::table('ai_settings')->pluck('value', 'key')->toArray();

        return [
            'min_orders'      => (int) ($settings['regular_customer_min_orders'] ?? 3),
            'period_days'     => (int) ($settings['regular_customer_period_days'] ?? 60),
            'min_order_value' => (float) ($settings['min_order_value_filter'] ?? 5000),
            'lookahead_days'  => (int) ($settings['lookahead_days'] ?? 7),
        ];
    }

    private function runInventoryForecaster(int $tenantId, array $settings): void
    {
        $this->info('   📦 Brain B: Inventory Forecaster...');

        $lookahead = $settings['lookahead_days'];

        // WOUND 3 FIX: Scope CustomerAnalytics by tenant_id
        $dueCustomers = CustomerAnalytics::with(['party.invoices' => function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId)
                  ->where('type', 'sale')
                  ->latest()
                  ->take(1)
                  ->with('items.product');
            }])
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->whereNotNull('predicted_next_order')
            ->where('predicted_next_order', '<=', Carbon::now()->addDays($lookahead))
            ->get();

        $expectedDemand = [];

        foreach ($dueCustomers as $analytics) {
            $party = $analytics->party;
            if (!$party) continue;

            $lastInvoice = $party->invoices->first();
            if (!$lastInvoice) continue;

            foreach ($lastInvoice->items as $item) {
                if (!$item->product) continue;

                $productId = $item->product_id;
                if (!isset($expectedDemand[$productId])) {
                    $expectedDemand[$productId] = [
                        'product'   => $item->product,
                        'qty'       => 0,
                        'customers' => 0,
                    ];
                }
                $expectedDemand[$productId]['qty'] += $item->quantity;
                $expectedDemand[$productId]['customers']++;
            }
        }

        $created = 0;

        foreach ($expectedDemand as $productId => $demand) {
            $product = $demand['product'];

            // WOUND 3 FIX: Scope inventory_batches by tenant_id
            $currentStock = DB::table('inventory_batches')
                ->where('tenant_id', $tenantId)
                ->where('product_id', $productId)
                ->where('remaining_qty', '>', 0)
                ->whereNull('deleted_at')
                ->sum('remaining_qty');

            if ($currentStock >= $demand['qty']) continue;

            $shortfall = $demand['qty'] - $currentStock;

            // WOUND 3 FIX: Check existing alerts scoped to this tenant
            $exists = AiRecommendation::where('tenant_id', $tenantId)
                ->where('type', 'forecast')
                ->where('product_id', $productId)
                ->where('created_at', '>=', Carbon::now()->startOfDay())
                ->exists();

            if ($exists) continue;

            AiRecommendation::create([
                'tenant_id'        => $tenantId,
                'type'             => 'forecast',
                'priority'         => 'urgent',
                'product_id'       => $productId,
                'title'            => "Stock Risk: {$product->name}",
                'message'          => "You have {$currentStock} {$product->unit} but expected demand is {$demand['qty']} {$product->unit} from {$demand['customers']} customers this week. Shortfall: {$shortfall} {$product->unit}.",
                'potential_revenue'=> $shortfall * ($product->price ?? 0),
                'action_type'      => 'purchase_order',
                'action_url'       => '/purchase-orders/create', // fallback if route() fails in CLI
                'data'             => [
                    'current_stock'   => $currentStock,
                    'expected_demand' => $demand['qty'],
                    'shortfall'       => $shortfall,
                ],
                'valid_until'      => Carbon::now()->addDays(7),
            ]);

            $created++;
        }

        $this->info("   - Created {$created} stock risk alerts.");
    }

    private function runChurnDetector(int $tenantId): void
    {
        $this->info('   ⚠️ Brain C: Churn Detector...');

        // WOUND 3 FIX: Scope CustomerAnalytics by tenant_id
        $churned = CustomerAnalytics::with('party')
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['at_risk', 'churned'])
            ->get();

        $created = 0;

        foreach ($churned as $analytics) {
            $party = $analytics->party;
            if (!$party) continue;

            $daysSince = $analytics->last_order_date
                ? Carbon::parse($analytics->last_order_date)->diffInDays(Carbon::now())
                : 999;

            $missedCycles = $analytics->avg_days_between_orders
                ? floor($daysSince / $analytics->avg_days_between_orders)
                : 0;

            if ($missedCycles < 2) continue;

            // WOUND 3 FIX: Check existing alerts scoped to this tenant
            $exists = AiRecommendation::where('tenant_id', $tenantId)
                ->where('type', 'churn')
                ->where('party_id', $party->id)
                ->where('created_at', '>=', Carbon::now()->startOfWeek())
                ->exists();

            if ($exists) continue;

            $priority = $analytics->status === 'churned' ? 'urgent' : 'high';

            AiRecommendation::create([
                'tenant_id'        => $tenantId,
                'type'             => 'churn',
                'priority'         => $priority,
                'party_id'         => $party->id,
                'title'            => "Churn Risk: {$party->name}",
                'message'          => "This customer hasn't ordered in " . round($daysSince) . " days. They have missed {$missedCycles} order cycles. You are losing a regular client worth Rs. " . number_format($analytics->total_spent) . " in past orders.",
                'potential_revenue'=> $analytics->average_order_value,
                'action_type'      => 'view_invoice',
                'action_url'       => "/parties/{$party->id}",
                'data'             => [
                    'days_since_order' => $daysSince,
                    'missed_cycles'    => $missedCycles,
                    'total_spent'      => $analytics->total_spent,
                ],
                'valid_until'      => Carbon::now()->addDays(14),
            ]);

            $created++;
        }

        $this->info("   - Created {$created} churn alerts.");
    }

    private function runRecoveryAlerts(int $tenantId): void
    {
        $this->info('   💰 Recovery Alerts...');

        // WOUND 3 FIX: Scope journal queries by tenant_id
        $overdueParties = DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('accounts.code', '1200') // Accounts Receivable
            ->where('journal_entries.is_reversed', 0)
            ->whereNotNull('journal_entries.party_id')
            ->groupBy('journal_entries.party_id')
            ->havingRaw('SUM(debit) - SUM(credit) > 0')
            ->selectRaw('journal_entries.party_id, SUM(debit) - SUM(credit) as outstanding_balance')
            ->get();

        $created = 0;

        foreach ($overdueParties as $row) {
            $partyId = $row->party_id;
            $party = Party::where('tenant_id', $tenantId)->find($partyId);
            if (!$party) continue;

            $totalDue = $row->outstanding_balance;

            // Check if already alerted
            $exists = AiRecommendation::where('tenant_id', $tenantId)
                ->where('type', 'recovery')
                ->where('party_id', $partyId)
                ->where('created_at', '>=', Carbon::now()->startOfDay())
                ->exists();

            if ($exists) continue;

            AiRecommendation::create([
                'tenant_id'        => $tenantId,
                'type'             => 'recovery',
                'priority'         => 'high',
                'party_id'         => $partyId,
                'title'            => "Overdue: {$party->name}",
                'message'          => "Total outstanding receivable from this party: Rs. " . number_format($totalDue) . ".",
                'potential_revenue'=> $totalDue,
                'action_type'      => 'send_reminder',
                'action_url'       => "/parties/{$partyId}/ledger",
                'data'             => [
                    'outstanding_balance' => $totalDue,
                ],
                'valid_until'      => Carbon::now()->addDays(7),
            ]);

            $created++;
        }

        $this->info("   - Created {$created} recovery alerts.");
    }
}
