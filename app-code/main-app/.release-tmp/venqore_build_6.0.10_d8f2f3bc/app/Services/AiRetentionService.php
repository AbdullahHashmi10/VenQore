<?php

namespace App\Services;

use App\Models\AiRecommendation;
use App\Models\CustomerAnalytics;
use App\Models\Invoice;
use App\Models\Party;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AiRetentionService
{
    /**
     * V3 Brain A: Customer Retention Engine (Tenant-Scoped)
     *
     * WOUND 3 FIX: Accepts explicit $tenantId and scopes EVERY query with it.
     * Previously this ran globally, mixing all tenants' customer analytics.
     *
     * @param int $tenantId  The tenant to analyze. MUST be passed explicitly.
     * @return int           Number of alerts generated.
     */
    public function runRetentionAnalysis(int $tenantId): int
    {
        Log::info("[AiEngine] Starting Retention Analysis for tenant {$tenantId}...");

        $count = 0;

        // WOUND 3 FIX: Scope customers to this tenant only
        $customers = Party::where('tenant_id', $tenantId)
            ->where('type', 'customer')
            ->get();

        Log::info("[AiEngine] Tenant {$tenantId}: {$customers->count()} customers found.");

        foreach ($customers as $customer) {
            // WOUND 3 FIX: Scope invoices to this tenant + this customer
            $invoices = Invoice::where('tenant_id', $tenantId)
                ->where('party_id', $customer->id)
                ->whereIn('status', ['paid', 'posted'])
                ->latest('date')
                ->get();

            if ($invoices->count() < 3) continue;

            // 1. Calculate Core Analytics
            $dates = $invoices->pluck('date');
            $intervals = [];
            for ($i = 0; $i < $dates->count() - 1; $i++) {
                try {
                    $current  = Carbon::parse($dates[$i]);
                    $previous = Carbon::parse($dates[$i + 1]);
                    $intervals[] = $current->diffInDays($previous);
                } catch (\Exception $e) {
                    continue;
                }
            }

            $adbo               = count($intervals) > 0 ? (array_sum($intervals) / count($intervals)) : 0;
            $lastOrderDate      = Carbon::parse($dates[0]);
            $daysSinceLastOrder = $lastOrderDate->diffInDays(now());

            // 2. Determine Prediction and Risk Status
            $predictedNextOrder = (clone $lastOrderDate)->addDays(round($adbo));
            $isAtRisk  = ($daysSinceLastOrder > max(7, $adbo * 1.3));
            $isChurned = ($daysSinceLastOrder > $adbo * 3);

            $status = $isChurned ? 'churned' : ($isAtRisk ? 'at_risk' : 'active');

            // 3. Update Analytics (tenant-scoped upsert)
            $analytics = CustomerAnalytics::updateOrCreate(
                ['tenant_id' => $tenantId, 'party_id' => $customer->id],  // WOUND 3 FIX
                [
                    'total_orders'            => $invoices->count(),
                    'total_spent'             => $invoices->sum('total_amount'),
                    'average_order_value'     => $invoices->avg('total_amount'),
                    'avg_days_between_orders' => round($adbo),
                    'last_order_date'         => $lastOrderDate->toDateString(),
                    'predicted_next_order'    => $predictedNextOrder->toDateString(),
                    'status'                  => $status,
                ]
            );

            // 4. Enhanced Intelligence: History and Top Products
            $history = $invoices->take(10)->reverse()->map(function ($inv) {
                return [
                    'name'  => Carbon::parse($inv->date)->format('M d'),
                    'value' => (float)$inv->total_amount,
                ];
            })->values()->toArray();

            // WOUND 3 FIX: Scope product history query to this tenant's invoices
            $topProducts = DB::table('invoice_items')
                ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
                ->join('products', 'invoice_items.product_id', '=', 'products.id')
                ->where('invoices.tenant_id', $tenantId)  // WOUND 3 FIX
                ->where('invoices.party_id', $customer->id)
                ->select('products.name', DB::raw('count(*) as total'))
                ->groupBy('products.id', 'products.name')
                ->orderBy('total', 'desc')
                ->limit(3)
                ->get()
                ->pluck('name')
                ->toArray();

            // 5. Generate Recommendations (only for non-active customers)
            if ($status !== 'active') {
                $type = $status === 'churned' ? 'churn' : 'retention';

                // WOUND 3 FIX: Check for existing alerts scoped to this tenant
                $exists = AiRecommendation::where('tenant_id', $tenantId)
                    ->where('party_id', $customer->id)
                    ->where('type', $type)
                    ->where('is_read', false)
                    ->exists();

                if (!$exists) {
                    $title   = $status === 'churned'
                        ? 'Churned Customer: ' . $customer->name
                        : 'Retention Warning: ' . $customer->name;
                    $message = $status === 'churned'
                        ? "This customer has likely churned. It's been " . round($daysSinceLastOrder) . " days since their last visit."
                        : "Customer is late for their next order. Usual cycle: " . round($adbo) . " days.";

                    AiRecommendation::create([
                        'tenant_id'        => $tenantId,  // WOUND 3 FIX — explicit stamp
                        'type'             => $type,
                        'priority'         => ($status === 'churned' || $daysSinceLastOrder > ($adbo * 2)) ? 'urgent' : 'high',
                        'party_id'         => $customer->id,
                        'title'            => $title,
                        'message'          => $message . " Estimated revenue gap: Rs " . number_format($analytics->average_order_value, 0),
                        'potential_revenue' => $analytics->average_order_value,
                        'action_type'      => 'whatsapp',
                        'data'             => [
                            'adbo'              => round($adbo),
                            'last_order'        => $lastOrderDate->toDateString(),
                            'phone'             => $customer->phone,
                            'history'           => $history,
                            'top_products'      => $topProducts,
                            'days_since'        => round($daysSinceLastOrder),
                            'suggested_message' => "Hi {$customer->name}, we noticed it's been a while since you visited VenQore. We'd love to have you back! Here's a special quote just for you.",
                        ],
                        'valid_until'      => now()->addDays(7),
                    ]);
                    $count++;
                }
            }
        }

        Log::info("[AiEngine] Tenant {$tenantId}: Retention Engine complete. {$count} alerts generated.");
        return $count;
    }
}
